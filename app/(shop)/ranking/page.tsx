import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { createPublicClient } from '@/lib/supabase/public';
import type { Brand, Product } from '@/lib/types';
import FilterPanel from '@/components/FilterPanel';
import { FACET_FIELDS, applyFilters, readFilters, type FacetRow } from '@/lib/attributes';

export const metadata: Metadata = { title: 'The Selection' };

/** 셀렉션: 관리자 진열 순서대로 (영상 있는 것 → 최신) */
type SP = { brand?: string; c?: string; m?: string; s?: string; g?: string; d?: string };

export default async function SelectionPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const slug = sp.brand;
  const filters = readFilters(sp);
  const supabase = createPublicClient();
  const { data: brandRows } = await supabase.from('brands').select('*').order('sort_order');
  const brands = (brandRows ?? []) as Brand[];
  const brand = brands.find((b) => b.slug === slug) ?? null;

  let query = supabase
    .from('products')
    .select('*, brands(name_ko, name_en, slug)', { count: 'exact' })
    .order('sort_order')
    .order('has_video', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(48);
  if (brand) query = query.eq('brand_id', brand.id);
  query = applyFilters(query, filters);
  let facetQ = supabase.from('products').select(FACET_FIELDS).limit(3000);
  if (brand) facetQ = facetQ.eq('brand_id', brand.id);
  const [{ data, count }, { data: facetData }] = await Promise.all([query, facetQ]);
  const products = (data ?? []) as Product[];
  const facets = (facetData ?? []) as FacetRow[];
  // 필터 창의 컬렉션: 상품이 많은 순서로 최대 24개
  const colCount = new Map<string, number>();
  for (const r of facets) if (r.collection) colCount.set(r.collection, (colCount.get(r.collection) ?? 0) + 1);
  const collections = [...colCount].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([c]) => c);
  const keep = (b?: string) => {
    const q = new URLSearchParams();
    if (b) q.set('brand', b);
    (['c', 'm', 's', 'g', 'd'] as const).forEach((k) => sp[k] && q.set(k, sp[k]!));
    return `/ranking${q.size ? `?${q}` : ''}`;
  };

  const tile = (on: boolean) =>
    `flex h-16 w-16 items-center justify-center overflow-hidden border bg-panel/60 transition-colors ${on ? 'border-accent' : 'border-rule'}`;

  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center">
        <p className="eyebrow">Curated by Timelier</p>
        <h1 className="display mt-4 text-[40px]">The Selection</h1>
        <p className="mt-3 text-[12.5px] text-fg/50">타임리에가 직접 검수하고 고른 시계들</p>
      </div>

      <nav className="mt-9 -mx-5 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        <Link href={keep()} className="flex w-16 shrink-0 flex-col items-center gap-2">
          <span className={tile(!brand)}><span className="font-serif text-[18px] italic text-accent">All</span></span>
          <span className={`text-[11px] ${!brand ? 'text-accent' : 'text-fg/55'}`}>전체</span>
        </Link>
        {brands.map((b) => (
          <Link key={b.id} href={keep(b.slug)} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <span className={tile(brand?.id === b.id)}>
              {b.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo_url} alt="" className="w-3/4 object-contain" />
              ) : (
                <span className="px-1 text-center font-serif text-[12.5px] leading-[1.1] text-fg/85">{b.name_en ?? b.name_ko}</span>
              )}
            </span>
            <span className={`w-full truncate text-center text-[11px] ${brand?.id === b.id ? 'text-accent' : 'text-fg/55'}`}>{b.name_ko}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 -mx-5 border-y border-rule px-5 pt-3 pb-3">
        <FilterPanel facets={facets} collections={collections} total={count ?? 0} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {products.length === 0 && <p className="py-20 text-center text-sm text-fg/55">조건에 맞는 시계가 없어요.</p>}
    </div>
  );
}
