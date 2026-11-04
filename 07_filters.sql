-- 07. 필터용 소재 · 스트랩 (타임리에)
alter table public.products add column if not exists material text;  -- 스틸, 옐로우골드, 로즈골드, 화이트골드, 콤비, 플래티넘, 티타늄, 세라믹
alter table public.products add column if not exists strap text;     -- 메탈, 가죽, 러버
create index if not exists products_material_idx on public.products (material);
create index if not exists products_strap_idx on public.products (strap);
create index if not exists products_gender_idx on public.products (gender);
