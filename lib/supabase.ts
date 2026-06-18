import { createClient } from '@supabase/supabase-js'
import type { Task, Comment } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 타입 안전성은 lib/tasks.ts의 함수 시그니처로 보장.
// Supabase 스키마 타입은 아래 DatabaseSchema로 문서화.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** DB 스키마 참조용 타입 (createClient 제네릭으로 사용 시 Supabase 내부 타입과 충돌 방지를 위해 별도 정의) */
export type DatabaseSchema = {
  tasks: {
    Row: Task
    Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Omit<Task, 'id' | 'created_at'>>
  }
  comments: {
    Row: Comment
    Insert: Omit<Comment, 'id' | 'created_at'>
  }
}
