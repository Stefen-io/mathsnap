# Unify Solve View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the standalone history-detail page into a single full-bleed `/solve` route that serves both solving a new problem (SOLVE mode) and reviewing a stored one (VIEW mode via `?id`), with a mobile-responsive StepCard.

**Architecture:** `app/solve/page.tsx` becomes a `<Suspense>` wrapper around `SolvePageContent`, which reads `useSearchParams().get('id')` to pick mode. VIEW mode fetches via `getHistoryItem` (no `/api/solve`, no camera redirect); SOLVE mode keeps the existing `postSolve` flow. History/bookmarks lists navigate to `/solve?id=`. The old `history/[id]` route and its dead i18n keys are deleted.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Vitest + happy-dom, KaTeX, motion/react.

All commands run from `src/client/`.

---

### Task 1: Update solve test mocks + add failing VIEW-mode tests

**Files:**
- Test: `src/client/app/solve/page.test.tsx`

- [ ] **Step 1: Add `useSearchParams` to the navigation mock and a mutable params holder**

Replace the `next/navigation` mock block (currently `app/solve/page.test.tsx:8-10`) and add a mutable holder just above it. The variable name MUST start with `mock` so Vitest's hoisted `vi.mock` factory may reference it.

```ts
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))
```

- [ ] **Step 2: Add `getHistoryItem` to the api mock**

In the `vi.mock('@/lib/api', ...)` factory (currently `app/solve/page.test.tsx:17-26`), add `getHistoryItem: vi.fn(),` alongside `postSolve`:

```ts
vi.mock('@/lib/api', () => ({
  postSolve: vi.fn(),
  getHistoryItem: vi.fn(),
  toggleBookmark: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string; retryable: boolean
    constructor(code: string, message: string, retryable: boolean) {
      super(message); this.code = code; this.retryable = retryable
    }
  },
}))
```

- [ ] **Step 3: Import `getHistoryItem` in the test**

Change the api import line (currently `app/solve/page.test.tsx:41`) to:

```ts
import { postSolve, getHistoryItem, toggleBookmark, ApiError } from '@/lib/api'
```

- [ ] **Step 4: Reset `mockSearchParams` between tests**

In the first `describe`'s `beforeEach` (currently `beforeEach(() => { vi.clearAllMocks() })`), reset the params so each test starts in SOLVE mode by default:

```ts
beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })
```

- [ ] **Step 5: Add a VIEW-mode describe block with failing tests**

Append this block to the end of `app/solve/page.test.tsx`:

```ts
describe('SolvePage VIEW mode', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })

  it('fetches by id, renders steps, and does not call postSolve or redirect to camera', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...mockItem, latex: 'y^2' })
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    expect(await screen.findByTestId('step-1')).toBeTruthy()
    expect(getHistoryItem).toHaveBeenCalledWith('item-123', 'device-456')
    expect(postSolve).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalledWith('/camera')
  })

  it('shows item.latex in the problem bar (not ocrLatex)', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...mockItem, latex: 'y^2' })
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await screen.findByTestId('step-1')
    expect(screen.getByTestId('katex').textContent).toBe('y^2')
  })

  it('redirects to /history on ApiError', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockRejectedValueOnce(new ApiError('HISTORY_NOT_FOUND', 'not found', false))
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/history'))
  })
})
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

Run: `pnpm vitest run app/solve/page.test.tsx`
Expected: the 3 VIEW-mode tests FAIL (current page ignores `?id`: `getHistoryItem` not called, and with `ocrLatex: null` it redirects to `/camera`). Existing SOLVE tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add app/solve/page.test.tsx
git commit -m "test(solve): add failing VIEW-mode tests and useSearchParams/getHistoryItem mocks"
```

---

### Task 2: Implement dual-mode `/solve` + Suspense

**Files:**
- Modify (full rewrite): `src/client/app/solve/page.tsx`

- [ ] **Step 1: Replace the entire file with the dual-mode implementation**

Write `src/client/app/solve/page.tsx` with exactly this content:

