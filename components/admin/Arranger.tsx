'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { resetArrangement, saveArrangement } from '@/app/admin/actions';
import { toast } from '@/components/Toaster';

type Item = { id: number; name: string; thumbnail_url: string | null; has_video: boolean; sort_order: number; stock_type: string };

/** 끌어서(PC) 또는 버튼으로(휴대폰) 진열 순서 바꾸기 */
export default function Arranger({ initial, scope, scopeLabel }: { initial: Item[]; scope: string; scopeLabel: string }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const dragFrom = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    setItems((list) => {
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    setDirty(true);
  };

  function save() {
    start(async () => {
      try {
        await saveArrangement(items.map((i) => i.id));
        setDirty(false);
        toast('진열 순서를 저장했어요');
        router.refresh();
      } catch (e) {
        alert('저장 실패: ' + (e as Error).message);
      }
    });
  }

  function reset() {
    if (!confirm(`${scopeLabel}의 직접 정한 순서를 모두 지우고 자동 순서(검수영상 있는 상품 → 최신순)로 돌릴까요?`)) return;
    start(async () => {
      await resetArrangement(scope);
      toast('자동 순서로 돌렸어요');
      router.refresh();
      setDirty(false);
    });
  }

  const sm = 'h-8 min-w-8 rounded border border-line bg-white px-2 text-xs hover:border-ink disabled:opacity-30 active:scale-90';

  return (
    <div>
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-white/95 py-3 backdrop-blur">
        <button className="btn" onClick={save} disabled={!dirty || pending}>
          {pending ? '저장 중…' : dirty ? '이 순서로 저장' : '저장됨'}
        </button>
        {dirty && (
          <button className="btn-line" onClick={() => { setItems(initial); setDirty(false); }} disabled={pending}>
            되돌리기
          </button>
        )}
        <button className="ml-auto text-xs text-neutral-500 underline" onClick={reset} disabled={pending}>
          자동 순서로 초기화
        </button>
      </div>

      <ol className="space-y-1.5">
        {items.map((p, i) => (
          <li
            key={p.id}
            draggable
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom.current !== null) move(dragFrom.current, i);
              dragFrom.current = null;
              setOver(null);
            }}
            onDragEnd={() => { dragFrom.current = null; setOver(null); }}
            className={`flex items-center gap-3 rounded-lg border bg-white p-2 transition ${over === i ? 'border-ink shadow-md' : 'border-line'} cursor-grab active:cursor-grabbing`}
          >
            <span className="hidden md:block select-none px-1 text-neutral-300" aria-hidden="true">⋮⋮</span>
            <b className="w-7 text-right text-xs text-neutral-400 tabular-nums">{i + 1}</b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" draggable={false} className="h-12 w-12 shrink-0 rounded object-cover" /> : <span className="h-12 w-12 shrink-0 rounded bg-neutral-100" />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm line-clamp-1">{p.name}</span>
              <span className="mt-0.5 flex gap-1 text-[10px]">
                {p.has_video && <span className="rounded bg-red-50 px-1 text-red-600">영상</span>}
                {p.stock_type === 'domestic' && <span className="rounded bg-green-50 px-1 text-green-700">국내재고</span>}
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button type="button" className={sm} onClick={() => move(i, 0)} disabled={i === 0} title="맨 위로">⤒</button>
              <button type="button" className={sm} onClick={() => move(i, i - 1)} disabled={i === 0} title="위로">▲</button>
              <button type="button" className={sm} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} title="아래로">▼</button>
              <button
                type="button"
                className={`${sm} hidden sm:block`}
                title="위치 입력"
                onClick={() => {
                  const n = Number(prompt(`몇 번째로 옮길까요? (1~${items.length})`, String(i + 1)));
                  if (n >= 1 && n <= items.length) move(i, n - 1);
                }}
              >
                #
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
