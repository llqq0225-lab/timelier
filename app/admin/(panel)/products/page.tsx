import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductTable from '@/components/admin/ProductTable';
import type { Brand, BrandCollection, Product } from '@/lib/types';

const PAGE_SIZE = 50;

type SP = { q?: string; brand?: string; c?: string; status?: string; sort?: string; page?: string };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();

  let query = supabase.from('products').select('*, brands(name_ko, name_en, slug)', { count: 'exact' });
  if (sp.sort === 'pick') query = query.order('sort_order').order('has_video', { ascending: false });
  query = query
    .order(sp.sort === 'views' ? 'view_count' : 'created_at', { ascending: false })
    .order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.q) {
    const w = sp.q.replace(/[%,()]/g, ' ').trim();
    query = query.or(`name.ilike.%${w}%,model_no.ilike.%${w}%`);
  }
  if (sp.brand) query = query.eq('brand_id', Number(sp.brand));
  if (sp.c === '__none') query = query.is('collection', null);
  else if (sp.c) query = query.eq('collection', sp.c);
  if (sp.status === 'hidden') query = query.eq('is_visible', false);
  if (sp.status === 'domestic') query = query.eq('stock_type', 'domestic');
  if (sp.status === 'video') query = query.eq('has_video', true);

  const [{ data, count }, { data: brands }, { data: cols }] = await Promise.all([
    query,
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const allCols = (cols ?? []) as BrandCollection[];
  const brandCols = sp.brand ? allCols.filter((c) => c.brand_id === Number(sp.brand)) : allCols;
  const colNames = [...new Set(brandCols.map((c) => c.collection))].sort();
  const qs = (p: number) => {
    const q = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== 'page') as [string, string][]);
    q.set('page', String(p));
    return `?${q}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">상품 관리 <span className="text-base font-normal text-neutral-500">({count ?? 0})</span></h1>
        <Link href="/admin/products/new" className="btn">+ 상품 등록</Link>
      </div>

      <form className="flex flex-wrap gap-2 mb-4">
        <input name="q" defaultValue={sp.q} placeholder="상품명 · 모델번호" className="input max-w-[200px]" />
        <select name="brand" defaultValue={sp.brand ?? ''} className="input max-w-[150px]">
          <option value="">전체 브랜드</option>
          {((brands ?? []) as Brand[]).map((b) => (
            <option key={b.id} value={b.id}>{b.name_ko}</option>
          ))}
        </select>
        <select name="c" defaultValue={sp.c ?? ''} className="input max-w-[160px]">
          <option value="">전체 컬렉션</option>
          <option value="__none">미분류만</option>
          {colNames.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className="input max-w-[130px]">
          <option value="">전체 상태</option>
          <option value="hidden">숨김만</option>
          <option value="domestic">국내재고만</option>
          <option value="video">영상 있는 것</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? ''} className="input max-w-[120px]">
          <option value="">최신순</option>
          <option value="views">조회순</option>
          <option value="pick">사이트 추천순</option>
        </select>
        <button className="btn-line">검색</button>
      </form>

      <ProductTable products={(data ?? []) as Product[]} collections={colNames} />

      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap gap-1 text-sm">
          {page > 1 && <Link href={qs(page - 1)} className="btn-line">이전</Link>}
          <span className="px-3 py-2">{page} / {totalPages}</span>
          {page < totalPages && <Link href={qs(page + 1)} className="btn-line">다음</Link>}
        </nav>
      )}
    </div>
  );
}
