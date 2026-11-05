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

// 사진 종류별 최대 크기 (긴 쪽 기준 px)
const MAX: Record<string, number> = { banners: 2000, popup: 1200, seo: 1200, brands: 600, watermark: 800 };
const THUMB_FOLDERS = ['products', 'shipping', 'reviews', 'collections'];
const THUMB_PX = 640;

/** 캔버스 → WebP (지원 안 하는 브라우저는 JPG) */
async function encode(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob; ext: 'webp' | 'jpg' } | null> {
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality + 0.04));
  return jpg ? { blob: jpg, ext: 'jpg' } : null;
}

type Processed = { full: Blob; ext: string; type: string; small?: Blob };

/** 올리기 전에: 크기 줄이기 → (상품·검수·후기 사진이면) 워터마크 → WebP로 압축 → 작은 사진도 하나 더 */
async function process(file: File, folder: string): Promise<Processed | null> {
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.type)) return null; // gif 등은 그대로
  const wm = WM_FOLDERS.includes(folder) ? await getWm().catch(() => null) : null;
  const useWm = !!wm?.on && (folder !== 'reviews' || wm.reviews);
  const keepAlpha = folder === 'brands' || folder === 'watermark'; // 로고는 투명 배경 유지
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const max = MAX[folder] ?? 1600;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    if (!keepAlpha) {
      ctx.fillStyle = '#fff'; // 투명 PNG 배경을 흰색으로
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    if (useWm && wm) await drawWatermark(ctx, canvas.width, canvas.height, wm);

    const full = keepAlpha
      ? await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9)).then((b) => (b && b.type === 'image/webp' ? { blob: b, ext: 'webp' as const } : null))
      : await encode(canvas, 0.82);
    if (!full) return null;

    let small: Blob | undefined;
    if (THUMB_FOLDERS.includes(folder) && Math.max(canvas.width, canvas.height) > THUMB_PX) {
      const k = THUMB_PX / Math.max(canvas.width, canvas.height);
      const c2 = document.createElement('canvas');
      c2.width = Math.round(canvas.width * k);
      c2.height = Math.round(canvas.height * k);
      const x2 = c2.getContext('2d')!;
      x2.imageSmoothingQuality = 'high';
      x2.drawImage(canvas, 0, 0, c2.width, c2.height);
      small = (await encode(c2, 0.78))?.blob;
    }
    return { full: full.blob, ext: full.ext, type: full.blob.type, small };
  } catch {
    return null; // 브라우저가 못 읽는 형식이면 원본 그대로
  }
}

/** 마지막으로 올린 사진의 용량 변화 (화면 안내용) */
export const lastUploadInfo = { before: 0, after: 0 };

/** 사진을 Supabase 저장소(media)에 올리고 주소를 돌려줌 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  const supabase = createClient();
  const store = supabase.storage.from('media');
  const base = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const opt = { cacheControl: '31536000' };
  const done = await process(file, folder);
  lastUploadInfo.before = file.size;

  if (!done) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const { error } = await store.upload(`${base}.${ext}`, file, { ...opt, contentType: file.type || undefined });
    if (error) throw error;
    lastUploadInfo.after = file.size;
    return store.getPublicUrl(`${base}.${ext}`).data.publicUrl;
  }

  // 원본은 '-o', 작은 사진은 '-t' (목록에서는 작은 사진을 씀)
  const fullPath = done.small ? `${base}-o.${done.ext}` : `${base}.${done.ext}`;
  const { error } = await store.upload(fullPath, done.full, { ...opt, contentType: done.type });
  if (error) throw error;
  if (done.small) {
    const t = await store.upload(`${base}-t.${done.ext}`, done.small, { ...opt, contentType: done.type });
    // 작은 사진 저장에 실패하면 원본을 같은 이름으로 한 번 더 (목록에서 깨지지 않게)
    if (t.error) await store.upload(`${base}-t.${done.ext}`, done.full, { ...opt, contentType: done.type });
  }
  lastUploadInfo.after = done.full.size;
  return store.getPublicUrl(fullPath).data.publicUrl;
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
  const [info, setInfo] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      const mb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`);
      setInfo(lastUploadInfo.after < lastUploadInfo.before ? `${mb(lastUploadInfo.before)} → ${mb(lastUploadInfo.after)}로 줄였어요` : '');
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
        {info && <span className="text-[11px] text-green-700">{info}</span>}
        {value && (
          <button type="button" className="text-xs text-red-600 text-left" onClick={() => onChange('')}>
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
