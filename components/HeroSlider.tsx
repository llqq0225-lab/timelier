'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroSlide = { id: number; title: string | null; subtitle: string | null; image_url: string; link_url: string | null };

const INTERVAL = 6000; // 다음 배너로 넘어가는 시간 (6초)

/** 메인 첫 화면: 배너 여러 장이 부드럽게 페이드로 바뀜. 손가락으로 밀거나 아래 줄을 눌러 넘길 수 있음 */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  const many = n > 1;

  const go = useCallback((d: number) => setCur((c) => (c + d + n) % n), [n]);

  useEffect(() => {
    if (!many || paused) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [cur, many, paused, go]);

  const s = slides[cur] ?? null;

  return (
    <section
      className="relative h-[78svh] min-h-[520px] overflow-hidden bg-abyss"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* 사진들: 겹쳐 두고 지금 것만 보이게 (천천히 확대되는 효과) */}
      {slides.map((sl, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={sl.id}
          src={sl.image_url}
          alt={sl.title ?? ''}
          fetchPriority={i === 0 ? 'high' : 'low'}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out ${
            i === cur ? 'scale-[1.06] opacity-100' : 'scale-100 opacity-0'
          }`}
          style={{ transitionDuration: i === cur ? '1400ms, 7000ms' : '1400ms, 1400ms' }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0509]/25 via-[#1a0509]/25 to-[#1a0509]/95" />

      {/* 글: 배너가 바뀔 때마다 살짝 떠오르며 나타남 */}
      <div key={cur} className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-20 text-center" style={{ animation: 'fadeUp 1s ease both' }}>
        <p className="eyebrow !text-[#d9bd8f]">Maison Timelier</p>
        <h1 className="display mt-5 text-[34px] leading-[1.2] text-fg whitespace-pre-line">{s?.title || 'The Art of Time'}</h1>
        <p className="mt-5 max-w-md text-[13px] leading-relaxed text-fg/75">{s?.subtitle || '한 점 한 점 직접 검수한 시계만을 소개합니다.'}</p>
        <Link href={s?.link_url || '/ranking'} className="cta mt-9">Discover</Link>
      </div>

      {many && (
        <>
          {/* 아래 진행 줄: 지금 배너는 금색으로 채워짐, 누르면 그 배너로 */}
          <div className="absolute inset-x-0 bottom-7 flex justify-center gap-2">
            {slides.map((sl, i) => (
              <button key={sl.id} type="button" aria-label={`${i + 1}번째 배너`} onClick={() => setCur(i)} className="py-2">
                <span className="relative block h-px w-8 overflow-hidden bg-fg/25">
                  {i === cur && (
                    <span
                      key={`${cur}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-accent"
                      style={paused ? { width: '100%' } : { animation: `heroBar ${INTERVAL}ms linear both` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          {/* PC(마우스)에서만 보이는 ‹ › */}
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? '이전 배너' : '다음 배너'}
              onClick={() => go(d)}
              className={`absolute top-1/2 hidden -translate-y-1/2 ${d < 0 ? 'left-3' : 'right-3'} h-10 w-10 items-center justify-center text-fg/70 transition-colors hover:text-accent [@media(hover:hover)]:flex`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d={d < 0 ? 'M10.5 2L4.5 8l6 6' : 'M5.5 2l6 6-6 6'} />
              </svg>
            </button>
          ))}
        </>
      )}
    </section>
  );
}
