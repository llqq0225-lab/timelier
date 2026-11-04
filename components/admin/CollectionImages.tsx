'use client';

import { useState } from 'react';
import { saveCollectionImage } from '@/app/admin/actions';
import { uploadImage } from './ImageUpload';
import { toast } from '@/components/Toaster';

type Col = { collection: string; cnt: number; custom: string | null; auto: string | null };

/** 브랜드 아래 모델(상세분류)별 대표 이미지 정하기 */
export default function CollectionImages({ brandId, cols }: { brandId: number; cols: Col[] }) {
  const [items, setItems] = useState(cols);
  const [busy, setBusy] = useState<string | null>(null);

  async function set(collection: string, file: File | null) {
    setBusy(collection);
    try {
      const url = file ? await uploadImage(file, 'collections') : null;
      await saveCollectionImage(brandId, collection, url);
      setItems((list) => list.map((c) => (c.collection === collection ? { ...c, custom: url } : c)));
      toast(file ? `${collection} 이미지를 바꿨어요` : `${collection} 이미지를 자동으로 돌렸어요`);
    } catch (e) {
      alert('실패: ' + (e as Error).message);
    }
    setBusy(null);
  }

  if (items.length === 0) return <p className="text-xs text-neutral-400">아직 모델(상세분류)이 없어요.</p>;

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((c) => {
        const src = c.custom ?? c.auto;
        return (
          <div key={c.collection} className="w-24 text-center">
            <label className={`relative block h-24 w-24 cursor-pointer overflow-hidden rounded-2xl bg-neutral-100 ring-offset-2 hover:ring-2 hover:ring-ink ${busy === c.collection ? 'opacity-50' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src && <img src={src} alt="" className="h-full w-full object-cover" />}
              <span className={`absolute left-1 top-1 rounded px-1 text-[9px] ${c.custom ? 'bg-ink text-white' : 'bg-white/90 text-neutral-500'}`}>
                {c.custom ? '직접' : '자동'}
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-[10px] text-white">{busy === c.collection ? '올리는 중…' : '사진 바꾸기'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!!busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) set(c.collection, f);
                }}
              />
            </label>
            <p className="mt-1 text-[11px] font-medium leading-tight line-clamp-2">{c.collection}</p>
            <p className="text-[10px] text-neutral-400">{c.cnt}개</p>
            {c.custom && (
              <button type="button" className="text-[10px] text-red-600 underline" onClick={() => set(c.collection, null)} disabled={!!busy}>
                자동으로
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
