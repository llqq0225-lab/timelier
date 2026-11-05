'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useList, type SavedItem } from '@/lib/local-store';
import { hasKakao, type KakaoUrls } from '@/lib/kakao';
import KakaoLink from './KakaoLink';
import { thumb } from '@/lib/img';

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

function hiddenToday(key: string) {
  try {
    return localStorage.getItem(key) === today();
  } catch {
    return false;
  }
}
function hideToday(key: string) {
  try {
    localStorage.setItem(key, today());
  } catch {}
}
function onceThisVisit(key: string) {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

function Modal({ open, onClose, children, className = '' }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <div className={`app-fixed-x fixed inset-0 z-[75] flex items-center justify-center p-6 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full bg-paper shadow-2xl transition-all duration-300 ease-out rounded-lg ${
          open ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- 첫 접속 팝업 (관리자 > 사이트 설정) ---------------- */

export type EntryPopupData = { image?: string; link?: string; title?: string; text?: string };

export function EntryPopup({ data }: { data: EntryPopupData | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const KEY = 'da_entry_hide';

  useEffect(() => {
    if (!data || path !== '/') return;
    if (hiddenToday(KEY) || !onceThisVisit('da_entry_seen')) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [data, path]);

  if (!data) return null;
  const body = (
    <>
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.image} alt={data.title ?? ''} className="block w-full max-h-[44vh] object-cover" />
      )}
      {(data.title || data.text) && (
        <div className="px-4 pt-3.5 pb-1 ">
          {data.title && <p className="text-[15px] font-semibold whitespace-pre-line">{data.title}</p>}
          {data.text && <p className="mt-1 text-[13px] text-fg/65 whitespace-pre-line">{data.text}</p>}
        </div>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="max-w-[280px] overflow-hidden">
      {data.link ? (
        <Link href={data.link} onClick={() => setOpen(false)} className="block">{body}</Link>
      ) : body}
      <div className="flex border-t border-rule text-[13px] mt-3">
        <button className="flex-1 py-3 text-fg/55 active:bg-panel/50" onClick={() => { hideToday(KEY); setOpen(false); }}>
          오늘 하루 보지 않기
        </button>
        <button className="flex-1 py-3 font-semibold border-l border-rule active:bg-panel/50" onClick={() => setOpen(false)}>
          닫기
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- 둘러보는 중 추천 팝업 ---------------- */

type Rec = { id: number; name: string; thumbnail_url: string | null; recent_sales: number; view_count: number; collection: string | null; brands: { name_ko: string } | null };

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** 본 모델·브랜드와 비슷한 것 → 부족하면 인기 상품에서 무작위 */
async function pickRecommendations(recent: SavedItem[], count: number): Promise<Rec[]> {
  const supabase = createClient();
  const seen = new Set(recent.map((r) => r.id));
  const fields = 'id, name, thumbnail_url, recent_sales, view_count, collection, brands(name_ko)';
  const out: Rec[] = [];
  const add = (rows: Rec[] | null) => {
    for (const r of shuffle(rows ?? [])) {
      if (out.length >= count) break;
      if (!seen.has(r.id) && !out.some((o) => o.id === r.id)) out.push(r);
    }
  };

  const cols = [...new Set(recent.slice(0, 5).map((r) => r.collection).filter(Boolean))] as string[];
  const brandIds = [...new Set(recent.slice(0, 5).map((r) => r.brandId).filter(Boolean))] as number[];

  if (cols.length) {
    const { data } = await supabase.from('products').select(fields).in('collection', cols).order('view_count', { ascending: false }).limit(30);
    add(data as unknown as Rec[]);
  }
  if (out.length < count && brandIds.length) {
    const { data } = await supabase.from('products').select(fields).in('brand_id', brandIds).order('view_count', { ascending: false }).limit(40);
    add(data as unknown as Rec[]);
  }
  if (out.length < count) {
    const { data } = await supabase.from('products').select(fields).order('view_count', { ascending: false }).limit(60);
    add(data as unknown as Rec[]);
  }
  return out;
}

export function RecommendPopup({ kakao }: { kakao: KakaoUrls }) {
  const path = usePathname();
  const recent = useList('recent');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Rec[]>([]);
  const fired = useRef(false);
  const KEY = 'da_rec_hide';

  useEffect(() => {
    // 상품 상세에서만, 한 번 방문에 1번, 오늘 숨김 안 했을 때
    if (!path.startsWith('/product/') || fired.current || hiddenToday(KEY)) return;
    try {
      if (sessionStorage.getItem('da_rec_seen')) return;
    } catch {}

    let done = false;
    const show = async () => {
      if (done || fired.current) return;
      done = true;
      fired.current = true;
      const list = await pickRecommendations(recent, 5);
      if (list.length < 2) return;
      try {
        sessionStorage.setItem('da_rec_seen', '1');
      } catch {}
      setItems(list);
      setOpen(true);
    };
    // 상품을 2개 이상 봤으면 20초 뒤, 또는 페이지를 80% 넘게 내렸을 때
    const timer = recent.length >= 2 ? setTimeout(show, 20000) : undefined;
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + innerHeight) / h.scrollHeight > 0.8 && recent.length >= 1) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [path, recent]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="max-w-[340px] ">
      <div className="p-4 ">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">이런 제품은 어떠신가요?</h2>
          <button onClick={() => setOpen(false)} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-full bg-panel text-lg active:scale-90">×</button>
        </div>
        {/* 휴대폰: 작은 카드 옆으로 넘기기 / PC: 5칸 */}
        <div className="-mx-4 mt-3 flex gap-2.5 overflow-x-auto no-scrollbar snap-x scroll-px-4 px-4 ">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              onClick={() => setOpen(false)}
              className="group block w-[118px] shrink-0 snap-start active:scale-95 transition-transform"
            >
              <div className="aspect-square overflow-hidden rounded-md bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.thumbnail_url && <img src={thumb(p.thumbnail_url)} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />}
              </div>
              <p className="mt-1.5 text-[12px] font-semibold">{p.brands?.name_ko}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-fg/55 line-clamp-2">{p.name}</p>
              {p.recent_sales > 0 ? (
                <p className="mt-0.5 text-[10px] font-semibold text-blue-600">최근판매 {p.recent_sales}건</p>
              ) : p.view_count >= 10 && <p className="mt-0.5 text-[10px] text-fg/40">조회 {p.view_count.toLocaleString()}</p>}
            </Link>
          ))}
        </div>
        {hasKakao(kakao) && (
          <KakaoLink
            urls={kakao}
            className="mt-3.5 block rounded-md bg-blue-50 py-2.5 text-center text-[12px] font-semibold text-blue-700 active:scale-[0.98] transition-transform"
          >
            찾으시는 상품이 없으신가요? 카톡으로 구해드려요
          </KakaoLink>
        )}
        <button onClick={() => { hideToday(KEY); setOpen(false); }} className="mx-auto mt-2.5 block text-[11px] text-fg/55">
          오늘 하루 보지 않기
        </button>
      </div>
    </Modal>
  );
}
