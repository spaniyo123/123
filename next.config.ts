import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // SSR 유지 (정적 내보내기는 Realtime 동기화와 호환되지 않음)
  // Vercel 서버리스 배포로 최적화됨
}

export default nextConfig
