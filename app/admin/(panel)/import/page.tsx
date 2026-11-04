'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';
import { rowsToJobs, type ImportJob } from '@/lib/cafe24';

const CONCURRENCY = 3;

type Log = { name: string; msg: string };

async function existingNos(table: string) {
  const supabase = createClient();
  const set = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from(table).select('cafe24_no').not('cafe24_no', 'is', null).range(from, from + 999);
    (data ?? []).forEach((r: { cafe24_no: string }) => set.add(r.cafe24_no));
    if (!data || data.length < 1000) break;
  }
  return set;
}

export default function ImportPage() {
  const [host, setHost] = useState('');
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ ok: 0, skipped: 0, error: 0, images: 0, imgFailed: 0 });
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const stopRef = useRef(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // 파일명 앞부분이 카페24 쇼핑몰 아이디 (예: dudtlr00119922_2026...csv)
    const mallId = file.name.split('_')[0];
    if (!host && /^[a-z0-9]+$/i.test(mallId)) setHost(`https://${mallId}.cafe24.com`);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const parsed = rowsToJobs(res.data);
        if (!parsed.length) {
          alert('상품을 찾지 못했어요. 카페24 상품 엑셀(CSV)이 맞는지 확인해주세요.');
          return;
        }
        setJobs(parsed);
        const [p, s] = await Promise.all([existingNos('products'), existingNos('shipping_videos')]);
        setDone(new Set(parsed.filter((j) => (j.kind === 'product' ? p : s).has(j.no)).map((j) => j.kind + j.no)));
      },
    });
  }

  async function start() {
    if (!host) return alert('카페24 주소를 입력해주세요.');
    const queue = jobs.filter((j) => overwrite || !done.has(j.kind + j.no));
    if (!queue.length) return alert('가져올 게 없어요. 이미 다 옮겨졌어요.');
    if (!confirm(`${queue.length}개를 가져올게요. 끝날 때까지 이 창을 닫지 마세요.`)) return;

    stopRef.current = false;
    setTotal(queue.length);
    setRunning(true);
    setLogs([]);
    setProgress({ ok: 0, skipped: 0, error: 0, images: 0, imgFailed: 0 });

    let next = 0;
    async function worker() {
      while (next < queue.length && !stopRef.current) {
        const job = queue[next++];
        let attempt = 0;
        while (true) {
          try {
            const res = await fetch('/api/admin/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ job, host, overwrite }),
            });
            const data = await res.json().catch(() => ({ error: `서버 응답 오류 (${res.status})` }));
            if (!res.ok || data.error) throw new Error(data.error ?? `오류 ${res.status}`);
            setProgress((p) => ({
              ...p,
              ok: p.ok + (data.status === 'ok' ? 1 : 0),
              skipped: p.skipped + (data.status === 'skipped' ? 1 : 0),
              images: p.images + (data.images ?? 0),
              imgFailed: p.imgFailed + (data.failed ?? 0),
            }));
            if (data.failed) setLogs((l) => [...l, { name: job.name, msg: `사진 ${data.failed}장 못 받음` }]);
            setDone((d) => new Set(d).add(job.kind + job.no));
            break;
          } catch (err) {
            if (++attempt < 3) continue; // 2번까지 다시 시도
            setProgress((p) => ({ ...p, error: p.error + 1 }));
            setLogs((l) => [...l, { name: job.name, msg: (err as Error).message }]);
            break;
          }
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
  }

  const products = jobs.filter((j) => j.kind === 'product');
  const shipping = jobs.filter((j) => j.kind === 'shipping');
  const finished = progress.ok + progress.skipped + progress.error;
  const pct = total ? Math.round((finished / total) * 100) : 0;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">카페24 가져오기</h1>
      <p className="text-sm text-neutral-500 mb-8">
        카페24 상품 엑셀(CSV)을 올리면 상품·출고 게시물·사진·찰나 영상을 이 사이트로 옮겨요. 사진은 카페24에서 복사해 오기 때문에 카페24를 해지해도 남아요.
        중간에 멈추거나 창이 닫혀도, 다시 파일을 올리고 시작하면 <b>안 옮겨진 것만</b> 이어서 가져와요.
      </p>

      <div className="bg-white border border-line p-6 space-y-5">
        <div>
          <label className="label">1. 카페24 상품 엑셀(CSV) 파일</label>
          <input type="file" accept=".csv" onChange={onFile} disabled={running} className="text-sm" />
        </div>
        <div>
          <label className="label">2. 카페24 쇼핑몰 주소 (사진 받아올 곳)</label>
          <input className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="https://아이디.cafe24.com" disabled={running} />
        </div>

        {jobs.length > 0 && (
          <div className="bg-neutral-50 border border-line p-4 text-sm grid grid-cols-2 md:grid-cols-3 gap-y-2">
            <p>상품 <b>{products.length.toLocaleString()}</b>개</p>
            <p>국내재고 <b>{products.filter((j) => j.domestic).length}</b>개</p>
            <p>브랜드 미분류 <b>{products.filter((j) => !j.brandSlug).length}</b>개</p>
            <p>출고 게시물 <b>{shipping.length}</b>개</p>
            <p>찰나 영상 <b>{jobs.filter((j) => j.video).length}</b>개</p>
            <p>사진 약 <b>{jobs.reduce((n, j) => n + j.detailImages.length + (j.mainImage ? 1 : 0), 0).toLocaleString()}</b>장</p>
            <p className="col-span-full text-neutral-500">이미 옮겨진 것: {done.size.toLocaleString()}개</p>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} disabled={running} />
          이미 옮긴 것도 다시 가져오기 (덮어쓰기)
        </label>

        <div className="flex gap-2">
          <button className="btn" onClick={start} disabled={running || !jobs.length}>
            {running ? '가져오는 중…' : '3. 가져오기 시작'}
          </button>
          {running && (
            <button className="btn-line" onClick={() => (stopRef.current = true)}>멈추기</button>
          )}
        </div>
      </div>

      {(running || finished > 0) && (
        <div className="mt-6 bg-white border border-line p-6 space-y-3">
          <div className="h-3 bg-neutral-100 rounded overflow-hidden">
            <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm">
            {finished.toLocaleString()} / {total.toLocaleString()} ({pct}%) · 완료 {progress.ok} · 건너뜀 {progress.skipped} ·{' '}
            <span className={progress.error ? 'text-red-600 font-bold' : ''}>실패 {progress.error}</span> · 사진 {progress.images.toLocaleString()}장
            {progress.imgFailed > 0 && <span className="text-orange-600"> (못 받은 사진 {progress.imgFailed}장)</span>}
          </p>
          {!running && finished > 0 && (
            <p className="text-sm font-bold">
              {progress.error ? '끝났어요. 실패한 건 파일을 다시 올리고 시작하면 그것만 다시 시도해요.' : '모두 끝났어요! 🎉'}
            </p>
          )}
          {logs.length > 0 && (
            <ul className="max-h-60 overflow-y-auto text-xs border-t border-line pt-3 space-y-1">
              {logs.map((l, i) => (
                <li key={i}><b>{l.name}</b> — <span className="text-neutral-500">{l.msg}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
