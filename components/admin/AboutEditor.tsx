'use client';

import { useState, useTransition } from 'react';
import { saveAbout } from '@/app/admin/actions';
import ImageUpload, { uploadImage } from './ImageUpload';
import { BLOCK_LABELS, DEFAULT_ABOUT, SIZE_LABELS, TITLE_LABELS, WEIGHT_LABELS, emptyBlock, styleVars, type AboutBlock, type AboutStyle } from '@/lib/about';

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
/** 버튼 여러 개 중 하나 고르기 */
function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(options) as T[]).map((k) => (
          <button key={k} type="button" className={`btn-line !py-1 text-xs ${value === k ? '!border-ink bg-neutral-900 text-white' : ''}`} onClick={() => onChange(k)}>
            {options[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

const isWm = (url: string) => url.includes('/about-wm/');

export default function AboutEditor({ initial, initialStyle, wmOn }: { initial: AboutBlock[]; initialStyle: AboutStyle; wmOn: boolean }) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initial);
  const [style, setStyle] = useState<AboutStyle>(initialStyle);
  const [retro, setRetro] = useState('');
  const setS = (p: Partial<AboutStyle>) => setStyle((x) => ({ ...x, ...p }));
  const bodyFolder = style.wm ? 'about-wm' : 'about';

  // 이미 올린 본문 사진에 워터마크 넣기 (첫 화면 사진은 제외)
  const pending0 = blocks.flatMap((b) => (b.type === 'split' || b.type === 'image' ? [b.image, b.image2 ?? ''] : [])).filter((u) => u && !isWm(u));
  async function applyWmToExisting() {
    if (!confirm(`이미 올린 본문 사진 ${pending0.length}장에 워터마크를 넣을까요? (원본 사진은 그대로 남아요)`)) return;
    const map = new Map<string, string>();
    let k = 0;
    for (const url of pending0) {
      k++;
      setRetro(`워터마크 넣는 중… ${k}/${pending0.length}`);
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'about.jpg', { type: blob.type || 'image/jpeg' });
        map.set(url, await uploadImage(file, 'about-wm'));
      } catch {
        /* 실패한 사진은 그대로 둠 */
      }
    }
    setBlocks((bs) =>
      bs.map((b) =>
        b.type === 'split' || b.type === 'image'
          ? ({ ...b, image: map.get(b.image) ?? b.image, image2: b.image2 ? map.get(b.image2) ?? b.image2 : b.image2 } as AboutBlock)
          : b,
      ),
    );
    setRetro(`${map.size}장에 넣었어요. 아래 [저장하기]를 눌러야 사이트에 반영돼요.`);
  }
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
      await saveAbout(JSON.stringify(blocks), JSON.stringify(style));
      setMsg('저장했어요. 사이트에 1분 안에 반영돼요.');
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* 글자·사진 설정 */}
      <section className="bg-white border border-line p-5 space-y-5">
        <b className="text-sm">글자 · 사진 설정</b>
        <div className="grid gap-4 sm:grid-cols-3">
          <Choice label="본문 글자 크기" value={style.size} options={SIZE_LABELS} onChange={(v) => setS({ size: v })} />
          <Choice label="글씨 굵기" value={style.weight} options={WEIGHT_LABELS} onChange={(v) => setS({ weight: v })} />
          <Choice label="제목 크기" value={style.title} options={TITLE_LABELS} onChange={(v) => setS({ title: v })} />
        </div>
        {/* 미리보기 (사이트와 같은 색·글꼴) */}
        <div className="bg-[#2b0a15] px-6 py-7 text-center" style={styleVars(style) as React.CSSProperties}>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600&display=swap" precedence="default" />
          <p className="font-kserif ab-title text-[#f3eadb]" style={{ fontSize: 'calc(26px * var(--ab-ts))' }}>좋은 시계는 오래 곁에 남습니다</p>
          <p className="mt-4 font-kserif ab-body leading-[2.1]">평생 손목 위에 둘 시계를, 우리는 얼마나 신중하게 고르고 있을까.</p>
        </div>

        <div className="border-t border-line pt-4 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={style.wm} onChange={(e) => setS({ wm: e.target.checked })} /> 본문 사진에 워터마크 넣기
          </label>
          <p className="text-xs text-neutral-500">
            켜두면 앞으로 올리는 본문 사진(사진 + 글, 사진 블록)에 상품 사진과 같은 워터마크가 들어가요. 첫 화면 큰 사진에는 넣지 않아요.
            {!wmOn && <b className="text-red-600"> 지금 ‘배너 · 사이트 설정’에서 워터마크가 꺼져 있어서 들어가지 않아요. 거기서 먼저 켜주세요.</b>}
          </p>
          {style.wm && wmOn && pending0.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-line text-xs" onClick={applyWmToExisting} disabled={retro.startsWith('워터마크 넣는 중')}>
                이미 올린 사진 {pending0.length}장에도 넣기
              </button>
              {retro && <span className="text-xs text-neutral-600">{retro}</span>}
            </div>
          )}
          {retro && !(style.wm && wmOn && pending0.length > 0) && <p className="text-xs text-green-700">{retro}</p>}
        </div>
      </section>

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
              <ImageUpload value={b.image} onChange={(v) => update(i, { image: v })} folder={b.type === 'hero' ? 'about' : bodyFolder} />
            </div>
          )}
          {(b.type === 'split' || b.type === 'image') && (
            <div>
              <label className="label">두 번째 사진 (선택 · 넣으면 두 장이 나란히 보여요)</label>
              <ImageUpload value={b.image2 ?? ''} onChange={(v) => update(i, { image2: v })} folder={bodyFolder} />
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
