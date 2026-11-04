import type { Metadata } from 'next';
import Link from 'next/link';
import VideoGrid, { type VideoItem } from '@/components/VideoGrid';
import { createPublicClient } from '@/lib/supabase/public';
import type { Brand, Shipping } from '@/lib/types';

export const metadata: Metadata = { title: '실시간 검수' };

const PAGE_SIZE = 36;
type SP = { tab?: string; q?: string; brand?: string; page?: string };
type Post = Shipping & { products: { id: number; name: string } | null };

export default async function ShippingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = sp.tab === 'video' ? 'video' : 'all';
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? '').replace(/[%,()]/g, ' ').trim().slice(0, 40);
  const supabase = createPublicClient();

  const { data: brandRows } = await supabase.from('brands').select('*').order('sort_order');
  const brands = (brandRows ?? []) as Brand[];
  const brand = brands.find((b) => b.slug === sp.brand) ?? null;

  // 검색어가 상품명에 들어간 상품 → 그 상품에 연결된 게시물도 찾기
  let productIds: number[] = [];
  if (q) {
    const { data } = await supabase.from('products').select('id').ilike('name', `%${q}%`).limit(200);
    productIds = (data ?? []).map((r: { id: number }) => r.id);
  }

  const shippingQuery = (withCount: boolean) => {
    let query = supabase
      .from('shipping_videos')
      .select('*, products(id, name)', withCount ? { count: 'exact' } : undefined)
      .order('shipped_at', { ascending: false })
      .order('id', { ascending: false });
    if (brand) query = query.eq('brand_id', brand.id);
    if (q) query = query.or([`title.ilike.%${q}%`, productIds.length ? `product_id.in.(${productIds.join(',')})` : ''].filter(Boolean).join(','));
    return query;
  };

  let posts: Post[] = [];
  let videos: VideoItem[] = [];
  let total = 0;

  if (tab === 'all') {
    const { data, count } = await shippingQuery(true).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    posts = (data ?? []) as Post[];
    total = count ?? 0;
  } else {
    // 출고 게시물 영상 + 상품에 등록된 출고영상을 합쳐서 최신순
    let prodQuery = supabase.from('products').select('id, name, thumbnail_url, video_url, created_at').not('video_url', 'is', null).limit(300);
    if (brand) prodQuery = prodQuery.eq('brand_id', brand.id);
    if (q) prodQuery = prodQuery.ilike('name', `%${q}%`);
    const [{ data: sv }, { data: pv }] = await Promise.all([shippingQuery(false).not('video_url', 'is', null).limit(300), prodQuery]);
    const merged: (VideoItem & { sort: string })[] = [
      ...((sv ?? []) as Post[]).map((s) => ({
        key: `s${s.id}`, title: s.products?.name ?? s.title ?? '', thumb: s.thumbnail_url, video: s.video_url!, date: s.shipped_at, productId: s.product_id, sort: s.shipped_at,
      })),
      ...((pv ?? []) as { id: number; name: string; thumbnail_url: string | null; video_url: string; created_at: string }[]).map((p) => ({
        key: `p${p.id}`, title: p.name, thumb: p.thumbnail_url, video: p.video_url, date: p.created_at.slice(0, 10), productId: p.id, sort: p.created_at.slice(0, 10),
      })),
    ].sort((a, b) => b.sort.localeCompare(a.sort));
    total = merged.length;
    videos = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const next = { tab: tab === 'video' ? 'video' : undefined, q: q || undefined, brand: sp.brand, ...o };
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    return `/shipping?${p}`;
  };

  return (
    <div className="bg-abyss text-white -mb-24 pb-24 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-10 ">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> INSPECTION ATELIER
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <div>
            <h1 className="display text-[44px] text-fg">The Records</h1>
            <p className="mt-2 text-sm text-neutral-400">출고 전 실제 제품을 직접 촬영한 검수 사진과 영상 기록이에요.</p>
          </div>
          <p className="text-xs text-neutral-500">사진 · 영상 검수 기록</p>
        </div>

        {/* 탭 */}
        <div className="mt-8 grid grid-cols-2 border-b border-white/10 text-sm">
          {[
            { key: 'all', label: '검수 전체보기' },
            { key: 'video', label: '실시간 출고영상' },
          ].map((t) => (
            <Link
              key={t.key}
              href={href({ tab: t.key === 'video' ? 'video' : undefined, page: undefined })}
              className={`relative py-4 text-center transition ${tab === t.key ? 'font-semibold text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {t.label}
              <span className={`absolute inset-x-6 -bottom-px h-[2px] bg-white transition-transform ${tab === t.key ? 'scale-x-100' : 'scale-x-0'}`} />
            </Link>
          ))}
        </div>

        {/* 검색 */}
        <form action="/shipping" className="mt-6 flex gap-2">
          {tab === 'video' && <input type="hidden" name="tab" value="video" />}
          <input
            name="q"
            defaultValue={q}
            placeholder="브랜드 또는 모델명 검색"
            enterKeyHint="search"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/40"
          />
          <select
            name="brand"
            defaultValue={sp.brand ?? ''}
            className="w-28 rounded-md border border-white/10 bg-abyss px-3 text-sm focus:outline-none"
          >
            <option value="">전체 브랜드</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>{b.name_ko}</option>
            ))}
          </select>
          <button className="bg-accent px-4 text-sm font-medium text-paper active:scale-95 transition">검색</button>
        </form>

        <p className="mt-6 mb-4 text-sm text-neutral-400">전체 {total.toLocaleString()}건</p>

        {tab === 'all' ? (
          <div className="grid grid-cols-2 gap-2.5 ">
            {posts.map((s) => {
              const photos = (s.thumbnail_url ? 1 : 0) + (s.images?.length ?? 0);
              return (
                <Link key={s.id} href={`/shipping/${s.id}`} className="group block active:scale-[0.98] transition-transform">
                  <div className="relative aspect-[4/5] overflow-hidden bg-panel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.thumbnail_url && <img src={s.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />}
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] text-black">✓</span> 검수완료
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                      사진 {photos}{s.video_url && ' · 영상 1'}
                    </span>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-snug text-neutral-200 line-clamp-2">{s.products?.name ?? s.title}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{s.shipped_at}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <VideoGrid items={videos} />
        )}
        {total === 0 && <p className="py-24 text-center text-sm text-neutral-500">검색 결과가 없어요.</p>}

        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-2 text-sm">
            {page > 1 && <Link href={href({ page: String(page - 1) })} className="rounded-full border border-white/20 px-5 py-2.5 hover:border-white">이전</Link>}
            <span className="px-3 text-neutral-400">{page} / {totalPages}</span>
            {page < totalPages && <Link href={href({ page: String(page + 1) })} className="rounded-full border border-white/20 px-5 py-2.5 hover:border-white">다음</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}
