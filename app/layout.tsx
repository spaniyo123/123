import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { FilterProvider } from '@/lib/filter-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '부서 공용 할일 관리',
  description: '부서원 전체가 함께 사용하는 할일 관리 앱',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <FilterProvider>{children}</FilterProvider>
        </Suspense>
      </body>
    </html>
  )
}
