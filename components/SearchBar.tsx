'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type B = { slug: string; name: string };

function Bar({ brands }: { brands: B[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');

  // 검색 결과 화면이면 지금 검색어를 칸에 채워둠
  useEffect(() => {
    if (path === '/search') {
      setQ(sp.get('q') ?? '');
      setBrand(sp.get('brand') ?? '');
    } else if (path.startsWith('/brand/')) {
      setBrand(path.split('/')[2] === 'domestic' ? '' : path.split('/')[2]);
    }
  }, [path, sp]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q.trim()) p.set('q', q.trim());
        if (brand) p.set('brand', brand);
        router.push(`/search?${p}`);
        (document.activeElement as HTMLElement | null)?.blur(); // 모바일 키보드 닫기
      }}
      className="mx-auto flex max-w-6xl gap-2 px-4 py-3"
    >
      <select
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        aria-label="브랜드 선택"
        className="w-[104px] shrink-0 rounded-none border border-rule bg-paper px-2 text-[13px] text-fg/85 focus:outline-none focus:border-accent"
      >
        <option value="">전체 브랜드</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>{b.name}</option>
        ))}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="브랜드 또는 모델명을 검색하세요"
        enterKeyHint="search"
        className="min-w-0 flex-1 rounded-none border border-rule bg-transparent px-3 py-2.5 text-[14px] placeholder:text-fg/35 focus:outline-none focus:border-accent"
      />
      <button aria-label="검색" className="flex w-11 shrink-0 items-center justify-center bg-accent text-paper active:scale-90 transition">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20.5 20.5 16 16" />
        </svg>
      </button>
    </form>
  );
}

/** 헤더 왼쪽 돋보기: 누르면 검색줄이 열리고 닫힘 */
export function SearchToggle() {
  return (
    <button
      type="button"
      aria-label="검색"
      onClick={() => window.dispatchEvent(new Event('tl:search'))}
      className="flex h-10 w-9 items-center justify-center text-fg/85 hover:text-accent active:scale-90 transition"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M20.5 20.5 16 16" />
      </svg>
    </button>
  );
}

export default function SearchBar({ brands }: { brands: B[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = () => setOpen((o) => !o);
    window.addEventListener('tl:search', t);
    return () => window.removeEventListener('tl:search', t);
  }, []);
  useEffect(() => setOpen(path === '/search'), [path]); // 검색 화면에서는 항상 열림

  return (
    <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr] border-b border-rule' : 'grid-rows-[0fr]'} bg-paper`}>
      <div className="overflow-hidden">
        <Suspense fallback={<div className="h-[66px]" />}>
          <Bar brands={brands} />
        </Suspense>
      </div>
    </div>
  );
}
