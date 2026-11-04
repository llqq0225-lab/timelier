'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type BrandMenu = { id: number; name: string; en: string | null; slug: string; logo: string | null; cols: string[] };

export const TABS = [
  { href: '/brands', label: 'Collections', ko: '컬렉션', mega: true },
  { href: '/ranking', label: 'The Selection', ko: '셀렉션' },
  { href: '/brand/domestic', label: 'In Boutique', ko: '바로 배송' },
  { href: '/shipping', label: 'Inspection', ko: '검수 아틀리에' },
  { href: '/reviews', label: 'Client Stories', ko: '고객 이야기' },
] as { href: string; label: string; ko: string; mega?: boolean; dot?: boolean }[];

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  if (href === '/brands') return path === '/brands' || (path.startsWith('/brand/') && path !== '/brand/domestic');
  return path.startsWith(href);
}

/** 메뉴 탭 줄. 모바일은 옆으로 밀어서 보기, PC는 SHOP에 마우스 올리면 브랜드·모델 메뉴 */
export default function NavTabs({ brands }: { brands: BrandMenu[] }) {
  const path = usePathname();

  return (
    <nav className="mx-auto max-w-6xl">
      <ul className="flex overflow-x-auto no-scrollbar font-display text-[10.5px] font-medium uppercase tracking-[0.22em] px-1 ">
        {TABS.map((t) => {
          const on = isActive(path, t.href);
          return (
            <li key={t.href} className={`shrink-0 ${t.mega ? 'group' : ''}`}>
              <Link
                href={t.href}
                className={`relative flex h-11 items-center px-3.5 whitespace-nowrap transition-colors active:opacity-60 ${
                  on ? 'text-accent' : 'text-fg/60 hover:text-fg'
                }`}
              >
                {t.label}
                {t.dot && <span className="absolute right-1.5 top-2.5 h-1.5 w-1.5 rounded-full bg-accent" />}
                <span className={`absolute inset-x-3 bottom-0 h-px bg-accent transition-transform ${on ? 'scale-x-100' : 'scale-x-0'}`} />
              </Link>

              {t.mega && (
                <div className="hidden invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition duration-200 absolute left-0 right-0 top-full bg-paper border-b border-rule shadow-[0_20px_40px_-20px_rgba(61,15,27,0.25)]">
                  <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-6 gap-x-6 gap-y-8">
                    {brands.map((b) => (
                      <div key={b.id}>
                        <Link href={`/brand/${b.slug}`} className="font-semibold text-accent hover:text-accent">{b.name}</Link>
                        <ul className="mt-3 space-y-1.5 text-[13px] text-fg/55">
                          {b.cols.slice(0, 7).map((c) => (
                            <li key={c}>
                              <Link href={`/brand/${b.slug}?c=${encodeURIComponent(c)}`} className="hover:text-fg">{c}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
