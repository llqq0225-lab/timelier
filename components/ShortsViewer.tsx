'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { videoEmbedUrl } from '@/lib/charlla';
import type { VideoItem } from './VideoGrid';

/**
 * 숏츠처럼 위아래로 넘겨보는 출고영상.
 * 넘길 때는 사진만 보여서 가볍고, 누르면 그 영상만 재생됨 (다른 영상 소리 안 겹침)
 */
export default function ShortsViewer({ items, start, onClose }: { items: VideoItem[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(start);
  const [playing, setPlaying] = useState<number | null>(start);

  // 처음 연 영상 위치로 바로 이동
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = start * el.clientHeight;
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') go(idx + 1);
      if (e.key === 'ArrowUp') go(idx - 1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  });

  const go = useCallback((i: number) => {
    const el = ref.current;
    if (!el || i < 0 || i >= items.length) return;
    el.scrollTo({ top: i * el.clientHeight, behavior: 'smooth' });
  }, [items.length]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx) {
      setIdx(i);
      setPlaying(null); // 넘기면 이전 영상은 멈춤
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black" role="dialog" aria-modal="true" aria-label="출고영상">
      <div ref={ref} onScroll={onScroll} className="h-[100dvh] overflow-y-auto no-scrollbar snap-y snap-mandatory overscroll-contain">
        {items.map((v, i) => (
          <section key={v.key} className="relative flex h-[100dvh] snap-start snap-always flex-col items-center justify-center px-3 pt-14 pb-36">
            <div className="relative aspect-[9/16] h-full max-h-full max-w-full overflow-hidden rounded-lg bg-neutral-900">
              {playing === i ? (
                <iframe
                  src={videoEmbedUrl(v.video) ?? ''}
                  title={v.title}
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(i)} className="group relative block h-full w-full" aria-label="영상 재생">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.thumb && <img src={v.thumb} alt="" loading={Math.abs(i - idx) < 3 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />}
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    눌러서 재생
                  </span>
                </button>
              )}
            </div>

            {/* 아래 정보 (이 부분을 밀어서 넘길 수도 있음) */}
            <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-white">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-band animate-pulse" /> 실제 출고영상
              </p>
              <p className="mt-1 text-[15px] font-medium leading-snug line-clamp-2">{v.title}</p>
              {v.productId && (
                <Link href={`/product/${v.productId}`} className="mt-3 block rounded-md bg-accent py-3 text-center text-sm font-semibold text-paper active:scale-[0.98] transition-transform">
                  이 상품 보러가기 →
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* 위쪽: 닫기 + 몇 번째 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs text-white">{idx + 1} / {items.length}</span>
        <button type="button" onClick={onClose} aria-label="닫기" className="pointer-events-auto h-10 w-10 rounded-full bg-white/15 text-2xl text-white active:scale-90">×</button>
      </div>

      {/* 오른쪽: 위/아래 버튼 */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="이전 영상" className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-20 active:scale-90">▲</button>
        <button type="button" onClick={() => go(idx + 1)} disabled={idx === items.length - 1} aria-label="다음 영상" className="h-11 w-11 rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-20 active:scale-90">▼</button>
      </div>

      {idx === start && idx < items.length - 1 && (
        <p className="pointer-events-none absolute bottom-40 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/80">
          위로 밀어서 다음 영상
        </p>
      )}
    </div>
  );
}
