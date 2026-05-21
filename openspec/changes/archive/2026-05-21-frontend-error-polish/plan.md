# frontend-error-polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the P0 CaptureContext bug that breaks OCR→Solve navigation, upgrade S-10 error states to 3 semantically distinct variants, and ship the S-12 one-time onboarding overlay.

**Architecture:** The CaptureContext fix is a one-line removal from `(main)/layout.tsx`. Error state upgrades are inline code-dispatch blocks inside the two existing page files — no shared component. Onboarding is a custom full-screen overlay driven by a `useOnboarding()` hook that owns localStorage, mounted in root layout so it intercepts any entry route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Vitest + happy-dom, pnpm

---

### Task 1: Fix CaptureContext Double-Nesting

**Files:**
- Modify: `src/client/app/(main)/layout.tsx`

**Background:** `app/(main)/layout.tsx` wraps its subtree with a second `<CaptureProvider>`. This creates a separate React state tree from the root layout's provider. `solve/page.tsx` lives outside `(main)`, so it reads from the root provider (which never has `ocrLatex` set). Result: every OCR→Solve navigation immediately redirects back to `/camera`.

- [ ] **Step 1: Read the current file**

  Read `src/client/app/(main)/layout.tsx`. Confirm it imports `CaptureProvider` and wraps children in `<CaptureProvider>`.

- [ ] **Step 2: Remove the duplicate CaptureProvider**

  Replace the file content with:

  ```tsx
  import type { ReactNode } from 'react'
  import BottomNav from '@/components/BottomNav'
  import { NavSpacer } from '@/components/NavSpacer'

  export default function MainLayout({ children }: { children: ReactNode }) {
    return (
      <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
        <main className="flex-1">{children}</main>
        <NavSpacer />
        <BottomNav />
      </div>
    )
  }
  ```

- [ ] **Step 3: Verify root layout still has CaptureProvider**

  Read `src/client/app/layout.tsx`. Confirm `CaptureProvider` is imported and wraps `{children}` inside the `<body>`. No change needed — just verify it's there.

