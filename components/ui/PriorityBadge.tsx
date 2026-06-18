import type { TaskPriority } from '@/types'

interface PriorityConfig {
  label: string
  className: string
}

const priorityConfig: Record<TaskPriority, PriorityConfig> = {
  high: {
    label: '높음',
    className: 'bg-priority-high-bg text-priority-high',
  },
  medium: {
    label: '보통',
    className: 'bg-priority-medium-bg text-priority-medium',
  },
  low: {
    label: '낮음',
    className: 'bg-priority-low-bg text-priority-low',
  },
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
