import type { Metadata } from 'next';
import Link from 'next/link';
import { collectionHref, collectionsOf } from '@/components/Header';
import { createPublicClient } from '@/lib/supabase/public';
import type { Brand, BrandCollection } from '@/lib/types';

export const metadata: Metadata = { title: '브랜드 · 모델' };

export default async function BrandsPage() {
  const supabase = createPublicClient();
  const [{ data: brands }, { data: cols }] = await Promise.all([
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
  ]);
  const collections = (cols ?? []) as BrandCollection[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 ">
      <div className="text-center pt-8 pb-6"><p className="eyebrow">Collections</p><h1 className="display mt-5 text-[44px] ">The Maisons</h1><p className="mt-4 text-[13px] text-fg/55">브랜드와 모델별로 둘러보세요</p></div>
      <div className="mt-8 space-y-3">
        {((brands ?? []) as Brand[]).map((b) => {
          const list = collectionsOf(collections, b.id);
          const total = list.reduce((n, c) => n + c.cnt, 0);
          return (
            <details key={b.id} className="group rounded-lg border border-rule bg-paper open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 active:bg-panel/50 rounded-lg">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper">
                  {b.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo_url} alt="" className="w-3/4 object-contain" />
                  ) : (
                    <span className="text-[9px] font-semibold text-center leading-tight px-1">{b.name_en}</span>
                  )}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{b.name_ko}</span>
                  <span className="block text-xs text-fg/40">{b.name_en} · {total}개</span>
                </span>
                <span className="text-fg/40 transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="flex flex-wrap gap-2 px-4 pb-5">
                <Link href={`/brand/${b.slug}`} className="rounded-full bg-accent px-4 py-2 text-sm text-paper active:scale-95 transition">
                  전체 {total}
                </Link>
                {list.map((c) => (
                  <Link
                    key={c.collection}
                    href={collectionHref(b.slug, c.collection)}
                    className="rounded-full border border-rule px-4 py-2 text-sm hover:border-accent active:scale-95 transition"
                  >
                    {c.collection} <span className="text-fg/40">{c.cnt}</span>
                  </Link>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
