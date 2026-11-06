'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getAdmin } from '@/lib/supabase/server';
import { guessCollection } from '@/lib/collections';
import { guessMaterial, guessStrap } from '@/lib/attributes';

async function requireAdmin() {
  const { supabase, isAdmin } = await getAdmin();
  if (!isAdmin) throw new Error('관리자 권한이 없습니다.');
  return supabase;
}

const str = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
};
const num = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().replace(/[^0-9]/g, '');
  return s === '' ? null : Number(s);
};

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

/* ---------------- 상품 ---------------- */

export async function saveProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = num(formData.get('id'));

  const row = {
    name: str(formData.get('name')) ?? '이름 없음',
    brand_id: num(formData.get('brand_id')),
    model_no: str(formData.get('model_no')),
    price: num(formData.get('price')),
    description: str(formData.get('description')),
    thumbnail_url: str(formData.get('thumbnail_url')),
    video_url: str(formData.get('video_url')),
    stock_type: formData.get('stock_type') === 'domestic' ? 'domestic' : 'order',
    collection: str(formData.get('collection')) ?? guessCollection(str(formData.get('name')) ?? ''),
    gender: str(formData.get('gender')) ?? '공용',
    material: str(formData.get('material')) ?? guessMaterial(str(formData.get('name')) ?? ''),
    strap: str(formData.get('strap')) ?? guessStrap(str(formData.get('name')) ?? ''),
    recent_sales: num(formData.get('recent_sales')) ?? 0,
    sort_order: num(formData.get('sort_order')) ?? 0,
    is_visible: formData.get('is_visible') === 'on',
  };

  let productId = id;
  if (id) {
    const { error } = await supabase.from('products').update(row).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from('products').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    productId = data.id;
  }

  // 추가 이미지: 전부 지우고 다시 저장 (순서 반영)
  const extra: string[] = JSON.parse((formData.get('images') ?? '[]').toString());
  await supabase.from('product_images').delete().eq('product_id', productId);
  if (extra.length) {
    await supabase
      .from('product_images')
      .insert(extra.map((url, i) => ({ product_id: productId, url, sort_order: i })));
  }

  revalidatePath('/', 'layout');
  redirect('/admin/products');
}

