import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { VideoFrame } from '@/lib/charlla';
import { kakaoOf, getSettings, type Shipping } from '@/lib/types';
import ReviewStrip from '@/components/ReviewStrip';
import { KakaoBar } from '@/components/KakaoButton';
import { hasKakao } from '@/lib/kakao';
import { thumb } from '@/lib/img';

// 처음 열릴 때 만들어서 저장해두고, 1분마다 갱신 (빠르게 열림)
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

type Post = Shipping & { products: { id: number; name: string; thumbnail_url: string | null } | null };

const getPost = cache(async (id: number) => {
  if (!Number.isFinite(id)) return null;
  const { data } = await createPublicClient().from('shipping_videos').select('*, products(id, name, thumbnail_url)').eq('id', id).maybeSingle();
  return data as Post | null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = await getPost(Number((await params).id));
  if (!v) return {};
  const title = `${v.products?.name ?? v.title} 검수`;
  return { title, openGraph: { title, images: v.thumbnail_url ? [{ url: v.thumbnail_url }] : [] } };
}

export default async function ShippingDetail({ params }: { params: Promise<{ id: string }> }) {
  const v = await getPost(Number((await params).id));
  if (!v) notFound();
  const supabase = createPublicClient();
  const [settings, { data: more }] = await Promise.all([
    getSettings(supabase),
    supabase.from('shipping_videos').select('*').neq('id', v.id).order('shipped_at', { ascending: false }).limit(9),
  ]);
  const images = [...(v.thumbnail_url ? [v.thumbnail_url] : []), ...(v.images ?? [])];
  const asReviews = images.map((url, i) => ({ id: i, product_id: null, author_name: null, content: null, image_urls: [url], is_visible: true, created_at: '' }));

  return (
    <div className="bg-abyss text-white -mb-24 pb-24 min-h-screen">
      <article className="mx-auto max-w-3xl px-4 pt-8 ">
        <Link href="/shipping" className="text-sm text-neutral-400 hover:text-white">‹ 실시간 검수</Link>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-black">✓ 검수완료</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1">사진 {images.length}{v.video_url && ' · 영상 1'}</span>
          <span className="text-neutral-500 font-normal">{v.shipped_at} 출고</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-snug">{v.products?.name ?? v.title}</h1>
        {v.products && <p className="mt-1 text-sm text-neutral-500">{v.title}</p>}

        {v.video_url && (
          <div className="mt-8">
            <VideoFrame url={v.video_url} title={v.title ?? undefined} />
          </div>
        )}

        {images.length > 0 && (
          <section className="mt-8">
            <p className="mb-3 text-sm font-semibold">검수 사진 <span className="text-neutral-500 font-normal">· 누르면 크게 볼 수 있어요</span></p>
            <div className="overflow-hidden rounded-lg">
              <ReviewStrip reviews={asReviews} layout="grid" />
            </div>
          </section>
        )}

        {v.products && (
          <Link
            href={`/product/${v.products.id}`}
            className="mt-8 flex items-center gap-4 rounded-lg bg-white/5 p-3 ring-1 ring-white/10 hover:bg-white/10 active:scale-[0.98] transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {v.products.thumbnail_url && <img src={thumb(v.products.thumbnail_url)} alt="" className="h-16 w-16 rounded-md object-cover" />}
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] text-neutral-400">이 제품 보러가기</span>
              <span className="block text-sm font-medium line-clamp-1">{v.products.name}</span>
            </span>
            <span className="text-neutral-400">›</span>
          </Link>
        )}

        {hasKakao(kakaoOf(settings)) && (
          <div className="mt-4">
            <KakaoBar urls={kakaoOf(settings)} productName={v.products?.name ?? undefined} />
          </div>
        )}

        {(more?.length ?? 0) > 0 && (
          <section className="mt-14">
            <p className="mb-4 font-semibold">다른 검수 기록</p>
            <div className="grid grid-cols-3 gap-2">
              {((more ?? []) as Shipping[]).map((m) => (
                <Link key={m.id} href={`/shipping/${m.id}`} className="relative aspect-square overflow-hidden rounded-md bg-neutral-900 active:scale-95 transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.thumbnail_url && <img src={thumb(m.thumbnail_url)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  {m.video_url && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 text-[10px]">▶</span>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
