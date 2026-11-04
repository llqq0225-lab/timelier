import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { formatDate } from '@/lib/types';

// 처음 열릴 때 만들어서 저장해두고, 1분마다 갱신 (빠르게 열림)
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

export default async function NoticeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: n } = await supabase.from('notices').select('*').eq('id', Number(id)).maybeSingle();
  if (!n) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <div className="border-b border-accent pb-6">
        <h1 className="text-2xl font-semibold">{n.title}</h1>
        <p className="mt-2 text-sm text-fg/40">{formatDate(n.created_at)}</p>
      </div>
      <div className="py-10 whitespace-pre-line leading-8 text-neutral-800">{n.content}</div>
      <Link href="/notice" className="btn-line">목록으로</Link>
    </article>
  );
}
