'use client'

import { useState, useEffect } from 'react'
import type { Task } from '@/types'
import { getTasks, subscribeToTasks } from '@/lib/tasks'
import { useFilters } from '@/lib/filter-context'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { TaskModal } from './TaskModal'

interface CalendarViewProps {
  userName: string
}

export function CalendarView({ userName }: CalendarViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const tasksByDate = tasks.reduce(
    (acc, task) => {
      if (task.due_date) {
        if (!acc[task.due_date]) acc[task.due_date] = []
        acc[task.due_date].push(task)
      }
      return acc
    },
    {} as Record<string, Task[]>
  )

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const tasksForSelectedDate = selectedDate ? tasksByDate[selectedDate] ?? [] : []

  const monthLabel = currentMonth.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      {/* PRD 5.1: 캘린더·작업 목록 - 모바일 스택, 데스크탑 3열 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 캘린더 */}
        <div className="lg:col-span-2 rounded-card bg-white p-6 shadow-card">
          {/* 월 네비게이션 */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-violet/20"
              >
                ← 이전
              </button>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-violet/20"
              >
                다음 →
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dateStr = `${currentMonth.getFullYear()}-${String(
                currentMonth.getMonth() + 1
              ).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayTasks = tasksByDate[dateStr] ?? []
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`aspect-square rounded-lg p-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-brand-violet text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  } focus-visible:ring-2 focus-visible:ring-brand-violet/20`}
                >
                  <div>{day}</div>
                  {dayTasks.length > 0 && (
                    <div className={`mt-1 text-xs ${isSelected ? 'text-white/80' : 'text-brand-violet font-bold'}`}>
                      +{dayTasks.length}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 선택된 날짜의 작업 */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <h3 className="mb-4 font-bold text-gray-900">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString('ko-KR')
              : '날짜를 선택하세요'}
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tasksForSelectedDate.length === 0 ? (
              <p className="text-sm text-gray-500">
                {selectedDate ? '이 날짜에 작업이 없습니다' : ''}
              </p>
            ) : (
              tasksForSelectedDate.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="cursor-pointer rounded-lg bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                >
                  <p className="line-clamp-2 text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">{task.assignee}</p>
                </div>
              ))
            )}
          </div>
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
