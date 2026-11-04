import Link from 'next/link';
import { type Product } from '@/lib/types';
import WishButton from './WishButton';

/** 상품 카드: 큰 사진 + 브랜드 + 이름. 순위·조회수·판매수 같은 표시는 넣지 않음 */
export default function ProductCard({ p }: { p: Product; rank?: number }) {
  return (
    <Link href={`/product/${p.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-panel">
        {p.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.thumbnail_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center font-serif text-fg/30">Timelier</div>
        )}
        {p.stock_type === 'domestic' && (
          <span className="absolute left-3 top-3 font-display text-[9px] font-medium uppercase tracking-[0.22em] text-fg/80">In boutique</span>
        )}
        <WishButton variant="overlay" item={{ id: p.id, name: p.name, thumb: p.thumbnail_url, brand: p.brands?.name_ko }} />
      </div>
      <div className="pt-5 text-center">
        {p.brands && (
          <p className="font-display text-[9.5px] font-medium uppercase tracking-[0.26em] text-accent line-clamp-1">
            {p.brands.name_en ?? p.brands.name_ko}
          </p>
        )}
        <p className="mx-auto mt-2.5 max-w-[22rem] text-[13px] font-light leading-[1.6] line-clamp-2 text-fg/90">{p.name}</p>
        <p className="mt-2 font-serif text-[13px] italic text-fg/45">{p.price ? `₩ ${p.price.toLocaleString()}` : 'Price upon request'}</p>
      </div>
    </Link>
  );
}
