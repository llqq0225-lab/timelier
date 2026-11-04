'use client';

import { useState } from 'react';
import { Lightbox } from './Gallery';
import type { Review } from '@/lib/types';

/** 후기 사진들: 옆으로 넘기기(strip) 또는 바둑판(grid). 누르면 크게 */
export default function ReviewStrip({ reviews, layout = 'strip' }: { reviews: Review[]; layout?: 'strip' | 'grid' }) {
  const images = reviews.flatMap((r) => r.image_urls ?? []);
  const captions = reviews.flatMap((r) => (r.image_urls ?? []).map(() => r.content));
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div
        className={
          layout === 'strip'
            ? 'flex gap-0.5 overflow-x-auto no-scrollbar snap-x'
            : 'grid grid-cols-3  gap-1'
        }
      >
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            className={`${layout === 'strip' ? 'w-40 shrink-0 snap-start' : ''} aspect-[3/4] overflow-hidden bg-panel active:opacity-80`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="고객 후기" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} captions={captions} hideCount start={open} alt="고객 후기" onClose={() => setOpen(null)} />}
    </>
  );
}
