import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { formatDate, type Notice } from '@/lib/types';

export default async function NoticeList() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center pt-6 pb-10"><p className="eyebrow">Notice</p><h1 className="display mt-5 text-[44px] ">News</h1></div>
      <ul className="divide-y divide-rule border-y border-accent">
        {((data ?? []) as Notice[]).map((n) => (
          <li key={n.id}>
            <Link href={`/notice/${n.id}`} className="flex justify-between gap-4 py-5 hover:bg-panel/50 px-2">
              <span>
                {n.is_pinned && <b className="mr-2 text-accent">[공지]</b>}
                {n.title}
              </span>
              <span className="shrink-0 text-sm text-fg/40">{formatDate(n.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {(data?.length ?? 0) === 0 && <p className="py-20 text-center text-fg/55">등록된 공지가 없어요.</p>}
    </div>
  );
}
