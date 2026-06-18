'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { FilterBar } from '@/components/filters/FilterBar'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { getTasks } from '@/lib/tasks'

export default function BoardPage() {
  const [userName, setUserName] = useState('')
  const [allAssignees, setAllAssignees] = useState<string[]>([])
  const [allCategories, setAllCategories] = useState<string[]>([])

  useEffect(() => {
    // 저장된 이름 불러오기 (localStorage)
    const saved = localStorage.getItem('userName')
    if (saved) {
      setUserName(saved)
    }

    // 전체 담당자·카테고리 목록 조회
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
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-card-lg bg-white p-8 shadow-card-active">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">팀 할일 관리</h1>
          <p className="mb-6 text-sm text-gray-600">
            부서원 전체가 함께 사용하는 할일 관리 앱입니다.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input = (e.currentTarget.elements[0] as HTMLInputElement).value.trim()
              if (input) {
                localStorage.setItem('userName', input)
                setUserName(input)
              }
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름을 입력하세요
              </label>
              <input
                id="name"
                type="text"
                maxLength={30}
                placeholder="예: 김철수"
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
              <p className="font-medium">⚠️ 중요 안내</p>
              <p className="mt-1">
                별도의 로그인이 없으므로, 동명이인이나 사칭을 기술적으로 막을 수 없습니다.
                부서 내부 신뢰 환경을 전제로 운영됩니다.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-brand-gradient py-2 font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white"
            >
              시작
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header userName={userName} />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">칸반보드</h1>
            <p className="mt-1 text-sm text-gray-600">
              상태별로 할일을 관리하세요. 카드를 드래그해서 상태를 변경할 수 있습니다.
            </p>
          </div>

          <FilterBar
            availableAssignees={allAssignees}
            availableCategories={allCategories}
          />

          <KanbanBoard userName={userName} />
        </div>
      </div>
    </div>
  )
}
