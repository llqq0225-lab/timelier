import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ReviewStrip from '@/components/ReviewStrip';
import KakaoLink from '@/components/KakaoLink';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, kakaoOf, type Brand, type BrandCollection, type Product, type Review, type Shipping } from '@/lib/types';
import { hasKakao } from '@/lib/kakao';
import { thumb } from '@/lib/img';

const PRODUCT_FIELDS = '*, brands(name_ko, name_en, slug)';

type Banner = { id: number; title: string | null; subtitle: string | null; image_url: string; link_url: string | null };

/** 섹션 제목: 영문 세리프 + 한글 설명 */
function Heading({ en, ko, align = 'left', more }: { en: string; ko?: string; align?: 'left' | 'center'; more?: { href: string; label: string } }) {
  return (
    <div className={`flex ${align === 'center' ? 'flex-col items-center text-center' : 'items-end justify-between gap-6'} mb-10 `}>
      <div>
        <h2 className="display text-[38px] text-fg">{en}</h2>
        {ko && <p className="mt-3 text-[13px] text-fg/55">{ko}</p>}
      </div>
      {more && (
        <Link href={more.href} className={`shrink-0 font-display text-[10px] font-medium uppercase tracking-[0.28em] text-accent border-b border-accent/40 pb-1 hover:border-accent ${align === 'center' ? 'mt-6' : ''}`}>
          {more.label}
        </Link>
      )}
    </div>
  );
}

const STEPS = [
  { n: 'I', t: '입고 · 실물 확인', d: '들어온 시계를 한 점씩 꺼내 외관과 구성품을 확인합니다.' },
  { n: 'II', t: '정밀 검수', d: '무브먼트, 각인, 마감과 작동 상태를 꼼꼼하게 살핍니다.' },
  { n: 'III', t: '기록 · 출고', d: '검수 과정을 사진과 영상으로 남기고, 그대로 보여드린 뒤 보냅니다.' },
];

