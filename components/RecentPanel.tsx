'use client';

import Link from 'next/link';
import { useList } from '@/lib/local-store';

/** 큰 PC 화면 오른쪽에 따라다니는 '최근 본 상품' */
export default function RecentPanel() {
  const recent = useList('recent');
  const wish = useList('wish');
  if (recent.length === 0) return null;

  return (
    <aside className="hidden fixed right-6 top-1/2 -translate-y-1/2 z-30 w-24 flex-col items-center gap-2 rounded-lg border border-rule bg-white/95 p-2 shadow-lg backdrop-blur">
      <Link href="/wishlist" className="w-full rounded-md bg-panel/50 py-2 text-center text-[11px] hover:bg-panel">
        찜 <b className="text-accent">{wish.length}</b>
      </Link>
      <p className="text-[11px] font-semibold mt-1">최근 본 상품</p>
      {recent.slice(0, 4).map((r) => (
        <Link key={r.id} href={`/product/${r.id}`} title={r.name} className="block w-20 h-20 overflow-hidden rounded-lg bg-panel active:scale-95 transition">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {r.thumb && <img src={r.thumb} alt={r.name} className="h-full w-full object-cover" />}
        </Link>
      ))}
      <Link href="/wishlist?tab=recent" className="text-[11px] text-fg/55 hover:text-fg">전체보기</Link>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="w-full rounded-md border border-rule py-1.5 text-[11px] hover:border-accent"
      >
        ↑ TOP
      </button>
    </aside>
  );
}
