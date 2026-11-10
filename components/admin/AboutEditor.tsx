'use client';

import { useRef, useState, useTransition } from 'react';
import Rich from '@/components/about/Rich';
import { saveAbout } from '@/app/admin/actions';
import ImageUpload, { uploadImage } from './ImageUpload';
import { BLOCK_LABELS, DEFAULT_ABOUT, SIZE_LABELS, TITLE_LABELS, WEIGHT_LABELS, emptyBlock, styleVars, type AboutBlock, type AboutStyle } from '@/lib/about';

type Patch = Partial<Record<string, unknown>>;

function Field({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // 드래그한 글자를 감싸기: 굵게 "…" / 작게 ((…))
  const wrap = (l: string, r: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if (a === b) {
      alert('먼저 강조하거나 작게 할 글자를 마우스로 드래그해서 골라주세요.');
      return;
    }
    const sel = value.slice(a, b);
    // 이미 감싸져 있으면 풀기
    const before = value.slice(0, a);
    const after = value.slice(b);
    if (before.endsWith(l) && after.startsWith(r)) {
      onChange(before.slice(0, -l.length) + sel + after.slice(r.length));
      return;
    }
    onChange(before + l + sel + r + after);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + l.length, b + l.length);
    });
  };
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label className="label">{label}</label>
        {rows && (
          <div className="mb-1 flex gap-1">
            <button type="button" className="btn-line !px-2 !py-0.5 text-xs font-bold" onClick={() => wrap('"', '"')} title="드래그한 글자를 두껍게">굵게</button>
            <button type="button" className="btn-line !px-2 !py-0.5 text-[11px]" onClick={() => wrap('((', '))')} title="드래그한 글자를 작게">작게</button>
          </div>
        )}
      </div>
      {rows ? (
        <textarea ref={ref} className="input leading-relaxed" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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

/** 블록마다: 제목 크기 · 본문 크기 · 굵기 + 그 블록 글로 미리보기 */
function TextStyle({ b, onChange }: { b: AboutBlock; onChange: (p: Patch) => void }) {
  const hasBody = 'body' in b || b.type === 'pillars';
  const st = { size: b.fs ?? 'm', weight: b.fw ?? 'light', title: b.ts ?? 'm', wm: false } as AboutStyle;
  const title = b.type === 'quote' ? b.text : 'title' in b ? b.title : '';
  const body = 'body' in b ? b.body : b.type === 'pillars' ? b.items[0]?.body ?? '' : '';
  return (
    <div className="border-t border-line pt-4 space-y-3">
      <p className="text-sm font-medium">이 블록 글자</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Choice label={b.type === 'quote' ? '문구 크기' : '제목 크기'} value={st.title} options={TITLE_LABELS} onChange={(v) => onChange({ ts: v })} />
        {hasBody && <Choice label="본문 크기" value={st.size} options={SIZE_LABELS} onChange={(v) => onChange({ fs: v })} />}
        <Choice label="굵기" value={st.weight} options={WEIGHT_LABELS} onChange={(v) => onChange({ fw: v })} />
      </div>
      {(title || body) && (
        <div className="bg-[#2b0a15] px-5 py-6 text-center" style={styleVars(st) as React.CSSProperties}>
          {title && (
            <p className="font-kserif ab-title whitespace-pre-line text-[#f3eadb]" style={{ fontSize: 'calc(24px * var(--ab-ts))', lineHeight: 1.45 }}>
              <Rich text={title} />
            </p>
          )}
          {body && <p className="mt-3 line-clamp-4 font-kserif ab-body whitespace-pre-line leading-[2.05]"><Rich text={body} /></p>}
        </div>
      )}
    </div>
  );
}

export default function AboutEditor({ initial, initialStyle, wmOn }: { initial: AboutBlock[]; initialStyle: AboutStyle; wmOn: boolean }) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initial);
  const [retro, setRetro] = useState<Record<number, string>>({});

  // 이 블록 사진에 워터마크를 넣을지 (사진 + 글, 사진 블록만 · 기본은 넣음)
  const wmOf = (b: AboutBlock) => (b.type === 'split' || b.type === 'image') && (b.wm ?? initialStyle.wm);
  const folderOf = (b: AboutBlock) => (wmOf(b) ? 'about-wm' : 'about');
  const notWm = (b: AboutBlock) => (b.type === 'split' || b.type === 'image' ? [b.image, b.image2 ?? ''].filter((u) => u && !isWm(u)) : []);

  // 이미 올린 이 블록의 사진에 워터마크 넣기
  async function applyWm(i: number) {
    const urls = notWm(blocks[i]);
    if (!urls.length || !confirm(`이 블록 사진 ${urls.length}장에 워터마크를 넣을까요?`)) return;
    const map = new Map<string, string>();
    for (const [k, url] of urls.entries()) {
      setRetro((r) => ({ ...r, [i]: `넣는 중… ${k + 1}/${urls.length}` }));
      try {
        const blob = await (await fetch(url)).blob();
        map.set(url, await uploadImage(new File([blob], 'about.jpg', { type: blob.type || 'image/jpeg' }), 'about-wm'));
      } catch {
        /* 실패한 사진은 그대로 둠 */
      }
    }
    setBlocks((bs) =>
      bs.map((b, k) =>
        k === i && (b.type === 'split' || b.type === 'image')
          ? ({ ...b, image: map.get(b.image) ?? b.image, image2: b.image2 ? map.get(b.image2) ?? b.image2 : b.image2 } as AboutBlock)
          : b,
      ),
    );
    setRetro((r) => ({ ...r, [i]: `${map.size}장에 넣었어요. [저장하기]를 눌러야 반영돼요.` }));
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
      await saveAbout(JSON.stringify(blocks), JSON.stringify(initialStyle));
      setMsg('저장했어요. 사이트에 1분 안에 반영돼요.');
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600&display=swap" precedence="default" />
      <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed">
        <b>글 안에서 일부만 강조하기</b> — 글자를 드래그한 뒤 칸 오른쪽 위 <b>[굵게]</b> 또는 <b>[작게]</b>를 누르세요.
        <br />
        직접 쓸 때는 <code className="bg-white px-1">"타임리에"</code> → <b>타임리에</b> (따옴표는 사이트에 안 보여요),{' '}
        <code className="bg-white px-1">((문구))</code> → <small>작은 글씨</small>
      </div>
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
              <ImageUpload value={b.image} onChange={(v) => update(i, { image: v })} folder={b.type === 'hero' ? 'about' : folderOf(b)} />
            </div>
          )}
          {(b.type === 'split' || b.type === 'image') && (
            <div>
              <label className="label">두 번째 사진 (선택 · 넣으면 두 장이 나란히 보여요)</label>
              <ImageUpload value={b.image2 ?? ''} onChange={(v) => update(i, { image2: v })} folder={folderOf(b)} />
            </div>
          )}
          {(b.type === 'split' || b.type === 'image') && (
            <div className="rounded bg-neutral-50 px-3 py-2.5 space-y-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={wmOf(b)} onChange={(e) => update(i, { wm: e.target.checked })} /> 이 블록 사진에 워터마크 넣기
              </label>
              {wmOf(b) && !wmOn && <p className="text-xs text-red-600">‘배너 · 사이트 설정’에서 워터마크가 꺼져 있어서 지금은 안 들어가요. 거기서 먼저 켜주세요.</p>}
              {wmOf(b) && wmOn && notWm(b).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-500">이미 올린 사진 {notWm(b).length}장에는 아직 없어요</span>
                  <button type="button" className="btn-line !py-1 text-xs" onClick={() => applyWm(i)}>지금 넣기</button>
                </div>
              )}
              {retro[i] && <p className="text-xs text-green-700">{retro[i]}</p>}
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
          {b.type !== 'image' && <TextStyle b={b} onChange={(p) => update(i, p)} />}
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
