'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EN, GENDERS, MATERIALS, STRAPS, genderValues, type FacetRow, type Filters } from '@/lib/attributes';

type Key = 'c' | 'm' | 's' | 'g';
type Group = { key: Key; title: string; en: string; options: string[] };
const KEYS = ['c', 'm', 's', 'g', 'd'] as const;
const EMPTY: Filters = { c: [], m: [], s: [], g: [], d: [] };
const field = { c: 'collection', m: 'material', s: 'strap', g: 'gender' } as const;

function matches(r: FacetRow, f: Filters) {
  if (f.c.length && !f.c.includes(r.collection ?? '')) return false;
  if (f.m.length && !f.m.includes(r.material ?? '')) return false;
  if (f.s.length && !f.s.includes(r.strap ?? '')) return false;
  if (f.g.length && !genderValues(f.g).includes(r.gender ?? '공용')) return false;
  if (f.d.length && r.stock_type !== 'domestic') return false;
  return true;
}

/**
 * 상품 목록 위 필터 (VIVER식)
 * 1줄: 상품 수 · 정렬   2줄: [필터] [바로 배송] [컬렉션▾] [소재▾] [스트랩▾] [성별▾]
 * 칩을 누르면 그 항목만, '필터'를 누르면 전체가 아래에서 올라옴
 */