```tsx
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, getHistoryItem, toggleBookmark, ApiError } from '@/lib/api'
import { t, type Lang } from '@/lib/i18n'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import { StepCard } from '@/components/StepCard'
import type { SolutionStep } from '@/types/history'

type PageState = 'loading' | 'success' | 'error'

interface ErrorInfo {
  message: string
  retryable: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

function LoadingFallback() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-[70%]" />
        <Skeleton className="h-16 w-[50%]" />
      </div>
    </div>
  )
}

export default function SolvePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SolvePageContent />
    </Suspense>
  )
}

function SolvePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewId = searchParams.get('id')
  const { ocrLatex, setSolveResult, reset } = useCaptureContext()
  const { lang } = useLanguage()
  const deviceId = useDeviceId()
  const startedRef = useRef(false)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [steps, setSteps] = useState<SolutionStep[]>([])
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set<number>())
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [historyItemId, setHistoryItemId] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [viewLatex, setViewLatex] = useState<string | null>(null)

  const displayLatex = viewId ? viewLatex : ocrLatex

  function toggleStep(index: number) {
    setOpenSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }

  async function runSolve() {
    if (!ocrLatex || !deviceId) return
    setPageState('loading')
    setError(null)
    setErrorCode(null)
    try {
      const stored = localStorage.getItem('mathsnap_language')
      const language: Lang = stored === 'en' ? 'en' : 'vi'
      const result = await postSolve(ocrLatex, deviceId, language)
      setSolveResult(result)
      setSteps(result.solutionSteps)
      setHistoryItemId(result.id)
      setIsBookmarked(result.isBookmarked)
      setOpenSteps(new Set(result.solutionSteps.map((s: SolutionStep) => s.index)))
      setPageState('success')
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      const localizedMessage: string = err instanceof ApiError
        ? (err.code === 'RATE_LIMITED'
            ? (err.retryable ? t[lang].rateLimitBurst : t[lang].rateLimitDaily)
            : err.message)
        : t[lang].solveErrorGeneric
      setErrorCode(code)
      setError({
        message: localizedMessage,
        retryable: err instanceof ApiError ? err.retryable : true,
      })
      setPageState('error')
      toast.error(err instanceof ApiError ? localizedMessage : t[lang].solveToastError)
    }
  }

  async function loadHistoryItem(id: string, dev: string) {
    setPageState('loading')
    try {
      const item = await getHistoryItem(id, dev)
      setSolveResult(item)
      setSteps(item.solutionSteps)
      setHistoryItemId(item.id)
      setIsBookmarked(item.isBookmarked)
      setViewLatex(item.latex)
      setOpenSteps(new Set(item.solutionSteps.map((s: SolutionStep) => s.index)))
      setPageState('success')
    } catch (err) {
      if (err instanceof ApiError) router.replace('/history')
    }
  }

  useEffect(() => {
    // VIEW mode: fetch by id; never redirect to /camera, never call postSolve.
    if (viewId) {
      if (!deviceId) return
      if (startedRef.current) return
      startedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadHistoryItem(viewId, deviceId)
      return
    }
    // SOLVE mode
    if (!ocrLatex) { router.replace('/camera'); return }
    if (!deviceId) return
    // No cleanup reset: intentional. Adding one would let StrictMode's remount bypass this guard.
    if (startedRef.current) return
    startedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLatex, deviceId, viewId])

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {pageState === 'loading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-[70%]" />
          <Skeleton className="h-16 w-[50%]" />
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888]">
            {t[lang].solveLoading}<span className="animate-pulse">_</span>
          </p>
        </div>
      )}

      {pageState === 'error' && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="w-full rounded-[16px] border border-black/5 p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[15px] text-[#333]">{error.message}</p>
            {/* LLM_CONTENT_POLICY always navigates away regardless of retryable flag */}
            {errorCode === 'LLM_CONTENT_POLICY' ? (
              <button
                onClick={() => { reset(); router.push('/camera') }}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                {t[lang].solveOtherProblem}
              </button>
            ) : error.retryable ? (
              <button
                onClick={runSolve}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                {t[lang].solveRetry}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {pageState === 'success' && (
        <>
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-full text-[#888] hover:bg-[#fafafa]"
              aria-label={t[lang].solveAriaBack}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <h1 className="text-[16px] font-medium text-[#0d0d0d]">{t[lang].solveTitle}</h1>
          </header>

          <div className="border-b border-black/5 bg-[#fafafa] px-4 py-3">
            {displayLatex && <KaTeXRenderer latex={displayLatex} />}
          </div>

          <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[88px]">
            {steps.map(step => (
              <StepCard
                key={step.index}
                step={step}
                isOpen={openSteps.has(step.index)}
                onToggle={() => toggleStep(step.index)}
                lang={lang}
              />
            ))}
          </main>

          <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 flex items-center gap-3 border-t border-black/5 bg-white px-4 py-3">
            <button
              onClick={async () => {
                if (!historyItemId || !deviceId) return
                const next = !isBookmarked
                setIsBookmarked(next) // optimistic
                try {
                  await toggleBookmark(historyItemId, deviceId, next)
                } catch {
                  setIsBookmarked(!next) // revert on error
                }
              }}
              className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                isBookmarked
                  ? 'bg-[#d4fae8] text-[#0fa76e]'
                  : 'border border-black/5 text-[#0d0d0d]'
              }`}
              aria-label={t[lang].solveAriaBookmark}
            >
              <Bookmark
                className="size-5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                strokeWidth={isBookmarked ? 1.5 : 2}
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => { reset(); router.push('/') }}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
            >
              {t[lang].solveNewProblem}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the solve tests to verify all pass**

