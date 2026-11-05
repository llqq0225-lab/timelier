'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WM_KEYS, drawWatermark, readWm, type WmConfig } from '@/lib/watermark';

/** 워터마크를 찍는 사진 종류 (배너·로고·팝업·공유이미지 등에는 안 찍음) */
const WM_FOLDERS = ['products', 'shipping', 'reviews'];

// 워터마크 설정은 한 번만 불러옴
let wmPromise: Promise<WmConfig> | null = null;
function getWm(): Promise<WmConfig> {
  if (!wmPromise) {
    wmPromise = (async () => {
      const { data } = await createClient().from('site_settings').select('key, value').in('key', [...WM_KEYS, 'site_name']);
      return readWm(Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])));
    })();
  }
  return wmPromise;
}
/** 설정을 저장한 뒤 다시 불러오도록 */
export function resetWatermarkCache() {
  wmPromise = null;
}

/** 큰 사진은 가로 1600px JPG로 줄이고, 필요하면 워터마크를 찍음 */
async function process(file: File, folder: string, max = 1600): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) return file;
  const wm = WM_FOLDERS.includes(folder) ? await getWm().catch(() => null) : null;
  const useWm = !!wm?.on && (folder !== 'reviews' || wm.reviews);
  if (!useWm && file.size < 400 * 1024) return file;
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
    if (useWm && wm) await drawWatermark(ctx, canvas.width, canvas.height, wm);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
    if (!blob) return file;
    return useWm || blob.size < file.size ? blob : file;
  } catch {
    return file; // 브라우저가 못 읽는 형식이면 원본 그대로
  }
}

/** 사진을 Supabase 저장소(media)에 올리고 주소를 돌려줌 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const supabase = createClient();
  const body = await process(file, folder);
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
