'use client';

import { useEffect, useRef, useState } from 'react';
import { thumb } from '@/lib/img';

/** 손가락으로 넘기는 사진 줄 */
function Slider({
  images,
  alt,
  index,
  onIndex,
  onOpen,
  full,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndex: (i: number) => void;
  onOpen?: () => void;
  full?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // 바깥에서 번호가 바뀌면 그 사진으로 이동 (전체화면은 처음엔 바로 점프)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 4) {
      el.scrollTo({ left: target, behavior: full && first.current ? 'instant' : 'smooth' });
    }
    first.current = false;
  }, [index, full]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) onIndex(i);
  };

  const go = (d: number) => onIndex(Math.min(images.length - 1, Math.max(0, index + d)));
  const arrow =
    // 마우스가 있는 기기(PC)에서만 보이는 화살표. 휴대폰은 손가락으로 넘김
    'hidden [@media(hover:hover)]:flex absolute top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-abyss/60 text-2xl text-fg shadow backdrop-blur-sm transition hover:bg-abyss/85 active:scale-90 disabled:!opacity-0 disabled:pointer-events-none';

  return (
    <div className={`relative group ${full ? 'h-full' : 'h-full'}`}>
      <div ref={ref} onScroll={onScroll} className="flex h-full overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {images.map((src, i) => (
          <div key={src + i} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              loading={i < 2 || Math.abs(i - index) < 2 ? 'eager' : 'lazy'}
              draggable={false}
              onClick={onOpen}
              className={full ? 'max-h-full max-w-full object-contain select-none' : 'h-full w-full object-cover cursor-zoom-in select-none'}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="이전 사진" onClick={() => go(-1)} disabled={index === 0} className={`${arrow} left-3`}>‹</button>
          <button type="button" aria-label="다음 사진" onClick={() => go(1)} disabled={index === images.length - 1} className={`${arrow} right-3`}>›</button>
        </>
      )}
    </div>
  );
}

/** 검은 화면 전체보기 */
export function Lightbox({
  images,
  start = 0,
  alt = '',
  captions,
  hideCount = false,
  onClose,
}: {
  images: string[];
  start?: number;
  alt?: string;
  captions?: (string | null)[];
  hideCount?: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, images.length]);

  return (
    <div className="fixed inset-0 z-[80] bg-black" role="dialog" aria-modal="true">
      <Slider images={images} alt={alt} index={idx} onIndex={setIdx} full />
      {!hideCount && (
        <span className="absolute left-1/2 -translate-x-1/2 top-5 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
          {idx + 1} / {images.length}
        </span>
      )}
      {captions?.[idx] && (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 text-center text-sm text-white">
          {captions[idx]}
        </p>
      )}
      <button type="button" onClick={onClose} aria-label="닫기" className="absolute right-4 top-3 h-11 w-11 rounded-full bg-white/15 text-2xl text-white active:scale-90">
        ×
      </button>
    </div>
  );
}

/** 상품 사진: 크게 넘겨보고, 아래에 작은 사진 4장 + '+N' */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  if (images.length === 0) {
    return <div className="aspect-square bg-panel flex items-center justify-center text-fg/40">No image</div>;
  }

  // 지금 보는 사진이 작은 사진 4장 안에 들어오도록 범위 이동
  const VISIBLE = 4;
  const startThumb = Math.min(Math.max(0, idx - 1), Math.max(0, images.length - VISIBLE));
  const thumbs = images.slice(startThumb, startThumb + VISIBLE);
  const rest = images.length - (startThumb + thumbs.length);

  return (
    <div className="relative aspect-square overflow-hidden bg-panel">
      <Slider images={images} alt={alt} index={idx} onIndex={setIdx} onOpen={() => setOpen(true)} />

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent pb-3 pt-10">
          {thumbs.map((src, i) => {
            const real = startThumb + i;
            return (
              <button
                key={src + real}
                type="button"
                onClick={() => setIdx(real)}
                aria-label={`${real + 1}번째 사진`}
                className={`pointer-events-auto h-12 w-12 overflow-hidden border transition active:scale-90 ${real === idx ? 'border-white' : 'border-transparent opacity-75'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            );
          })}
          {rest > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center bg-abyss/70 text-sm font-semibold text-white active:scale-90 transition"
            >
              +{rest}
            </button>
          )}
        </div>
      )}

      {open && <Lightbox images={images} start={idx} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}
