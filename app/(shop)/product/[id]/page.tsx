import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, kakaoOf, type Product, type Review, type Shipping } from '@/lib/types';
import { VideoFrame } from '@/lib/charlla';
import Gallery from '@/components/Gallery';
import InspectStrip from '@/components/InspectStrip';
import ReviewStrip from '@/components/ReviewStrip';
import ProductCard from '@/components/ProductCard';
import WishButton from '@/components/WishButton';
import ShareButton from '@/components/ShareButton';
import RecentRecorder from '@/components/RecentRecorder';
import { KakaoBar } from '@/components/KakaoButton';
import InquiryBar from '@/components/InquiryBar';
import { hasKakao } from '@/lib/kakao';
import { collectionHref } from '@/components/Header';

export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

const getProduct = cache(async (id: number) => {
  if (!Number.isFinite(id)) return null;
  const { data } = await createPublicClient()
    .from('products')
    .select('*, brands(name_ko, name_en, slug), product_images(id, url, sort_order)')
    .eq('id', id)
    .maybeSingle();
  return data as Product | null;
});

// 카톡·문자로 링크 보낼 때 뜨는 미리보기 (사진 + 상품명)
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getProduct(Number((await params).id));
  if (!p) return {};
  const desc = [p.brands?.name_ko, p.collection, '실시간 검수 · 출고영상 확인'].filter(Boolean).join(' · ');
  return {
    title: p.name,
    description: desc,
    openGraph: { title: p.name, description: desc, images: p.thumbnail_url ? [{ url: p.thumbnail_url }] : [] },
  };
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex border-b border-rule py-3.5 text-[13px]">
      <dt className="w-24 shrink-0 text-fg/45">{label}</dt>
      <dd className="min-w-0 text-fg/85">{children}</dd>
    </div>
  );
}

