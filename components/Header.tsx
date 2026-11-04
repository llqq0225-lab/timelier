import Link from 'next/link';
import type { Brand, BrandCollection } from '@/lib/types';
import HeaderIcons from './HeaderIcons';
import NavTabs from './NavTabs';
import SearchBar from './SearchBar';
import KakaoLink from './KakaoLink';
import Wordmark from './Wordmark';
import { SearchToggle } from './SearchBar';
import type { KakaoUrls } from '@/lib/kakao';

export function collectionsOf(cols: BrandCollection[], brandId: number) {
  return cols.filter((c) => c.brand_id === brandId).sort((a, b) => b.cnt - a.cnt);
}

export function collectionHref(slug: string, collection: string) {
  return `/brand/${slug}?c=${encodeURIComponent(collection)}`;
}

/** 상단: 공지바 → (고정) 로고줄 + 메뉴탭 → 검색줄 */
export default function Header({
  siteName,
  brands,
  collections,
  announce,
  kakao,
}: {
  siteName: string;
  brands: Brand[];
  collections: BrandCollection[];
  announce?: string;
  kakao: KakaoUrls;
}) {
  const brandMenu = brands.map((b) => ({
    id: b.id,
    name: b.name_ko,
    slug: b.slug,
    logo: b.logo_url,
    en: b.name_en,
    cols: collectionsOf(collections, b.id).map((c) => c.collection),
  }));

  return (
    <>
      {announce && (
        <KakaoLink
          urls={kakao}
          className="block bg-abyss px-4 py-2.5 text-center text-[12px] text-fg/80 tracking-tight"
          dangerouslySetInnerHTML={{
            // **강조** 부분만 샴페인색 (관리자에서 입력한 문구)
            __html: announce
              .replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
              .replace(/\*\*(.+?)\*\*/g, '<b style="color:#d9bd8f;font-weight:600">$1</b>'),
          }}
        />
      )}

      <div className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-rule">
        <div className="mx-auto max-w-6xl px-3 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center">
            <SearchToggle />
          </div>
          <Link href="/" className="active:opacity-70" aria-label={siteName}>
            <Wordmark sub className="text-[20px] text-fg" />
          </Link>
          <div className="flex justify-end">
            <HeaderIcons brands={brandMenu} />
          </div>
        </div>
        <NavTabs brands={brandMenu} />
      </div>

      <SearchBar brands={brands.map((b) => ({ slug: b.slug, name: b.name_ko }))} />
    </>
  );
}
