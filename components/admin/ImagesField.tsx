'use client';

import { useState } from 'react';
import { uploadImage } from './ImageUpload';

/** 여러 장 사진 올리기 + 순서 바꾸기. name 이름의 숨은 칸에 JSON으로 담김 */
export default function ImagesField({
  name = 'images',
  initial,
  folder,
}: {
  name?: string;
  initial: string[];
  folder?: string;
}) {
  const [images, setImages] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);

  async function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, folder)));
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      alert('업로드 실패: ' + (err as Error).message);
    }
    setBusy(false);
    e.target.value = '';
  }

  const move = (i: number, d: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(images)} />
      <p className="label">추가 사진 ({images.length}장) — 상세페이지에 이 순서대로 나와요</p>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url + i} className="w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-24 h-24 object-cover border border-line" />
            <div className="flex justify-between text-xs mt-1">
              <button type="button" onClick={() => move(i, -1)}>◀</button>
              <button type="button" className="text-red-600" onClick={() => setImages(images.filter((_, j) => j !== i))}>삭제</button>
              <button type="button" onClick={() => move(i, 1)}>▶</button>
            </div>
          </div>
        ))}
        <label className="w-24 h-24 border border-dashed border-neutral-400 flex items-center justify-center text-xs text-neutral-500 cursor-pointer hover:border-ink text-center">
          {busy ? '올리는 중…' : '+ 여러 장 추가'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} disabled={busy} />
        </label>
      </div>
    </div>
  );
}
