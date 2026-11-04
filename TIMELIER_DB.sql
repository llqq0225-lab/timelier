-- ============================================================
-- TIMELIER 데이터베이스 (새 Supabase 프로젝트에서 딱 한 번만 실행)
-- SQL Editor > New query > 전체 붙여넣기 > Run
-- ============================================================

-- ---------------- 01_schema.sql ----------------
-- =========================================================
-- 시계 쇼핑몰 DB 구조 (Supabase SQL Editor에 통째로 붙여넣고 Run)
-- =========================================================

-- updated_at 자동 갱신 함수
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------------------------------------------------------
-- 관리자
-- ---------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------
-- 브랜드
-- ---------------------------------------------------------
create table public.brands (
  id bigint generated always as identity primary key,
  name_ko text not null,
  name_en text,
  slug text unique not null,          -- 주소용 영문 (예: rolex)
  logo_url text,
  feature_image_url text,             -- 메인 브랜드 섹션 대표 이미지
  is_featured boolean default false,  -- 메인 '대표 브랜드' 노출 여부
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 상품
-- ---------------------------------------------------------
create table public.products (
  id bigint generated always as identity primary key,
  brand_id bigint references public.brands(id) on delete set null,
  name text not null,
  model_no text,
  description text,
  price int,                          -- 비워두면 '가격 문의'로 표시
  thumbnail_url text,
  video_url text,                     -- 상품 상세 출고영상
  stock_type text default 'order'
    check (stock_type in ('order', 'domestic')),  -- domestic = 국내재고 바로배송
  recent_sales int default 0,         -- 랭킹용 '최근판매 N건'
  is_visible boolean default true,
  sort_order int default 0,
  cafe24_no text unique,              -- 카페24에서 옮겨온 상품번호 (이전 작업용)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create index products_brand_idx on public.products(brand_id);
create index products_sales_idx on public.products(recent_sales desc);

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int default 0
);
create index product_images_product_idx on public.product_images(product_id);

-- ---------------------------------------------------------
-- 출고영상 / 후기 / 공지 / 배너 / 사이트 설정
-- ---------------------------------------------------------
create table public.shipping_videos (
  id bigint generated always as identity primary key,
  brand_id bigint references public.brands(id) on delete set null,
  product_id bigint references public.products(id) on delete set null,
  title text,
  video_url text not null,
  thumbnail_url text,
  shipped_at date default current_date,
  is_visible boolean default true,
  created_at timestamptz default now()
);

create table public.reviews (
  id bigint generated always as identity primary key,
  product_id bigint references public.products(id) on delete set null,
  author_name text,
  content text,
  image_urls text[] default '{}',
  is_visible boolean default true,
  created_at timestamptz default now()
);

create table public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  content text,
  is_pinned boolean default false,
  is_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger notices_updated_at before update on public.notices
  for each row execute function public.set_updated_at();

create table public.banners (
  id bigint generated always as identity primary key,
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  placement text default 'hero',      -- hero, middle 등 위치 구분
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.site_settings (
  key text primary key,
  value text
);

-- ---------------------------------------------------------
-- 보안 (손님은 읽기만, 관리자만 쓰기)
-- ---------------------------------------------------------
alter table public.admins enable row level security;
create policy "admin_self_read" on public.admins
  for select using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['brands','products','product_images','shipping_videos',
                           'reviews','notices','banners','site_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin_all" on public.%I for all
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "public_read" on public.brands          for select using (true);
create policy "public_read" on public.products        for select using (is_visible);
create policy "public_read" on public.product_images  for select using (true);
create policy "public_read" on public.shipping_videos for select using (is_visible);
create policy "public_read" on public.reviews         for select using (is_visible);
create policy "public_read" on public.notices         for select using (is_visible);
create policy "public_read" on public.banners         for select using (is_active);
create policy "public_read" on public.site_settings   for select using (true);

-- ---------------------------------------------------------
-- 이미지 저장소 (media 폴더)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_admin_insert" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media_admin_update" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());
create policy "media_admin_delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------
-- 기본 데이터
-- ---------------------------------------------------------
insert into public.brands (name_ko, name_en, slug, is_featured, sort_order) values
  ('롤렉스',          'Rolex',               'rolex',               true,  1),
  ('파텍필립',        'Patek Philippe',      'patek-philippe',      true,  2),
  ('오데마피게',      'Audemars Piguet',     'audemars-piguet',     true,  3),
  ('까르띠에',        'Cartier',             'cartier',             true,  4),
  ('리처드밀',        'Richard Mille',       'richard-mille',       true,  5),
  ('오메가',          'Omega',               'omega',               true,  6),
  ('위블로',          'Hublot',              'hublot',              true,  7),
  ('IWC',             'IWC',                 'iwc',                 true,  8),
  ('바쉐론 콘스탄틴', 'Vacheron Constantin', 'vacheron-constantin', false, 9),
  ('파네라이',        'Panerai',             'panerai',             false, 10),
  ('샤넬',            'Chanel',              'chanel',              false, 11);

insert into public.site_settings (key, value) values
  ('site_name',   'TIMELIER'),
  ('kakao_url',   'https://pf.kakao.com/카카오채널주소'),
  ('bank_info',   '은행명 / 계좌번호 / 예금주'),
  ('footer_info', '상호 / 대표자 / 사업자등록번호 / 통신판매업신고번호 / 주소 / 연락처');

-- ---------------- 02_update.sql ----------------
-- =========================================================
-- 2단계 DB 변경 (SQL Editor에 붙여넣고 Run, 한 번만)
-- =========================================================

-- 출고 게시물: 영상 없이 사진만 있어도 저장 가능하게
alter table public.shipping_videos alter column video_url drop not null;
alter table public.shipping_videos add column if not exists images text[] default '{}';
alter table public.shipping_videos add column if not exists cafe24_no text unique;
create index if not exists shipping_videos_date_idx on public.shipping_videos(shipped_at desc);

-- 사진 덮어쓰기(다시 가져오기)를 위한 저장소 읽기 권한
drop policy if exists "media_admin_select" on storage.objects;
create policy "media_admin_select" on storage.objects
  for select using (bucket_id = 'media' and public.is_admin());

-- ---------------- 03_update.sql ----------------
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

-- ---------------- 04_update.sql ----------------
-- =========================================================
-- 5단계 DB 변경 (SQL Editor에 붙여넣고 Run, 한 번만)
-- 상세분류(모델) 대표 이미지를 직접 정할 수 있게
-- =========================================================
create table if not exists public.collection_images (
  brand_id bigint not null references public.brands(id) on delete cascade,
  collection text not null,
  image_url text not null,
  updated_at timestamptz default now(),
  primary key (brand_id, collection)
);

alter table public.collection_images enable row level security;
drop policy if exists "public_read" on public.collection_images;
drop policy if exists "admin_all" on public.collection_images;
create policy "public_read" on public.collection_images for select using (true);
create policy "admin_all" on public.collection_images for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- 05_update.sql ----------------
-- =========================================================
-- 6단계 DB 변경 (SQL Editor에 붙여넣고 Run, 한 번만)
-- 검수영상 있는 상품을 자동으로 표시 → 목록에서 위로
-- =========================================================

alter table public.products add column if not exists has_video boolean not null default false;
create index if not exists products_pick_idx on public.products(sort_order, has_video desc, created_at desc);

-- 상품에 영상이 있거나, 영상 있는 출고 게시물이 연결돼 있으면 true
create or replace function public.product_has_video(pid bigint, own_video text)
returns boolean language sql stable set search_path = public as $$
  select coalesce(nullif(trim(own_video), ''), null) is not null
      or exists (
        select 1 from public.shipping_videos s
        where s.product_id = pid and coalesce(trim(s.video_url), '') <> '' and s.is_visible
      );
$$;

-- 상품 저장할 때 자동 계산
create or replace function public.products_set_has_video()
returns trigger language plpgsql set search_path = public as $$
begin
  new.has_video := public.product_has_video(new.id, new.video_url);
  return new;
end; $$;

drop trigger if exists products_has_video on public.products;
create trigger products_has_video before insert or update of video_url on public.products
  for each row execute function public.products_set_has_video();

-- 출고 게시물이 바뀌면 연결된 상품 다시 계산
create or replace function public.shipping_refresh_has_video()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.product_id is not null then
    update public.products set has_video = public.product_has_video(id, video_url) where id = old.product_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.product_id is not null then
    update public.products set has_video = public.product_has_video(id, video_url) where id = new.product_id;
  end if;
  return null;
end; $$;

drop trigger if exists shipping_has_video on public.shipping_videos;
create trigger shipping_has_video after insert or update or delete on public.shipping_videos
  for each row execute function public.shipping_refresh_has_video();

-- 지금 있는 상품들 한 번에 계산
update public.products set has_video = public.product_has_video(id, video_url);

-- 결과 확인용: 영상 있는 상품 수
select count(*) filter (where has_video) as 영상있는상품, count(*) as 전체상품 from public.products;

-- ---------------- 06_update.sql ----------------
-- =========================================================
-- 7단계 DB 변경 (SQL Editor에 붙여넣고 Run, 한 번만)
-- 접속자 기록 + 관리자 통계
-- 개인정보: IP·이름 등은 저장하지 않고, 브라우저마다 만든 무작위 번호만 저장
-- =========================================================

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  visitor text not null,          -- 브라우저별 무작위 번호
  path text not null,
  product_id bigint,
  referrer text,                  -- 들어온 곳 (네이버, 인스타 등)
  device text,                    -- mobile / pc
  created_at timestamptz not null default now()
);
create index if not exists page_views_time_idx on public.page_views(created_at desc);
create index if not exists page_views_product_idx on public.page_views(product_id) where product_id is not null;

-- 손님은 직접 읽거나 지울 수 없음 (아래 함수로 기록만)
alter table public.page_views enable row level security;
drop policy if exists "admin_read" on public.page_views;
create policy "admin_read" on public.page_views for select using (public.is_admin());

-- 페이지 볼 때마다 기록 (사이트에서 자동 호출)
create or replace function public.track_view(p_visitor text, p_path text, p_product bigint, p_ref text, p_device text)
returns void language sql security definer set search_path = public as $$
  insert into public.page_views (visitor, path, product_id, referrer, device)
  select left(p_visitor, 40), left(p_path, 200), p_product, nullif(left(coalesce(p_ref, ''), 300), ''),
         case when p_device = 'mobile' then 'mobile' else 'pc' end
  where coalesce(p_visitor, '') <> '' and coalesce(p_path, '') <> '';
$$;
grant execute on function public.track_view(text, text, bigint, text, text) to anon, authenticated;

-- 들어온 곳 이름 정리
create or replace function public.ref_source(ref text)
returns text language sql immutable as $$
  select case
    when ref is null or ref = '' then '직접 방문'
    when ref ilike '%naver%' then '네이버'
    when ref ilike '%instagram%' then '인스타그램'
    when ref ilike '%kakao%' or ref ilike '%daum%' then '카카오·다음'
    when ref ilike '%google%' then '구글'
    when ref ilike '%youtube%' or ref ilike '%youtu.be%' then '유튜브'
    when ref ilike '%tiktok%' then '틱톡'
    when ref ilike '%facebook%' or ref ilike '%fb.%' then '페이스북'
    else '기타'
  end;
$$;

-- 관리자 통계 (최근 p_days일, 한국 시간 기준)
create or replace function public.admin_stats(p_days int default 7)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := (date_trunc('day', now() at time zone 'Asia/Seoul') - make_interval(days => greatest(p_days, 1) - 1)) at time zone 'Asia/Seoul';
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  result json;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  with v as (select * from public.page_views where created_at >= since)
  select json_build_object(
    'today', (select json_build_object('visitors', count(distinct visitor), 'views', count(*)) from public.page_views where created_at >= today),
    'period', (select json_build_object('visitors', count(distinct visitor), 'views', count(*)) from v),
    'live', (select count(distinct visitor) from public.page_views where created_at >= now() - interval '5 minutes'),
    'daily', coalesce((
      select json_agg(json_build_object('day', d.day, 'visitors', coalesce(x.visitors, 0), 'views', coalesce(x.views, 0)) order by d.day)
      from generate_series((since at time zone 'Asia/Seoul')::date, (now() at time zone 'Asia/Seoul')::date, interval '1 day') as d(day)
      left join (
        select (created_at at time zone 'Asia/Seoul')::date as day, count(distinct visitor) as visitors, count(*) as views
        from v group by 1
      ) x on x.day = d.day::date
    ), '[]'),
    'hours', coalesce((
      select json_agg(json_build_object('hour', h, 'views', coalesce(c, 0)) order by h)
      from generate_series(0, 23) h
      left join (select extract(hour from created_at at time zone 'Asia/Seoul')::int as hr, count(*) c from v group by 1) y on y.hr = h
    ), '[]'),
    'products', coalesce((
      select json_agg(t) from (
        select p.id, p.name, p.thumbnail_url, count(*) as views, count(distinct v.visitor) as visitors
        from v join public.products p on p.id = v.product_id
        group by p.id, p.name, p.thumbnail_url order by views desc limit 15
      ) t
    ), '[]'),
    'pages', coalesce((
      select json_agg(t) from (
        select case
                 when path like '/product/%' then '상품 상세'
                 when path like '/brand/domestic%' then '국내배송'
                 when path like '/brand/%' then '브랜드 목록'
                 when path like '/shipping%' then '실시간 검수'
                 when path like '/search%' then '검색'
                 when path = '/' then '메인'
                 else path end as page,
               count(*) as views
        from v group by 1 order by views desc limit 10
      ) t
    ), '[]'),
    'sources', coalesce((
      select json_agg(t) from (
        select public.ref_source(first_ref) as source, count(*) as visitors
        from (select visitor, (array_agg(referrer order by created_at) filter (where referrer is not null))[1] as first_ref from v group by visitor) f
        group by 1 order by visitors desc
      ) t
    ), '[]'),
    'devices', coalesce((
      select json_agg(t) from (select device, count(distinct visitor) as visitors from v group by device order by visitors desc) t
    ), '[]'),
    'returning', (select count(*) from (select visitor from v group by visitor having count(distinct (created_at at time zone 'Asia/Seoul')::date) > 1) r)
  ) into result;
  return result;
end; $$;
grant execute on function public.admin_stats(int) to authenticated;

-- 진열 순서 저장: 넘겨준 순서대로 맨 앞부터 (-N, ..., -1)
create or replace function public.admin_set_order(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.products p
     set sort_order = o.ord - coalesce(array_length(p_ids, 1), 0) - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where p.id = o.id;
end; $$;
grant execute on function public.admin_set_order(bigint[]) to authenticated;

-- ---------------- 07_filters.sql ----------------
-- 07. 필터용 소재 · 스트랩 (타임리에)
alter table public.products add column if not exists material text;  -- 스틸, 옐로우골드, 로즈골드, 화이트골드, 콤비, 플래티넘, 티타늄, 세라믹
alter table public.products add column if not exists strap text;     -- 메탈, 가죽, 러버
create index if not exists products_material_idx on public.products (material);
create index if not exists products_strap_idx on public.products (strap);
create index if not exists products_gender_idx on public.products (gender);
