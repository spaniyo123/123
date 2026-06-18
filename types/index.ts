export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type UrgencyLevel = 'imminent' | 'overdue' | null

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  assignee: string
  priority: TaskPriority
  due_date?: string | null
  category?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  task_id: string
  author: string
  content: string
  created_at: string
}

export interface TaskFilters {
  search: string
  status: TaskStatus[]
  priority: TaskPriority[]
  assignees: string[]
  categories: string[]
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  status?: TaskStatus
  assignee: string
  priority?: TaskPriority
  due_date?: string | null
  category?: string | null
  created_by: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  assignee?: string
  priority?: TaskPriority
  due_date?: string | null
  category?: string | null
}

export interface CreateCommentInput {
  task_id: string
  author: string
  content: string
}
