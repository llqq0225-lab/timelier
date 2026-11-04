'use client';

import { useFormStatus } from 'react-dom';
import { saveNotice, deleteNotice } from '@/app/admin/actions';
import type { Notice } from '@/lib/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? '저장 중…' : '저장하기'}</button>;
}

export default function NoticeForm({ notice }: { notice?: Notice }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <form action={saveNotice} className="bg-white border border-line p-6 space-y-5">
        {notice && <input type="hidden" name="id" value={notice.id} />}
        <div>
          <label className="label">제목 *</label>
          <input name="title" className="input" defaultValue={notice?.title} required />
        </div>
        <div>
          <label className="label">내용</label>
          <textarea name="content" rows={16} className="input" defaultValue={notice?.content ?? ''} />
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_pinned" defaultChecked={notice?.is_pinned ?? false} /> 상단 고정
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_visible" defaultChecked={notice?.is_visible ?? true} /> 사이트에 노출
          </label>
        </div>
        <div className="flex gap-2">
          <SubmitButton />
          <a href="/admin/notices" className="btn-line">취소</a>
        </div>
      </form>
      {notice && (
        <form action={deleteNotice} onSubmit={(e) => { if (!confirm('이 공지를 삭제할까요?')) e.preventDefault(); }}>
          <input type="hidden" name="id" value={notice.id} />
          <button className="text-sm text-red-600 underline">공지 삭제</button>
        </form>
      )}
    </div>
  );
}
