'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** 휴대폰 원본처럼 큰 사진은 올리기 전에 가로 1600px JPG로 줄임 (빠르고 용량 절약) */
async function shrink(file: File, max = 1600): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // 투명 PNG 배경을 흰색으로
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // 브라우저가 못 읽는 형식이면 원본 그대로
  }
}

/** 사진을 Supabase 저장소(media)에 올리고 주소를 돌려줌 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const supabase = createClient();
  const body = await shrink(file);
  const ext = body === file ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('media')
    .upload(path, body, { cacheControl: '31536000', contentType: body === file ? file.type || undefined : 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export default function ImageUpload({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      alert('업로드 실패: ' + (err as Error).message);
    }
    setBusy(false);
    e.target.value = '';
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-28 h-28 bg-neutral-100 border border-line overflow-hidden shrink-0 flex items-center justify-center text-xs text-neutral-400">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : '없음'}
      </div>
      <div className="flex flex-col gap-2">
        <label className="btn-line cursor-pointer">
          {busy ? '올리는 중…' : '사진 선택'}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        {value && (
          <button type="button" className="text-xs text-red-600 text-left" onClick={() => onChange('')}>
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
