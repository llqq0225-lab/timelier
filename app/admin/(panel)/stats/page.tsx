import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type Stats = {
  today: { visitors: number; views: number };
  period: { visitors: number; views: number };
  live: number;
  returning: number;
  daily: { day: string; visitors: number; views: number }[];
  hours: { hour: number; views: number }[];
  products: { id: number; name: string; thumbnail_url: string | null; views: number; visitors: number }[];
  pages: { page: string; views: number }[];
  sources: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
};

const RANGES = [7, 30, 90];

function Bar({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate">{label}</span>
      <span className="relative h-6 flex-1 overflow-hidden rounded bg-neutral-100">
        <span className="absolute inset-y-0 left-0 rounded bg-ink/80" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums">
        {value.toLocaleString()}
        {sub && <span className="text-neutral-400"> {sub}</span>}
      </span>
    </div>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 7;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_stats', { p_days: days });

  if (error || !data) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">방문 통계</h1>
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          통계를 불러오지 못했어요. Supabase SQL Editor에서 <b>06_update.sql</b>을 먼저 실행해 주세요.
          {error && <span className="mt-2 block text-xs text-amber-700">({error.message})</span>}
        </p>
      </div>
    );
  }
  const s = data as Stats;
  const maxDay = Math.max(1, ...s.daily.map((d) => d.visitors));
  const maxHour = Math.max(1, ...s.hours.map((h) => h.views));
  const totalDev = s.devices.reduce((n, d) => n + d.visitors, 0) || 1;
  const mobile = s.devices.find((d) => d.device === 'mobile')?.visitors ?? 0;

  const cards = [
    { label: '지금 접속 중', value: s.live, sub: '최근 5분', accent: true },
    { label: '오늘 방문자', value: s.today.visitors, sub: `페이지뷰 ${s.today.views.toLocaleString()}` },
    { label: `${days}일 방문자`, value: s.period.visitors, sub: `페이지뷰 ${s.period.views.toLocaleString()}` },
    { label: '다시 온 방문자', value: s.returning, sub: `${days}일 중 2일 이상 방문` },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">방문 통계</h1>
        <div className="flex gap-1 rounded-lg bg-neutral-200 p-1 text-sm">
          {RANGES.map((r) => (
            <Link key={r} href={`?days=${r}`} className={`rounded-md px-3 py-1.5 ${r === days ? 'bg-white font-bold shadow-sm' : 'text-neutral-600'}`}>
              {r}일
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-line p-4">
            <p className="flex items-center gap-1.5 text-sm text-neutral-500">
              {c.accent && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
              {c.label}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-neutral-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 날짜별 */}
      <section className="bg-white border border-line p-5">
        <h2 className="font-bold mb-4">날짜별 방문자</h2>
        <div className="flex h-44 items-end gap-[2px] overflow-x-auto">
          {s.daily.map((d) => {
            const day = d.day.slice(5, 10).replace('-', '/');
            return (
              <div key={d.day} className="group relative flex h-full min-w-[10px] flex-1 flex-col justify-end" title={`${day} · 방문자 ${d.visitors} · 페이지뷰 ${d.views}`}>
                <span className="mb-1 hidden text-center text-[10px] text-neutral-500 group-hover:block">{d.visitors}</span>
                <span className="rounded-t bg-ink/80 group-hover:bg-gold" style={{ height: `${(d.visitors / maxDay) * 100}%`, minHeight: d.visitors ? 3 : 1 }} />
                {(s.daily.length <= 31 || Number(day.slice(3)) % 7 === 1) && (
                  <span className="mt-1 text-center text-[9px] text-neutral-400">{days <= 7 ? day : day.slice(3)}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border border-line p-5 space-y-2.5">
          <h2 className="font-bold mb-2">어디서 들어왔나요</h2>
          {s.sources.length === 0 && <p className="text-sm text-neutral-400">아직 기록이 없어요.</p>}
          {s.sources.map((r) => (
            <Bar key={r.source} label={r.source} value={r.visitors} max={s.sources[0]?.visitors ?? 1} sub="명" />
          ))}
        </section>

        <section className="bg-white border border-line p-5">
          <h2 className="font-bold mb-4">기기</h2>
          <div className="flex h-5 overflow-hidden rounded-full bg-neutral-100">
            <span className="bg-ink" style={{ width: `${(mobile / totalDev) * 100}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-ink" />모바일 {Math.round((mobile / totalDev) * 100)}%</span>
            <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-neutral-300" />PC {100 - Math.round((mobile / totalDev) * 100)}%</span>
          </div>

          <h2 className="font-bold mt-8 mb-3">많이 본 페이지</h2>
          <div className="space-y-2.5">
            {s.pages.map((p) => (
              <Bar key={p.page} label={p.page} value={p.views} max={s.pages[0]?.views ?? 1} />
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white border border-line p-5">
        <h2 className="font-bold mb-4">시간대별 (한국 시간)</h2>
        <div className="flex h-28 items-end gap-1">
          {s.hours.map((h) => (
            <div key={h.hour} className="flex h-full flex-1 flex-col justify-end" title={`${h.hour}시 · ${h.views}`}>
              <span className="rounded-t bg-gold/80" style={{ height: `${(h.views / maxHour) * 100}%`, minHeight: h.views ? 3 : 1 }} />
              <span className="mt-1 text-center text-[9px] text-neutral-400">{h.hour % 3 === 0 ? h.hour : ''}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-line p-5">
        <h2 className="font-bold mb-4">많이 본 상품 ({days}일)</h2>
        <ol className="divide-y divide-line">
          {s.products.map((p, i) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 py-2 text-sm hover:bg-neutral-50">
                <b className="w-6 text-right text-neutral-400">{i + 1}</b>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="h-10 w-10 rounded bg-neutral-100" />}
                <span className="flex-1 line-clamp-1">{p.name}</span>
                <span className="text-neutral-500 tabular-nums">{p.visitors}명 · {p.views}회</span>
              </Link>
            </li>
          ))}
        </ol>
        {s.products.length === 0 && <p className="text-sm text-neutral-400">아직 기록이 없어요.</p>}
      </section>

      <p className="text-xs text-neutral-400">
        이름·연락처·IP는 저장하지 않고, 브라우저마다 만든 무작위 번호로만 세요. 같은 사람이 휴대폰과 PC로 들어오면 2명으로 세질 수 있어요. 관리자 화면은 집계하지 않아요.
      </p>
    </div>
  );
}
