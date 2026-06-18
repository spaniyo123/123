'use client'

import { useState, useEffect } from 'react'
import type { Task, TaskStatus } from '@/types'
import { getTasks, subscribeToTasks, updateTask } from '@/lib/tasks'
import { useFilters } from '@/lib/filter-context'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { getUrgency } from '@/lib/urgency'
import { TaskModal } from './TaskModal'

interface KanbanBoardProps {
  userName: string
}

const columns: TaskStatus[] = ['todo', 'in-progress', 'done']
const columnLabels: Record<TaskStatus, string> = {
  todo: '대기',
  'in-progress': '진행중',
  done: '완료',
}

export function KanbanBoard({ userName }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { filters } = useFilters()

  // 초기 로드 및 실시간 구독
  useEffect(() => {
    const loadTasks = async () => {
      const { tasks: data } = await getTasks(filters)
      setTasks(data)
      setIsLoading(false)
    }

    loadTasks()

    // PRD 4.9: Realtime 구독
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

  const tasksByStatus = columns.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasks.find((t) => t.id === taskId)

    if (!task || task.status === targetStatus) return

    // 상태 변경 → updateTask 호출
    const { error } = await updateTask(
      task.id,
      { status: targetStatus },
      task.updated_at
    )

    if (error) {
      alert(`상태 변경 실패: ${error}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      {/* PRD 5.1: 모바일에서 가로 스크롤, 데스크탑에서 자동 넓이 */}
      <div className="overflow-x-auto rounded-card shadow-card">
        <div className="inline-flex gap-6 p-4 md:flex md:gap-6 md:p-0">
          {columns.map((status) => (
            <div
              key={status}
              className="min-w-80 flex-shrink-0 rounded-card bg-gray-50 p-4 md:min-w-fit md:w-96"
            >
              {/* 컬럼 헤더 */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {columnLabels[status]}
                </h2>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700">
                  {tasksByStatus[status].length}
                </span>
              </div>

              {/* 드롭 영역 - 키보드 접근성: tabindex 추가 */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="space-y-3 rounded-lg bg-white p-3 min-h-96 focus:ring-2 focus:ring-brand-violet focus:outline-none"
                role="region"
                aria-label={`${columnLabels[status]} 컬럼`}
              >
                {tasksByStatus[status].map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-move rounded-card bg-white p-3 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <PriorityBadge priority={task.priority} />
                      <UrgencyBadge urgency={getUrgency(task)} />
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      담당: {task.assignee}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500">
                        마감: {new Date(task.due_date).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
