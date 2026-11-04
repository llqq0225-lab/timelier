'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useList } from '@/lib/local-store';
import { TABS, type BrandMenu } from './NavTabs';

function Icon({ d, className = 'h-[22px] w-[22px]' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const HEART = 'M12 20.5s-7.5-4.6-9.3-9.1C1.5 8.2 3.6 5 6.9 5c2 0 3.4 1.1 4.1 2.3h2C13.7 6.1 15.1 5 17.1 5c3.3 0 5.4 3.2 4.2 6.4-1.8 4.5-9.3 9.1-9.3 9.1z';
const CLOCK = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2';

export default function HeaderIcons({ brands }: { brands: BrandMenu[] }) {
  const wish = useList('wish');
  const recent = useList('recent');
  const [open, setOpen] = useState(false);
  const [openBrand, setOpenBrand] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]); // 페이지 이동하면 닫기
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const iconBtn = 'relative flex h-10 w-9  items-center justify-center text-fg/85 hover:text-accent active:scale-90 transition';

  return (
    <>
      <div className="flex items-center gap-0.5 ">
        <Link href="/wishlist?tab=recent" aria-label="최근 본 상품" className={`${iconBtn} hidden `}>
          <Icon d={CLOCK} className="h-5 w-5" />
          {recent.length > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[9px] leading-4 text-paper">{recent.length}</span>}
        </Link>
        <Link href="/wishlist" aria-label="찜 목록" className={iconBtn}>
          <Icon d={HEART} className="h-5 w-5" />
          {wish.length > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[9px] leading-4 text-paper">{wish.length}</span>}
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="전체 메뉴" className={iconBtn}>
          <Icon d="M4 7h16M4 12h16M4 17h16" className="h-5 w-5" />
        </button>
      </div>

      {/* 전체 메뉴 (오른쪽에서 열림). 헤더 밖(페이지 맨 위)에 그려야 화면 전체를 덮음 */}
      {mounted && createPortal(
      <div className={`app-fixed-x fixed inset-0 z-[60] overflow-hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto bg-paper shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-rule bg-paper px-5 h-14">
            <b>전체 메뉴</b>
            <button onClick={() => setOpen(false)} aria-label="닫기" className="text-2xl leading-none active:scale-90">×</button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4">
            {[
              { href: '/wishlist', label: `찜 ${wish.length}`, d: HEART },
              { href: '/wishlist?tab=recent', label: `최근 본 ${recent.length}`, d: CLOCK },
              { href: '/search', label: '검색', d: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20.5 20.5 16 16' },
            ].map((x) => (
              <Link key={x.href} href={x.href} className="flex flex-col items-center gap-1.5 rounded-lg bg-panel/50 py-4 text-xs active:scale-95 transition">
                <Icon d={x.d} />
                {x.label}
              </Link>
            ))}
          </div>

          <ul className="border-t border-rule">
            {TABS.filter((t) => t.href !== '/brands').map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center justify-between px-5 py-3.5 font-medium active:bg-panel/50">
                  <span>{t.ko} <span className="ml-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-fg/40">{t.label}</span></span> <span className="text-fg/25">›</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/notice" className="flex items-center justify-between px-5 py-3.5 font-medium active:bg-panel/50">
                공지사항 <span className="text-fg/25">›</span>
              </Link>
            </li>
          </ul>

          <p className="border-t border-rule px-5 pt-5 pb-2 text-xs font-semibold tracking-widest text-accent">BRAND</p>
          <ul className="pb-10">
            {brands.map((b) => (
              <li key={b.id} className="border-b border-rule/70">
                <button
                  type="button"
                  onClick={() => setOpenBrand(openBrand === b.id ? null : b.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-panel/50"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper text-[7px] font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {b.logo ? <img src={b.logo} alt="" className="w-3/4 object-contain" /> : b.en?.split(' ')[0]}
                  </span>
                  <span className="flex-1">{b.name}</span>
                  <span className={`text-fg/40 transition-transform ${openBrand === b.id ? 'rotate-180' : ''}`}>⌄</span>
                </button>
                {openBrand === b.id && (
                  <div className="flex flex-wrap gap-1.5 px-5 pb-4">
                    <Link href={`/brand/${b.slug}`} className="rounded-full bg-accent px-3 py-1.5 text-xs text-paper">전체</Link>
                    {b.cols.map((c) => (
                      <Link key={c} href={`/brand/${b.slug}?c=${encodeURIComponent(c)}`} className="rounded-full border border-rule px-3 py-1.5 text-xs">
                        {c}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>,
      document.body)}
    </>
  );
}
