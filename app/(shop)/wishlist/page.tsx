'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clearList, removeItem, useList, type SavedItem } from '@/lib/local-store';

function Grid({ items, onRemove }: { items: SavedItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 ">
      {items.map((it) => (
        <div key={it.id} className="relative">
          <Link href={`/product/${it.id}`} className="block active:scale-[0.98] transition-transform">
            <div className="aspect-square overflow-hidden rounded-md bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.thumb && <img src={it.thumb} alt={it.name} loading="lazy" className="h-full w-full object-cover" />}
            </div>
            {it.brand && <p className="mt-3 text-xs text-fg/55">{it.brand}</p>}
            <p className="mt-1 text-sm leading-snug line-clamp-2">{it.name}</p>
          </Link>
          <button
            type="button"
            onClick={() => onRemove(it.id)}
            aria-label="목록에서 빼기"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-abyss/60 text-fg/80 shadow-sm active:scale-90"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const wish = useList('wish');
  const recent = useList('recent');
  const [tab, setTab] = useState<'wish' | 'recent'>('wish');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'recent') setTab('recent');
  }, []);

  const items = tab === 'wish' ? wish : recent;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 ">
      <div className="flex border-b border-rule">
        {(
          [
            ['wish', `찜한 상품 ${wish.length}`],
            ['recent', `최근 본 상품 ${recent.length}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm border-b-2 -mb-px transition ${tab === key ? 'border-accent font-semibold' : 'border-transparent text-fg/40'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-4 mb-6 text-xs text-fg/40">이 기기(휴대폰·PC)에만 저장돼요.</p>

      {items.length > 0 ? (
        <>
          <Grid items={items} onRemove={(id) => removeItem(tab, id)} />
          <button
            type="button"
            onClick={() => confirm('목록을 모두 지울까요?') && clearList(tab)}
            className="mt-10 text-xs text-fg/40 underline"
          >
            전체 지우기
          </button>
        </>
      ) : (
        <div className="py-24 text-center text-sm text-fg/55">
          <p>{tab === 'wish' ? '하트를 눌러 마음에 드는 시계를 담아보세요.' : '아직 본 상품이 없어요.'}</p>
          <Link href="/brands" className="mt-6 inline-flex items-center border border-accent px-6 py-3 text-sm text-accent hover:bg-accent hover:text-paper">브랜드 둘러보기</Link>
        </div>
      )}
    </div>
  );
}
