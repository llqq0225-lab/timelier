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
