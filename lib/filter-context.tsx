'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react'
import type { TaskFilters, TaskStatus, TaskPriority } from '@/types'
import { useSearchParams, useRouter } from 'next/navigation'

interface FilterContextType {
  filters: TaskFilters
  setSearch: (search: string) => void
  setStatusFilter: (statuses: TaskStatus[]) => void
  setPriorityFilter: (priorities: TaskPriority[]) => void
  setAssigneeFilter: (assignees: string[]) => void
  setCategoryFilter: (categories: string[]) => void
  resetFilters: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const defaultFilters: TaskFilters = {
  search: '',
  status: [],
  priority: [],
  assignees: [],
  categories: [],
}

/**
 * PRD 4.3: 검색·필터 상태를 URL 쿼리로 관리
 * 뷰 전환 시에도 조건이 유지되고, 북마크·공유 가능
 */
export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters)
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL에서 쿼리 파라미터 읽어 필터 상태 초기화
  useEffect(() => {
    const newFilters = { ...defaultFilters }

    const search = searchParams.get('search')
    if (search) newFilters.search = decodeURIComponent(search)

    const status = searchParams.get('status')
    if (status) newFilters.status = status.split(',') as TaskStatus[]

    const priority = searchParams.get('priority')
    if (priority) newFilters.priority = priority.split(',') as TaskPriority[]

    const assignees = searchParams.get('assignees')
    if (assignees) newFilters.assignees = assignees.split(',')

    const categories = searchParams.get('categories')
    if (categories) newFilters.categories = categories.split(',')

    setFilters(newFilters)
  }, [searchParams])

  // 필터 변경 → URL 업데이트
  const updateUrl = useCallback((newFilters: TaskFilters) => {
    const params = new URLSearchParams()
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.status.length) params.set('status', newFilters.status.join(','))
    if (newFilters.priority.length) params.set('priority', newFilters.priority.join(','))
    if (newFilters.assignees.length) params.set('assignees', newFilters.assignees.join(','))
    if (newFilters.categories.length) params.set('categories', newFilters.categories.join(','))

    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : window.location.pathname, {
      scroll: false,
    })
  }, [router])

  const setSearch = useCallback((search: string) => {
    const newFilters = { ...filters, search }
    setFilters(newFilters)
    updateUrl(newFilters)
  }, [filters, updateUrl])

  const setStatusFilter = useCallback((statuses: TaskStatus[]) => {
    const newFilters = { ...filters, status: statuses }
    setFilters(newFilters)
    updateUrl(newFilters)
  }, [filters, updateUrl])

  const setPriorityFilter = useCallback((priorities: TaskPriority[]) => {
    const newFilters = { ...filters, priority: priorities }
    setFilters(newFilters)
    updateUrl(newFilters)
  }, [filters, updateUrl])

  const setAssigneeFilter = useCallback((assignees: string[]) => {
    const newFilters = { ...filters, assignees }
    setFilters(newFilters)
    updateUrl(newFilters)
  }, [filters, updateUrl])

  const setCategoryFilter = useCallback((categories: string[]) => {
    const newFilters = { ...filters, categories }
    setFilters(newFilters)
    updateUrl(newFilters)
  }, [filters, updateUrl])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    router.push(window.location.pathname, { scroll: false })
  }, [router])

  return (
    <FilterContext.Provider
      value={{
        filters,
        setSearch,
        setStatusFilter,
        setPriorityFilter,
        setAssigneeFilter,
        setCategoryFilter,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider')
  }
  return context
}
