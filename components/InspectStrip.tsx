import Link from 'next/link';
import type { Shipping } from '@/lib/types';
import { thumb } from '@/lib/img';

type Card = { key: string; href: string; thumb: string | null; video: boolean; label?: string };

/** 상품 상세 '실시간 검수' 줄: 이 상품 영상 + 연결된 출고 게시물 */
export default function InspectStrip({
  title,
  count,
  productVideoThumb,
  hasProductVideo,
  posts,
}: {
  title: string;
  count: number;
  productVideoThumb: string | null;
  hasProductVideo: boolean;
  posts: Shipping[];
}) {
  const cards: Card[] = [
    ...(hasProductVideo ? [{ key: 'pv', href: '#video', thumb: productVideoThumb, video: true, label: '출고영상' }] : []),
    ...posts.map((p) => ({ key: `s${p.id}`, href: `/shipping/${p.id}`, thumb: p.thumbnail_url, video: !!p.video_url })),
  ];
  if (cards.length === 0) return null;

  return (
    <section className="py-2">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow">Inspection Atelier</p>
          <h2 className="mt-3 text-[18px] font-light">{title} 기록 <span className="font-serif italic text-fg/45">· {count}</span></h2>
        </div>
        <Link href="/shipping" className="shrink-0 font-display text-[10px] font-medium uppercase tracking-[0.25em] text-accent border-b border-accent/40 pb-1">All records</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x -mx-5 px-5 scroll-px-5 ">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="group relative w-40 shrink-0 snap-start aspect-[4/5] overflow-hidden bg-panel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.thumb && <img src={thumb(c.thumb)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a0509]/85 to-transparent px-3 pb-3 pt-10 font-display text-[9.5px] font-medium uppercase tracking-[0.22em] text-fg/90">
              {c.video ? `▶ ${c.label === '출고영상' ? 'Film' : 'Film'}` : 'Inspected'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
