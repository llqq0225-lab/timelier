import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Dashboard() {
  const supabase = await createClient();
  const count = async (table: string, filter?: [string, unknown]) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return (await q).count ?? 0;
  };
  const [products, hidden, domestic, notices, top, unclassified] = await Promise.all([
    count('products'),
    count('products', ['is_visible', false]),
    count('products', ['stock_type', 'domestic']),
    count('notices'),
    supabase.from('products').select('id, name, thumbnail_url, view_count').order('view_count', { ascending: false }).limit(10),
    supabase.from('products').select('*', { count: 'exact', head: true }).is('collection', null),
  ]);

  const cards = [
    { label: '전체 상품', value: products, href: '/admin/products' },
    { label: '숨김 상품', value: hidden, href: '/admin/products' },
    { label: '국내재고', value: domestic, href: '/admin/products' },
    { label: '공지사항', value: notices, href: '/admin/notices' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">대시보드</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white border border-line p-5 hover:border-ink">
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>
      {(unclassified.count ?? 0) > 0 && (
        <Link href="/admin/products?c=__none" className="mt-4 block rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          컬렉션(상세분류)이 비어있는 상품이 {unclassified.count}개 있어요 → 상품 관리에서 &lsquo;컬렉션 자동 분류&rsquo;를 눌러주세요
        </Link>
      )}

      <div className="mt-10 bg-white border border-line p-5 max-w-2xl">
        <h2 className="font-bold mb-4">많이 본 상품 TOP 10</h2>
        <ol className="space-y-2">
          {(top.data ?? []).map((p: { id: number; name: string; thumbnail_url: string | null; view_count: number }, i: number) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 text-sm hover:underline">
                <b className="w-5 text-right text-neutral-400">{i + 1}</b>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.thumbnail_url && <img src={p.thumbnail_url} alt="" className="h-9 w-9 rounded object-cover" />}
                <span className="flex-1 line-clamp-1">{p.name}</span>
                <span className="text-neutral-500">{(p.view_count ?? 0).toLocaleString()}회</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/admin/products/new" className="btn">+ 상품 등록</Link>
        <Link href="/admin/notices/new" className="btn-line">+ 공지 작성</Link>
      </div>
    </div>
  );
}