- [ ] **Step 4: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/client/app/(main)/layout.tsx
  git commit -m "fix(client): remove duplicate CaptureProvider from main layout

  solve/page.tsx is outside (main) route group and reads from root layout's
  CaptureProvider instance. The inner provider in (main)/layout.tsx created a
  split state tree, causing ocrLatex to always be null in solve page."
  ```

---

### Task 2: S-10 OCR Error State — Code Dispatch

**Files:**
- Modify: `src/client/app/(main)/ocr/page.tsx`
- Modify: `src/client/app/(main)/ocr/page.test.tsx`

**Background:** The current error state shows a hardcoded generic message and a single "Chụp lại" button regardless of error code. We need to dispatch on `ApiError.code` to show appropriate messages and CTAs.

- [ ] **Step 1: Read the current OCR page**

  Read `src/client/app/(main)/ocr/page.tsx`. Note the current `OcrState` type, state declarations, and the `catch` block in the effect.

- [ ] **Step 2: Add errorInfo state and update the catch block**

  In `ocr/page.tsx`, change the state declarations and effect catch handler. Replace:

  ```tsx
  type OcrState = 'ocr-loading' | 'confirm' | 'error'
  ```

  With:

  ```tsx
  type OcrState = 'ocr-loading' | 'confirm' | 'error'

  interface OcrErrorInfo {
    code: string
    message: string
    retryable: boolean
  }
  ```

  Add after the existing `useState` declarations:

  ```tsx
  const [errorInfo, setErrorInfo] = useState<OcrErrorInfo | null>(null)
  ```

  Replace the `.catch` block inside the `useEffect` (the `postOcr` call):

  ```tsx
  .catch((err: unknown) => {
    const info: OcrErrorInfo = err instanceof ApiError
      ? { code: err.code, message: err.message, retryable: err.retryable }
      : { code: 'UNKNOWN', message: 'Có lỗi xảy ra. Vui lòng thử lại.', retryable: false }
    setErrorInfo(info)
    setState('error')
  })
  ```

- [ ] **Step 3: Extract the postOcr call into a named function for retry support**

  Wrap the postOcr invocation into a named function `runOcr` so the "Thử lại" button can call it:

  ```tsx
  const runOcr = useCallback(() => {
    if (!croppedBlob || !deviceId) return
    setState('ocr-loading')
    setErrorInfo(null)
    postOcr(croppedBlob, deviceId)
      .then(res => {
        const formula = res.formulas[0]
        if (!formula) {
          setErrorInfo({ code: 'OCR_NO_FORMULA', message: 'Không nhận diện được công thức trong ảnh.', retryable: false })
          setState('error')
          return
        }
        setEditedLatex(formula.latex)
        setConfidence(formula.confidence)
        setState('confirm')
      })
      .catch((err: unknown) => {
        const info: OcrErrorInfo = err instanceof ApiError
          ? { code: err.code, message: err.message, retryable: err.retryable }
          : { code: 'UNKNOWN', message: 'Có lỗi xảy ra. Vui lòng thử lại.', retryable: false }
        setErrorInfo(info)
        setState('error')
      })
  }, [croppedBlob, deviceId])
  ```

  Add `useCallback` to the imports: `import { useState, useEffect, useMemo, useCallback } from 'react'`

  Update the `useEffect` to call `runOcr()`:

  ```tsx
  useEffect(() => {
    if (!croppedBlob) { router.push('/camera'); return }
    if (!deviceId) return
    runOcr()
  }, [croppedBlob, deviceId, runOcr])
  ```

- [ ] **Step 4: Replace the static error JSX with code-dispatch**

  Replace the `{state === 'error' && ( ... )}` block with:

  ```tsx
  {state === 'error' && errorInfo && (
    <div className="flex flex-col items-center gap-4 pt-12">
      <p className="text-center text-[15px] text-[#333]">{errorInfo.message}</p>
      {errorInfo.retryable ? (
        <button
          onClick={runOcr}
          className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
        >
          Thử lại
        </button>
      ) : (
        <button
          onClick={() => { reset(); router.push('/camera') }}
          className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
        >
          Chụp lại
        </button>
      )}
    </div>
  )}
  ```

  This handles all cases correctly:
  - `OCR_NO_FORMULA` / `INVALID_IMAGE`: `retryable=false` → "Chụp lại"
  - `RATE_LIMITED` burst (`retryable=true`) → "Thử lại"
  - `RATE_LIMITED` daily (`retryable=false`) → "Chụp lại"
  - fallback: `retryable=false` → "Chụp lại"

- [ ] **Step 5: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

- [ ] **Step 6: Read the existing test file**

  Read `src/client/app/(main)/ocr/page.test.tsx` to understand current mock setup (ApiError mocking, CaptureContext mock, etc.).

- [ ] **Step 7: Add new test cases for error variants**

  Add the following test cases to `ocr/page.test.tsx`. Add them after existing error test cases:

  ```tsx
  it('shows Thử lại button for RATE_LIMITED burst (retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('RATE_LIMITED', 'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.', true), { name: 'ApiError' })
    )
    render(<OcrPage />)
    expect(await screen.findByText('Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chụp lại' })).not.toBeInTheDocument()
  })

  it('shows Chụp lại button for RATE_LIMITED daily (non-retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('RATE_LIMITED', 'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.', false), { name: 'ApiError' })
    )
    render(<OcrPage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chụp lại' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
  })

  it('shows Chụp lại for INVALID_IMAGE (non-retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('INVALID_IMAGE', 'File exceeds 2MB limit.', false), { name: 'ApiError' })
    )
    render(<OcrPage />)
    expect(await screen.findByText('File exceeds 2MB limit.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chụp lại' })).toBeInTheDocument()
  })
  ```

- [ ] **Step 8: Run tests**

  ```bash
  cd src/client && pnpm test -- ocr/page.test
  ```

  Expected: all tests pass including the 3 new ones.

- [ ] **Step 9: Commit**

  ```bash
  git add src/client/app/(main)/ocr/page.tsx src/client/app/(main)/ocr/page.test.tsx
  git commit -m "feat(client): implement S-10 OCR error state with code-specific dispatch

  Replaces generic error message with ApiError.code dispatch. RATE_LIMITED
  burst shows Thử lại; RATE_LIMITED daily and image errors show Chụp lại.
  Extracts postOcr call into runOcr() for retry support."
  ```

---

### Task 3: S-10 Solve Page Error State — Code Dispatch

**Files:**
- Modify: `src/client/app/solve/page.tsx`

**Background:** The solve page error state checks only `retryable` for button display. We need code-specific dispatch: `LLM_CONTENT_POLICY` gets "Nhập bài toán khác" (navigate back, call reset); `RATE_LIMITED` daily gets no button; all other retryable errors get "Thử lại".

- [ ] **Step 1: Read the current solve page**

  Read `src/client/app/solve/page.tsx`. Note the `ErrorInfo` interface, `error` state, and the current error JSX block.

- [ ] **Step 2: Add errorCode state**

  Add after the existing `const [error, setError] = useState<ErrorInfo | null>(null)` line:

  ```tsx
  const [errorCode, setErrorCode] = useState<string | null>(null)
  ```

- [ ] **Step 3: Update the catch block in runSolve**

  Replace the existing `catch` block in `runSolve`:

  ```tsx
  } catch (err) {
    const code = err instanceof ApiError ? err.code : 'UNKNOWN'
    const info: ErrorInfo = err instanceof ApiError
      ? { message: err.message, retryable: err.retryable }
      : { message: 'Không thể tạo lời giải. Vui lòng thử lại.', retryable: true }
    toast.error(info.message)
    setErrorCode(code)
    setError(info)
    setPageState('error')
  }
  ```

  Note: do NOT call `reset()` here — `ocrLatex` must be preserved for retry.

- [ ] **Step 4: Replace the error JSX block with code-dispatch**

  Replace the `{pageState === 'error' && error && ( ... )}` block:

  ```tsx
  {pageState === 'error' && error && (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <div className="w-full rounded-[16px] border border-black/5 p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
        <p className="mb-4 text-[15px] text-[#333]">{error.message}</p>
        {errorCode === 'LLM_CONTENT_POLICY' ? (
          <button
            onClick={() => { reset(); router.push('/camera') }}
            className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
          >
            Nhập bài toán khác
          </button>
        ) : error.retryable ? (
          <button
            onClick={runSolve}
            className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
          >
            Thử lại
          </button>
        ) : null}
      </div>
    </div>
  )}
  ```

  This handles:
  - `LLM_CONTENT_POLICY` (retryable=false) → "Nhập bài toán khác" (reset + /camera)
  - `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `RATE_LIMITED`(retryable=true) → "Thử lại"
  - `RATE_LIMITED`(retryable=false, daily) → no button (null)

