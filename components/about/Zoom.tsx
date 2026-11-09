'use client';

import { useEffect, useRef, useState } from 'react';

/** About 본문 사진을 누르면 크게 보기 (data-zoom 이 붙은 사진만) */
export default function Zoom() {
  const [list, setList] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const touchX = useRef<number | null>(null);
  const open = idx >= 0;

  // 사진 클릭 감지
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('img[data-zoom]') as HTMLImageElement | null;
      if (!el) return;
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-zoom]')).map((i) => i.currentSrc || i.src);
      setList(imgs);
      setIdx(Math.max(0, imgs.indexOf(el.currentSrc || el.src)));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const go = (d: number) => setIdx((i) => (i + d + list.length) % list.length);

  // 열려 있을 때: 키보드, 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIdx(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list.length]);

  if (!open) return null;
  const many = list.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0204]"
      style={{ animation: 'fadeUp .35s ease' }}
      onClick={() => setIdx(-1)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={list[idx]}
        alt=""
        className="max-h-[88vh] max-w-[94vw] object-contain shadow-2xl"
        onClick={(e) => {
          e.stopPropagation();
          if (many) go(1);
        }}
      />

      <button
        type="button"
        aria-label="닫기"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 text-accent"
        onClick={() => setIdx(-1)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2l12 12M14 2L2 14" /></svg>
      </button>

      {many && (
        <>
          {(['prev', 'next'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k === 'prev' ? '이전 사진' : '다음 사진'}
              className={`absolute top-1/2 -translate-y-1/2 ${k === 'prev' ? 'left-3' : 'right-3'} flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-[#0d0204]/60 text-accent`}
              onClick={(e) => {
                e.stopPropagation();
                go(k === 'prev' ? -1 : 1);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d={k === 'prev' ? 'M9 2L4 7l5 5' : 'M5 2l5 5-5 5'} />
              </svg>
            </button>
          ))}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden="true">
            {list.map((_, k) => (
              <span key={k} className={`h-1 w-1 rounded-full ${k === idx ? 'bg-accent' : 'bg-fg/25'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