export async function deleteProduct(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('products').delete().eq('id', num(formData.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/products');
}

export async function toggleProductVisible(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase
    .from('products')
    .update({ is_visible: formData.get('next') === 'true' })
    .eq('id', num(formData.get('id')));
  revalidatePath('/', 'layout');
}

/* ---------------- 공지 ---------------- */

export async function saveNotice(formData: FormData) {
  const supabase = await requireAdmin();
  const id = num(formData.get('id'));
  const row = {
    title: str(formData.get('title')) ?? '제목 없음',
    content: str(formData.get('content')),
    is_pinned: formData.get('is_pinned') === 'on',
    is_visible: formData.get('is_visible') === 'on',
  };
  const { error } = id
    ? await supabase.from('notices').update(row).eq('id', id)
    : await supabase.from('notices').insert(row);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  redirect('/admin/notices');
}

export async function deleteNotice(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('notices').delete().eq('id', num(formData.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/notices');
}

/* ---------------- 출고 게시물 ---------------- */

export async function saveShipping(formData: FormData) {
  const supabase = await requireAdmin();
  const id = num(formData.get('id'));
  const row = {
    title: str(formData.get('title')),
    shipped_at: str(formData.get('shipped_at')) ?? new Date().toISOString().slice(0, 10),
    brand_id: num(formData.get('brand_id')),
    product_id: num(formData.get('product_id')),
    video_url: str(formData.get('video_url')),
    thumbnail_url: str(formData.get('thumbnail_url')),
    images: JSON.parse((formData.get('images') ?? '[]').toString()) as string[],
    is_visible: formData.get('is_visible') === 'on',
  };
  // 상품을 연결했고 브랜드를 안 골랐으면 상품의 브랜드로 (실시간 검수 브랜드 필터용)
  if (row.product_id && !row.brand_id) {
    const { data } = await supabase.from('products').select('brand_id').eq('id', row.product_id).maybeSingle();
    row.brand_id = data?.brand_id ?? null;
  }
  const { error } = id
    ? await supabase.from('shipping_videos').update(row).eq('id', id)
    : await supabase.from('shipping_videos').insert(row);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  redirect('/admin/shipping');
}

export async function deleteShipping(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('shipping_videos').delete().eq('id', num(formData.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/shipping');
}

/* ---------------- 설정 · 배너 ---------------- */

export async function saveSettings(formData: FormData) {
  const supabase = await requireAdmin();
  const keys = [
    'site_name', 'kakao_url', 'kakao_openchat_url', 'bank_info', 'footer_info', 'shipping_method', 'shipping_fee',
    'announce_text', 'popup_image', 'popup_title', 'popup_text', 'popup_link',
    'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'icon_url', 'site_url', 'google_verification', 'naver_verification',
    'wm_text', 'wm_logo', 'wm_style', 'wm_opacity', 'wm_size', 'wm_reviews',
    'insp1_image', 'insp1_title', 'insp1_desc', 'insp2_image', 'insp2_title', 'insp2_desc', 'insp3_image', 'insp3_title', 'insp3_desc',
  ];
  await supabase.from('site_settings').upsert([
    ...keys.map((key) => ({ key, value: (formData.get(key) ?? '').toString() })),
    { key: 'popup_enabled', value: formData.get('popup_enabled') === 'on' ? 'Y' : 'N' },
    { key: 'wm_on', value: formData.get('wm_on') === 'on' ? 'Y' : 'N' },
  ]);

  // 메인 배너 3칸
  for (const n of [1, 2, 3]) {
    const p = `banner${n}_`;
    const id = num(formData.get(`${p}id`));
    const image = str(formData.get(`${p}image`));
    const row = {
      title: str(formData.get(`${p}title`)),
      subtitle: str(formData.get(`${p}subtitle`)),
      image_url: image ?? '',
      link_url: str(formData.get(`${p}link`)),
      placement: 'hero',
      sort_order: n,
      is_active: formData.get(`${p}active`) === 'on' && !!image, // 사진 없는 칸은 안 보이게
    };
    if (id) await supabase.from('banners').update(row).eq('id', id);
    else if (image) await supabase.from('banners').insert(row);
  }

  revalidatePath('/', 'layout');
  redirect('/admin/settings?saved=1');
}

/* ---------------- 상품 일괄 관리 ---------------- */

export type BulkAction = 'show' | 'hide' | 'domestic' | 'order' | 'collection' | 'gender' | 'material' | 'strap' | 'sales' | 'pin' | 'unpin' | 'delete';

export async function bulkProducts(ids: number[], action: BulkAction, value?: string) {
  const supabase = await requireAdmin();
  if (!ids.length) return { ok: 0 };
  const patch: Record<string, unknown> | null =
    action === 'show' ? { is_visible: true }
    : action === 'hide' ? { is_visible: false }
    : action === 'domestic' ? { stock_type: 'domestic' }
    : action === 'order' ? { stock_type: 'order' }
    : action === 'collection' ? { collection: value?.trim() || null }
    : action === 'gender' ? { gender: value || '공용' }
    : action === 'material' ? { material: value || null }
    : action === 'strap' ? { strap: value || null }
    : action === 'sales' ? { recent_sales: Math.max(0, Number(value) || 0) }
    : action === 'pin' ? { sort_order: -10000 } // 진열 순서보다 항상 앞
    : action === 'unpin' ? { sort_order: 0 }
    : null;
  // 한 번에 너무 많으면 나눠서
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { error } = patch
      ? await supabase.from('products').update(patch).in('id', chunk)
      : await supabase.from('products').delete().in('id', chunk);
    if (error) throw new Error(error.message);
  }
  revalidatePath('/', 'layout');
  return { ok: ids.length };
}

/** 상품명으로 컬렉션(상세분류) 자동 채우기. onlyEmpty면 비어있는 것만 */
export async function autoClassify(onlyEmpty: boolean) {
  const supabase = await requireAdmin();
  const rows: { id: number; name: string; collection: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('products').select('id, name, collection').order('id').range(from, from + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const groups = new Map<string, number[]>();
  let unknown = 0;
  for (const r of rows) {
    if (onlyEmpty && r.collection) continue;
    const c = guessCollection(r.name);
    if (!c) { unknown++; continue; }
    if (c === r.collection) continue;
    groups.set(c, [...(groups.get(c) ?? []), r.id]);
  }
  let changed = 0;
  for (const [collection, ids] of groups) {
    for (let i = 0; i < ids.length; i += 200) {
      await supabase.from('products').update({ collection }).in('id', ids.slice(i, i + 200));
    }
    changed += ids.length;
  }
  revalidatePath('/', 'layout');
  return { changed, unknown };
}

/** 상품명으로 소재 · 스트랩 자동 채우기 (비어있는 것만) */
export async function autoAttributes() {
  const supabase = await requireAdmin();
  const rows: { id: number; name: string; material: string | null; strap: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('products').select('id, name, material, strap').order('id').range(from, from + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const groups = new Map<string, number[]>(); // "material|값" → ids
  let unknown = 0;
  for (const r of rows) {
    const m = r.material ? null : guessMaterial(r.name);
    const s = r.strap ? null : guessStrap(r.name);
    if (m) groups.set(`material|${m}`, [...(groups.get(`material|${m}`) ?? []), r.id]);
    if (s) groups.set(`strap|${s}`, [...(groups.get(`strap|${s}`) ?? []), r.id]);
    if ((!r.material && !m) || (!r.strap && !s)) unknown++;
  }
  let changed = 0;
  for (const [key, ids] of groups) {
    const [col, val] = key.split('|');
    for (let i = 0; i < ids.length; i += 200) {
      await supabase.from('products').update({ [col]: val }).in('id', ids.slice(i, i + 200));
    }
    changed += ids.length;
  }
  revalidatePath('/', 'layout');
  return { changed, unknown };
}

/* ---------------- 후기 ---------------- */

/** 사진 여러 장 → 사진 1장당 후기 1개 (멘트는 모두 같게) */
export async function addReviews(urls: string[], content?: string, baseTime?: number) {
  const supabase = await requireAdmin();
  if (!urls.length) return;
  // 먼저 고른 사진이 맨 앞(최신)에 오도록 1초씩 차이
  const now = baseTime ?? Date.now();
  const text = content?.trim() || null;
  const { error } = await supabase.from('reviews').insert(
    urls.map((u, i) => ({ image_urls: [u], content: text, created_at: new Date(now - i * 1000).toISOString() }))
  );
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
}

/** 선택한 후기들 멘트 한 번에 바꾸기 */
export async function setReviewsContent(ids: number[], content: string) {
  const supabase = await requireAdmin();
  for (let i = 0; i < ids.length; i += 200) {
    await supabase.from('reviews').update({ content: content.trim() || null }).in('id', ids.slice(i, i + 200));
  }
  revalidatePath('/', 'layout');
}

export async function updateReview(id: number, patch: { is_visible?: boolean }) {
  const supabase = await requireAdmin();
  await supabase.from('reviews').update(patch).eq('id', id);
  revalidatePath('/', 'layout');
}

export async function deleteReviews(ids: number[]) {
  const supabase = await requireAdmin();
  await supabase.from('reviews').delete().in('id', ids);
  revalidatePath('/', 'layout');
}

/* ---------------- 브랜드 ---------------- */

export async function saveBrand(formData: FormData) {
  const supabase = await requireAdmin();
  const id = num(formData.get('id'));
  const row = {
    name_ko: str(formData.get('name_ko')) ?? '',
    name_en: str(formData.get('name_en')),
    logo_url: str(formData.get('logo_url')),
    is_featured: formData.get('is_featured') === 'on',
    sort_order: num(formData.get('sort_order')) ?? 0,
  };
  const { error } = await supabase.from('brands').update(row).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
}

/** 새 브랜드 추가 (상품 등록 화면·브랜드 화면에서). 같은 이름이 이미 있으면 그걸 돌려줌 */
export async function createBrand(nameKo: string, nameEn: string): Promise<{ id: number; name_ko: string; existed: boolean }> {
  const supabase = await requireAdmin();
  const ko = nameKo.trim();
  const en = nameEn.trim();
  if (!ko) throw new Error('브랜드 이름(한글)을 입력해주세요.');

  const { data: same } = await supabase.from('brands').select('id, name_ko').ilike('name_ko', ko).maybeSingle();
  if (same) return { id: same.id, name_ko: same.name_ko, existed: true };

  // 주소용 영문 (예: Tudor → /brand/tudor). 영문이 없으면 자동 코드
  const base =
    en.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    `brand-${Date.now().toString(36)}`;
  const { data: taken } = await supabase.from('brands').select('slug').like('slug', `${base}%`);
  const used = new Set((taken ?? []).map((t) => t.slug));
  let slug = base;
  for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;

  const { data: last } = await supabase.from('brands').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from('brands')
    .insert({ name_ko: ko, name_en: en || null, slug, sort_order: (last?.sort_order ?? 0) + 1, is_featured: false })
    .select('id, name_ko')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
  return { id: data.id, name_ko: data.name_ko, existed: false };
}

/* ---------------- 메종 이야기 (About) ---------------- */

export async function saveAbout(json: string) {
  const supabase = await requireAdmin();
  JSON.parse(json); // 형식 확인
  const { error } = await supabase.from('site_settings').upsert({ key: 'about_blocks', value: json });
  if (error) throw new Error(error.message);
  revalidatePath('/about');
}

/* ---------------- 상세분류(모델) 이미지 ---------------- */

export async function saveCollectionImage(brandId: number, collection: string, imageUrl: string | null) {
  const supabase = await requireAdmin();
  const { error } = imageUrl
    ? await supabase.from('collection_images').upsert({ brand_id: brandId, collection, image_url: imageUrl, updated_at: new Date().toISOString() })
    : await supabase.from('collection_images').delete().eq('brand_id', brandId).eq('collection', collection);
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
}

/* ---------------- 진열 순서 ---------------- */

/** 보이는 순서 그대로 저장 (맨 앞부터) */
export async function saveArrangement(ids: number[]) {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc('admin_set_order', { p_ids: ids });
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
}

/** 이 목록의 직접 정한 순서를 없애고 자동(영상 있는 것 → 최신순)으로 */
export async function resetArrangement(scope: string) {
  const supabase = await requireAdmin();
  let q = supabase.from('products').update({ sort_order: 0 }).neq('sort_order', 0);
  if (scope === 'domestic') q = q.eq('stock_type', 'domestic');
  else if (scope !== 'all') {
    const { data } = await supabase.from('brands').select('id').eq('slug', scope).maybeSingle();
    if (!data) return;
    q = q.eq('brand_id', data.id);
  }
  const { error } = await q;
  if (error) throw new Error(error.message);
  revalidatePath('/', 'layout');
}
