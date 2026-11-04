import Link from 'next/link';
import ReviewManager from '@/components/admin/ReviewManager';
import { createClient } from '@/lib/supabase/server';
import type { Review } from '@/lib/types';

const PAGE_SIZE = 60;

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">후기 <span className="text-base font-normal text-neutral-500">({count ?? 0})</span></h1>
      <ReviewManager reviews={(data ?? []) as Review[]} />
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
