'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveShowcases } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';
import { emptyShowcase, type Showcase } from '@/lib/showcase';
import { thumb } from '@/lib/img';

type B = { id: number; name_ko: string; name_en: string | null };
type C = { brand_id: number; collection: string; cnt: number };
type P = { id: number; name: string; model_no: string | null; thumbnail_url: string | null; brand_id: number | null; collection: string | null };

/** 직접 고르기: 검색해서 체크, 고른 순서대로 표시 */
function Picker({ products, brands, value, onChange }: { products: P[]; brands: B[]; value: number[]; onChange: (v: number[]) => void }) {
  const [q, setQ] = useState('');
  const bname = useMemo(() => new Map(brands.map((b) => [b.id, b.name_ko])), [brands]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const found = words.length
    ? products
        .filter((p) => {
          const t = `${p.name} ${p.model_no ?? ''} ${p.collection ?? ''} ${p.brand_id ? bname.get(p.brand_id) : ''}`.toLowerCase();
          return words.every((w) => t.includes(w));
        })
        .slice(0, 40)
    : [];
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const move = (k: number, d: -1 | 1) => {
    const j = k + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[k], n[j]] = [n[j], n[k]];
    onChange(n);
  };

  const Thumb = ({ p }: { p: P }) => (
    <span className="block h-12 w-10 shrink-0 overflow-hidden bg-neutral-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.thumbnail_url && <img src={thumb(p.thumbnail_url)} alt="" className="h-full w-full object-cover" />}
    </span>
  );

  return (
    <div className="space-y-3">
      <div>
        <label className="label">고른 상품 {value.length}개 (이 순서대로 나와요)</label>
        {value.length === 0 ? (
          <p className="text-sm text-neutral-400">아래에서 검색해서 추가하세요.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {value.map((id, k) => {
              const p = byId.get(id);
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  {p ? <Thumb p={p} /> : null}
                  <span className="min-w-0 flex-1 truncate">{p ? p.name : `(삭제된 상품 #${id})`}</span>
                  <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(k, -1)} disabled={k === 0}>▲</button>
                  <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(k, 1)} disabled={k === value.length - 1}>▼</button>
                  <button type="button" className="btn-line !px-2 !py-1 text-xs text-red-600" onClick={() => toggle(id)}>빼기</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div>
        <input className="input" placeholder="상품 검색 (예: 노틸러스, 5711, 로렉스)" value={q} onChange={(e) => setQ(e.target.value)} />
        {words.length > 0 && (
          <ul className="mt-2 max-h-80 divide-y divide-line overflow-y-auto border border-line">
            {found.length === 0 && <li className="px-3 py-3 text-sm text-neutral-400">검색 결과가 없어요.</li>}
            {found.map((p) => {
              const on = value.includes(p.id);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => toggle(p.id)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${on ? 'bg-amber-50' : 'hover:bg-neutral-50'}`}>
                    <input type="checkbox" readOnly checked={on} />
                    <Thumb p={p} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-xs text-neutral-400">{p.brand_id ? bname.get(p.brand_id) : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** 관리자 > 메인 제품 줄 편집 */
export default function ShowcaseEditor({ initial, brands, cols, products }: { initial: Showcase[]; brands: B[]; cols: C[]; products: P[] }) {
  const [list, setList] = useState<Showcase[]>(initial.length ? initial : [emptyShowcase()]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');

  const update = (i: number, patch: Partial<Showcase>) => setList((ls) => ls.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) =>
    setList((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const n = [...ls];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  function save() {
    setMsg('');
    start(async () => {
      await saveShowcases(JSON.stringify(list));
      setMsg('저장했어요. 사이트에 1분 안에 반영돼요.');
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {list.map((s, i) => {
        const colsOf = cols.filter((c) => c.brand_id === s.brand_id).sort((a, b) => b.cnt - a.cnt);
        return (
          <section key={i} className="bg-white border border-line p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{i + 1}</span>
              <b className="text-sm">{s.title || '배너 + 제품 줄'}</b>
              <div className="ml-auto flex gap-1">
                <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(i, 1)} disabled={i === list.length - 1}>▼</button>
                <button
                  type="button"
                  className="btn-line !px-2 !py-1 text-xs text-red-600"
                  onClick={() => confirm('이 묶음을 지울까요?') && setList((ls) => ls.filter((_, k) => k !== i))}
                >
                  삭제
                </button>
              </div>
            </div>

            <div>
              <label className="label">배너 사진 (가로로 긴 사진 · 가로 2 : 세로 1 비율로 보여요)</label>
              <ImageUpload value={s.image} onChange={(v) => update(i, { image: v })} folder="banners" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">제목 (예: PATEK PHILIPPE)</label>
                <input className="input" value={s.title} placeholder="비우면 브랜드·모델 이름" onChange={(e) => update(i, { title: e.target.value })} />
              </div>
              <div>
                <label className="label">작은 설명 (선택)</label>
                <input className="input" value={s.subtitle} placeholder="예: 검수를 마친 노틸러스 컬렉션" onChange={(e) => update(i, { subtitle: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">보여줄 제품</label>
              <div className="flex gap-2">
                {(['brand', 'pick'] as const).map((m) => (
                  <button key={m} type="button" className={`btn-line text-xs ${s.mode === m ? '!border-ink font-bold' : ''}`} onClick={() => update(i, { mode: m })}>
                    {m === 'brand' ? '브랜드·모델로 자동' : '직접 고르기'}
                  </button>
                ))}
              </div>
            </div>

            {s.mode === 'brand' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">브랜드</label>
                  <select className="input" value={s.brand_id ?? ''} onChange={(e) => update(i, { brand_id: e.target.value ? Number(e.target.value) : null, collection: '' })}>
                    <option value="">선택하세요</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name_ko}{b.name_en ? ` (${b.name_en})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">모델 (선택)</label>
                  <select className="input" value={s.collection} onChange={(e) => update(i, { collection: e.target.value })} disabled={!s.brand_id}>
                    <option value="">브랜드 전체</option>
                    {colsOf.map((c) => (
                      <option key={c.collection} value={c.collection}>{c.collection} ({c.cnt})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">몇 개</label>
                  <select className="input" value={s.limit} onChange={(e) => update(i, { limit: Number(e.target.value) })}>
                    {[4, 6, 8, 10, 12, 16].map((n) => (
                      <option key={n} value={n}>{n}개</option>
                    ))}
                  </select>
                </div>
                <p className="sm:col-span-3 text-xs text-neutral-500">‘진열 순서’에서 정한 순서대로 나와요. VIEW ALL을 누르면 해당 브랜드·모델 페이지로 가요.</p>
              </div>
            ) : (
              <Picker products={products} brands={brands} value={s.product_ids} onChange={(v) => update(i, { product_ids: v })} />
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 bg-white border border-dashed border-line p-4">
        <button type="button" className="btn-line" onClick={() => setList((ls) => [...ls, emptyShowcase()])}>+ 묶음 추가</button>
        <span className="text-xs text-neutral-500">묶음을 모두 지우고 저장하면 메인에서 이 영역이 사라져요.</span>
      </div>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button type="button" className="btn shadow-lg" onClick={save} disabled={pending}>{pending ? '저장 중…' : '저장하기'}</button>
        <a href="/" target="_blank" className="btn-line bg-white">사이트에서 보기 ↗</a>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </div>
  );
}
