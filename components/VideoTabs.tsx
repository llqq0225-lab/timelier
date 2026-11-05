'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Shipping } from '@/lib/types';
import { thumb } from '@/lib/img';

export function ShippingCard({ v, compact }: { v: Shipping; compact?: boolean }) {
  return (
    <Link
      href={`/shipping/${v.id}`}
      className="group relative block aspect-square overflow-hidden rounded-md bg-neutral-900 active:scale-[0.97] transition-transform"
    >
      {v.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb(v.thumbnail_url)} alt={v.title ?? ''} loading="lazy" className="h-full w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-300" />
      )}
      {v.video_url && (
        <span className={`absolute right-1.5 top-1.5 rounded-full bg-black/60 text-white ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}`}>▶{!compact && ' 영상'}</span>
      )}
      <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent text-white ${compact ? 'p-2' : 'p-3'}`}>
        {!compact && <p className="text-[11px] text-accent">검수통과 · 출고완료</p>}
        {v.title && <p className={`line-clamp-1 ${compact ? 'text-[11px]' : 'text-sm'}`}>{v.title}</p>}
      </div>
    </Link>
  );
}

export default function VideoTabs({
  videos,
  brands,
  compact,
}: {
  videos: Shipping[];
  brands: { id: number; name_ko: string }[];
  compact?: boolean;
}) {
  const tabs = brands.filter((b) => videos.some((v) => v.brand_id === b.id));
  const [active, setActive] = useState<number | 'all'>('all');
  const shown = (active === 'all' ? videos : videos.filter((v) => v.brand_id === active)).slice(0, compact ? 12 : 8);

  return (
    <div>
      {tabs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          {[{ id: 'all' as const, name_ko: '전체' }, ...tabs].map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm border transition active:scale-95 ${
                active === t.id ? 'bg-accent text-white border-accent' : 'border-rule hover:border-accent'
              }`}
            >
              {t.name_ko}
            </button>
          ))}
        </div>
      )}
      {compact ? (
        // 작게: 모바일은 옆으로 넘기기, PC는 6칸
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 scroll-px-4 ">
          {shown.map((v) => (
            <div key={v.id} className="w-28 shrink-0 snap-start ">
              <ShippingCard v={v} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shown.map((v) => (
            <ShippingCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}
