# frontend-solve-flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing camera-crop pipeline through OCR recognition and LLM solve into a complete end-to-end math tutoring flow, delivering screens S-05 (Formula Preview), S-06 (Loading), and S-07 (Solution Detail).

**Architecture:** A new `lib/api.ts` layer wraps `POST /api/ocr` and `POST /api/solve` with typed `ApiError` error handling. `CaptureContext` is extended with `ocrLatex`+`solveResult` fields so the OCR page can pass the recognised formula to the solve page without React Router state (not available in Next.js App Router). The solve page is a flat route at `app/solve/page.tsx` outside the `(main)` layout to avoid BottomNav.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, KaTeX (already installed), `motion` (Framer Motion v11 — to be added), Sonner toasts (already installed), Vitest + happy-dom.

---

## Task 1: Install motion package

**Files:**
- Modify: `src/client/package.json` (via pnpm)

- [ ] **Step 1.1: Install the package**

Run from `src/client/`:
```bash
pnpm add motion
```
Expected output: `+ motion <version>` added to `dependencies`.

- [ ] **Step 1.2: Verify the import resolves**

```bash
node --input-type=module <<'EOF'
import { AnimatePresence } from 'motion/react'
console.log('ok')
EOF
```
Or simply proceed — TypeScript will catch it at typecheck time in Task 2.

---

## Task 2: Device Identity — lib/device-id.ts (TDD)

**Files:**
- Create: `src/client/lib/device-id.ts`
- Create: `src/client/lib/device-id.test.ts`

- [ ] **Step 2.1: Write the failing test first**

Create `src/client/lib/device-id.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getDeviceId } from './device-id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('getDeviceId', () => {
  beforeEach(() => { localStorage.clear() })

  it('generates and persists a UUID v4 on first call', () => {
    const id = getDeviceId()
    expect(id).toMatch(UUID_V4)
    expect(localStorage.getItem('mathsnap_device_id')).toBe(id)
  })

  it('returns the same UUID on subsequent calls', () => {
    expect(getDeviceId()).toBe(getDeviceId())
  })

  it('generates a new UUID after localStorage.clear()', () => {
    const first = getDeviceId()
    localStorage.clear()
    const second = getDeviceId()
    expect(second).not.toBe(first)
    expect(second).toMatch(UUID_V4)
  })

  it('returned value matches UUID v4 regex', () => {
    expect(getDeviceId()).toMatch(UUID_V4)
  })
})
```

- [ ] **Step 2.2: Run tests — expect failure**

```bash
cd src/client && pnpm test -- --reporter=verbose lib/device-id.test.ts
```
Expected: `Cannot find module './device-id'`

- [ ] **Step 2.3: Implement the utility**

Create `src/client/lib/device-id.ts`:
```ts
const KEY = 'mathsnap_device_id'

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
```

- [ ] **Step 2.4: Run tests — expect all green**

```bash
cd src/client && pnpm test -- --reporter=verbose lib/device-id.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add src/client/lib/device-id.ts src/client/lib/device-id.test.ts
git commit -m "feat(client): add getDeviceId utility with localStorage persistence"
```

---

## Task 3: Device Identity — hooks/useDeviceId.ts

**Files:**
- Create: `src/client/hooks/useDeviceId.ts`

- [ ] **Step 3.1: Create the SSR-safe hook**

Create `src/client/hooks/useDeviceId.ts`:
```ts
'use client'

import { useState, useEffect } from 'react'
import { getDeviceId } from '@/lib/device-id'

export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => { setId(getDeviceId()) }, [])
  return id
}
```

- [ ] **Step 3.2: Typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/client/hooks/useDeviceId.ts
git commit -m "feat(client): add useDeviceId hook (SSR-safe localStorage UUID)"
```

---

## Task 4: API Client — lib/api.ts

**Files:**
- Create: `src/client/lib/api.ts`

- [ ] **Step 4.1: Create the API client**

Create `src/client/lib/api.ts`:
```ts
import type { HistoryItem } from '@/types/history'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export class ApiError extends Error {
  readonly code: string
  readonly retryable: boolean

  constructor(code: string, message: string, retryable: boolean) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.retryable = retryable
  }
}