- [ ] **Step 5: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

- [ ] **Step 6: Run tests**

  ```bash
  cd src/client && pnpm test
  ```

  Expected: all existing tests pass (no solve page tests exist yet; just verify nothing broke).

- [ ] **Step 7: Commit**

  ```bash
  git add src/client/app/solve/page.tsx
  git commit -m "feat(client): implement S-10 solve error state with code-specific dispatch

  LLM_CONTENT_POLICY shows 'Nhập bài toán khác' (reset + navigate /camera).
  RATE_LIMITED daily (retryable=false) shows message only, no button.
  All other retryable errors show 'Thử lại'. ocrLatex never cleared on error."
  ```

---

### Task 4: S-12 Onboarding — Context and Hook

**Files:**
- Create: `src/client/contexts/OnboardingContext.tsx`

- [ ] **Step 1: Create the context file**

  Create `src/client/contexts/OnboardingContext.tsx`:

  ```tsx
  'use client'

  import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

  const STORAGE_KEY = 'mathsnap.onboarding.seen'

  interface OnboardingState {
    hasSeenOnboarding: boolean
    markAsSeen: () => void
  }

  const OnboardingContext = createContext<OnboardingState | null>(null)

  export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

    useEffect(() => {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setHasSeenOnboarding(true)
      }
    }, [])

    function markAsSeen() {
      localStorage.setItem(STORAGE_KEY, 'true')
      setHasSeenOnboarding(true)
    }

    return (
      <OnboardingContext.Provider value={{ hasSeenOnboarding, markAsSeen }}>
        {children}
      </OnboardingContext.Provider>
    )
  }

  export function useOnboarding(): OnboardingState {
    const ctx = useContext(OnboardingContext)
    if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
    return ctx
  }
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

---

### Task 5: S-12 Onboarding — PaginationDots Component

**Files:**
- Create: `src/client/components/PaginationDots.tsx`

- [ ] **Step 1: Create PaginationDots**

  Create `src/client/components/PaginationDots.tsx`:

  ```tsx
  interface PaginationDotsProps {
    total: number
    current: number
  }

  export function PaginationDots({ total, current }: PaginationDotsProps) {
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={
              i === current
                ? 'size-2 rounded-full bg-[#0d0d0d]'
                : 'size-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-transparent'
            }
          />
        ))}
      </div>
    )
  }
  ```

---

### Task 6: S-12 Onboarding — OnboardingStep Component

**Files:**
- Create: `src/client/components/OnboardingStep.tsx`

- [ ] **Step 1: Create OnboardingStep**

  Create `src/client/components/OnboardingStep.tsx`:

  ```tsx
  import type { ReactNode } from 'react'

  interface OnboardingStepProps {
    title: string
    description: string
    illustration: ReactNode
  }

  export function OnboardingStep({ title, description, illustration }: OnboardingStepProps) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex size-[120px] items-center justify-center rounded-full bg-[#d4fae8]">
          {illustration}
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-[36px] font-semibold leading-tight tracking-[-0.72px] text-[#0d0d0d]">
            {title}
          </h2>
          <p className="text-[16px] leading-relaxed text-[#666666]">
            {description}
          </p>
        </div>
      </div>
    )
  }
  ```

---

### Task 7: S-12 Onboarding — OnboardingOverlay Component

**Files:**
- Create: `src/client/components/OnboardingOverlay.tsx`

- [ ] **Step 1: Create the overlay with all 3 steps and navigation**

  Create `src/client/components/OnboardingOverlay.tsx`:

  ```tsx
  'use client'

  import { useState } from 'react'
  import { Camera, Bookmark, Lock, CheckCircle2 } from 'lucide-react'
  import { useOnboarding } from '@/contexts/OnboardingContext'
  import { OnboardingStep } from '@/components/OnboardingStep'
  import { PaginationDots } from '@/components/PaginationDots'

  const STEPS = [
    {
      title: 'Chụp ảnh bài toán',
      description: 'Chụp hoặc tải ảnh bài toán toán học bất kỳ — phương trình, hệ phương trình, hay tích phân.',
      illustration: <Camera className="size-12 text-[#0fa76e]" aria-hidden="true" />,
    },
    {
      title: 'Nhận diện công thức',
      description: 'AI tự động đọc và nhận diện công thức từ ảnh của bạn với độ chính xác cao.',
      illustration: (
        <div className="flex w-[220px] flex-col gap-3 rounded-[16px] border border-black/5 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#d4fae8] px-3 py-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.6px] text-[#0fa76e]">01</span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
              <div className="h-2 w-3/4 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
            <Lock className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 w-2/3 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Xem lời giải từng bước',
      description: 'Nhận lời giải chi tiết từng bước, kèm công thức và giải thích rõ ràng.',
      illustration: <Bookmark className="size-12 text-[#0fa76e]" aria-hidden="true" />,
    },
  ]

  export function OnboardingOverlay() {
    const { hasSeenOnboarding, markAsSeen } = useOnboarding()
    const [step, setStep] = useState(0)

    if (hasSeenOnboarding) return null

    const isLastStep = step === STEPS.length - 1
    const current = STEPS[step]

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white pt-safe pb-safe">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.6px] text-[#888888]">
            {step + 1} / {STEPS.length}
          </span>
          {!isLastStep && (
            <button
              onClick={markAsSeen}
              className="text-[14px] font-medium text-[#888888] transition-colors hover:text-[#0d0d0d]"
            >
              Bỏ qua
            </button>
          )}
        </div>

        <OnboardingStep
          title={current.title}
          description={current.description}
          illustration={current.illustration}
        />

        <div className="flex flex-col items-center gap-4 px-6 pb-8">
          <PaginationDots total={STEPS.length} current={step} />
          <button
            onClick={isLastStep ? markAsSeen : () => setStep(s => s + 1)}
            className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white shadow-[0px_1px_2px_rgba(0,0,0,0.06)]"
          >
            {isLastStep ? 'Bắt đầu' : 'Tiếp'}
          </button>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

---

### Task 8: S-12 Onboarding — Root Layout Integration

**Files:**
- Modify: `src/client/app/layout.tsx`

- [ ] **Step 1: Read the current root layout**

  Read `src/client/app/layout.tsx`. Note the existing imports and the body structure with `ThemeProvider` and `CaptureProvider`.

- [ ] **Step 2: Add OnboardingProvider and OnboardingOverlay**

  Replace the file content with:

  ```tsx
  import { Geist_Mono, Inter } from "next/font/google"

  import "./globals.css"
  import { ThemeProvider } from "@/components/theme-provider"
  import { CaptureProvider } from "@/contexts/CaptureContext"
  import { OnboardingProvider } from "@/contexts/OnboardingContext"
  import { OnboardingOverlay } from "@/components/OnboardingOverlay"
  import { cn } from "@/lib/utils"

  const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

  const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
  })

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) {
    return (
      <html
        lang="en"
        suppressHydrationWarning
        className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
      >
        <body>
          <ThemeProvider>
            <CaptureProvider>
              <OnboardingProvider>
                {children}
                <OnboardingOverlay />
              </OnboardingProvider>
            </CaptureProvider>
          </ThemeProvider>
        </body>
      </html>
    )
  }
  ```

  Note: `Geist` font removed from import since it was unused in the original (only `Geist_Mono` was used as `--font-mono`). Verify the original file — if `Geist` was used, keep it.

- [ ] **Step 3: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: zero errors.

- [ ] **Step 4: Run all tests**

  ```bash
  cd src/client && pnpm test
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit onboarding**

  ```bash
  git add src/client/contexts/OnboardingContext.tsx \
          src/client/components/PaginationDots.tsx \
          src/client/components/OnboardingStep.tsx \
          src/client/components/OnboardingOverlay.tsx \
          src/client/app/layout.tsx
  git commit -m "feat(client): implement S-12 one-time onboarding overlay

  3-step full-screen overlay shown on first app launch across all routes.
  Both 'Bỏ qua' and 'Bắt đầu' set mathsnap.onboarding.seen in localStorage.
  SSR-safe: localStorage read deferred to useEffect to prevent hydration mismatch."
  ```

---

### Task 9: Record S-14 Cut in Cut Decisions Log

**Files:**
- Modify: `docs/plans/PHASE_2.5_IMPLEMENTATION.md`

- [ ] **Step 1: Read Section 7 of the plan**

  Read `docs/plans/PHASE_2.5_IMPLEMENTATION.md`. Find Section 7 "Cut Decisions Log".

- [ ] **Step 2: Add the cut entry**

  Replace the empty table row:

  ```markdown
  | _(empty — chưa có trigger fired)_ |               |            |              |           |
  ```

  With:

  ```markdown
  | 2026-05-20 | Manual — backend constraint | Cut S-14 Problem Selector | ProblemSelector component | ~1h |
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add docs/plans/PHASE_2.5_IMPLEMENTATION.md
  git commit -m "docs: record S-14 Problem Selector cut in Phase 2.5 Cut Decisions Log

  Backend pix2tex always returns exactly 1 formula — a multi-formula selector
  would be dead code. Cut to save ~1h for higher-priority S-10 and S-12 work."
  ```

---

### Task 10: Final Verification

- [ ] **Step 1: TypeScript — zero errors**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: exit code 0, no errors printed.

- [ ] **Step 2: Tests — all pass**

  ```bash
  cd src/client && pnpm test
  ```

  Expected: all test suites pass, including the 3 new OCR error variant tests.

- [ ] **Step 3: Lint — no new errors**

  ```bash
  cd src/client && pnpm lint
  ```

  Expected: exit code 0.

- [ ] **Step 4: Manual smoke test (dev server)**

  ```bash
  cd src/client && pnpm dev
  ```

  Verify in browser:
  1. Clear localStorage → open `http://localhost:3000` → onboarding overlay appears
  2. Click "Tiếp" twice → reach step 3 → click "Bắt đầu" → overlay disappears
  3. Reload → overlay does NOT reappear
  4. Clear localStorage → click "Bỏ qua" on step 1 → overlay disappears → reload → gone
