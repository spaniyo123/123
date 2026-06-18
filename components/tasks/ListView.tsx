'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/types'
import { getTasks, subscribeToTasks } from '@/lib/tasks'
import { useFilters } from '@/lib/filter-context'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { getUrgency } from '@/lib/urgency'
import { TaskModal } from './TaskModal'

interface ListViewProps {
  userName: string
}

type SortColumn = 'title' | 'assignee' | 'priority' | 'due_date' | 'created_at'
type SortOrder = 'asc' | 'desc'

export function ListView({ userName }: ListViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
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

  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal: string | number | null = null
    let bVal: string | number | null = null

    if (sortColumn === 'title') {
      aVal = a.title
      bVal = b.title
    } else if (sortColumn === 'assignee') {
      aVal = a.assignee
      bVal = b.assignee
    } else if (sortColumn === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      aVal = priorityOrder[a.priority]
      bVal = priorityOrder[b.priority]
    } else if (sortColumn === 'due_date') {
      aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity
      bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity
    } else if (sortColumn === 'created_at') {
      aVal = new Date(a.created_at).getTime()
      bVal = new Date(b.created_at).getTime()
    }

    if (aVal === null || bVal === null) return 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('desc')
    }
  }

  const SortHeader = ({ column, label }: { column: SortColumn; label: string }) => (
    <button
      onClick={() => toggleSort(column)}
      className="flex items-center gap-1 font-medium text-gray-900 hover:text-brand-violet focus-visible:ring-2 focus-visible:ring-brand-violet/20"
    >
      {label}
      {sortColumn === column && (
        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-card shadow-card">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <SortHeader column="title" label="제목" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <SortHeader column="assignee" label="담당자" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <SortHeader column="priority" label="우선순위" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                <SortHeader column="due_date" label="마감일" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="line-clamp-1 font-medium text-gray-900">
                    {task.title}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {task.assignee}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <PriorityBadge priority={task.priority} />
                    <UrgencyBadge urgency={getUrgency(task)} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString('ko-KR')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onSave={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          )
        }}
        currentUserName={userName}
      />
    </>
  )
}
