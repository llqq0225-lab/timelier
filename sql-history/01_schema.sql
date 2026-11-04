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
  ('site_name',   '사이트 이름'),
  ('kakao_url',   'https://pf.kakao.com/카카오채널주소'),
  ('bank_info',   '은행명 / 계좌번호 / 예금주'),
  ('footer_info', '상호 / 대표자 / 사업자등록번호 / 통신판매업신고번호 / 주소 / 연락처');