export default async function Home() {
  const supabase = createPublicClient();
  const [banners, brands, selection, cols, videos, reviews, settings] = await Promise.all([
    supabase.from('banners').select('*').eq('placement', 'hero').eq('is_active', true).order('sort_order').limit(1),
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('products').select(PRODUCT_FIELDS).order('sort_order').order('has_video', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    supabase.from('brand_collections').select('*'),
    supabase.from('shipping_videos').select('*').not('thumbnail_url', 'is', null).order('shipped_at', { ascending: false }).order('id', { ascending: false }).limit(3),
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(8),
    getSettings(supabase),
  ]);

  const allBrands = (brands.data ?? []) as Brand[];
  const brandById = new Map(allBrands.map((b) => [b.id, b]));
  const hero = ((banners.data ?? []) as Banner[])[0];
  const kakao = kakaoOf(settings);

  // 컬렉션 이야기: 상품이 가장 많은 모델 3개 + 대표 사진
  const topCols = ((cols.data ?? []) as BrandCollection[]).filter((c) => brandById.has(c.brand_id)).sort((a, b) => b.cnt - a.cnt).slice(0, 3);
  const colImgs = await Promise.all(
    topCols.map(async (c) => {
      const [{ data: custom }, { data: prod }] = await Promise.all([
        supabase.from('collection_images').select('image_url').eq('brand_id', c.brand_id).eq('collection', c.collection).maybeSingle(),
        supabase.from('products').select('thumbnail_url').eq('brand_id', c.brand_id).eq('collection', c.collection).not('thumbnail_url', 'is', null).order('view_count', { ascending: false }).limit(1).maybeSingle(),
      ]);
      return (custom?.image_url as string | undefined) ?? (prod?.thumbnail_url as string | undefined) ?? null;
    }),
  );

  return (
    <>
      {/* 첫 화면: 큰 사진 한 장 */}
      <section className="relative h-[78svh] min-h-[520px] overflow-hidden bg-abyss">
        {hero?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image_url} alt={hero.title ?? ''} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0509]/25 via-[#1a0509]/25 to-[#1a0509]/95" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-16 text-center">
          <p className="eyebrow !text-[#d9bd8f]">Maison Timelier</p>
          <h1 className="display mt-5 text-[34px] leading-[1.2] text-fg whitespace-pre-line">{hero?.title || 'The Art of Time'}</h1>
          <p className="mt-5 max-w-md text-[13px] leading-relaxed text-fg/75">
            {hero?.subtitle || '한 점 한 점 직접 검수한 시계만을 소개합니다.'}
          </p>
          <Link href={hero?.link_url || '/ranking'} className="cta mt-9">Discover</Link>
        </div>
      </section>

      {/* 소개 문장 */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="eyebrow">The Maison</p>
        <p className="display mt-8 text-[30px] italic text-fg/95">Every piece, inspected by hand.</p>
        <p className="mx-auto mt-8 max-w-xl text-[14px] leading-[1.9] text-fg/65">
          타임리에는 많이 파는 곳보다 제대로 고르는 곳이 되고자 합니다.
          모든 시계는 출고 전 실물 검수를 거치고, 그 과정을 숨김없이 기록해 보여드립니다.
        </p>
      </section>

      {/* 셀렉션 */}
      <section className="mx-auto max-w-6xl px-5 pb-24 ">
        <Heading en="The Selection" ko="이번 주 타임리에가 고른 시계" more={{ href: '/ranking', label: 'View all' }} />
        {(selection.data?.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-sm text-fg/55">관리자 페이지에서 상품을 등록하면 여기에 표시돼요.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-14 ">
            {(selection.data as Product[]).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* 컬렉션 이야기 */}
      {topCols.length > 0 && (
        <section className="border-t border-rule">
          {topCols.map((c, i) => {
            const b = brandById.get(c.brand_id)!;
            const img = colImgs[i];
            return (
              <div key={`${c.brand_id}-${c.collection}`} className={`grid items-center border-b border-rule ${i % 2 ? '' : ''}`}>
                <Link href={`/brand/${b.slug}?c=${encodeURIComponent(c.collection)}`} className="group block aspect-square overflow-hidden bg-panel">
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(img)} alt={c.collection} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
                  )}
                </Link>
                <div className="px-6 py-14 ">
                  <p className="eyebrow">{b.name_en ?? b.name_ko}</p>
                  <h3 className="display mt-5 text-[40px] text-fg">{c.collection}</h3>
                  <p className="mt-6 max-w-sm text-[14px] leading-[1.9] text-fg/60">
                    {b.name_ko}의 {c.collection}. 타임리에의 검수를 마친 {c.cnt}점의 셀렉션을 만나보세요.
                  </p>
                  <Link href={`/brand/${b.slug}?c=${encodeURIComponent(c.collection)}`} className="cta mt-9">Explore</Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 검수 아틀리에 */}
      <section className="bg-abyss">
        <div className="mx-auto max-w-6xl px-5 py-24 ">
          <Heading en="Inspection Atelier" ko="출고 전 모든 시계는 이 과정을 거칩니다" more={{ href: '/shipping', label: 'Inspection records' }} />
          <div className="grid gap-8 ">
            {STEPS.map((step, i) => {
              const v = ((videos.data ?? []) as Shipping[])[i];
              const k = `insp${i + 1}_`;
              const s = { n: step.n, t: settings[`${k}title`] || step.t, d: settings[`${k}desc`] || step.d };
              const img = settings[`${k}image`] || v?.thumbnail_url; // 관리자에서 넣은 사진 → 없으면 최근 검수 사진
              return (
                <div key={s.n} className="grid grid-cols-[112px_1fr] gap-5 items-start">
                  <div className="aspect-[4/5] overflow-hidden bg-panel">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb(img)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className=" font-serif text-[26px] leading-none text-accent">{s.n}</p>
                    <p className="mt-3 text-[15px] font-medium">{s.t}</p>
                    <p className="mt-2 text-[13px] leading-[1.85] text-fg/55">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 브랜드 */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="eyebrow">The Maisons</p>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-4 ">
          {allBrands.map((b) => (
            <li key={b.id}>
              <Link href={`/brand/${b.slug}`} className="font-serif text-[24px] font-light text-fg/85 transition-colors hover:text-accent">
                {b.name_en ?? b.name_ko}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 고객 이야기 */}
      {(reviews.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-6xl pb-24 ">
          <div className="px-5 ">
            <Heading en="Client Stories" ko="타임리에의 시계를 받으신 분들의 이야기" more={{ href: '/reviews', label: 'Read more' }} />
          </div>
          <ReviewStrip reviews={(reviews.data ?? []) as Review[]} />
        </section>
      )}

      {/* 상담 */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <p className="eyebrow">Concierge</p>
          <h2 className="display mt-6 text-[40px] text-fg">Private Consultation</h2>
          <p className="mx-auto mt-6 max-w-md text-[14px] leading-[1.9] text-fg/60">
            찾으시는 모델, 예산, 착용 상황을 말씀해 주시면 전담 컨시어지가 1:1로 안내해 드립니다.
          </p>
          {hasKakao(kakao) ? (
            <KakaoLink urls={kakao} className="cta-solid mt-10">Book a consultation</KakaoLink>
          ) : (
            <Link href="/brands" className="cta-solid mt-10">Explore collections</Link>
          )}
        </div>
      </section>
    </>
  );
}
