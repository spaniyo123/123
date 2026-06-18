'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/types'
import { getTasks, subscribeToTasks } from '@/lib/tasks'
import { useFilters } from '@/lib/filter-context'
import { getUrgency } from '@/lib/urgency'

/**
 * PRD 4.5: 통계 지표
 * - 상태별 카운트
 * - 완료율
 * - 담당자별 부하 (미완료 건수)
 * - 마감 임박/지연 건수
 */
export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { filters } = useFilters()

  useEffect(() => {
    const loadTasks = async () => {
      const { tasks: data } = await getTasks(filters)
      setTasks(data)
      setIsLoading(false)
    }

    loadTasks()

    const unsubscribe = subscribeToTasks(({ eventType, task, oldTask }) => {
      setTasks((prev) => {
        if (eventType === 'INSERT' && task) {
          return [task, ...prev]
        }
        if (eventType === 'UPDATE' && task) {
          return prev.map((t) => (t.id === task.id ? task : t))
        }
        if (eventType === 'DELETE' && oldTask) {
          return prev.filter((t) => t.id !== oldTask.id)
        }
        return prev
      })
    })

    return unsubscribe
  }, [filters])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  // 상태별 카운트
  const statusStats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  // 완료율
  const completionRate =
    tasks.length > 0 ? Math.round((statusStats.done / tasks.length) * 100) : 0

  // 담당자별 부하 (미완료 건수)
  const assigneeWorkload = tasks
    .filter((t) => t.status !== 'done')
    .reduce(
      (acc, task) => {
        acc[task.assignee] = (acc[task.assignee] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

  const sortedAssignees = Object.entries(assigneeWorkload)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // 상위 5명

  // 마감 임박/지연 건수
  const urgentStats = {
    imminent: tasks.filter((t) => getUrgency(t) === 'imminent').length,
    overdue: tasks.filter((t) => getUrgency(t) === 'overdue').length,
  }

  // 진행률 차트 (간단한 바 차트)
  const maxWorkload = Math.max(...Object.values(assigneeWorkload), 1)

  return (
    <div className="space-y-6">
      {/* PRD 5.1: 상태별 카운트 카드 - 모바일 1열, 태블릿 2열, 데스크탑 3열 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">대기</p>
              <p className="text-3xl font-bold text-gray-900">
                {statusStats.todo}
              </p>
            </div>
            <div className="text-4xl text-status-todo opacity-20">📋</div>
          </div>
        </div>

        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">진행 중</p>
              <p className="text-3xl font-bold text-gray-900">
                {statusStats['in-progress']}
              </p>
            </div>
            <div className="text-4xl text-status-in-progress opacity-20">⚙️</div>
          </div>
        </div>

        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료</p>
              <p className="text-3xl font-bold text-status-done">
                {statusStats.done}
              </p>
            </div>
            <div className="text-4xl text-status-done opacity-20">✓</div>
          </div>
        </div>
      </div>

      {/* PRD 5.1: 완료율·마감상태 - 모바일 1열, 데스크탑 2열 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 완료율 */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-900">전체 완료율</h3>
          <div className="flex items-end gap-4">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 120 120">
                {/* 배경 원 */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* 진행률 원 */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${(completionRate / 100) * (2 * Math.PI * 54)} ${
                    2 * Math.PI * 54
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900">
                  {completionRate}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                완료: <span className="font-semibold">{statusStats.done}</span>
              </p>
              <p className="text-sm text-gray-600">
                전체: <span className="font-semibold">{tasks.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 마감 상태 */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-900">마감 상태</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">마감 임박 (3일 이내)</span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-urgency-imminent-bg text-xs font-bold text-urgency-imminent">
                  {urgentStats.imminent}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-urgency-imminent"
                  style={{
                    width: `${Math.min((urgentStats.imminent / (tasks.length || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">지연</span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-urgency-overdue-bg text-xs font-bold text-urgency-overdue">
                  {urgentStats.overdue}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-urgency-overdue"
                  style={{
                    width: `${Math.min((urgentStats.overdue / (tasks.length || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 담당자별 부하 */}
      {sortedAssignees.length > 0 && (
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="mb-4 font-semibold text-gray-900">
            담당자별 미완료 업무 (상위 5명)
          </h3>
          <div className="space-y-4">
            {sortedAssignees.map(([assignee, count]) => (
              <div key={assignee}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{assignee}</span>
                  <span className="text-xs font-semibold text-gray-600">{count}건</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-brand-violet"
                    style={{
                      width: `${(count / maxWorkload) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
