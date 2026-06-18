import { supabase } from '@/lib/supabase'
import type {
  Task,
  Comment,
  CreateTaskInput,
  UpdateTaskInput,
  CreateCommentInput,
  TaskFilters,
} from '@/types'

// ===== Tasks — CRUD =====

export async function getTasks(
  filters?: Partial<TaskFilters>
): Promise<{ tasks: Task[]; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('tasks') as any)
    .select('*')
    .order('created_at', { ascending: false })

  // PRD 4.3: 제목·담당자명 텍스트 검색
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,assignee.ilike.%${filters.search}%`
    )
  }

  // PRD 4.3: 상태·우선순위·담당자·카테고리 다중 선택 필터
  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority)
  }
  if (filters?.assignees?.length) {
    query = query.in('assignee', filters.assignees)
  }
  if (filters?.categories?.length) {
    query = query.in('category', filters.categories)
  }

  const { data, error } = await query
  return { tasks: (data as Task[]) ?? [], error: (error as Error | null)?.message ?? null }
}

export async function getTaskById(
  id: string
): Promise<{ task: Task | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tasks') as any)
    .select('*')
    .eq('id', id)
    .single()

  return { task: data as Task | null, error: (error as Error | null)?.message ?? null }
}

export async function createTask(
  input: CreateTaskInput
): Promise<{ task: Task | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tasks') as any)
    .insert(input)
    .select()
    .single()

  return { task: data as Task | null, error: (error as Error | null)?.message ?? null }
}

/**
 * PRD 4.9 Last-Write-Wins 충돌 처리
 *
 * - update_task_lww RPC: 트랜잭션 내 FOR UPDATE 잠금으로 원자적 실행
 * - clientUpdatedAt: 클라이언트 화면에 표시된 레코드의 updated_at
 * - 서버 updated_at과 다르면 conflict=true를 반환하고, 저장은 항상 수행
 * - 호출측: conflict=true 시 "다른 팀원이 방금 수정했습니다" 안내 표시
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  clientUpdatedAt: string
): Promise<{ task: Task | null; conflict: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc('update_task_lww' as string, {
    p_id: id,
    p_client_updated_at: clientUpdatedAt,
    p_updates: input,
  })

  if (error) return { task: null, conflict: false, error: error.message }

  const result = data as { task: Task; conflict: boolean }
  return { task: result.task, conflict: result.conflict, error: null }
}

export async function deleteTask(
  id: string
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any).delete().eq('id', id)
  return { error: (error as Error | null)?.message ?? null }
}

// ===== Comments =====

export async function getComments(
  taskId: string
): Promise<{ comments: Comment[]; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('comments') as any)
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  return {
    comments: (data as Comment[]) ?? [],
    error: (error as Error | null)?.message ?? null,
  }
}

export async function addComment(
  input: CreateCommentInput
): Promise<{ comment: Comment | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('comments') as any)
    .insert(input)
    .select()
    .single()

  return {
    comment: data as Comment | null,
    error: (error as Error | null)?.message ?? null,
  }
}

// ===== Realtime 구독 =====

export type RealtimeTaskPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  task: Task | null
  oldTask: Partial<Task> | null
}

/**
 * PRD 4.9: Supabase Realtime(Postgres Changes)으로 tasks 테이블 변경 구독
 *
 * 반환값: 구독 해제 함수 (컴포넌트 unmount 시 호출)
 *
 * 사용 예:
 *   const unsubscribe = subscribeToTasks(({ eventType, task, oldTask }) => {
 *     if (eventType === 'INSERT') setTasks(prev => [task!, ...prev])
 *     if (eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === task!.id ? task! : t))
 *     if (eventType === 'DELETE') setTasks(prev => prev.filter(t => t.id !== oldTask?.id))
 *   })
 *   return unsubscribe  // useEffect cleanup
 */
export function subscribeToTasks(
  callback: (payload: RealtimeTaskPayload) => void
): () => void {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        const newRow = payload.new as Record<string, unknown>
        const oldRow = payload.old as Record<string, unknown>
        callback({
          eventType: payload.eventType as RealtimeTaskPayload['eventType'],
          task: Object.keys(newRow).length > 0 ? (newRow as unknown as Task) : null,
          oldTask: Object.keys(oldRow).length > 0 ? (oldRow as unknown as Partial<Task>) : null,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
