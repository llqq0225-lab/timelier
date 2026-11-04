import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Shipping } from '@/lib/types';

const PAGE_SIZE = 40;

export default async function AdminShipping({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('shipping_videos')
    .select('*', { count: 'exact' })
    .order('shipped_at', { ascending: false })
    .order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">출고 게시물 <span className="text-base font-normal text-neutral-500">({count ?? 0})</span></h1>
        <Link href="/admin/shipping/new" className="btn">+ 출고 등록</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {((data ?? []) as Shipping[]).map((v) => (
          <Link key={v.id} href={`/admin/shipping/${v.id}`} className="bg-white border border-line hover:border-ink">
            <div className="relative aspect-square bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />}
              {v.video_url && <span className="absolute right-1 top-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">▶ 영상</span>}
              {!v.is_visible && <span className="absolute left-1 top-1 bg-neutral-700 text-white text-[10px] px-1.5 py-0.5 rounded">숨김</span>}
            </div>
            <div className="p-2 text-xs">
              <p className="line-clamp-1 font-medium">{v.title}</p>
              <p className="text-neutral-400">{v.shipped_at}</p>
            </div>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <nav className="mt-6 flex gap-1 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`} className="btn-line">이전</Link>}
          <span className="px-3 py-2">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?page=${page + 1}`} className="btn-line">다음</Link>}
        </nav>
      )}
    </div>
  );
}
