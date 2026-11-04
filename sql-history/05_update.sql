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