Run: `pnpm vitest run app/solve/page.test.tsx`
Expected: all tests PASS (3 VIEW-mode + the existing SOLVE/error/bookmark tests).

- [ ] **Step 3: Commit**

```bash
git add app/solve/page.tsx
git commit -m "feat(solve): add VIEW mode and Suspense boundary to unify solution display"
```

---

### Task 3: Point history & bookmarks navigation at `/solve?id=`

**Files:**
- Modify: `src/client/app/(main)/history/page.tsx:126`
- Modify: `src/client/app/(main)/bookmarks/page.tsx:99`

- [ ] **Step 1: Update history navigation target**

In `app/(main)/history/page.tsx`, change the card `onClick` (line ~126):

From:
```tsx
onClick={() => { if (draggingId.current !== item.id) router.push(`/history/${item.id}`) }}
```
To:
```tsx
onClick={() => { if (draggingId.current !== item.id) router.push(`/solve?id=${item.id}`) }}
```

- [ ] **Step 2: Update bookmarks navigation target**

In `app/(main)/bookmarks/page.tsx`, change the card `onClick` (line ~99):

From:
```tsx
onClick={() => { if (draggingId.current !== item.id) router.push(`/history/${item.id}`) }}
```
To:
```tsx
onClick={() => { if (draggingId.current !== item.id) router.push(`/solve?id=${item.id}`) }}
```

- [ ] **Step 3: Run the list tests to confirm no regression**

Run: `pnpm vitest run "app/(main)/history/page.test.tsx" "app/(main)/bookmarks/page.test.tsx"`
Expected: PASS (these tests assert delete/bookmark actions, not the navigation target).

- [ ] **Step 4: Commit**

```bash
git add "app/(main)/history/page.tsx" "app/(main)/bookmarks/page.tsx"
git commit -m "feat(history,bookmarks): navigate item taps to unified /solve?id view"
```

---

### Task 4: Make StepCard responsive (≤480px) with horizontal-scroll formulas

**Files:**
- Modify: `src/client/components/StepCard.tsx`

- [ ] **Step 1: Shrink the step title font at ≤480px**

In `components/StepCard.tsx`, change the title span (currently line ~37):

From:
```tsx
<span className="flex-1 text-[15px] font-medium text-[#0d0d0d]">{step.title}</span>
```
To:
```tsx
<span className="flex-1 text-[15px] font-medium text-[#0d0d0d] [@media(max-width:480px)]:text-[13px]">{step.title}</span>
```

- [ ] **Step 2: Shrink the explanation font at ≤480px**

Change the explanation paragraph (currently line ~62):

From:
```tsx
<p className="text-[15px] leading-relaxed text-[#555]">{step.explanation}</p>
```
To:
```tsx
<p className="text-[15px] leading-relaxed text-[#555] [@media(max-width:480px)]:text-[13px]">{step.explanation}</p>
```

- [ ] **Step 3: Make the formula container scroll and the answer formula clamp**

Replace the formula block (currently lines ~63-72):

From:
```tsx
              {step.formula && (
                <div className="mt-3 flex items-center justify-center rounded-[16px] bg-[#fafafa] p-3">
                  {step.isAnswer ? (
                    <span style={{ fontSize: '2.5rem' }} className="text-[#0d0d0d]">
                      <KaTeXRenderer latex={step.formula} />
                    </span>
                  ) : (
                    <KaTeXRenderer latex={step.formula} />
                  )}
                </div>
              )}
```
To:
```tsx
              {step.formula && (
                <div className="mt-3 overflow-x-auto rounded-[16px] bg-[#fafafa] p-3">
                  <div className="flex w-max min-w-full justify-center">
                    {step.isAnswer ? (
                      <span style={{ fontSize: 'clamp(1.5rem, 7vw, 2.5rem)' }} className="text-[#0d0d0d]">
                        <KaTeXRenderer latex={step.formula} />
                      </span>
                    ) : (
                      <KaTeXRenderer latex={step.formula} />
                    )}
                  </div>
                </div>
              )}
```

(The outer `overflow-x-auto` enables horizontal scroll; the inner `w-max min-w-full justify-center` centers a formula that fits but lets a wider one scroll instead of clipping.)

- [ ] **Step 4: Typecheck and run the full test suite**