export interface OcrFormula {
  latex: string
  confidence: number
}

export interface OcrResponse {
  formulas: OcrFormula[]
}

async function handleError(res: Response): Promise<never> {
  let body: { code?: string; message?: string; retryable?: boolean }
  try {
    body = await res.json()
  } catch {
    throw new ApiError('UNKNOWN', `HTTP ${res.status}`, false)
  }
  throw new ApiError(
    body.code ?? 'UNKNOWN',
    body.message ?? 'Unknown error',
    body.retryable ?? false,
  )
}

export async function postOcr(blob: Blob, deviceId: string): Promise<OcrResponse> {
  const form = new FormData()
  form.append('image', blob, 'image.jpg')
  const res = await fetch(`${BASE}/api/ocr`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId },
    body: form,
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<OcrResponse>
}

export async function postSolve(
  latex: string,
  deviceId: string,
  language: 'vi' | 'en' = 'vi',
): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify({ latex, language }),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}
```

- [ ] **Step 4.2: Typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/client/lib/api.ts
git commit -m "feat(client): add postOcr/postSolve API wrappers with ApiError"
```

---

## Task 5: Extend CaptureContext

**Files:**
- Modify: `src/client/contexts/CaptureContext.tsx`

Current state: holds `capturedBlob`, `croppedBlob`, two setters, `reset`.
After edit: also holds `ocrLatex`, `solveResult`, two more setters; `reset` clears all four.

- [ ] **Step 5.1: Replace the full file content**

`src/client/contexts/CaptureContext.tsx`:
```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { HistoryItem } from '@/types/history'

interface CaptureState {
  capturedBlob: Blob | null
  croppedBlob: Blob | null
  ocrLatex: string | null
  solveResult: HistoryItem | null
  setCapturedBlob: (blob: Blob) => void
  setCroppedBlob: (blob: Blob) => void
  setOcrLatex: (latex: string | null) => void
  setSolveResult: (item: HistoryItem | null) => void
  reset: () => void
}

const CaptureContext = createContext<CaptureState | null>(null)

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [ocrLatex, setOcrLatex] = useState<string | null>(null)
  const [solveResult, setSolveResult] = useState<HistoryItem | null>(null)

  function reset() {
    setCapturedBlob(null)
    setCroppedBlob(null)
    setOcrLatex(null)
    setSolveResult(null)
  }

  return (
    <CaptureContext.Provider
      value={{
        capturedBlob,
        croppedBlob,
        ocrLatex,
        solveResult,
        setCapturedBlob,
        setCroppedBlob,
        setOcrLatex,
        setSolveResult,
        reset,
      }}
    >
      {children}
    </CaptureContext.Provider>
  )
}

export function useCaptureContext(): CaptureState {
  const ctx = useContext(CaptureContext)
  if (!ctx) throw new Error('useCaptureContext must be used within a CaptureProvider')
  return ctx
}
```

- [ ] **Step 5.2: Run full test suite to confirm no regressions**

```bash
cd src/client && pnpm test
```
Expected: all existing tests pass (CaptureContext.test.tsx, useCamera.test.ts, device-id.test.ts).

- [ ] **Step 5.3: Typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/client/contexts/CaptureContext.tsx
git commit -m "feat(client): extend CaptureContext with ocrLatex and solveResult"
```

---

## Task 6: Rewrite OCR Page (S-05)

**Files:**
- Modify: `src/client/app/(main)/ocr/page.tsx` (full rewrite of stub)

This page has three states:
- `ocr-loading` — fires `postOcr`, shows pulse skeleton
- `confirm` — shows thumbnail + KaTeX render + textarea + bottom CTA bar
- `error` — shows error message + Chụp lại button

- [ ] **Step 6.1: Rewrite ocr/page.tsx**

`src/client/app/(main)/ocr/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postOcr, ApiError } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'

