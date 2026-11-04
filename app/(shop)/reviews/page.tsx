import type { Metadata } from 'next';
import ReviewStrip from '@/components/ReviewStrip';
import { createPublicClient } from '@/lib/supabase/public';
import type { Review } from '@/lib/types';

export const metadata: Metadata = { title: '실시간 후기' };

const PAGE_SIZE = 60;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { data, count } = await createPublicClient()
    .from('reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 ">
      <div className="text-center pt-8 pb-4">
        <p className="eyebrow">Client Stories</p>
        <h1 className="display mt-5 text-[44px] ">Client Stories</h1>
        <p className="mt-4 text-[13px] text-fg/55">타임리에의 시계를 받으신 분들이 보내주신 이야기</p>
      </div>

      <div className="mt-8 -mx-4 ">
        <ReviewStrip reviews={(data ?? []) as Review[]} layout="grid" />
      </div>
      {(count ?? 0) === 0 && <p className="py-20 text-center text-fg/55 text-sm">아직 등록된 후기가 없어요.</p>}

      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2 text-sm">
          {page > 1 && <a href={`?page=${page - 1}`} className="btn-line rounded-full">이전</a>}
          <span className="px-3 py-2">{page} / {totalPages}</span>
          {page < totalPages && <a href={`?page=${page + 1}`} className="btn-line rounded-full">다음</a>}
        </nav>
      )}
    </div>
  );
}
