'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Slide = { id: number; title: string | null; subtitle: string | null; image_url: string; link_url: string | null };

/** 메인 배너: 5초마다 부드럽게 넘어가고, 손가락으로도 넘길 수 있음 */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((i: number) => {
    const el = ref.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = setInterval(() => go(idx + 1), 5000);
    return () => clearInterval(t);
  }, [idx, paused, go, slides.length]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  if (slides.length === 0) {
    return (
      <div className="relative h-[62vh] min-h-[380px] bg-abyss text-fg flex flex-col items-center justify-center text-center px-8">
        <p className="eyebrow">Fine Timepieces</p>
        <p className="mt-5 font-display text-3xl font-light tracking-[0.3em] -mr-[0.3em]">TIMELIER</p>
        <p className="mt-6 text-sm text-fg/60">관리자 › 배너 · 사이트 설정에서 메인 배너를 등록하세요</p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden bg-abyss"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}
    >
      <div ref={ref} onScroll={onScroll} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        {slides.map((s, i) => {
          const inner = (
            <div className="relative h-[62vh] min-h-[380px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image_url}
                alt={s.title ?? ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a0a13]/90 via-[#2a0a13]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-7 pb-14 text-fg">
                <p className="eyebrow !text-[#d9bd8f]">Timelier Collection</p>
                {s.title && <h2 className="mt-3 text-[26px] font-light leading-[1.25] tracking-[-0.02em] whitespace-pre-line">{s.title}</h2>}
                {s.subtitle && <p className="mt-3 text-[13px] tracking-[-0.01em] text-fg/75">{s.subtitle}</p>}
                {s.link_url && (
                  <span className="mt-7 inline-flex w-fit items-center gap-3 border border-fg/70 px-6 py-3 font-display text-[11px] font-medium tracking-[0.25em] text-fg transition-colors hover:bg-fg hover:text-paper">
                    DISCOVER <span aria-hidden="true">→</span>
                  </span>
                )}
              </div>
            </div>
          );
          return (
            <div key={s.id} className="w-full shrink-0 snap-start snap-always">
              {s.link_url ? <Link href={s.link_url} className="block">{inner}</Link> : inner}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-6 left-7 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${i + 1}번 배너`}
                onClick={() => go(i)}
                className={`h-px transition-all duration-500 ${i === idx ? 'w-10 bg-panel' : 'w-5 bg-panel/35'}`}
              />
            ))}
          </div>
          <span className="absolute bottom-[18px] right-7 font-display text-[11px] tracking-[0.2em] text-fg/70">
            {String(idx + 1).padStart(2, '0')} <span className="text-fg/35">/ {String(slides.length).padStart(2, '0')}</span>
          </span>
          <button type="button" aria-label="이전 배너" onClick={() => go(idx - 1)} className="hidden absolute left-5 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full border border-fg/30 text-2xl text-fg hover:bg-panel/15">‹</button>
          <button type="button" aria-label="다음 배너" onClick={() => go(idx + 1)} className="hidden absolute right-5 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full border border-fg/30 text-2xl text-fg hover:bg-panel/15">›</button>
        </>
      )}
    </div>
  );
}