const PROMISES = ['출고 전 실물 검수', '검수 과정 사진 · 영상 기록', '영상과 다르면 200% 환불'];

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = await getProduct(id);
  if (!p) notFound();

  const supabase = createPublicClient();
  const similarBase = supabase
    .from('products')
    .select('*, brands(name_ko, name_en, slug)')
    .neq('id', p.id)
    .order('view_count', { ascending: false })
    .limit(10);

  const [settings, linked, reviews, similar] = await Promise.all([
    getSettings(supabase),
    supabase.from('shipping_videos').select('*', { count: 'exact' }).eq('product_id', p.id).order('shipped_at', { ascending: false }).limit(12),
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(12),
    p.collection && p.brand_id
      ? similarBase.eq('brand_id', p.brand_id).eq('collection', p.collection)
      : p.brand_id
        ? similarBase.eq('brand_id', p.brand_id)
        : Promise.resolve({ data: [] }),
  ]);

  // 이 상품에 연결된 출고 게시물이 없고 영상도 없으면, 최근 검수 게시물을 보여줌
  let posts = (linked.data ?? []) as Shipping[];
  let inspectTitle = '이 시계의 검수';
  let inspectCount = (linked.count ?? 0) + (p.video_url ? 1 : 0);
  if (posts.length === 0 && !p.video_url) {
    const { data } = await supabase.from('shipping_videos').select('*').order('shipped_at', { ascending: false }).order('id', { ascending: false }).limit(8);
    posts = (data ?? []) as Shipping[];
    inspectTitle = '최근 검수';
    inspectCount = posts.length;
  }

  const detailImages = (p.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url);
  const gallery = [...(p.thumbnail_url ? [p.thumbnail_url] : []), ...detailImages];
  const similarList = (similar.data ?? []) as Product[];
  const saved = { id: p.id, name: p.name, thumb: p.thumbnail_url, brand: p.brands?.name_ko, collection: p.collection, brandId: p.brand_id };

  const kakao = kakaoOf(settings);

  return (
    <div className="mx-auto max-w-6xl ">
      <RecentRecorder item={saved} />
      {hasKakao(kakao) && <InquiryBar urls={kakao} name={p.name} thumb={p.thumbnail_url} />}

      <div className=" ">
        <Gallery images={gallery} alt={p.name} />

        {/* 상품 정보 */}
        <section className="px-5 pt-9 ">
          {p.brands && (
            <Link href={`/brand/${p.brands.slug}`} className="eyebrow hover:opacity-70">{p.brands.name_en ?? p.brands.name_ko}</Link>
          )}
          <h1 className="mt-4 text-[22px] font-light leading-[1.45] tracking-[-0.01em]">{p.name}</h1>
          <p className="mt-3 text-[12.5px] text-fg/45">
            {[p.collection, p.model_no && `Ref. ${p.model_no}`, p.gender || '공용'].filter(Boolean).join('  ·  ')}
          </p>

          <div className="mt-8 border-t border-rule pt-7">
            <p className="font-serif text-[24px] italic text-fg/90">{p.price ? `₩ ${p.price.toLocaleString()}` : 'Price upon request'}</p>
            <p className="mt-1.5 text-[12.5px] text-fg/45">가격과 재고는 상담 시 안내해 드립니다.</p>
            {p.stock_type === 'domestic' && (
              <p className="mt-4 flex items-center gap-2 text-[12.5px] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> 국내 보유 · 상담 후 바로 배송
              </p>
            )}
          </div>

          {hasKakao(kakao) && (
            <div className="mt-8">
              <KakaoBar urls={kakao} productName={p.name} />
              <p className="mt-2.5 text-center text-[11.5px] text-fg/40">카카오톡 1:1 상담으로 연결되며, 상품명이 자동으로 복사돼요</p>
            </div>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <ShareButton title={p.name} />
            <WishButton item={saved} />
          </div>

          <ul className="mt-9 space-y-2.5 border-y border-rule py-6">
            {PROMISES.map((t, i) => (
              <li key={t} className="flex items-baseline gap-4 text-[13px] text-fg/75">
                <span className="w-5 font-serif text-[15px] text-accent">{['I', 'II', 'III'][i]}</span>
                {t}
              </li>
            ))}
          </ul>

          <dl className="mt-2">
            <Spec label="브랜드">{p.brands?.name_ko ?? '-'}</Spec>
            <Spec label="컬렉션">
              {p.collection && p.brands ? (
                <Link href={collectionHref(p.brands.slug, p.collection)} className="underline underline-offset-4 decoration-accent/50">{p.collection}</Link>
              ) : (p.collection ?? '-')}
            </Spec>
            {p.model_no && <Spec label="레퍼런스">{p.model_no}</Spec>}
            <Spec label="배송">{[settings.shipping_method || '택배', settings.shipping_fee || '기본 무료'].join(' · ')}</Spec>
            <Spec label="결제">상담 후 계좌이체</Spec>
          </dl>
        </section>
      </div>

      <div className="px-5 ">
        {/* 검수 기록 */}
        <div className="mt-20 ">
          <InspectStrip title={inspectTitle} count={inspectCount} hasProductVideo={!!p.video_url} productVideoThumb={p.thumbnail_url} posts={posts} />
        </div>

        {/* 출고영상 */}
        {p.video_url && (
          <section id="video" className="mt-20 scroll-mt-28 text-center">
            <p className="eyebrow">The Film</p>
            <h2 className="display mt-4 text-[34px] ">Inspection Film</h2>
            <p className="mt-3 mb-10 text-[13px] text-fg/50">출고 전 실제 제품을 촬영한 영상이에요. 영상과 다르면 200% 환불해 드립니다.</p>
            <div className="mx-auto max-w-[460px]">
              <VideoFrame url={p.video_url} title={p.name} />
            </div>
          </section>
        )}

        {/* 상세 사진 */}
        {(p.description || detailImages.length > 0) && (
          <section className="mt-20 mx-auto max-w-3xl">
            <div className="text-center">
              <p className="eyebrow">Details</p>
              <h2 className="display mt-4 text-[34px] ">A Closer Look</h2>
            </div>
            {p.description && <div className="mt-8 whitespace-pre-line text-[14px] leading-[1.9] text-fg/70 text-center">{p.description}</div>}
            <div className="mt-10 space-y-3">
              {detailImages.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src + i} src={src} alt={`${p.name} 상세 ${i + 1}`} loading="lazy" className="w-full" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 고객 이야기 */}
      {(reviews.data?.length ?? 0) > 0 && (
        <section className="mt-20 ">
          <div className="flex items-end justify-between px-5 mb-6">
            <div>
              <p className="eyebrow">Client Stories</p>
              <h2 className="mt-3 text-[18px] font-light">고객 이야기</h2>
            </div>
            <Link href="/reviews" className="font-display text-[10px] font-medium uppercase tracking-[0.25em] text-accent border-b border-accent/40 pb-1">Read more</Link>
          </div>
          <ReviewStrip reviews={(reviews.data ?? []) as Review[]} />
        </section>
      )}

      {/* 함께 보면 좋은 시계 */}
      {similarList.length > 0 && (
        <section className="mt-20 px-5 ">
          <div className="text-center mb-12">
            <p className="eyebrow">{p.collection ?? p.brands?.name_en ?? 'Timelier'}</p>
            <h2 className="display mt-4 text-[34px] ">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12">
            {similarList.slice(0, 4).map((s) => (
              <ProductCard key={s.id} p={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
