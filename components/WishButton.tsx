'use client';

import { toggleWish, useList, type SavedItem } from '@/lib/local-store';
import { toast } from './Toaster';

export default function WishButton({
  item,
  variant = 'icon',
}: {
  item: SavedItem;
  variant?: 'icon' | 'overlay';
}) {
  const wish = useList('wish');
  const on = wish.some((i) => i.id === item.id);

  return (
    <button
      type="button"
      aria-label={on ? '찜 해제' : '찜하기'}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault(); // 카드 안에 있을 때 상품으로 넘어가지 않게
        e.stopPropagation();
        const added = toggleWish(item);
        toast(added ? '찜 목록에 담았어요' : '찜을 해제했어요');
      }}
      className={
        variant === 'overlay'
          ? 'absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center active:scale-90 transition'
          : 'flex h-10 w-10 items-center justify-center rounded-full border border-rule active:scale-90 transition'
      }
    >
      <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${on ? 'text-accent' : 'text-fg/80'}`} aria-hidden="true">
        <path
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          d="M12 20.5s-7.5-4.6-9.3-9.1C1.5 8.2 3.6 5 6.9 5c2 0 3.4 1.1 4.1 2.3h2C13.7 6.1 15.1 5 17.1 5c3.3 0 5.4 3.2 4.2 6.4-1.8 4.5-9.3 9.1-9.3 9.1z"
        />
      </svg>
    </button>
  );
}
