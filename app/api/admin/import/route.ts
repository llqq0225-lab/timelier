import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getAdmin } from '@/lib/supabase/server';
import { sourceUrl, type ImportJob } from '@/lib/cafe24';
import { guessCollection } from '@/lib/collections';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Supa = Awaited<ReturnType<typeof getAdmin>>['supabase'];

/** 카페24에서 사진 받아서 → 크기 줄여서 → 우리 저장소에 올리고 주소 반환 */
async function copyImage(supabase: Supa, url: string, path: string, width: number) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const output = await sharp(input, { failOn: 'none' })
    .rotate() // 휴대폰 사진 회전 정보 반영
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const { error } = await supabase.storage
    .from('media')
    .upload(path, output, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** 여러 장을 동시에 4장씩 처리. 실패한 사진은 빼고 순서는 유지 */
async function copyAll(supabase: Supa, urls: string[], prefix: string) {
  const results: (string | null)[] = new Array(urls.length).fill(null);
  let next = 0;
  let failed = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      try {
        results[i] = await copyImage(supabase, urls[i], `${prefix}/${String(i + 1).padStart(2, '0')}.jpg`, 1200);
      } catch {
        failed++;
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return { urls: results.filter((u): u is string => !!u), failed };
}

export async function POST(req: Request) {
  const { supabase, isAdmin } = await getAdmin();
  if (!isAdmin) return NextResponse.json({ error: '관리자 권한이 없어요.' }, { status: 401 });

  const { job, host, overwrite } = (await req.json()) as { job: ImportJob; host: string; overwrite?: boolean };
  const table = job.kind === 'product' ? 'products' : 'shipping_videos';

  const { data: existing } = await supabase.from(table).select('id').eq('cafe24_no', job.no).maybeSingle();
  if (existing && !overwrite) return NextResponse.json({ status: 'skipped' });

  const folder = `c24/${job.kind === 'product' ? 'p' : 's'}${job.no}`;
  let thumbnail: string | null = null;
  let failed = 0;
  if (job.mainImage) {
    try {
      thumbnail = await copyImage(supabase, sourceUrl(host, job.mainImage, 'main'), `${folder}/main.jpg`, 1000);
    } catch {
      failed++;
    }
  }
  const detail = await copyAll(
    supabase,
    job.detailImages.map((s) => sourceUrl(host, s, 'detail')),
    folder
  );
  failed += detail.failed;

  // 대표사진을 못 받았으면 상세 첫 장으로 대신
  if (!thumbnail && detail.urls.length) thumbnail = detail.urls[0];

  if (job.kind === 'product') {
    let brand_id: number | null = null;
    if (job.brandSlug) {
      const { data } = await supabase.from('brands').select('id').eq('slug', job.brandSlug).maybeSingle();
      brand_id = data?.id ?? null;
    }
    const row = {
      cafe24_no: job.no,
      name: job.name,
      brand_id,
      collection: guessCollection(job.name),
      price: null,
      thumbnail_url: thumbnail,
      video_url: job.video,
      stock_type: job.domestic ? 'domestic' : 'order',
      is_visible: job.visible,
      ...(job.createdAt && { created_at: job.createdAt }),
    };
    let productId = existing?.id as number | undefined;
    if (productId) {
      const { error } = await supabase.from('products').update(row).eq('id', productId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await supabase.from('product_images').delete().eq('product_id', productId);
    } else {
      const { data, error } = await supabase.from('products').insert(row).select('id').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      productId = data.id;
    }
    if (detail.urls.length) {
      const { error } = await supabase
        .from('product_images')
        .insert(detail.urls.map((url, i) => ({ product_id: productId, url, sort_order: i })));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const row = {
      cafe24_no: job.no,
      title: job.name,
      shipped_at: job.shippedAt ?? new Date().toISOString().slice(0, 10),
      thumbnail_url: thumbnail,
      images: thumbnail === detail.urls[0] ? detail.urls.slice(1) : detail.urls,
      video_url: job.video,
      is_visible: job.visible,
      ...(job.createdAt && { created_at: job.createdAt }),
    };
    const { error } = existing
      ? await supabase.from('shipping_videos').update(row).eq('id', existing.id)
      : await supabase.from('shipping_videos').insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', images: detail.urls.length + (thumbnail ? 1 : 0), failed });
}