export default function FilterPanel({
  facets,
  collections = [],
  total,
  sort,
  domesticChip = true,
}: {
  facets: FacetRow[];
  collections?: string[];
  total: number;
  sort?: React.ReactNode;
  domesticChip?: boolean;
}) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const current = useMemo<Filters>(() => {
    const list = (k: string) => (sp.get(k) ?? '').split(',').filter(Boolean);
    return { c: list('c'), m: list('m'), s: list('s'), g: list('g'), d: sp.get('d') === '1' ? ['1'] : [] };
  }, [sp]);

  const [open, setOpen] = useState<null | 'all' | Key>(null);
  const [draft, setDraft] = useState<Filters>(current);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setDraft(current), [current, open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const has = (k: Key, v: string) => facets.some((r) => (k === 'g' ? r.gender === v || r.gender === '공용' : r[field[k]] === v));
  const groups: Group[] = (
    [
      collections.length > 1 && { key: 'c', title: '컬렉션', en: 'Collection', options: collections },
      { key: 'm', title: '소재', en: 'Material', options: MATERIALS.filter((v) => has('m', v) || current.m.includes(v)) },
      { key: 's', title: '스트랩', en: 'Strap', options: STRAPS.filter((v) => has('s', v) || current.s.includes(v)) },
      { key: 'g', title: '성별', en: 'Gender', options: [...GENDERS] },
    ].filter(Boolean) as Group[]
  ).filter((g) => g.options.length > 0);
  const shown = open === 'all' ? groups : groups.filter((g) => g.key === open);

  const count = (k: Key, v: string) => facets.filter((r) => matches(r, { ...draft, [k]: [v] })).length;
  const draftTotal = facets.filter((r) => matches(r, draft)).length;
  const active = current.c.length + current.m.length + current.s.length + current.g.length + current.d.length;
  const hasDomestic = domesticChip && facets.some((r) => r.stock_type === 'domestic');

  function go(f: Filters) {
    const q = new URLSearchParams(sp.toString());
    q.delete('page');
    KEYS.forEach((k) => (f[k].length ? q.set(k, k === 'd' ? '1' : f[k].join(',')) : q.delete(k)));
    const s = q.toString();
    router.push(s ? `${path}?${s}` : path, { scroll: false });
  }
  const toggle = (k: Key, v: string) => setDraft((d) => ({ ...d, [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] }));

  const chip = (on: boolean) =>
    `inline-flex shrink-0 items-center gap-1 border px-3 py-[7px] text-[12px] transition-colors ${on ? 'border-accent text-accent' : 'border-rule text-fg/60 hover:text-fg'}`;
  const chipLabel = (g: Group) => {
    const v = current[g.key];
    return v.length === 0 ? g.title : v.length === 1 ? v[0] : `${v[0]} 외 ${v.length - 1}`;
  };

  return (
    <>
      {/* 1줄: 상품 수 · 정렬 */}
      <div className="flex items-center justify-between py-1">
        <p className="text-[13px] text-fg/80" data-tl-total>
          상품 <span className="font-medium text-accent">{total.toLocaleString()}</span>
        </p>
        {sort}
      </div>

      {/* 2줄: 필터 · 칩 */}
      <div className="-mx-5 mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-rule px-5 pt-3">
        <button type="button" data-tl-open="all" onClick={() => setOpen('all')} className="inline-flex shrink-0 items-center gap-1.5 pr-1 text-[13px] text-fg">
          필터
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3" />
          </svg>
          {active > 0 && <span className="text-accent">{active}</span>}
        </button>
        <span className="h-4 w-px shrink-0 bg-rule" />
        {hasDomestic && (
          <button type="button" data-tl-toggle="d" onClick={() => go({ ...current, d: current.d.length ? [] : ['1'] })} className={chip(current.d.length > 0)}>
            바로 배송
          </button>
        )}
        {groups.map((g) => (
          <button key={g.key} type="button" data-tl-open={g.key} onClick={() => setOpen(g.key)} className={chip(current[g.key].length > 0)}>
            {chipLabel(g)}
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        ))}
        {active > 0 && (
          <button type="button" onClick={() => go(EMPTY)} className="shrink-0 px-1 text-[12px] text-fg/40 underline underline-offset-4">
            초기화
          </button>
        )}
      </div>

      {/* 아래에서 올라오는 필터 창 */}
      {mounted &&
        createPortal(
          <div className={`app-fixed-x fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} data-tl-sheet>
            <div onClick={() => setOpen(null)} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
            <section
              role="dialog"
              aria-label="필터"
              className={`absolute inset-x-0 bottom-0 flex max-h-[84vh] flex-col bg-paper text-fg shadow-[0_-20px_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
            >
              <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-fg/20" />
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-rule px-5">
                <p className="text-[16px]" data-tl-title>{open && open !== 'all' ? groups.find((g) => g.key === open)?.title : '필터'}</p>
                <button type="button" onClick={() => setOpen(null)} aria-label="닫기" className="text-2xl leading-none text-fg/60 hover:text-fg">×</button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                {/* 미리보기에서도 쓰도록 모든 항목을 그려두고, 안 보이는 것만 숨김 */}
                {groups.map((g) => (
                  <div key={g.key} data-tl-group={g.key} hidden={!shown.includes(g)} className="border-b border-rule py-5 last:border-b-0">
                    <p className="mb-2 flex items-baseline gap-2 text-[14px]" data-tl-gtitle hidden={open !== 'all' && open !== null}>
                      {g.title} <span className="font-display text-[9.5px] uppercase tracking-[0.2em] text-accent">{g.en}</span>
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4">
                      {g.options.map((v) => {
                        const on = draft[g.key].includes(v);
                        const n = count(g.key, v);
                        return (
                          <li key={v}>
                            <button
                              type="button"
                              data-tl-opt={`${g.key}|${v}`}
                              disabled={!on && n === 0}
                              onClick={() => toggle(g.key, v)}
                              className="flex w-full items-center gap-2.5 py-2.5 text-left disabled:opacity-30"
                            >
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${on ? 'border-accent bg-accent' : 'border-fg/35'}`}>
                                {on && <svg viewBox="0 0 24 24" className="h-3 w-3 text-paper" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>}
                              </span>
                              <span className="min-w-0 flex-1 text-[13px] leading-tight">
                                {v}
                                {EN[v] && <span className="block font-display text-[8.5px] uppercase tracking-[0.16em] text-fg/35">{EN[v]}</span>}
                              </span>
                              <span className="text-[11.5px] text-fg/35">{n}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {g.key === 'g' && <p className="mt-2 text-[11px] text-fg/35">남성·여성을 고르면 공용 모델도 함께 보여드려요.</p>}
                  </div>
                ))}
              </div>

              <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-rule px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  data-tl-reset
                  onClick={() => setDraft(open === 'all' || !open ? EMPTY : { ...draft, [open]: [] })}
                  className="inline-flex items-center gap-1.5 px-3 text-[13px] text-fg/60 hover:text-fg"
                >
                  ↺ 초기화
                </button>
                <button
                  type="button"
                  data-tl-apply
                  onClick={() => {
                    go(draft);
                    setOpen(null);
                  }}
                  className="bg-accent py-3.5 text-[14px] font-medium text-paper"
                >
                  {draftTotal.toLocaleString()}개 상품 보기
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
