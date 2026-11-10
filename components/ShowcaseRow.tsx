'use client';

import Link from 'next/link';
import { useRef } from 'react';

/** 배너 아래 제품 줄: 제목 + VIEW ALL + ‹ › 버튼, 옆으로 넘기는 상품 목록 */
export default function ShowcaseRow({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle?: string;
  href: string;
  children: React.ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const go = (d: number) => {
    const el = row.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="flex items-center gap-4 px-5 pb-6 pt-7">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[13px] font-medium uppercase tracking-[0.26em] text-fg">{title}</h3>
          {subtitle && <p className="mt-1.5 truncate text-[12px] text-fg/50">{subtitle}</p>}
        </div>
        <Link href={href} className="shrink-0 border-b border-accent/50 pb-0.5 font-display text-[10px] font-medium uppercase tracking-[0.24em] text-accent hover:border-accent">
          View all
        </Link>
        <div className="flex shrink-0 gap-1">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? '이전' : '다음'}
              onClick={() => go(d)}
              className="flex h-8 w-8 items-center justify-center text-fg/60 transition-colors hover:text-accent"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d={d < 0 ? 'M8 1.5L3.5 6 8 10.5' : 'M4 1.5L8.5 6 4 10.5'} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div ref={row} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5">
        {children}
      </div>
    </div>
  );
}
