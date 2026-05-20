# frontend-camera-flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 4-screen camera intake flow (Home → Camera → Crop → OCR skeleton) with shared CaptureContext, so MathSnap is fully navigable on mobile without any backend dependency.

**Architecture:** Separate Next.js routes under `app/(main)/` route group share a `CaptureContext` (provided in the route group layout) that holds `capturedBlob` and `croppedBlob` as in-memory Blobs — never serialized to storage. BottomNav is visible only on Home; hidden on camera/crop/ocr. TDD throughout: test file written and run failing before each implementation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Vitest + happy-dom + React Testing Library, react-easy-crop, KaTeX (already installed), lucide-react.

---

## Task 1: Foundation — Dependencies, Types, Tokens

**Files:**
- Modify: `src/client/package.json`
- Create: `src/client/vitest.setup.ts`
- Create: `src/client/types/history.ts`
- Create: `src/client/fixtures/solution.ts`
- Modify: `src/client/app/globals.css`

- [ ] **Step 1: Install runtime and dev dependencies**

From `src/client/`:
```bash
pnpm add react-easy-crop
pnpm add -D @testing-library/react @testing-library/user-event @vitejs/plugin-react
```

Expected: no peer dep warnings about React 19. If `react-easy-crop` warns, verify it supports React 19 (v5.x does).

- [ ] **Step 2: Verify vitest.config.ts has correct environment and alias, update if needed**

Open `src/client/vitest.config.ts`. It must have `environment: 'happy-dom'` and `@/` alias resolving to the project root. If not, replace the entire file with:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Create `src/client/vitest.setup.ts`** — global mocks needed by multiple tests

```typescript
import { vi } from 'vitest'

// URL.createObjectURL / revokeObjectURL are not implemented in happy-dom
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
})
```

- [ ] **Step 4: Create `src/client/types/history.ts`**

```typescript
export interface SolutionStep {
  index: number
  title: string
  explanation: string
  formula: string | undefined
  isAnswer: boolean
}

export interface HistoryItem {
  id: string
  deviceId: string
  latex: string
  solutionSteps: SolutionStep[]
  language: 'vi' | 'en'
  createdAt: string
  isBookmarked: boolean
}
```

- [ ] **Step 5: Create `src/client/fixtures/solution.ts`**

```typescript
import type { SolutionStep } from '@/types/history'

export const MOCK_SOLUTION_STEPS: SolutionStep[] = [
  {
    index: 1,
    title: 'Chuyển vế',
    explanation: 'Chuyển +3 sang vế phải, đổi dấu thành -3',
    formula: '2x = 7 - 3',
    isAnswer: false,
  },
  {
    index: 2,
    title: 'Rút gọn',
    explanation: 'Không cần trung gian — tính trực tiếp',
    formula: undefined,
    isAnswer: false,
  },
  {
    index: 3,
    title: 'Kết quả',
    explanation: 'Chia cả hai vế cho 2',
    formula: 'x = 2',
    isAnswer: true,
  },
]
```

- [ ] **Step 6: Add brand tokens to `src/client/app/globals.css`**

Inside the existing `:root { ... }` block (after `--radius: 0.625rem;`), add:

```css
    --color-brand: oklch(0.82 0.15 155);      /* #18E299 in oklch */
    --color-brand-light: oklch(0.95 0.05 155); /* #d4fae8 */
    --color-brand-deep: oklch(0.60 0.14 155);  /* #0fa76e */
```

> Note: Tailwind v4 uses OKLCH internally. Use `oklch(0.82 0.15 155)` for `#18E299`. If pixel-exact hex is required for a component, use `#18E299` inline in that component's Tailwind class.

- [ ] **Step 7: Run typecheck to confirm `fixtures/history.ts` now compiles**

```bash
cd src/client && pnpm typecheck
```

Expected: 0 errors. Previously failing due to missing `@/types/history`.

- [ ] **Step 8: Commit**

```bash
git add src/client/types/history.ts src/client/fixtures/solution.ts \
        src/client/app/globals.css src/client/vitest.setup.ts \
        src/client/package.json src/client/pnpm-lock.yaml
git commit -m "feat(client): add history types, solution fixtures, brand tokens, test deps"
```

---

## Task 2: CaptureContext (TDD)

**Files:**
- Create: `src/client/contexts/CaptureContext.test.tsx`
- Create: `src/client/contexts/CaptureContext.tsx`

