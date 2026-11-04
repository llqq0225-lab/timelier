'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { addReviews, deleteReviews, setReviewsContent, updateReview } from '@/app/admin/actions';
import { uploadImage } from './ImageUpload';
import type { Review } from '@/lib/types';

const DEFAULT_TEXT = '고객님의 소중한 후기입니다.';
const TEXT_KEY = 'da_review_text';
const PARALLEL = 4; // 동시에 올리는 장수
const SAVE_EVERY = 20; // 20장마다 바로 저장 (중간에 창이 닫혀도 올린 만큼은 남음)

export default function ReviewManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const stopRef = useRef(false);

  // 마지막에 쓴 멘트 기억
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TEXT_KEY);
      if (saved !== null) setText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(TEXT_KEY, text);
    } catch {}
  }, [text]);

  async function uploadAll(input: File[]) {
    const files = input.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (!files.length) return;
    // 파일 이름 순서대로 (카톡 캡처는 이름에 날짜가 들어있어서 시간순이 됨) → 마지막 사진이 맨 앞에 보이게 뒤집기
    files.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true })).reverse();
    if (!confirm(`사진 ${files.length}장을 후기 ${files.length}개로 등록할게요.\n멘트: "${text || '(없음)'}"\n\n끝날 때까지 이 창을 닫지 마세요.`)) return;

    stopRef.current = false;
    const base = Date.now();
    const urls: (string | null)[] = new Array(files.length).fill(null);
    let next = 0;
    let saved = 0;
    let failed = 0;
    setProgress({ done: 0, total: files.length, failed: 0 });

    // 앞에서부터 연속으로 다 올라간 것만 저장 (순서 유지)
    const flush = async (force = false) => {
      let end = saved;
      while (end < urls.length && urls[end] !== null) end++;
      if (end - saved >= SAVE_EVERY || (force && end > saved)) {
        const batch = urls.slice(saved, end).filter((u): u is string => !!u && u !== 'x');
        const offset = saved;
        saved = end;
        if (batch.length) await addReviews(batch, text, base - offset * 1000);
      }
    };

    async function worker() {
      while (next < files.length && !stopRef.current) {
        const i = next++;
        try {
          urls[i] = await uploadImage(files[i], 'reviews');
        } catch {
          urls[i] = 'x'; // 실패 표시
          failed++;
        }
        setProgress((p) => p && { ...p, done: p.done + 1, failed });
        await flush();
      }
    }
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    await flush(true);
    setProgress((p) => p && { ...p, done: p.total });
    router.refresh();
  }

  const toggle = (id: number) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const running = !!progress && progress.done < progress.total;
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      {/* 한 번에 올리기 */}
      <section
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!running) uploadAll(Array.from(e.dataTransfer.files));
        }}
        className={`mb-8 rounded-xl border-2 border-dashed p-5 transition ${dragOver ? 'border-ink bg-neutral-100' : 'border-neutral-300 bg-white'}`}
      >
        <h2 className="font-bold">후기 한 번에 올리기</h2>
        <p className="mt-1 text-xs text-neutral-500">
          사진 1장 = 후기 1개로 등록돼요. 폴더에서 <b>전부 선택(Ctrl+A)</b>해서 끌어다 놓거나 아래 버튼으로 고르세요. 큰 사진은 자동으로 줄여서 올라가요.
        </p>

        <label className="label mt-4">모든 후기에 들어갈 멘트</label>
        <input value={text} onChange={(e) => setText(e.target.value)} className="input" placeholder="비워두면 사진만 올라가요" disabled={running} />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className={`btn cursor-pointer ${running ? 'opacity-50 pointer-events-none' : ''}`}>
            사진 고르기 (여러 장)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                uploadAll(files);
              }}
            />
          </label>
          {running && <button className="btn-line" onClick={() => (stopRef.current = true)}>멈추기</button>}
        </div>

        {progress && (
          <div className="mt-4">
            <div className="h-2.5 overflow-hidden rounded bg-neutral-100">
              <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm">
              {running ? '올리는 중' : '완료'} {progress.done} / {progress.total} ({pct}%)
              {progress.failed > 0 && <span className="text-red-600"> · 실패 {progress.failed}장 (다시 올려주세요)</span>}
            </p>
          </div>
        )}
      </section>

      {/* 선택한 것 일괄 */}
      {sel.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-ink p-3 text-sm text-white shadow-lg">
          <b className="mr-2">{sel.size}개 선택</b>
          <button
            className="rounded border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10"
            disabled={pending}
            onClick={() => start(async () => { await setReviewsContent([...sel], text); setSel(new Set()); router.refresh(); })}
          >
            멘트를 &ldquo;{text.slice(0, 12)}{text.length > 12 ? '…' : ''}&rdquo;로 바꾸기
          </button>
          <button
            className="rounded border border-red-400 px-3 py-1.5 text-xs text-red-300 hover:bg-white/10"
            disabled={pending}
            onClick={() =>
              confirm(`${sel.size}개 후기를 삭제할까요?`) &&
              start(async () => { await deleteReviews([...sel]); setSel(new Set()); router.refresh(); })
            }
          >
            삭제
          </button>
          <button className="text-xs text-white/60" onClick={() => setSel(new Set(reviews.map((r) => r.id)))}>이 페이지 전체 선택</button>
          <button className="ml-auto text-xs text-white/60" onClick={() => setSel(new Set())}>선택 해제</button>
        </div>
      )}

      <p className="mb-3 text-xs text-neutral-500">사진을 누르면 선택돼요. 왼쪽 위 표시를 누르면 노출/숨김이 바뀌어요.</p>
      <div className={`grid grid-cols-3 md:grid-cols-6 gap-3 ${pending ? 'opacity-60' : ''}`}>
        {reviews.map((r) => (
          <div key={r.id} className={`relative overflow-hidden rounded-lg border-2 bg-white ${sel.has(r.id) ? 'border-red-500' : 'border-transparent'}`}>
            <button type="button" onClick={() => toggle(r.id)} className="block w-full aspect-[3/4] bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.image_urls?.[0] && <img src={r.image_urls[0]} alt="" loading="lazy" className={`h-full w-full object-cover ${r.is_visible ? '' : 'opacity-30'}`} />}
            </button>
            <button
              type="button"
              onClick={() => start(async () => { await updateReview(r.id, { is_visible: !r.is_visible }); router.refresh(); })}
              className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] ${r.is_visible ? 'bg-green-600 text-white' : 'bg-neutral-700 text-white'}`}
            >
              {r.is_visible ? '노출' : '숨김'}
            </button>
            {r.content && <p className="px-1.5 py-1 text-[10px] text-neutral-500 line-clamp-1">{r.content}</p>}
          </div>
        ))}
      </div>
      {reviews.length === 0 && <p className="py-16 text-center text-sm text-neutral-500">아직 후기가 없어요. 위에서 사진을 올려보세요.</p>}
    </div>
  );
}