Run: `pnpm typecheck && pnpm vitest run`
Expected: typecheck clean; all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/StepCard.tsx
git commit -m "feat(stepcard): responsive text and horizontally scrollable formulas at <=480px"
```

---

### Task 5: Remove the history-detail route and its dead i18n keys

**Files:**
- Delete: `src/client/app/(main)/history/[id]/page.tsx`
- Delete: `src/client/app/(main)/history/[id]/page.test.tsx`
- Modify: `src/client/lib/i18n.ts`

- [ ] **Step 1: Delete the history-detail page and test**

Run:
```bash
git rm "app/(main)/history/[id]/page.tsx" "app/(main)/history/[id]/page.test.tsx"
```
(The `[id]` directory becomes empty and should be removed; if git leaves it, run `rmdir "app/(main)/history/[id]"`.)

- [ ] **Step 2: Remove the 4 `detail*` keys from the `vi` object**

In `lib/i18n.ts`, delete these 5 lines (the comment + 4 keys, currently around lines 27-31):

```ts
  // History detail
  detailTitle: 'Lời giải',
  detailAriaBack: 'Quay lại',
  detailAriaBookmark: 'Đánh dấu',
  detailNewProblem: 'Bài mới',
```

- [ ] **Step 3: Remove the 4 `detail*` keys from the `en` object**

In `lib/i18n.ts`, delete these 5 lines (the comment + 4 keys, currently around lines 118-122):

```ts
  // History detail
  detailTitle: 'Solution',
  detailAriaBack: 'Go back',
  detailAriaBookmark: 'Bookmark',
  detailNewProblem: 'New problem',
```

- [ ] **Step 4: Confirm no remaining references to `detail*` keys**

Run: `grep -rn "detailTitle\|detailAriaBack\|detailAriaBookmark\|detailNewProblem" app components lib`
Expected: no output (zero matches).

- [ ] **Step 5: Run i18n parity test + full suite**

Run: `pnpm vitest run lib/i18n.test.ts && pnpm vitest run`
Expected: i18n parity test PASS (en/vi key sets still equal); full suite PASS (the deleted detail test is gone).

- [ ] **Step 6: Commit**

```bash
git add "app/(main)/history" lib/i18n.ts
git commit -m "refactor: remove history/[id] route and dead detail i18n keys"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Lint, typecheck, test, build all green**

Run: `pnpm lint && pnpm typecheck && pnpm vitest run && pnpm build`
Expected: all succeed. Critically, `pnpm build` MUST NOT emit a `useSearchParams` missing-suspense / deopt error for `/solve` (proves the Suspense wrapper works).

- [ ] **Step 2: Manual browser smoke test**

Run: `pnpm dev`, then in the browser verify:
- Solve-new flow (`/camera` → `/ocr` → "Giải bài này" → `/solve`) still renders steps.
- Tapping a history item opens `/solve?id={id}` and shows the stored solution with `item.latex` in the problem bar (no flash of `/camera`).
- Tapping a bookmark item opens `/solve?id={id}`.
- Back button returns to the originating list.
- On a ≤480px viewport, a long answer formula scrolls horizontally and text is smaller.

- [ ] **Step 3: Final commit (if any manual fixups were needed)**

```bash
git add -A
git commit -m "chore(solve): verification fixups for unified solve view"
```

---

## Self-Review

**Spec coverage:**
- `solution-viewer` ADDED "Suspense boundary" → Task 2 Step 1 (`<Suspense fallback>`), verified Task 6 Step 1 (`pnpm build`).
- `solution-viewer` ADDED "StepCard responsive" → Task 4 (text shrink + overflow-x).
- `solution-viewer` MODIFIED mount dual-mode → Task 2 (effect branch); tested Task 1.
- `solution-viewer` MODIFIED S-07 displayLatex → Task 2 (`displayLatex`); tested Task 1 Step 5 (item.latex test).
- `solution-viewer` MODIFIED answer clamp → Task 4 Step 3.
- `history-list-view` MODIFIED navigation → Task 3 Step 1.
- `bookmark-list-view` MODIFIED navigation → Task 3 Step 2.
- `history-item-detail` REMOVED → Task 5 Steps 1-3.

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output.

**Type consistency:** `viewId: string | null`, `viewLatex: string | null`, `displayLatex = viewId ? viewLatex : ocrLatex`. `loadHistoryItem(id: string, dev: string)` called only with non-null `viewId`/`deviceId` (guarded). `startedRef` (renamed from `solveStartedRef`) used in the single mount effect for both modes. `getHistoryItem` signature `(id, deviceId)` matches `lib/api.ts`.
