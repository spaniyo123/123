'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/board', label: '칸반보드' },
  { href: '/list', label: '리스트' },
  { href: '/calendar', label: '캘린더' },
  { href: '/dashboard', label: '대시보드' },
]

export function Header({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <header className="bg-brand-gradient text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/board"
            className="text-xl font-bold tracking-tight focus-visible:ring-white"
          >
            팀 할일 관리
          </Link>

          <nav className="flex items-center gap-1" aria-label="주 메뉴">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:ring-white ${
                  pathname === href
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>

          {userName && (
            <div className="text-sm text-white/90">
              <span className="font-medium">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
