'use client'

import { useState, useEffect } from 'react'
import type { Task, Comment, TaskStatus, TaskPriority } from '@/types'
import { updateTask, deleteTask, getComments, addComment } from '@/lib/tasks'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSave?: (task: Task) => void
  currentUserName: string
}

const statusOptions: TaskStatus[] = ['todo', 'in-progress', 'done']
const priorityOptions: TaskPriority[] = ['high', 'medium', 'low']

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

export function TaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  currentUserName,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [conflictMessage, setConflictMessage] = useState('')

  // PRD 5.3: Esc 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setAssignee(task.assignee)
      setPriority(task.priority)
      setDueDate(task.due_date ?? '')
      setCategory(task.category ?? '')
      setConflictMessage('')

      // 댓글 로드
      loadComments(task.id)
    } else {
      resetForm()
    }
  }, [task, isOpen])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setAssignee('')
    setPriority('medium')
    setDueDate('')
    setCategory('')
    setComments([])
    setNewComment('')
    setConflictMessage('')
  }

  const loadComments = async (taskId: string) => {
    const { comments: data, error } = await getComments(taskId)
    if (!error) {
      setComments(data)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요')
      return
    }
    if (!assignee.trim()) {
      alert('담당자를 입력해주세요')
      return
    }

    setIsSaving(true)
    setConflictMessage('')

    try {
      if (task) {
        // PRD 4.9: updateTask에 clientUpdatedAt 전달 → 충돌 감지
        const { task: updatedTask, conflict, error } = await updateTask(
          task.id,
          {
            title,
            description: description || null,
            status,
            assignee,
            priority,
            due_date: dueDate || null,
            category: category || null,
          },
          task.updated_at
        )

        if (error) {
          alert(`저장 실패: ${error}`)
        } else if (updatedTask) {
          if (conflict) {
            setConflictMessage('⚠️ 다른 팀원이 방금 이 작업을 수정했습니다. 최신 변경사항이 저장되었습니다.')
          }
          onSave?.(updatedTask)
          setTimeout(() => {
            onClose()
          }, conflict ? 2000 : 500)
        }
      } else {
        // 신규 할일 등록 (4단계에서 별도 모달/폼으로 처리 예정, 여기선 스킵)
        alert('신규 등록은 별도 화면에서 처리됩니다')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return

    setIsSaving(true)
    try {
      const { error } = await deleteTask(task.id)
      if (error) {
        alert(`삭제 실패: ${error}`)
      } else {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return

    setIsSaving(true)
    try {
      const { comment, error } = await addComment({
        task_id: task.id,
        author: currentUserName,
        content: newComment,
      })

      if (error) {
        alert(`댓글 추가 실패: ${error}`)
      } else if (comment) {
        setComments([...comments, comment])
        setNewComment('')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card-lg bg-white shadow-card-active" role="document">
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-gray-900">
            {task ? '작업 상세' : '새 작업'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-brand-violet"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="space-y-6 px-6 py-4">
          {/* 충돌 메시지 */}
          {conflictMessage && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
              {conflictMessage}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!task}
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!task}
                maxLength={2000}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* 상태 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                상태
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={!task}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* 담당자 */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                담당자
              </label>
              <input
                id="assignee"
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={!task}
                maxLength={30}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* 우선순위 */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                우선순위
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={!task}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabels[p]}
                  </option>
                ))}
              </select>
            </div>

            {/* 마감일 */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                마감일
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!task}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!task}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>
          </div>

          {/* 댓글 */}
          {task && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 font-semibold text-gray-900">댓글</h3>

              {/* 댓글 목록 */}
              <div className="mb-4 max-h-40 space-y-3 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500">댓글이 없습니다</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* 댓글 입력 */}
              <div className="space-y-2">
                <label htmlFor="newComment" className="block text-sm font-medium text-gray-700">
                  새 댓글
                </label>
                <div className="flex gap-2">
                  <input
                    id="newComment"
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={1000}
                    placeholder="댓글을 입력하세요..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-violet focus:outline-none focus:ring-2 focus:ring-brand-violet/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddComment()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSaving}
                    className="rounded-lg bg-brand-violet px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300 hover:bg-brand-violet/90 focus-visible:ring-2 focus-visible:ring-brand-violet/20"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {task && (
          <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-brand-violet px-4 py-2 font-medium text-white disabled:bg-gray-300 hover:bg-brand-violet/90 focus-visible:ring-2 focus-visible:ring-brand-violet/20"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-300"
            >
              삭제
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