- [ ] **Step 1: Write the failing test — `src/client/contexts/CaptureContext.test.tsx`**

```typescript
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CaptureProvider, useCaptureContext } from './CaptureContext'

describe('CaptureContext', () => {
  it('initial state has null blobs', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    expect(result.current.capturedBlob).toBeNull()
    expect(result.current.croppedBlob).toBeNull()
  })

  it('setCapturedBlob updates capturedBlob', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    act(() => { result.current.setCapturedBlob(blob) })
    expect(result.current.capturedBlob).toBe(blob)
  })

  it('setCroppedBlob updates croppedBlob', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    act(() => { result.current.setCroppedBlob(blob) })
    expect(result.current.croppedBlob).toBe(blob)
  })

  it('reset clears both blobs', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    act(() => {
      result.current.setCapturedBlob(blob)
      result.current.setCroppedBlob(blob)
    })
    act(() => { result.current.reset() })
    expect(result.current.capturedBlob).toBeNull()
    expect(result.current.croppedBlob).toBeNull()
  })

  it('useCaptureContext throws outside CaptureProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCaptureContext())).toThrow(/CaptureProvider/)
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test contexts/CaptureContext
```

Expected: FAIL — "Cannot find module './CaptureContext'"

- [ ] **Step 3: Implement `src/client/contexts/CaptureContext.tsx`**

```typescript
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface CaptureState {
  capturedBlob: Blob | null
  croppedBlob: Blob | null
  setCapturedBlob: (blob: Blob) => void
  setCroppedBlob: (blob: Blob) => void
  reset: () => void
}

const CaptureContext = createContext<CaptureState | null>(null)

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  function reset() {
    setCapturedBlob(null)
    setCroppedBlob(null)
  }

  return (
    <CaptureContext.Provider
      value={{ capturedBlob, croppedBlob, setCapturedBlob, setCroppedBlob, reset }}
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

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd src/client && pnpm test contexts/CaptureContext
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/client/contexts/CaptureContext.tsx src/client/contexts/CaptureContext.test.tsx
git commit -m "feat(client): add CaptureContext with capturedBlob/croppedBlob state"
```

---

## Task 3: useCamera Hook (TDD)

**Files:**
- Create: `src/client/hooks/useCamera.test.ts`
- Create: `src/client/hooks/useCamera.ts`

- [ ] **Step 1: Write the failing test — `src/client/hooks/useCamera.test.ts`**

```typescript
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useCamera } from './useCamera'

function makeMockTrack() {
  return { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack
}

function makeMockStream(tracks = [makeMockTrack()]) {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks,
  } as unknown as MediaStream
}

describe('useCamera', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGetUserMedia = vi.fn().mockResolvedValue(makeMockStream())
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: mockGetUserMedia },
    })
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls getUserMedia with environment facingMode', async () => {
    renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' },
      audio: false,
    })
  })

  it('stops all tracks on unmount', async () => {
    const tracks = [makeMockTrack()]
    mockGetUserMedia.mockResolvedValue(makeMockStream(tracks))
    const { unmount } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    unmount()
    tracks.forEach(t => expect(t.stop).toHaveBeenCalled())
  })

  it('captureFrame returns a Blob with type image/jpeg', async () => {
    const fakeBlob = new Blob(['img'], { type: 'image/jpeg' })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb) => { cb(fakeBlob) }
    )
    const { result } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    let blob: Blob | null = null
    await act(async () => { blob = await result.current.captureFrame() })
    expect((blob as unknown as Blob).type).toBe('image/jpeg')
  })

  it('flipCamera restarts stream with opposite facingMode', async () => {
    const { result } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    expect(result.current.facingMode).toBe('environment')
    await act(async () => {
      result.current.flipCamera()
      await Promise.resolve()
    })
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' },
      audio: false,
    })
    expect(result.current.facingMode).toBe('user')
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test hooks/useCamera
```

Expected: FAIL — "Cannot find module './useCamera'"

- [ ] **Step 3: Implement `src/client/hooks/useCamera.ts`**

