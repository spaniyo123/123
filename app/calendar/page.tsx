'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { FilterBar } from '@/components/filters/FilterBar'
import { CalendarView } from '@/components/tasks/CalendarView'
import { getTasks } from '@/lib/tasks'

export default function CalendarPage() {
  const [userName, setUserName] = useState('')
  const [allAssignees, setAllAssignees] = useState<string[]>([])
  const [allCategories, setAllCategories] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('userName')
    if (saved) {
      setUserName(saved)
    }

    const loadMetadata = async () => {
      const { tasks } = await getTasks()
      const assignees = Array.from(new Set(tasks.map((t) => t.assignee)))
      const categories = Array.from(
        new Set(tasks.filter((t) => t.category).map((t) => t.category))
      )
      setAllAssignees(assignees)
      setAllCategories(categories as string[])
    }

    loadMetadata()
  }, [])

  if (!userName) {
    return <div className="flex h-screen items-center justify-center">이름을 입력해주세요</div>
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header userName={userName} />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">캘린더</h1>
            <p className="mt-1 text-sm text-gray-600">
              마감일 기준으로 할일을 확인하세요. 날짜를 클릭하면 해당일 작업을 볼 수 있습니다.
            </p>
          </div>

          <FilterBar
            availableAssignees={allAssignees}
            availableCategories={allCategories}
          />

          <CalendarView userName={userName} />
        </div>
      </div>
    </div>
  )
}
