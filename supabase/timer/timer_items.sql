-- 빨간 원판 타이머: PC·휴대폰·exe가 함께 쓰는 할 일 표
-- Supabase 대시보드 → SQL Editor에 전체를 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.

create table if not exists public.timer_items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 본인 행만 읽고 쓸 수 있게 막기 (Row Level Security)
alter table public.timer_items enable row level security;

drop policy if exists "timer_items: read own"   on public.timer_items;
drop policy if exists "timer_items: insert own" on public.timer_items;
drop policy if exists "timer_items: update own" on public.timer_items;
drop policy if exists "timer_items: delete own" on public.timer_items;

create policy "timer_items: read own"   on public.timer_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "timer_items: insert own" on public.timer_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "timer_items: update own" on public.timer_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "timer_items: delete own" on public.timer_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 로그인한 사용자만 표에 접근 (로그인하지 않은 방문자는 차단)
revoke all on public.timer_items from anon;
grant select, insert, update, delete on public.timer_items to authenticated;

-- 다른 기기의 변경을 바로 알려주는 실시간 기능 켜기
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'timer_items'
  ) then
    alter publication supabase_realtime add table public.timer_items;
  end if;
end $$;