```typescript
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

type FacingMode = 'environment' | 'user'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [isReady, setIsReady] = useState(false)

  const startStream = useCallback(async (mode: FacingMode) => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      })
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    }
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    setIsReady(true)
  }, [])

  useEffect(() => {
    startStream('environment')
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = useCallback(() => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startStream(next)
  }, [facingMode, startStream])

  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) { reject(new Error('refs not attached')); return }
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no 2d context')); return }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/jpeg',
        0.85
      )
    })
  }, [])

  return { videoRef, canvasRef, facingMode, flipCamera, captureFrame, isReady }
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd src/client && pnpm test hooks/useCamera
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/client/hooks/useCamera.ts src/client/hooks/useCamera.test.ts
git commit -m "feat(client): add useCamera hook with getUserMedia, capture, and flip"
```

---

## Task 4: BottomNav Component (TDD)

**Files:**
- Create: `src/client/components/BottomNav.test.tsx`
- Create: `src/client/components/BottomNav.tsx`

- [ ] **Step 1: Write the failing test — `src/client/components/BottomNav.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

describe('BottomNav', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders 3 tab links', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<BottomNav />)
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('Home tab has aria-current="page" at /', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<BottomNav />)
    const homeLink = screen.getByRole('link', { name: /trang chủ/i })
    expect(homeLink.getAttribute('aria-current')).toBe('page')
  })

  it('History tab has aria-current="page" at /history', () => {
    vi.mocked(usePathname).mockReturnValue('/history')
    render(<BottomNav />)
    const historyLink = screen.getByRole('link', { name: /lịch sử/i })
    expect(historyLink.getAttribute('aria-current')).toBe('page')
  })

  it('returns null on /camera (hidden on capture routes)', () => {
    vi.mocked(usePathname).mockReturnValue('/camera')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null on /crop', () => {
    vi.mocked(usePathname).mockReturnValue('/crop')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null on /ocr', () => {
    vi.mocked(usePathname).mockReturnValue('/ocr')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test components/BottomNav
```

Expected: FAIL — "Cannot find module './BottomNav'"

- [ ] **Step 3: Implement `src/client/components/BottomNav.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Settings } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/history', label: 'Lịch sử', icon: Clock },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
] as const

const CAPTURE_ROUTES = ['/camera', '/crop', '/ocr']

export default function BottomNav() {
  const pathname = usePathname()
  if (CAPTURE_ROUTES.some(r => pathname.startsWith(r))) return null

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-black/5 bg-white">
      <ul className="flex h-16 items-center justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-[#18E299]' : 'text-gray-500 hover:text-[#18E299]'
                }`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd src/client && pnpm test components/BottomNav
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/client/components/BottomNav.tsx src/client/components/BottomNav.test.tsx
git commit -m "feat(client): add BottomNav with 3 tabs, hidden on capture flow routes"
```

---

## Task 5: KaTeXRenderer Stub (TDD)

**Files:**
- Create: `src/client/components/KaTeXRendererImpl.tsx`
- Create: `src/client/components/KaTeXRendererImpl.test.tsx`
- Create: `src/client/components/KaTeXRenderer.tsx`

- [ ] **Step 1: Write the failing test — `src/client/components/KaTeXRendererImpl.test.tsx`**

```typescript
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import KaTeXRendererImpl from './KaTeXRendererImpl'

