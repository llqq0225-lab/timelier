import { notFound } from 'next/navigation';
import NoticeForm from '@/components/admin/NoticeForm';
import { createClient } from '@/lib/supabase/server';
import type { Notice } from '@/lib/types';

export default async function EditNotice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('notices').select('*').eq('id', Number(id)).maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">공지 수정</h1>
      <NoticeForm notice={data as Notice} />
    </div>
  );
}
