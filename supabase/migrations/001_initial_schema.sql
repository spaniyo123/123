-- ============================================================
-- 부서 공용 할일 관리 앱 — 초기 스키마
-- PRD 4.7(데이터 필드 정의), 4.9(충돌 처리), 5.4(보안) 반영
-- ============================================================

-- UUID 생성 확장 (Supabase에는 기본 내장, 명시적으로 선언)
create extension if not exists "pgcrypto";

-- ===== 열거형 타입 =====

create type task_status as enum ('todo', 'in-progress', 'done');
create type task_priority as enum ('high', 'medium', 'low');

-- ===== tasks 테이블 =====
-- PRD 4.7 Task 필드 정의 기준: 타입·필수여부·제약 그대로 반영

create table tasks (
  id           uuid          primary key default gen_random_uuid(),

  -- 필수, 1~100자
  title        varchar(100)  not null
                             constraint tasks_title_not_empty
                               check (char_length(title) >= 1),

  -- 선택, 최대 2,000자
  description  text          constraint tasks_description_max_length
                               check (description is null or char_length(description) <= 2000),

  -- 필수, 기본값 todo
  status       task_status   not null default 'todo',

  -- 필수, 1~30자 (자유 텍스트 이름)
  assignee     varchar(30)   not null
                             constraint tasks_assignee_not_empty
                               check (char_length(assignee) >= 1),

  -- 필수, 기본값 medium
  priority     task_priority not null default 'medium',

  -- 선택, ISO 8601 date
  due_date     date,

  -- 선택
  category     text,

  -- 필수, 1~30자 (등록 당시 입력 이름, PRD 4.8)
  created_by   varchar(30)   not null
                             constraint tasks_created_by_not_empty
                               check (char_length(created_by) >= 1),

  -- 서버 자동 생성
  created_at   timestamptz   not null default now(),

  -- 변경마다 자동 갱신 — PRD 4.9 Last-Write-Wins 기준값
  updated_at   timestamptz   not null default now()
);

-- ===== comments 테이블 =====
-- PRD 4.7 Comment 필드 정의 기준

create table comments (
  id         uuid         primary key default gen_random_uuid(),

  -- FK → tasks.id, task 삭제 시 댓글도 cascade
  task_id    uuid         not null
                          references tasks(id) on delete cascade,

  -- 필수, 1~30자
  author     varchar(30)  not null
                          constraint comments_author_not_empty
                            check (char_length(author) >= 1),

  -- 필수, 1~1,000자
  content    text         not null
                          constraint comments_content_length
                            check (char_length(content) >= 1 and char_length(content) <= 1000),

  -- 서버 자동 생성
  created_at timestamptz  not null default now()
);

-- ===== updated_at 자동 갱신 트리거 =====
-- PRD 4.9: Last-Write-Wins의 기준값이므로 서버 시간 기준으로 정확히 갱신해야 함
-- 클라이언트 시간 대신 now()를 사용하여 시계 차이 문제 방지

create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tasks_updated_at
  before update on tasks
  for each row
  execute function fn_set_updated_at();

-- ===== 인덱스 =====
-- 검색·필터(PRD 4.3)와 대시보드 집계(PRD 4.5) 쿼리 최적화

create index idx_tasks_status     on tasks(status);
create index idx_tasks_assignee   on tasks(assignee);
create index idx_tasks_priority   on tasks(priority);
create index idx_tasks_due_date   on tasks(due_date);
create index idx_tasks_created_at on tasks(created_at desc);
create index idx_comments_task_id on comments(task_id);

-- ===== Row Level Security =====
-- PRD 5.4: anon key(비인증) 접근 전제, 부서 공용 데이터

alter table tasks    enable row level security;
alter table comments enable row level security;

-- tasks: SELECT / INSERT / UPDATE — 전체 허용
-- 부서 내부 신뢰 환경, 외부 비공개 전제 (PRD 5.4)
create policy "tasks: select all"
  on tasks for select
  using (true);

create policy "tasks: insert all"
  on tasks for insert
  with check (true);

create policy "tasks: update all"
  on tasks for update
  using (true)
  with check (true);

-- tasks: DELETE — PRD 5.4 "별도 정책으로 제한 검토"
-- 1차에서는 신뢰 환경 전제로 허용. 향후 created_by 기준 제한 강화 권고
create policy "tasks: delete all (revisit in v2)"
  on tasks for delete
  using (true);

-- comments: SELECT / INSERT 허용
-- DELETE는 PRD 8장 Out of Scope (댓글 삭제 미구현)
create policy "comments: select all"
  on comments for select
  using (true);

create policy "comments: insert all"
  on comments for insert
  with check (true);

-- ===== Last-Write-Wins RPC 함수 =====
-- PRD 4.9: 트랜잭션 내에서 원자적으로 충돌 감지 + 저장
--
-- 동작:
--   1. FOR UPDATE로 행 잠금 후 서버 updated_at 조회 (race condition 방지)
--   2. 클라이언트가 보낸 p_client_updated_at과 비교 → 다르면 conflict = true
--   3. conflict 여부와 무관하게 항상 UPDATE 실행 (Last-Write-Wins)
--   4. 업데이트된 task 전체와 conflict 플래그를 JSON으로 반환
--
-- p_updates는 JSONB로 받아 키 존재 여부(?)로 "미전달" vs "null로 설정" 구분

create or replace function update_task_lww(
  p_id                uuid,
  p_client_updated_at timestamptz,
  p_updates           jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_server_updated_at timestamptz;
  v_conflict          boolean := false;
  v_task              tasks;
begin
  -- 1단계: 행 잠금 + 현재 updated_at 조회
  select updated_at
  into   v_server_updated_at
  from   tasks
  where  id = p_id
  for update;

  if not found then
    raise exception 'task not found: %', p_id
      using errcode = 'P0002';
  end if;

  -- 2단계: PRD 4.9 — 서버 vs 클라이언트 updated_at 비교
  if v_server_updated_at <> p_client_updated_at then
    v_conflict := true;
  end if;

  -- 3단계: PRD 4.9 — 충돌 여부와 무관하게 항상 저장 (Last-Write-Wins)
  -- CASE WHEN (p_updates ? 'key') 로 미전달 필드는 기존값 유지,
  -- 명시적 null 전달 시에는 null로 갱신
  update tasks
  set
    title       = case when p_updates ? 'title'
                    then (p_updates->>'title')::varchar(100)
                    else title end,
    description = case when p_updates ? 'description'
                    then (p_updates->>'description')::text
                    else description end,
    status      = case when p_updates ? 'status'
                    then (p_updates->>'status')::task_status
                    else status end,
    assignee    = case when p_updates ? 'assignee'
                    then (p_updates->>'assignee')::varchar(30)
                    else assignee end,
    priority    = case when p_updates ? 'priority'
                    then (p_updates->>'priority')::task_priority
                    else priority end,
    due_date    = case when p_updates ? 'due_date'
                    then (p_updates->>'due_date')::date
                    else due_date end,
    category    = case when p_updates ? 'category'
                    then (p_updates->>'category')::text
                    else category end
  where id = p_id
  returning * into v_task;

  -- 4단계: 결과 반환 (task 전체 + conflict 플래그)
  return jsonb_build_object(
    'task',     to_jsonb(v_task),
    'conflict', v_conflict
  );
end;
$$;

-- anon 역할에 RPC 실행 권한 부여
grant execute on function update_task_lww(uuid, timestamptz, jsonb) to anon;
