import type { UrgencyLevel } from '@/types'

interface UrgencyConfig {
  label: string
  className: string
}

const urgencyConfig: Record<NonNullable<UrgencyLevel>, UrgencyConfig> = {
  imminent: {
    label: '마감 임박',
    className: 'bg-urgency-imminent-bg text-urgency-imminent',
  },
  overdue: {
    label: '지연',
    className: 'bg-urgency-overdue-bg text-urgency-overdue',
  },
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  if (!urgency) return null
  const config = urgencyConfig[urgency]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