type OcrState = 'ocr-loading' | 'confirm' | 'error'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

export default function OcrPage() {
  const router = useRouter()
  const { croppedBlob, setOcrLatex, reset } = useCaptureContext()
  const deviceId = useDeviceId()
  const [state, setState] = useState<OcrState>('ocr-loading')
  const [editedLatex, setEditedLatex] = useState('')
  const [confidence, setConfidence] = useState(1)

  const objectUrl = useMemo(
    () => (croppedBlob ? URL.createObjectURL(croppedBlob) : null),
    [croppedBlob],
  )

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [objectUrl])

  useEffect(() => {
    if (!croppedBlob) { router.push('/camera'); return }
    if (!deviceId) return
    postOcr(croppedBlob, deviceId)
      .then(res => {
        const formula = res.formulas[0]
        setEditedLatex(formula.latex)
        setConfidence(formula.confidence)
        setState('confirm')
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : 'Không nhận diện được công thức.'
        toast.error(msg)
        setState('error')
      })
  }, [croppedBlob, deviceId, router])

  if (!croppedBlob) return null

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-8 pb-[100px]">
      {state === 'ocr-loading' && (
        <div className="flex flex-col gap-4">
          <p className="text-center text-xs text-gray-400">Đang nhận dạng công thức...</p>
          <Skeleton className="h-[100px] w-full rounded-[16px]" />
          <div className="rounded-[16px] border border-black/5 p-5">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/5 p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-4 pt-12">
          <p className="text-[15px] text-[#333]">Không nhận diện được công thức.</p>
          <button
            onClick={() => { reset(); router.push('/camera') }}
            className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
          >
            Chụp lại
          </button>
        </div>
      )}

      {state === 'confirm' && (
        <>
          <div className="mb-4 rounded-[16px] border border-black/5 bg-[#fafafa] p-4">
            {objectUrl && (
              <img
                src={objectUrl}
                alt="Ảnh đã chụp"
                className="mb-4 h-[100px] w-full rounded-[12px] object-cover"
              />
            )}
            <div className="flex min-h-[64px] items-center justify-center py-2">
              <KaTeXRenderer latex={editedLatex} />
            </div>
            <p className="mt-2 text-center text-[13px] text-[#888]">
              Kiểm tra công thức đã chính xác chưa?
            </p>
          </div>

          {confidence < 0.6 && (
            <div className="mb-3 rounded-full border border-amber-300 px-3 py-1 text-center text-[13px] text-amber-700">
              Độ chính xác thấp — kiểm tra lại
            </div>
          )}

          <textarea
            value={editedLatex}
            onChange={e => setEditedLatex(e.target.value)}
            className="mb-4 h-[120px] w-full resize-none rounded-[16px] border border-black/8 p-3 font-mono text-[14px] text-[#0d0d0d] focus:outline-none focus:ring-2 focus:ring-[#18E299]"
          />

          <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 flex items-center gap-3 border-t border-black/5 bg-white px-6 py-3">
            <button
              onClick={() => { reset(); router.push('/camera') }}
              className="shrink-0 text-[15px] text-[#888] underline"
            >
              Chụp lại
            </button>
            <button
              disabled={!editedLatex.trim()}
              onClick={() => { setOcrLatex(editedLatex); router.push('/solve') }}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white disabled:opacity-40"
            >
              Giải bài này
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 6.2: Typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/client/app/'(main)'/ocr/page.tsx
git commit -m "feat(client): implement S-05 OCR formula preview with KaTeX live render"
```

---

## Task 7: Create Solve Page (S-06 + S-07)

**Files:**
- Create: `src/client/app/solve/page.tsx`

This is a flat route (no `(main)` layout wrapper). Contains both S-06 loading and S-07 solution detail. The `StepCard` component is defined inline.

- [ ] **Step 7.1: Create the directory and page file**

```bash
mkdir -p src/client/app/solve
```

Create `src/client/app/solve/page.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, ApiError } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { SolutionStep } from '@/types/history'

type PageState = 'loading' | 'success' | 'error'

interface ErrorInfo {
  message: string
  retryable: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

interface StepCardProps {
  step: SolutionStep
  isOpen: boolean
  onToggle: () => void
}

function StepCard({ step, isOpen, onToggle }: StepCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)] ${
        step.isAnswer ? 'border-l-4 border-[#18E299] border-t-black/5 border-r-black/5 border-b-black/5' : 'border-black/5'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
      >
        <span
          className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            step.isAnswer
              ? 'bg-[#d4fae8] text-[#0fa76e]'
              : 'border border-black/5 bg-[#fafafa] text-[#666]'
          }`}
        >
          {step.isAnswer ? 'Đáp án' : `Bước ${step.index}`}
        </span>
        <span className="flex-1 text-[15px] font-medium text-[#0d0d0d]">{step.title}</span>
        <ChevronRight
          className={`size-4 shrink-0 text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="mb-3 h-px w-full bg-black/5" />
              <p className="text-[15px] leading-relaxed text-[#555]">{step.explanation}</p>
              {step.formula && (
                <div className="mt-3 flex items-center justify-center rounded-[16px] bg-[#fafafa] p-3">
                  {step.isAnswer ? (
                    <span className="font-serif text-[40px] italic text-[#0d0d0d]">
                      <KaTeXRenderer latex={step.formula} />
                    </span>
                  ) : (
                    <KaTeXRenderer latex={step.formula} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SolvePage() {
  const router = useRouter()
  const { ocrLatex, setSolveResult, reset } = useCaptureContext()
  const deviceId = useDeviceId()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [steps, setSteps] = useState<SolutionStep[]>([])
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))
  const [error, setError] = useState<ErrorInfo | null>(null)

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
    try {
      const result = await postSolve(ocrLatex, deviceId)
      setSolveResult(result)
      setSteps(result.solutionSteps)
      setPageState('success')
    } catch (err) {
      const info: ErrorInfo = err instanceof ApiError
        ? { message: err.message, retryable: err.retryable }
        : { message: 'Đã xảy ra lỗi. Vui lòng thử lại.', retryable: true }
      toast.error(info.message)
      setError(info)
      setPageState('error')
    }
  }

  useEffect(() => {
    if (!ocrLatex) { router.replace('/camera'); return }
    if (!deviceId) return
    void runSolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLatex, deviceId])

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {pageState === 'loading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-[70%]" />
          <Skeleton className="h-16 w-[50%]" />
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888]">
            Đang phân tích bài toán<span className="animate-pulse">_</span>
          </p>
        </div>
      )}

      {pageState === 'error' && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="w-full rounded-[16px] border border-black/5 p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[15px] text-[#333]">{error.message}</p>
            {error.retryable && (
              <button
                onClick={runSolve}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      )}

      {pageState === 'success' && (
        <>
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-full text-[#888] hover:bg-[#fafafa]"
              aria-label="Quay lại"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <h1 className="text-[16px] font-medium text-[#0d0d0d]">Lời giải</h1>
          </header>

          <div className="border-b border-black/5 bg-[#fafafa] px-4 py-3">
            {ocrLatex && <KaTeXRenderer latex={ocrLatex} />}
          </div>

          <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[88px]">
            {steps.map(step => (
              <StepCard
                key={step.index}
                step={step}
                isOpen={openSteps.has(step.index)}
                onToggle={() => toggleStep(step.index)}
              />
            ))}
          </main>

          <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 flex items-center gap-3 border-t border-black/5 bg-white px-4 py-3">
            <button
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-black/5 text-[#0d0d0d]"
              aria-label="Đánh dấu"
            >
              <Bookmark className="size-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => { reset(); router.push('/') }}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
            >
              Bài mới
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 7.2: Typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 7.3: Run full test suite**

```bash
cd src/client && pnpm test
```
Expected: all tests pass.

- [ ] **Step 7.4: Commit**

```bash
git add src/client/app/solve/page.tsx
git commit -m "feat(client): add solve page with S-06 loading and S-07 accordion solution"
```

---

## Task 8: Build & Smoke Verification

- [ ] **Step 8.1: Production build**

```bash
cd src/client && pnpm build
```
Expected: no errors; `Route (app)` table shows `/ocr` and `/solve` in output.

- [ ] **Step 8.2: Start dev server**

```bash
cd src/client && pnpm dev
```
Navigate to `http://localhost:3000`.

- [ ] **Step 8.3: Browser Network tab — X-Device-ID header**

Open DevTools → Network tab. Navigate through camera → crop → OCR page. Confirm:
- `POST /api/ocr` request has `X-Device-ID: <uuid>` header
- After tapping "Giải bài này": `POST /api/solve` request has same `X-Device-ID` header

- [ ] **Step 8.4: S-05 live KaTeX preview**

On the OCR confirm screen, edit the textarea. Confirm the rendered KaTeX above the textarea updates in real-time without page reload.

- [ ] **Step 8.5: S-05 confidence badge**

To test: temporarily in `ocr/page.tsx` change `setConfidence(formula.confidence)` to `setConfidence(0.5)` — confirm amber badge appears. Revert.

- [ ] **Step 8.6: S-07 accordion and answer step**

On the solve page with a successful response:
- Tap each step header — confirm body expands/collapses with animation
- Confirm the `isAnswer: true` step has green left border and "Đáp án" badge
- Confirm answer formula displays at large size

- [ ] **Step 8.7: No BottomNav on /solve**

Navigate to `/solve`. Confirm the BottomNav component is not visible and not in the DOM (flat route outside `(main)` layout).

- [ ] **Step 8.8: Bài mới reset**

From S-07, tap "Bài mới". Confirm the router navigates to `/` and the capture flow context is cleared (attempting to navigate back to `/solve` redirects to `/camera`).

- [ ] **Step 8.9: Final commit**

```bash
git add -p  # review all changes
git commit -m "chore(client): verify frontend-solve-flow complete"
```

---

## Spec Coverage Self-Check

| Spec requirement | Covered in task |
|---|---|
| `getDeviceId` generates UUID v4, persists, reads | Task 2 |
| `getDeviceId` matches UUID v4 regex | Task 2 test |
| `useDeviceId` returns null before hydration | Task 3 (SSR-safe `useState(null)`) |
| `ApiError` class with `code`/`retryable` | Task 4 |
| `postOcr` sends multipart with `X-Device-ID` | Task 4 |
| `postSolve` sends JSON with `X-Device-ID` | Task 4 |
| CaptureContext extended with `ocrLatex`/`solveResult` | Task 5 |
| `reset()` clears all four fields | Task 5 |
| OCR page guard: null `croppedBlob` → `/camera` | Task 6 (preserved) |
| OCR page fires `postOcr` on mount | Task 6 |
| OCR loading skeleton + label | Task 6 |
| Thumbnail from `croppedBlob` objectUrl | Task 6 |
| KaTeX live preview on textarea change | Task 6 |
| Low-confidence amber badge (`< 0.6`) | Task 6 |
| "Giải bài này" disabled when empty | Task 6 |
| "Giải bài này" stores `ocrLatex` → `/solve` | Task 6 |
| "Chụp lại" resets + → `/camera` | Task 6 |
| Object URL revoked on unmount | Task 6 (`useEffect` cleanup) |
| Solve page guard: null `ocrLatex` → `/camera` | Task 7 |
| S-06 skeleton + "Đang phân tích bài toán_" | Task 7 |
| No BottomNav on `/solve` | Task 7 (flat route) |
| All steps expandable via accordion | Task 7 `StepCard` |
| `isAnswer` card: green border + "Đáp án" + large formula | Task 7 `StepCard` |
| `AnimatePresence` height animation | Task 7 `motion.div` |
| Error toast + inline card + retryable button | Task 7 |
| "Bài mới" → `reset()` + `/` | Task 7 |
| Bookmark button stub (no-op) | Task 7 |
