'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { autoAttributes, autoClassify, bulkProducts, type BulkAction } from '@/app/admin/actions';
import { MATERIALS, STRAPS } from '@/lib/attributes';
import { formatPrice, type Product } from '@/lib/types';

export default function ProductTable({ products, collections }: { products: Product[]; collections: string[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [colValue, setColValue] = useState('');
  const [sales, setSales] = useState('');

  const allOn = products.length > 0 && products.every((p) => sel.has(p.id));
  const toggle = (id: number) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function run(action: BulkAction, value?: string) {
    const ids = [...sel];
    if (action === 'delete' && !confirm(`${ids.length}개 상품을 삭제할까요? 되돌릴 수 없어요.`)) return;
    start(async () => {
      try {
        await bulkProducts(ids, action, value);
        setSel(new Set());
        router.refresh();
      } catch (e) {
        alert('실패: ' + (e as Error).message);
      }
    });
  }

  function classify(onlyEmpty: boolean) {
    if (!onlyEmpty && !confirm('모든 상품의 컬렉션을 상품명 기준으로 다시 정할까요? 직접 바꾼 것도 덮어써져요.')) return;
    start(async () => {
      const r = await autoClassify(onlyEmpty);
      alert(`${r.changed}개 상품의 컬렉션을 정했어요.${r.unknown ? ` (자동으로 못 정한 상품 ${r.unknown}개는 직접 지정해주세요)` : ''}`);
      router.refresh();
    });
  }

  function classifyAttrs() {
    start(async () => {
      const r = await autoAttributes();
      alert(`소재·스트랩을 ${r.changed}건 채웠어요.${r.unknown ? ` (상품명으로 알 수 없는 상품 ${r.unknown}개는 선택해서 직접 지정해주세요)` : ''}`);
      router.refresh();
    });
  }

  const btn = 'rounded-md border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-40';

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <button onClick={() => classify(true)} disabled={pending} className="btn-line text-xs">컬렉션 자동 분류 (빈 것만)</button>
        <button onClick={() => classify(false)} disabled={pending} className="btn-line text-xs text-neutral-500">전체 다시 분류</button>
        <button onClick={classifyAttrs} disabled={pending} className="btn-line text-xs">소재·스트랩 자동 분류 (빈 것만)</button>
      </div>

      {sel.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-ink p-3 text-white shadow-lg">
          <b className="mr-2 text-sm">{sel.size}개 선택</b>
          <button className={btn} disabled={pending} onClick={() => run('show')}>노출</button>
          <button className={btn} disabled={pending} onClick={() => run('hide')}>숨김</button>
          <button className={btn} disabled={pending} onClick={() => run('pin')}>📌 맨 위 고정</button>
          <button className={btn} disabled={pending} onClick={() => run('unpin')}>고정 해제</button>
          <button className={btn} disabled={pending} onClick={() => run('domestic')}>국내재고로</button>
          <button className={btn} disabled={pending} onClick={() => run('order')}>주문배송으로</button>
          <span className="flex items-center gap-1">
            <input
              list="col-list"
              value={colValue}
              onChange={(e) => setColValue(e.target.value)}
              placeholder="컬렉션 이름"
              className="w-28 rounded-md bg-white/10 px-2 py-1.5 text-xs placeholder:text-white/40 focus:outline-none"
            />
            <button className={btn} disabled={pending || !colValue} onClick={() => run('collection', colValue)}>컬렉션 지정</button>
          </span>
          <span className="flex items-center gap-1">
            <input
              value={sales}
              onChange={(e) => setSales(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="실제 판매수"
              className="w-20 rounded-md bg-white/10 px-2 py-1.5 text-xs placeholder:text-white/40 focus:outline-none"
            />
            <button className={btn} disabled={pending || sales === ''} onClick={() => run('sales', sales)}>최근판매 입력</button>
          </span>
          <select
            className="rounded-md bg-white/10 px-2 py-1.5 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) run('gender', e.target.value);
              e.target.value = '';
            }}
          >
            <option value="" className="text-ink">성별 지정…</option>
            {['공용', '남성', '여성'].map((g) => (
              <option key={g} value={g} className="text-ink">{g}</option>
            ))}
          </select>
          {([['material', '소재 지정…', MATERIALS], ['strap', '스트랩 지정…', STRAPS]] as const).map(([key, label, list]) => (
            <select
              key={key}
              className="rounded-md bg-white/10 px-2 py-1.5 text-xs"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) run(key, e.target.value === '-' ? '' : e.target.value);
                e.target.value = '';
              }}
            >
              <option value="" className="text-ink">{label}</option>
              {list.map((v) => <option key={v} value={v} className="text-ink">{v}</option>)}
              <option value="-" className="text-ink">(비우기)</option>
            </select>
          ))}
          <button className={`${btn} border-red-400 text-red-300`} disabled={pending} onClick={() => run('delete')}>삭제</button>
          <button className="ml-auto text-xs text-white/60" onClick={() => setSel(new Set())}>선택 해제</button>
          <datalist id="col-list">
            {collections.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      )}

      <div className={`bg-white border border-line overflow-x-auto ${pending ? 'opacity-60' : ''}`}>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="p-3 w-8">
                <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(products.map((p) => p.id)))} aria-label="전체 선택" />
              </th>
              <th className="p-3 w-14">사진</th>
              <th className="p-3">상품명</th>
              <th className="p-3">브랜드 · 컬렉션</th>
              <th className="p-3">가격</th>
              <th className="p-3">조회 · 판매</th>
              <th className="p-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className={sel.has(p.id) ? 'bg-amber-50' : 'hover:bg-neutral-50'}>
                <td className="p-3">
                  <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} aria-label="선택" />
                </td>
                <td className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-11 h-11 rounded object-cover" /> : <div className="w-11 h-11 rounded bg-neutral-100" />}
                </td>
                <td className="p-3 min-w-56">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                  {(p.sort_order ?? 0) < 0 && <span className="ml-1 text-xs" title="맨 위 고정">📌</span>}
                  {p.has_video && <span className="ml-1 rounded bg-red-50 px-1 text-[10px] text-red-600">영상</span>}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {p.brands?.name_ko ?? '-'}
                  <span className={p.collection ? 'text-neutral-500' : 'text-red-500'}> · {p.collection ?? '미분류'}</span>
                  <span className="text-neutral-400"> · {[p.material, p.strap].filter(Boolean).join('/') || '소재 미정'}</span>
                </td>
                <td className="p-3 whitespace-nowrap">{formatPrice(p.price)}</td>
                <td className="p-3 whitespace-nowrap">{(p.view_count ?? 0).toLocaleString()} · <span className={p.recent_sales ? 'text-ink' : 'text-neutral-300'}>{p.recent_sales ?? 0}건</span></td>
                <td className="p-3 whitespace-nowrap space-x-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.is_visible ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'}`}>
                    {p.is_visible ? '노출' : '숨김'}
                  </span>
                  {p.stock_type === 'domestic' && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">국내</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-10 text-center text-neutral-500">상품이 없어요.</p>}
      </div>
    </div>
  );
}
