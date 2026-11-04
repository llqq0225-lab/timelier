import Link from 'next/link';
import Arranger from '@/components/admin/Arranger';
import Toaster from '@/components/Toaster';
import { createClient } from '@/lib/supabase/server';
import type { Brand } from '@/lib/types';

const LIMIT = 120;

export default async function ArrangePage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const supabase = await createClient();
  const { data: brandRows } = await supabase.from('brands').select('*').order('sort_order');
  const brands = (brandRows ?? []) as Brand[];
  const scope = (await searchParams).scope ?? brands[0]?.slug ?? 'domestic';
  const brand = brands.find((b) => b.slug === scope);
  const scopeLabel = scope === 'domestic' ? '국내재고' : scope === 'all' ? '전체 상품' : (brand?.name_ko ?? '');

  // 손님이 보는 '추천순'과 똑같은 순서로 불러옴
  let q = supabase
    .from('products')
    .select('id, name, thumbnail_url, has_video, sort_order, stock_type', { count: 'exact' })
    .eq('is_visible', true)
    .order('sort_order')
    .order('has_video', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(LIMIT);
  if (scope === 'domestic') q = q.eq('stock_type', 'domestic');
  else if (brand) q = q.eq('brand_id', brand.id);
  const { data, count } = await q;

  const tab = (on: boolean) => `shrink-0 rounded-full px-3 py-1.5 text-sm border ${on ? 'bg-ink text-white border-ink' : 'bg-white border-line hover:border-ink'}`;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">진열 순서</h1>
      <p className="text-sm text-neutral-500 mb-5">
        손님이 보는 순서 그대로예요. PC는 끌어서 옮기고, 휴대폰은 ⤒(맨 위로) ▲ ▼ 버튼을 쓰세요. 다 옮긴 뒤 <b>이 순서로 저장</b>을 누르면 사이트에 바로 반영돼요.
        직접 안 정한 상품은 자동으로 <b>검수영상 있는 상품 → 최신순</b>이에요.
      </p>

      <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link href="?scope=domestic" className={tab(scope === 'domestic')}>국내재고</Link>
        {brands.map((b) => (
          <Link key={b.id} href={`?scope=${b.slug}`} className={tab(scope === b.slug)}>{b.name_ko}</Link>
        ))}
      </div>

      {(count ?? 0) > LIMIT && (
        <p className="mb-3 rounded bg-neutral-100 p-3 text-xs text-neutral-600">
          {scopeLabel} 상품이 {count}개라 앞쪽 {LIMIT}개만 보여요. 손님도 보통 앞쪽만 보니까 여기서 순서를 정하면 충분해요. 뒤쪽은 자동 순서예요.
        </p>
      )}

      <Arranger key={scope} initial={data ?? []} scope={scope} scopeLabel={scopeLabel} />
      <Toaster />
    </div>
  );
}
