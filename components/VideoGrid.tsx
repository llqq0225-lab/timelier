'use client';

import { useState } from 'react';
import ShortsViewer from './ShortsViewer';

export type VideoItem = {
  key: string;
  title: string;
  thumb: string | null;
  video: string;
  date: string;
  productId: number | null;
};

/** 실시간 출고영상 목록: 누르면 숏츠처럼 위아래로 넘겨보기 */
export default function VideoGrid({ items }: { items: VideoItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 ">
        {items.map((v, i) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[9/14] overflow-hidden rounded-lg bg-neutral-900 text-left active:scale-[0.97] transition-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {v.thumb && <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />}
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> 출고영상
            </span>
            {/* 재생 표시는 제품을 가리지 않게 오른쪽 위 작게 */}
            <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-12">
              <span className="block text-[13px] font-medium text-white line-clamp-2 leading-snug">{v.title}</span>
            </span>
          </button>
        ))}
      </div>

      {open !== null && <ShortsViewer items={items} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}