describe('KaTeXRendererImpl', () => {
  it('renders without crashing given a latex prop', () => {
    const { container } = render(<KaTeXRendererImpl latex="x^2" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders a non-empty span', () => {
    const { container } = render(<KaTeXRendererImpl latex="\\frac{1}{2}" />)
    const span = container.querySelector('span')
    expect(span).toBeTruthy()
    expect(span!.innerHTML.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test components/KaTeXRendererImpl
```

Expected: FAIL — "Cannot find module './KaTeXRendererImpl'"

- [ ] **Step 3: Implement `src/client/components/KaTeXRendererImpl.tsx`**

```typescript
'use client'

import katex from 'katex'

interface Props {
  latex: string
}

export default function KaTeXRendererImpl({ latex }: Props) {
  const html = katex.renderToString(latex, { throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
```

> Note: `katex/dist/katex.min.css` import should go in the page that uses this component to avoid SSR CSS issues. Do not import it here.

- [ ] **Step 4: Create `src/client/components/KaTeXRenderer.tsx`** (dynamic wrapper)

```typescript
import dynamic from 'next/dynamic'

const KaTeXRenderer = dynamic(() => import('./KaTeXRendererImpl'), { ssr: false })

export default KaTeXRenderer
```

- [ ] **Step 5: Run test — confirm it passes**

```bash
cd src/client && pnpm test components/KaTeXRendererImpl
```

Expected: PASS — 2 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/client/components/KaTeXRendererImpl.tsx \
        src/client/components/KaTeXRendererImpl.test.tsx \
        src/client/components/KaTeXRenderer.tsx
git commit -m "feat(client): add KaTeXRenderer lazy-load stub with katex.renderToString"
```

---

## Task 6: Main Layout + Home Screen (TDD)

**Files:**
- Create: `src/client/app/(main)/layout.tsx`
- Create: `src/client/app/(main)/page.test.tsx`
- Create: `src/client/app/(main)/page.tsx`
- Delete: `src/client/app/page.tsx`

- [ ] **Step 1: Create `src/client/app/(main)/layout.tsx`**

```typescript
import { CaptureProvider } from '@/contexts/CaptureContext'
import BottomNav from '@/components/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CaptureProvider>
      <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
        <main className="flex-1 pb-16">{children}</main>
        <BottomNav />
      </div>
    </CaptureProvider>
  )
}
```

- [ ] **Step 2: Write the failing test — `src/client/app/(main)/page.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import HomePage from './page'

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders 3 CTA buttons', () => {
    render(<HomePage />)
    expect(screen.getByText('Chụp ảnh')).toBeTruthy()
    expect(screen.getByText('Thư viện')).toBeTruthy()
    expect(screen.getByText('Lịch sử')).toBeTruthy()
  })

  it('Camera CTA navigates to /camera', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('Chụp ảnh'))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders without crashing', () => {
    expect(() => render(<HomePage />)).not.toThrow()
  })
})
```

- [ ] **Step 3: Run test — confirm it fails**

```bash
cd src/client && pnpm test "app/\\(main\\)/page"
```

Expected: FAIL — module not found

- [ ] **Step 4: Implement `src/client/app/(main)/page.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Camera, ImageIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0d0d0d]">
          MathSnap
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Chụp ảnh bài toán, nhận lời giải từng bước
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          className="h-12 w-full rounded-full bg-[#18E299] text-[#0d0d0d] font-medium hover:bg-[#0fa76e] hover:text-white"
          onClick={() => router.push('/camera')}
        >
          <Camera className="mr-2 size-5" />
          Chụp ảnh
        </Button>

        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={() => { /* G3: no-op — gallery integration in future change */ }}
        >
          <ImageIcon className="mr-2 size-5" />
          Thư viện
        </Button>

        <Button
          variant="ghost"
          className="h-12 w-full rounded-full"
          onClick={() => { /* G3: no-op — history screen in G6 */ }}
        >
          <Clock className="mr-2 size-5" />
          Lịch sử
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Delete the old placeholder**

```bash
rm src/client/app/page.tsx
```

- [ ] **Step 6: Run test — confirm it passes**

```bash
cd src/client && pnpm test "app/\\(main\\)/page"
```

Expected: PASS — 3 tests passing

- [ ] **Step 7: Commit**

```bash
git add src/client/app/\(main\)/layout.tsx \
        src/client/app/\(main\)/page.tsx \
        src/client/app/\(main\)/page.test.tsx
git rm src/client/app/page.tsx
git commit -m "feat(client): add main layout, Home screen (S-01) with 3 CTAs"
```

---

## Task 7: Camera Screen (TDD)

**Files:**
- Create: `src/client/app/(main)/camera/page.test.tsx`
- Create: `src/client/app/(main)/camera/page.tsx`

- [ ] **Step 1: Write the failing test — `src/client/app/(main)/camera/page.test.tsx`**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockSetCapturedBlob = vi.fn()
const mockCaptureFrame = vi.fn()
const mockFlipCamera = vi.fn()
const fakeBlob = new Blob(['frame'], { type: 'image/jpeg' })

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({
    capturedBlob: null,
    croppedBlob: null,
    setCapturedBlob: mockSetCapturedBlob,
    setCroppedBlob: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    facingMode: 'environment' as const,
    flipCamera: mockFlipCamera,
    captureFrame: mockCaptureFrame,
    isReady: true,
  }),
}))

import CameraPage from './page'

describe('CameraPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCaptureFrame.mockResolvedValue(fakeBlob)
  })

  it('renders a video element with autoPlay and playsInline', () => {
    const { container } = render(<CameraPage />)
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video!.hasAttribute('autoplay') || video!.hasAttribute('autoPlay')).toBe(true)
    expect(video!.hasAttribute('playsinline') || video!.hasAttribute('playsInline')).toBe(true)
  })

  it('renders shutter button with aria-label "Chụp ảnh"', () => {
    render(<CameraPage />)
    expect(screen.getByRole('button', { name: 'Chụp ảnh' })).toBeTruthy()
  })

  it('shutter click calls setCapturedBlob then navigates to /crop', async () => {
    render(<CameraPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Chụp ảnh' }))
    await waitFor(() => {
      expect(mockSetCapturedBlob).toHaveBeenCalledWith(fakeBlob)
      expect(mockPush).toHaveBeenCalledWith('/crop')
    })
  })

  it('flip button calls flipCamera', () => {
    render(<CameraPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xoay camera' }))
    expect(mockFlipCamera).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test "camera/page"
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/client/app/(main)/camera/page.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useCamera } from '@/hooks/useCamera'
import { useCaptureContext } from '@/contexts/CaptureContext'

export default function CameraPage() {
  const router = useRouter()
  const { videoRef, canvasRef, flipCamera, captureFrame, isReady } = useCamera()
  const { setCapturedBlob } = useCaptureContext()

  async function handleCapture() {
    const blob = await captureFrame()
    setCapturedBlob(blob)
    router.push('/crop')
  }

  return (
    <div className="relative flex h-dvh w-full flex-col bg-black">
      {/* Live viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {/* Off-screen capture canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-8 pb-10 pt-4">
        {/* Spacer to balance flip button */}
        <div className="size-10" aria-hidden="true" />

        {/* Shutter */}
        <button
          aria-label="Chụp ảnh"
          disabled={!isReady}
          onClick={handleCapture}
          className="size-16 rounded-full border-4 border-white bg-white/30 transition-transform active:scale-95 disabled:opacity-40"
        />

        {/* Flip camera */}
        <button
          aria-label="Xoay camera"
          onClick={flipCamera}
          className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <RefreshCw className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd src/client && pnpm test "camera/page"
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/client/app/\(main\)/camera/page.tsx \
        src/client/app/\(main\)/camera/page.test.tsx
git commit -m "feat(client): add Camera screen (S-02) with getUserMedia viewfinder"
```

---

## Task 8: getCroppedImg Helper + Crop Screen (TDD)

**Files:**
- Create: `src/client/lib/getCroppedImg.ts`
- Create: `src/client/app/(main)/crop/page.test.tsx`
- Create: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Create `src/client/lib/getCroppedImg.ts`** (no test needed — thin canvas utility)

```typescript
import type { Area } from 'react-easy-crop'

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no 2d context')); return }
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height
      )
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/jpeg',
        0.85
      )
    })
    image.addEventListener('error', () => reject(new Error('image load error')))
    image.src = imageSrc
  })
}
```

- [ ] **Step 2: Write the failing test — `src/client/app/(main)/crop/page.test.tsx`**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Area } from 'react-easy-crop'

const mockPush = vi.fn()
const mockSetCroppedBlob = vi.fn()
const mockCapturedBlob = new Blob(['frame'], { type: 'image/jpeg' })
const fakeCroppedBlob = new Blob(['cropped'], { type: 'image/jpeg' })

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))

vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }: {
    onCropComplete: (_: Area, pixels: Area) => void
  }) => {
    // Fire onCropComplete immediately with a fake crop area
    onCropComplete(
      { x: 0, y: 0, width: 100, height: 75 },
      { x: 0, y: 0, width: 400, height: 300 }
    )
    return <div data-testid="cropper" />
  },
}))

vi.mock('@/lib/getCroppedImg', () => ({
  getCroppedImg: vi.fn().mockResolvedValue(fakeCroppedBlob),
}))

import CropPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'

describe('CropPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when capturedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders Cropper when capturedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    expect(screen.getByTestId('cropper')).toBeTruthy()
  })

  it('Confirm calls setCroppedBlob and navigates to /ocr', async () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
    await waitFor(() => {
      expect(mockSetCroppedBlob).toHaveBeenCalledWith(fakeCroppedBlob)
      expect(mockPush).toHaveBeenCalledWith('/ocr')
    })
  })

  it('Cancel navigates to /camera', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })
})
```

- [ ] **Step 3: Run test — confirm it fails**

```bash
cd src/client && pnpm test "crop/page"
```

Expected: FAIL — module not found

- [ ] **Step 4: Implement `src/client/app/(main)/crop/page.tsx`**

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { getCroppedImg } from '@/lib/getCroppedImg'

export default function CropPage() {
  const router = useRouter()
  const { capturedBlob, setCroppedBlob } = useCaptureContext()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!capturedBlob) { router.push('/camera'); return }
    const url = URL.createObjectURL(capturedBlob)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [capturedBlob, router])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!imageUrl || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageUrl, croppedAreaPixels)
    setCroppedBlob(blob)
    router.push('/ocr')
  }

  if (!capturedBlob || !imageUrl) return null

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          minZoom={1}
          maxZoom={3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-6 py-6">
        <button
          aria-label="Hủy"
          onClick={() => router.push('/camera')}
          className="flex-1 rounded-full border border-white/30 py-3 text-sm font-medium text-white transition-colors hover:border-white/50"
        >
          Hủy
        </button>
        <button
          aria-label="Xác nhận"
          onClick={handleConfirm}
          className="flex-1 rounded-full bg-[#18E299] py-3 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-[#0fa76e]"
        >
          Xác nhận
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test — confirm it passes**

```bash
cd src/client && pnpm test "crop/page"
```

Expected: PASS — 4 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/client/lib/getCroppedImg.ts \
        src/client/app/\(main\)/crop/page.tsx \
        src/client/app/\(main\)/crop/page.test.tsx
git commit -m "feat(client): add getCroppedImg helper and Crop screen (S-03)"
```

