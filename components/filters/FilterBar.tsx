'use client'

import { useFilters } from '@/lib/filter-context'
import { useState } from 'react'
import type { TaskStatus, TaskPriority } from '@/types'

interface FilterBarProps {
  availableAssignees: string[]
  availableCategories: string[]
}

const statuses: TaskStatus[] = ['todo', 'in-progress', 'done']
const priorities: TaskPriority[] = ['high', 'medium', 'low']

const statusLabels: Record<TaskStatus, string> = {
  todo: '대기',
  'in-progress': '진행중',
  done: '완료',
}

const priorityLabels: Record<TaskPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export function FilterBar({
  availableAssignees,
  availableCategories,
}: FilterBarProps) {
  const { filters, setSearch, setStatusFilter, setPriorityFilter, setAssigneeFilter, setCategoryFilter, resetFilters } = useFilters()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-4 rounded-card bg-white p-4 shadow-card">
      {/* 검색 */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          검색
        </label>
        <input
          id="search"
          type="text"
          placeholder="제목 또는 담당자명..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
        />
      </div>

      {/* 필터 토글 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-brand-violet"
        >
          필터 {filters.status.length + filters.priority.length + filters.assignees.length + filters.categories.length > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-violet text-xs font-bold text-white">
              {filters.status.length + filters.priority.length + filters.assignees.length + filters.categories.length}
            </span>
          )}
        </button>
        {(filters.search || filters.status.length || filters.priority.length || filters.assignees.length || filters.categories.length) && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-900 focus-visible:ring-brand-violet"
          >
            초기화
          </button>
        )}
      </div>

      {/* 필터 패널 */}
      {isOpen && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          {/* 상태 - PRD 5.3: 명시적 라벨 연결 */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700">상태</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {statuses.map((status) => (
                <div key={status} className="flex items-center">
                  <input
                    id={`status-${status}`}
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      const newStatuses = e.target.checked
                        ? [...filters.status, status]
                        : filters.status.filter((s) => s !== status)
                      setStatusFilter(newStatuses)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                  />
                  <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-600 cursor-pointer">
                    {statusLabels[status]}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* 우선순위 - PRD 5.3: 명시적 라벨 연결 */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700">우선순위</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {priorities.map((priority) => (
                <div key={priority} className="flex items-center">
                  <input
                    id={`priority-${priority}`}
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={(e) => {
                      const newPriorities = e.target.checked
                        ? [...filters.priority, priority]
                        : filters.priority.filter((p) => p !== priority)
                      setPriorityFilter(newPriorities)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                  />
                  <label htmlFor={`priority-${priority}`} className="ml-2 text-sm text-gray-600 cursor-pointer">
                    {priorityLabels[priority]}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* 담당자 - PRD 5.3: 명시적 라벨 연결 */}
          {availableAssignees.length > 0 && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">담당자</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableAssignees.map((assignee) => (
                  <div key={assignee} className="flex items-center">
                    <input
                      id={`assignee-${assignee}`}
                      type="checkbox"
                      checked={filters.assignees.includes(assignee)}
                      onChange={(e) => {
                        const newAssignees = e.target.checked
                          ? [...filters.assignees, assignee]
                          : filters.assignees.filter((a) => a !== assignee)
                        setAssigneeFilter(newAssignees)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                    />
                    <label htmlFor={`assignee-${assignee}`} className="ml-2 text-sm text-gray-600 cursor-pointer">
                      {assignee}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {/* 카테고리 - PRD 5.3: 명시적 라벨 연결 */}
          {availableCategories.length > 0 && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">카테고리</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      id={`category-${category}`}
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.categories, category]
                          : filters.categories.filter((c) => c !== category)
                        setCategoryFilter(newCategories)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-2 focus:ring-brand-violet/20"
                    />
                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-600 cursor-pointer">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  )
}
