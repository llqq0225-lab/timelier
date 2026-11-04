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
