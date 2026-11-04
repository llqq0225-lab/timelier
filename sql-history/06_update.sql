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
