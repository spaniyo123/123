# 부서 공용 할일 관리 앱

부서원 전체가 공용으로 사용하는 웹 기반 할일 관리 앱입니다.  
로그인 없이 이름만 입력하면 즉시 사용 가능하며, 칸반보드·리스트·캘린더·대시보드 4가지 뷰를 제공합니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v3 |
| 데이터베이스 | Supabase (PostgreSQL) |
| 실시간 동기화 | Supabase Realtime |

## 로컬 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env.local`을 만들고, Supabase 프로젝트 값으로 교체하세요.

```bash
cp .env.example .env.local
```

`.env.local` 파일에 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Supabase 대시보드 → Project Settings → API** 에서 URL과 anon key를 확인하세요.

### 3. 데이터베이스 마이그레이션

Supabase SQL 에디터에서 `supabase/migrations/` 폴더의 SQL 파일을 순서대로 실행하세요. (2단계 완료 후 생성됩니다)

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 환경변수

| 변수명 | 설명 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 anon key | ✅ |

## 폴더 구조

```
c:\_vibe2/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 진입점 → /board 리다이렉트
│   ├── board/page.tsx          # 칸반보드 뷰
│   ├── list/page.tsx           # 리스트 뷰
│   ├── calendar/page.tsx       # 캘린더 뷰
│   └── dashboard/page.tsx      # 대시보드 뷰
├── components/
│   ├── ui/                     # 재사용 UI 요소
│   │   ├── StatusBadge.tsx     # 상태 배지 (todo/in-progress/done)
│   │   ├── PriorityBadge.tsx   # 우선순위 배지 (high/medium/low)
│   │   └── UrgencyBadge.tsx    # 마감 임박/지연 배지
│   ├── layout/
│   │   └── Header.tsx          # 공통 헤더 + 네비게이션
│   ├── tasks/                  # 할일 관련 컴포넌트 (4단계)
│   └── filters/                # 검색/필터 컴포넌트 (3단계)
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트
│   └── urgency.ts              # 마감 임박/지연 판정 유틸
├── types/
│   └── index.ts                # Task, Comment, 공통 타입
├── supabase/
│   └── migrations/             # DB 마이그레이션 SQL (2단계)
├── .env.local                  # 환경변수 (git 제외)
├── .env.example                # 환경변수 예시
├── tailwind.config.ts          # Tailwind 디자인 토큰
└── prd.md                      # 개발 지시 프롬프트
```

## 주요 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## Vercel 배포

### 1단계: Vercel 계정 & GitHub 연결

1. [Vercel](https://vercel.com)에서 계정 생성
2. GitHub 계정과 연결 (`vercel.json`이 이미 프로젝트에 있음)

### 2단계: GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit: 부서 공용 할일 관리 앱"
git branch -M main
git remote add origin https://github.com/your-org/your-repo.git
git push -u origin main
```

### 3단계: Vercel에서 배포

1. Vercel 대시보드 → "Add New Project"
2. GitHub 저장소 선택
3. **환경 변수 설정**:
   - `NEXT_PUBLIC_SUPABASE_URL` → 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Anon Key

```
Supabase 프로젝트 → Settings → API → 값 복사 후 Vercel에 입력
```

4. "Deploy" 클릭

### 4단계: Supabase 환경변수 Vercel에 설정

Vercel Dashboard → Project Settings → Environment Variables

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxxxxxxxxx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**프로덕션, 프리뷰, 개발 환경 모두 체크** ✓

### 5단계: 배포 완료

```
Vercel 대시보드에서 도메인 확인
예: https://your-app.vercel.app
```

### Supabase RLS 활성화 확인

배포 후 다음을 확인하세요:

```sql
-- Supabase SQL 에디터에서 실행
select * from pg_roles where rolname = 'anon';
select tablename from pg_tables where schemaname = 'public';

-- 각 테이블에 RLS 정책이 적용되어 있는지 확인
select * from pg_policies where tablename = 'tasks';
```

### 트러블슈팅

| 문제 | 해결책 |
|---|---|
| 빌드 실패 (TypeScript) | `npm run build` 로컬 실행 후 에러 메시지 확인 |
| Supabase 연결 실패 | `.env.local` 환경변수 Vercel에 다시 설정 |
| 데이터 로드 안됨 | Supabase RLS 정책 활성화 여부 확인 |
| 실시간 업데이트 안됨 | Supabase Realtime 활성화 확인 (Project Settings → Realtime) |
