'use client';

import { useState, useTransition } from 'react';
import { saveAbout } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';
import { BLOCK_LABELS, DEFAULT_ABOUT, emptyBlock, type AboutBlock } from '@/lib/about';

type Patch = Partial<Record<string, unknown>>;

function Field({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {rows ? (
        <textarea className="input leading-relaxed" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

/** 관리자 > 메종 이야기(About) 편집 */
export default function AboutEditor({ initial }: { initial: AboutBlock[] }) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  const [addType, setAddType] = useState<AboutBlock['type']>('split');

  const update = (i: number, patch: Patch) => setBlocks((bs) => bs.map((b, k) => (k === i ? ({ ...b, ...patch } as AboutBlock) : b)));
  const move = (i: number, d: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + d;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => confirm('이 블록을 지울까요?') && setBlocks((bs) => bs.filter((_, k) => k !== i));

  function save() {
    setMsg('');
    start(async () => {
      await saveAbout(JSON.stringify(blocks));
      setMsg('저장했어요. 사이트에 1분 안에 반영돼요.');
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {blocks.map((b, i) => (
        <section key={i} className="bg-white border border-line p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{i + 1}</span>
            <b className="text-sm">{BLOCK_LABELS[b.type]}</b>
            <div className="ml-auto flex gap-1">
              <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
              <button type="button" className="btn-line !px-2 !py-1 text-xs" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}>▼</button>
              <button type="button" className="btn-line !px-2 !py-1 text-xs text-red-600" onClick={() => remove(i)}>삭제</button>
            </div>
          </div>

          {'image' in b && (
            <div>
              <label className="label">사진 {b.type === 'hero' ? '(세로 사진, 화면 가득)' : '(세로 4:5 비율이 잘 어울려요)'}</label>
              <ImageUpload value={b.image} onChange={(v) => update(i, { image: v })} folder="about" />
            </div>
          )}
          {(b.type === 'split' || b.type === 'image') && (
            <div>
              <label className="label">두 번째 사진 (선택 · 넣으면 두 장이 나란히 보여요)</label>
              <ImageUpload value={b.image2 ?? ''} onChange={(v) => update(i, { image2: v })} folder="about" />
            </div>
          )}
          {'eyebrow' in b && <Field label="작은 영문 (예: Our Story)" value={b.eyebrow} onChange={(v) => update(i, { eyebrow: v })} />}
          {'title' in b && <Field label="제목 (줄바꿈 가능)" rows={2} value={b.title} onChange={(v) => update(i, { title: v })} />}
          {b.type === 'hero' && <Field label="작은 문구" value={b.subtitle} onChange={(v) => update(i, { subtitle: v })} />}
          {'body' in b && <Field label="본문 (빈 줄을 넣으면 문단이 나뉘어요)" rows={6} value={b.body} onChange={(v) => update(i, { body: v })} />}
          {b.type === 'image' && (
            <>
              <Field label="사진 설명 (선택)" value={b.caption} onChange={(v) => update(i, { caption: v })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={b.wide} onChange={(e) => update(i, { wide: e.target.checked })} /> 화면 끝까지 꽉 차게
              </label>
            </>
          )}
          {b.type === 'split' && (
            <div className="flex gap-2 text-sm">
              <span className="text-neutral-500">사진 위치 (두 장이면 '가운데'를 추천해요)</span>
              {(['left', 'center', 'right'] as const).map((s) => (
                <button key={s} type="button" className={`btn-line !py-1 text-xs ${b.side === s ? '!border-ink font-bold' : ''}`} onClick={() => update(i, { side: s })}>
                  {s === 'left' ? '왼쪽' : s === 'center' ? '가운데' : '오른쪽'}
                </button>
              ))}
            </div>
          )}
          {b.type === 'quote' && (
            <>
              <Field label="인용 문구 (줄바꿈 가능)" rows={3} value={b.text} onChange={(v) => update(i, { text: v })} />
              <Field label="출처 (선택)" value={b.cite} onChange={(v) => update(i, { cite: v })} />
            </>
          )}
          {b.type === 'pillars' && (
            <div className="space-y-3">
              {b.items.map((it, k) => (
                <div key={k} className="grid grid-cols-[36px_1fr] gap-2 items-start">
                  <span className="pt-2 text-sm text-neutral-400">{['I', 'II', 'III', 'IV', 'V', 'VI'][k]}</span>
                  <div className="space-y-2">
                    <input className="input" placeholder="제목" value={it.title} onChange={(e) => update(i, { items: b.items.map((x, z) => (z === k ? { ...x, title: e.target.value } : x)) })} />
                    <input className="input" placeholder="설명" value={it.body} onChange={(e) => update(i, { items: b.items.map((x, z) => (z === k ? { ...x, body: e.target.value } : x)) })} />
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                {b.items.length < 6 && (
                  <button type="button" className="btn-line text-xs" onClick={() => update(i, { items: [...b.items, { title: '', body: '' }] })}>+ 항목 추가</button>
                )}
                {b.items.length > 1 && (
                  <button type="button" className="btn-line text-xs" onClick={() => update(i, { items: b.items.slice(0, -1) })}>마지막 항목 빼기</button>
                )}
              </div>
            </div>
          )}
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-2 bg-white border border-dashed border-line p-4">
        <span className="text-sm text-neutral-500">블록 추가</span>
        <select className="input !w-auto" value={addType} onChange={(e) => setAddType(e.target.value as AboutBlock['type'])}>
          {(Object.keys(BLOCK_LABELS) as AboutBlock['type'][]).map((t) => (
            <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
          ))}
        </select>
        <button type="button" className="btn-line" onClick={() => setBlocks((bs) => [...bs, emptyBlock(addType)])}>+ 맨 아래에 추가</button>
        <button
          type="button"
          className="ml-auto text-xs text-neutral-400 underline"
          onClick={() => confirm('기본 문구로 되돌릴까요? 지금 편집한 내용은 사라져요.') && setBlocks(DEFAULT_ABOUT)}
        >
          기본 문구로 되돌리기
        </button>
      </div>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button type="button" className="btn shadow-lg" onClick={save} disabled={pending}>{pending ? '저장 중…' : '저장하기'}</button>
        <a href="/about" target="_blank" className="btn-line bg-white">사이트에서 보기 ↗</a>
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
    </div>
  );
}
