import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, type Notice } from '@/lib/types';

export default async function AdminNotices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        <Link href="/admin/notices/new" className="btn">+ 공지 작성</Link>
      </div>
      <ul className="bg-white border border-line divide-y divide-line">
        {((data ?? []) as Notice[]).map((n) => (
          <li key={n.id}>
            <Link href={`/admin/notices/${n.id}`} className="flex justify-between gap-4 p-4 hover:bg-neutral-50 text-sm">
              <span>
                {n.is_pinned && <b className="mr-2 text-gold">[고정]</b>}
                {!n.is_visible && <span className="mr-2 text-neutral-400">[숨김]</span>}
                {n.title}
              </span>
              <span className="text-neutral-400 shrink-0">{formatDate(n.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {(data?.length ?? 0) === 0 && <p className="p-10 text-center text-neutral-500">아직 공지가 없어요.</p>}
    </div>
  );
}
