import type { TaskStatus } from '@/types'

interface StatusConfig {
  label: string
  className: string
}

const statusConfig: Record<TaskStatus, StatusConfig> = {
  todo: {
    label: '대기',
    className: 'bg-status-todo-bg text-status-todo',
  },
  'in-progress': {
    label: '진행중',
    className: 'bg-status-in-progress-bg text-status-in-progress',
  },
  done: {
    label: '완료',
    className: 'bg-status-done-bg text-status-done',
  },
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
