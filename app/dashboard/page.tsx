'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { FilterBar } from '@/components/filters/FilterBar'
import { Dashboard } from '@/components/tasks/Dashboard'
import { getTasks } from '@/lib/tasks'

export default function DashboardPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="mt-1 text-sm text-gray-600">
              팀의 전체 진행 상황을 한눈에 파악하세요.
            </p>
          </div>

          <FilterBar
            availableAssignees={allAssignees}
            availableCategories={allCategories}
          />

          <Dashboard />
        </div>
      </div>
    </div>
  )
}
