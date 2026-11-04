import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { createPublicClient } from '@/lib/supabase/public';
import type { Product } from '@/lib/types';

export const metadata: Metadata = { title: '검색' };

const SUGGEST = ['데이토나', '서브마리너', '노틸러스', '로얄오크', '산토스', '탱크', '빅뱅', '5711', '국내재고'];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 50);
  const supabase = createPublicClient();
  let products: Product[] = [];
  let brandName = '';

  if (q || sp.brand) {
    let query = supabase
      .from('products')
      .select('*, brands!inner(name_ko, name_en, slug)')
      .order('has_video', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(80);
    if (sp.brand) query = query.eq('brands.slug', sp.brand);
    // 띄어쓰기로 나눠서 모든 단어가 들어간 상품 (예: "롤렉스 청판")
    const words = q.replace(/[%,()]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 5);
    for (const w of words) {
      if (w === '국내재고') query = query.eq('stock_type', 'domestic');
      else query = query.or(`name.ilike.%${w}%,model_no.ilike.%${w}%,collection.ilike.%${w}%`);
    }
    products = ((await query).data ?? []) as Product[];
    brandName = products[0]?.brands?.name_ko ?? '';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 ">
      {!q && !sp.brand ? (
        <div>
          <p className="text-sm font-semibold mb-3">많이 찾는 검색어</p>
          <div className="flex flex-wrap gap-2">
            {SUGGEST.map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-rule px-4 py-2 text-sm hover:border-accent active:scale-95 transition">
                {s}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-fg/55">
            {sp.brand && brandName && <b className="text-fg">{brandName} </b>}
            {q && <b className="text-fg">&lsquo;{q}&rsquo; </b>}
            검색 결과 {products.length}
            {products.length === 80 && '+'}개
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 ">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="py-20 text-center text-sm text-fg/55">
              <p>찾는 모델이 없나요?</p>
              <p className="mt-1">카톡으로 문의주시면 구해드릴 수 있는지 바로 확인해드려요.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
