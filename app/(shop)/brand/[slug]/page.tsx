import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { createPublicClient } from '@/lib/supabase/public';
import type { Brand, BrandCollection, Product } from '@/lib/types';
import FilterPanel from '@/components/FilterPanel';
import { FACET_FIELDS, applyFilters, readFilters, type FacetRow } from '@/lib/attributes';

const PAGE_SIZE = 40;

// 추천순 = 맨 위 고정 → 검수영상 있는 상품 → 최신순
const SORTS = {
  pick: { label: '추천순', col: 'created_at', asc: false },
  new: { label: '최신순', col: 'created_at', asc: false },
  popular: { label: '인기순', col: 'view_count', asc: false },
  name: { label: '이름순', col: 'name', asc: true },
} as const;
type SortKey = keyof typeof SORTS;
type SP = { page?: string; c?: string; sort?: string; b?: string; m?: string; s?: string; g?: string; d?: string };

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const { slug } = await params;
  const { c } = await searchParams;
  if (slug === 'domestic') return { title: '국내재고 바로배송' };
  const { data } = await createPublicClient().from('brands').select('name_ko').eq('slug', slug).maybeSingle();
  return { title: [data?.name_ko, c].filter(Boolean).join(' ') || '브랜드' };
}

export default async function BrandPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const sortKey: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : 'pick';
  const sort = SORTS[sortKey];
  const filters = readFilters(sp);
  const active = filters.c.length === 1 ? filters.c[0] : null;
  const supabase = createPublicClient();

  const { data: brandRows } = await supabase.from('brands').select('*').order('sort_order');
  const brands = (brandRows ?? []) as Brand[];
  const domestic = slug === 'domestic';
  // 국내재고 페이지: ?b=rolex 로 국내재고 안에서만 브랜드 고르기
  const brand = domestic ? (brands.find((b) => b.slug === sp.b) ?? null) : brands.find((b) => b.slug === slug);
  if (!domestic && !brand) notFound();

  // 국내재고 상품 목록(가벼운 정보만) → 브랜드별·모델별 개수와 대표사진 계산
  const domesticRows = domestic
    ? (((await supabase.from('products').select('brand_id, collection, thumbnail_url').eq('stock_type', 'domestic').order('view_count', { ascending: false }).limit(2000)).data ?? []) as {
        brand_id: number | null;
        collection: string | null;
        thumbnail_url: string | null;
      }[])
    : [];
  const domesticBrandCount = new Map<number, number>();
  for (const r of domesticRows) if (r.brand_id) domesticBrandCount.set(r.brand_id, (domesticBrandCount.get(r.brand_id) ?? 0) + 1);

  let query = supabase.from('products').select('*, brands(name_ko, name_en, slug)', { count: 'exact' });
  if (sortKey === 'pick') query = query.order('sort_order', { ascending: true }).order('has_video', { ascending: false });
  query = query
    .order(sort.col, { ascending: sort.asc })
    .order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (domestic) query = query.eq('stock_type', 'domestic');
  if (brand) query = query.eq('brand_id', brand.id);
  query = applyFilters(query, filters);

  // 모델(컬렉션)별 대표 사진: 그 모델에서 가장 많이 본 상품 사진
  let facetQ = supabase.from('products').select(FACET_FIELDS).limit(3000);
  if (domestic) facetQ = facetQ.eq('stock_type', 'domestic');
  if (brand) facetQ = facetQ.eq('brand_id', brand.id);
  const [{ data, count }, { data: colRows }, { data: thumbRows }, { data: customRows }, { data: facetRows }] = await Promise.all([
    query,
    brand && !domestic ? supabase.from('brand_collections').select('*').eq('brand_id', brand.id) : Promise.resolve({ data: [] }),
    brand && !domestic
      ? supabase.from('products').select('collection, thumbnail_url').eq('brand_id', brand.id).not('collection', 'is', null).order('view_count', { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] }),
    brand ? supabase.from('collection_images').select('collection, image_url').eq('brand_id', brand.id) : Promise.resolve({ data: [] }),
    facetQ,
  ]);
  let collections = ((colRows ?? []) as BrandCollection[]).sort((a, b) => b.cnt - a.cnt);
  let thumbSource = (thumbRows ?? []) as { collection: string; thumbnail_url: string | null }[];
  if (domestic && brand) {
    // 국내재고 안에서 이 브랜드의 모델만
    const mine = domesticRows.filter((r) => r.brand_id === brand.id && r.collection) as { collection: string; thumbnail_url: string | null }[];
    const cnt = new Map<string, number>();
    for (const r of mine) cnt.set(r.collection, (cnt.get(r.collection) ?? 0) + 1);
    collections = [...cnt].map(([collection, n]) => ({ brand_id: brand.id, collection, cnt: n })).sort((a, b) => b.cnt - a.cnt);
    thumbSource = mine;
  }
  const thumbs = new Map<string, string>();
  for (const r of thumbSource) {
    if (r.thumbnail_url && !thumbs.has(r.collection)) thumbs.set(r.collection, r.thumbnail_url);
  }
  // 관리자에서 직접 정한 모델 이미지가 있으면 그걸로
  for (const r of (customRows ?? []) as { collection: string; image_url: string }[]) thumbs.set(r.collection, r.image_url);

  const products = (data ?? []) as Product[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (o: Partial<SP>) => {
    const q = new URLSearchParams();
    const next = { b: domestic ? brand?.slug : undefined, c: filters.c.join(',') || undefined, m: sp.m, s: sp.s, g: sp.g, d: sp.d, sort: sortKey === 'pick' ? undefined : sortKey, ...o };
    Object.entries(next).forEach(([k, v]) => v && q.set(k, String(v)));
    const s = q.toString();
    return s ? `?${s}` : '?';
  };

  const brandTabs = domestic ? brands.filter((b) => domesticBrandCount.has(b.id)) : brands;
  const tile = (on: boolean) =>
    `flex h-16 w-16 items-center justify-center overflow-hidden border bg-panel/60 transition-colors ${on ? 'border-accent' : 'border-rule'}`;
  const pill = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-[7px] text-[12.5px] transition-colors ${on ? 'border-accent bg-accent text-paper' : 'border-rule text-fg/60 hover:text-fg'}`;

  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center">
        <p className="eyebrow">{domestic ? 'In Boutique' : 'Collections'}</p>
        <h1 className="display mt-4 text-[40px]">
          {domestic ? (brand ? brand.name_en ?? brand.name_ko : 'Ready to Ship') : brand!.name_en ?? brand!.name_ko}
        </h1>
        <p className="mt-3 text-[12.5px] text-fg/50">
          {domestic ? `국내 보유 · 상담 후 바로 배송${brand ? ` · ${brand.name_ko}` : ''}` : `${brand!.name_ko} · 타임리에가 검수한 컬렉션`}
        </p>
      </div>

      {/* 브랜드 (정사각 타일) */}
      <nav className="mt-9 -mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        {domestic && (
          <Link href="/brand/domestic" scroll={false} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <span className={tile(!brand)}><span className="font-serif text-[18px] italic text-accent">All</span></span>
            <span className={`text-[11px] ${!brand ? 'text-accent' : 'text-fg/55'}`}>전체</span>
          </Link>
        )}
        {brandTabs.map((b) => {
          const on = b.id === brand?.id;
          return (
            <Link
              key={b.id}
              href={domestic ? (on ? '/brand/domestic' : `/brand/domestic?b=${b.slug}`) : `/brand/${b.slug}`}
              scroll={false}
              className="flex w-16 shrink-0 flex-col items-center gap-2"
            >
              <span className={tile(on)}>
                {b.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logo_url} alt="" className="w-3/4 object-contain" />
                ) : (
                  <span className="px-1 text-center font-serif text-[12.5px] leading-[1.1] text-fg/85">{b.name_en ?? b.name_ko}</span>
                )}
              </span>
              <span className={`w-full truncate text-center text-[11px] ${on ? 'text-accent' : 'text-fg/55'}`}>
                {b.name_ko}
                {domestic && <span className="ml-0.5 text-fg/35">{domesticBrandCount.get(b.id)}</span>}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 모델(상세분류) 알약 버튼 */}
      {collections.length > 0 && (
        <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto no-scrollbar px-5">
          <Link href={href({ c: undefined, page: undefined })} scroll={false} className={pill(!filters.c.length)}>ALL</Link>
          {collections.map((c) => (
            <Link key={c.collection} href={href({ c: c.collection, page: undefined })} scroll={false} className={pill(filters.c.includes(c.collection))}>
              {c.collection}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 -mx-5 border-y border-rule px-5 pt-3 pb-3">
        <FilterPanel
          facets={(facetRows ?? []) as FacetRow[]}
          collections={collections.map((c) => c.collection)}
          total={count ?? 0}
          domesticChip={!domestic}
          sort={
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-[13px] text-fg/80">
                {SORTS[sortKey].label} <span className="text-fg/40">⌄</span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-28 border border-rule bg-paper shadow-lg">
                {(Object.keys(SORTS) as SortKey[]).map((k) => (
                  <Link key={k} href={href({ sort: k === 'pick' ? undefined : k, page: undefined })} scroll={false} className={`block px-4 py-2.5 text-[13px] hover:bg-panel/50 ${k === sortKey ? 'text-accent' : ''}`}>
                    {SORTS[k].label}
                  </Link>
                ))}
              </div>
            </details>
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {products.length === 0 && <p className="py-20 text-center text-fg/55">등록된 상품이 없어요.</p>}

      {totalPages > 1 && (
        <nav className="mt-14 flex flex-wrap justify-center gap-1 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n === 1 ? undefined : String(n) })}
              className={`w-10 h-10 flex items-center justify-center font-serif text-[16px] ${n === page ? 'text-accent border-b border-accent' : 'text-fg/50 hover:text-fg'}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
