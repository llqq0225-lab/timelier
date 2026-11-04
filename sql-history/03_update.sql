-- =========================================================
-- 3단계 DB 변경 (SQL Editor에 붙여넣고 Run, 한 번만)
-- =========================================================

-- 상품: 컬렉션(상세분류), 성별, 조회수
alter table public.products add column if not exists collection text;
alter table public.products add column if not exists gender text default '공용';
alter table public.products add column if not exists view_count int default 0;
create index if not exists products_brand_collection_idx on public.products(brand_id, collection);
create index if not exists products_views_idx on public.products(view_count desc);

-- 손님이 상품을 볼 때마다 조회수 +1 (로그인 없이 호출 가능, 조회수만 바꿀 수 있음)
create or replace function public.increment_view(pid bigint)
returns void language sql security definer set search_path = public as $$
  update public.products set view_count = coalesce(view_count, 0) + 1 where id = pid;
$$;
grant execute on function public.increment_view(bigint) to anon, authenticated;

-- 브랜드별 컬렉션 목록과 상품 수 (메뉴용)
create or replace view public.brand_collections with (security_invoker = true) as
  select brand_id, collection, count(*)::int as cnt
  from public.products
  where is_visible and collection is not null
  group by brand_id, collection;
grant select on public.brand_collections to anon, authenticated;

-- 사이트 기본 문구 (관리자 > 사이트 설정에서 수정)
insert into public.site_settings (key, value) values
  ('shipping_method', '택배'),
  ('shipping_fee', '기본 무료')
on conflict (key) do nothing;