---

## Task 9: OCR Loading Screen (TDD)

**Files:**
- Create: `src/client/app/(main)/ocr/page.test.tsx`
- Create: `src/client/app/(main)/ocr/page.tsx`

- [ ] **Step 1: Write the failing test — `src/client/app/(main)/ocr/page.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))

import OcrPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'

describe('OcrPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when croppedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders skeleton elements when croppedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('makes no fetch calls', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd src/client && pnpm test "ocr/page"
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/client/app/(main)/ocr/page.tsx`**

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCaptureContext } from '@/contexts/CaptureContext'

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`animate-pulse rounded-lg bg-gray-100 ${className}`}
    />
  )
}

export default function OcrPage() {
  const router = useRouter()
  const { croppedBlob } = useCaptureContext()

  useEffect(() => {
    if (!croppedBlob) router.push('/camera')
  }, [croppedBlob, router])

  if (!croppedBlob) return null

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-8">
      {/* Loading label */}
      <div className="mb-6 text-center">
        <Skeleton className="mx-auto mb-3 h-4 w-28" />
        <p className="text-xs text-gray-400">Đang nhận dạng công thức...</p>
      </div>

      {/* Formula area skeleton */}
      <div className="mb-6 rounded-2xl border border-black/5 p-5">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Steps skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-black/5 p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd src/client && pnpm test "ocr/page"
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/client/app/\(main\)/ocr/page.tsx \
        src/client/app/\(main\)/ocr/page.test.tsx
git commit -m "feat(client): add OCR loading skeleton (S-04), no API call"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full test suite — confirm 0 failures**

```bash
cd src/client && pnpm test
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Run TypeScript check — confirm 0 errors**

```bash
cd src/client && pnpm typecheck
```

Expected: 0 errors. Common failure: missing `@/` alias in vitest config — verify `resolve.alias` in `vitest.config.ts`.

- [ ] **Step 3: Run lint — confirm 0 errors**

```bash
cd src/client && pnpm lint
```

Fix any reported issues before proceeding.

- [ ] **Step 4: Start dev server and manually verify on mobile**

```bash
cd src/client && pnpm dev
```

Open `http://localhost:3000` in Chrome DevTools with mobile simulation (e.g., iPhone 12). Verify:
- [ ] Home screen shows "MathSnap" heading + 3 CTAs + BottomNav
- [ ] Tap "Chụp ảnh" → navigates to `/camera`
- [ ] Camera screen: video element visible, shutter button present, flip button present
- [ ] BottomNav NOT visible on `/camera`
- [ ] Tap shutter → navigates to `/crop` (will show Cropper with captured frame)
- [ ] Tap "Xác nhận" → navigates to `/ocr` (skeleton visible, no network call in DevTools)
- [ ] Tap "Hủy" on Crop → goes back to `/camera`
- [ ] Navigate directly to `/crop` without capturing → redirects to `/camera`
- [ ] Navigate directly to `/ocr` without cropping → redirects to `/camera`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(client): complete G3 frontend-camera-flow — 4 screens navigable"
```
