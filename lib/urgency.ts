import type { Task, UrgencyLevel } from '@/types'

const IMMINENT_DAYS = 3

export function getUrgency(task: Task): UrgencyLevel {
  if (task.status === 'done') return null
  if (!task.due_date) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const due = new Date(task.due_date)
  due.setHours(0, 0, 0, 0)

  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays <= IMMINENT_DAYS) return 'imminent'
  return null
}
