# Gap-Analysis Conformance Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the pre-G7 release-blocking gaps by bringing the codebase into conformance with `openspec/specs/` (6 fixes), with no backend contract change.

**Architecture:** Next.js 16 App Router frontend (`src/client/`, Vitest + @testing-library/react + happy-dom) and FastAPI backend (`src/server/`, pytest + TestClient). Each fix is isolated; implement TDD (failing test → minimal code → green → commit). Run client cmds from `src/client/` with `pnpm`, server cmds from `src/server/` with `uv run`.

**Tech Stack:** TypeScript/React 19, Tailwind v4, KaTeX, motion/react; Python 3.12, FastAPI, Pydantic v2, pix2tex.

---

### Task 1: Fix 3 — OCR server catch-all returns structured INTERNAL_ERROR

**Files:**
- Modify: `src/server/app/routers/ocr.py` (wrap handler body lines 27–111)
- Test: `src/server/tests/test_ocr_internal_error.py` (create)

- [ ] **Step 1: Write the failing tests**

```python
# src/server/tests/test_ocr_internal_error.py
from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

HEADERS = {"X-Device-ID": str(uuid4())}
PNG = ("t.png", b"\x89PNG\r\n\x1a\n", "image/png")


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_unexpected_exception_returns_internal_error(client):
    # check_burst runs after MIME/size validation; force an unexpected failure there
    with patch("app.rate_limit.check_burst", side_effect=RuntimeError("boom")):
        resp = client.post("/api/ocr", files={"image": PNG}, headers=HEADERS)
    assert resp.status_code == 500
    assert resp.json()["detail"]["code"] == "INTERNAL_ERROR"


def test_mapped_error_passes_through(client):
    # wrong MIME must stay INVALID_IMAGE, not be masked as INTERNAL_ERROR
    resp = client.post(
        "/api/ocr", files={"image": ("t.pdf", b"%PDF-1.4", "application/pdf")}, headers=HEADERS
    )
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "INVALID_IMAGE"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd src/server && uv run pytest tests/test_ocr_internal_error.py -v`
Expected: `test_unexpected_exception_returns_internal_error` FAILS (returns bare 500 without structured `code`).

- [ ] **Step 3: Wrap the handler body in a catch-all**

In `src/server/app/routers/ocr.py`, indent the existing body (current lines 27–111) one level into a `try:` and append the handlers. The catch-all must re-raise `HTTPException` so mapped errors are untouched:

```python
@router.post("/ocr", response_model=OcrResponse, tags=["OCR"])
async def ocr(
    request: Request,
    image: UploadFile = File(...),
    device_id: UUID = Depends(validate_device_id),
) -> OcrResponse:
    try:
        # ... existing body unchanged (MIME check, size check, burst, daily,
        #     Image.open, ocr_model call, empty check) ...
        return OcrResponse(formulas=[OcrFormula(latex=latex_result.strip())])
    except HTTPException:
        raise
    except Exception:
        logger.exception("ocr_internal_error device=%s...", str(device_id)[:8])
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                code=INTERNAL_ERROR,
                message="An unexpected error occurred.",
                retryable=True,
            ).model_dump(),
        )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd src/server && uv run pytest tests/test_ocr_internal_error.py tests/test_ocr_rate_limit.py -v`
Expected: all PASS (new tests green; existing OCR rate-limit tests unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/server/app/routers/ocr.py src/server/tests/test_ocr_internal_error.py
git commit -m "fix(server): return structured INTERNAL_ERROR on unexpected OCR failure"
```

---

### Task 2: Fix 1 — History detail renders all steps expanded

**Files:**
- Modify: `src/client/app/(main)/history/[id]/page.tsx:22,28-32`
- Test: `src/client/app/(main)/history/[id]/page.test.tsx`

- [ ] **Step 1: Write the failing test** (mock StepCard so `isOpen` is observable)

```tsx
// add to history/[id]/page.test.tsx — mock StepCard to expose isOpen
vi.mock('@/components/StepCard', () => ({
  StepCard: ({ step, isOpen }: { step: { index: number; title: string }; isOpen: boolean }) => (
    <div data-testid={`step-${step.index}`} data-open={isOpen}>{step.title}</div>
  ),
}))

it('renders all steps expanded on load', async () => {
  const item = {
    id: 'i1', deviceId: 'd1', latex: 'x', language: 'vi', createdAt: '', isBookmarked: false,
    solutionSteps: [
      { index: 1, title: 'A', explanation: '', isAnswer: false },
      { index: 2, title: 'B', explanation: '', isAnswer: false },
      { index: 3, title: 'C', explanation: '', isAnswer: true },
    ],
  }
  vi.mocked(getHistoryItem).mockResolvedValueOnce(item as any)
  vi.mocked(useDeviceId).mockReturnValue('d1')
  render(<HistoryDetailPage />)
  const cards = await screen.findAllByTestId(/^step-/)
  expect(cards).toHaveLength(3)
  cards.forEach(c => expect(c.getAttribute('data-open')).toBe('true'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run "app/(main)/history/[id]/page.test.tsx"`
Expected: FAIL — only `step-1` has `data-open="true"`.

- [ ] **Step 3: Implement all-open initialisation**

In `src/client/app/(main)/history/[id]/page.tsx`:
- Line 22: change `useState<Set<number>>(new Set([1]))` → `useState<Set<number>>(new Set<number>())`.
- In the `.then` callback (after `setItem(data)`), add: `setOpenSteps(new Set(data.solutionSteps.map(s => s.index)))`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run "app/(main)/history/[id]/page.test.tsx"`
Expected: PASS (all 3 cards `data-open="true"`; existing tests still green).

- [ ] **Step 5: Commit**

```bash
git add "src/client/app/(main)/history/[id]/page.tsx" "src/client/app/(main)/history/[id]/page.test.tsx"
git commit -m "fix(client): history detail opens all solution steps"
```

---

### Task 3: Fix 6 — Solve page starts all steps open

**Files:**
- Modify: `src/client/app/solve/page.tsx:31,54`
- Test: `src/client/app/solve/page.test.tsx`

- [ ] **Step 1: Write the failing test** (replace the StepCard mock to expose isOpen)

```tsx
// in solve/page.test.tsx, change the StepCard mock to surface isOpen:
vi.mock('@/components/StepCard', () => ({
  StepCard: ({ step, isOpen }: { step: { index: number; title: string }; isOpen: boolean }) => (
    <div data-testid={`step-${step.index}`} data-open={isOpen}>Step: {step.title}</div>
  ),
}))

it('starts with all steps expanded on success', async () => {
  const item = { ...mockItem, solutionSteps: [
    { index: 1, title: 'S1', explanation: '', isAnswer: false },
    { index: 2, title: 'S2', explanation: '', isAnswer: true },
  ] }
  vi.mocked(postSolve).mockResolvedValueOnce(item as any)
  vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
  vi.mocked(useDeviceId).mockReturnValue('device-456')
  render(<SolvePage />)
  const cards = await screen.findAllByTestId(/^step-/)
  expect(cards).toHaveLength(2)
  cards.forEach(c => expect(c.getAttribute('data-open')).toBe('true'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run app/solve/page.test.tsx`
Expected: FAIL — only `step-1` open.

- [ ] **Step 3: Implement all-open initialisation**

In `src/client/app/solve/page.tsx`:
- Line 31: `useState<Set<number>>(new Set([1]))` → `useState<Set<number>>(new Set<number>())`.
- In `runSolve`, after `setSteps(result.solutionSteps)` (line 54), add: `setOpenSteps(new Set(result.solutionSteps.map(s => s.index)))`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run app/solve/page.test.tsx`
Expected: PASS (both cards open; existing error/bookmark tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/client/app/solve/page.tsx src/client/app/solve/page.test.tsx
git commit -m "fix(client): solve page opens all steps per solution-viewer spec"
```

---

### Task 4: Fix 7 — Settings re-onboarding (context replay + wiring)

**Files:**
- Modify: `src/client/contexts/OnboardingContext.tsx`
- Test: `src/client/contexts/OnboardingContext.test.tsx`
- Modify: `src/client/app/(main)/settings/page.tsx:62-65`
- Test: `src/client/app/(main)/settings/page.test.tsx`

- [ ] **Step 1: Write the failing context test**

```tsx
// contexts/OnboardingContext.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { OnboardingProvider, useOnboarding } from './OnboardingContext'

function Probe() {
  const { hasSeenOnboarding, markAsSeen, replayOnboarding } = useOnboarding()
  return (
    <div>
      <span data-testid="seen">{String(hasSeenOnboarding)}</span>
      <button onClick={markAsSeen}>seen</button>
      <button onClick={replayOnboarding}>replay</button>
    </div>
  )
}

describe('useOnboarding replay', () => {
  beforeEach(() => localStorage.clear())
  it('replayOnboarding sets hasSeenOnboarding back to false', () => {
    render(<OnboardingProvider><Probe /></OnboardingProvider>)
    act(() => { screen.getByText('seen').click() })
    expect(screen.getByTestId('seen').textContent).toBe('true')
    act(() => { screen.getByText('replay').click() })
    expect(screen.getByTestId('seen').textContent).toBe('false')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run contexts/OnboardingContext.test.tsx`
Expected: FAIL — `replayOnboarding` is undefined (TypeError).

- [ ] **Step 3: Add `replayOnboarding` to the context**

In `src/client/contexts/OnboardingContext.tsx`:
- Add to `interface OnboardingState`: `replayOnboarding: () => void`.
- Add the function inside the provider: `function replayOnboarding() { setHasSeenOnboarding(false) }`.
- Include it in the provider value: `value={{ hasSeenOnboarding, markAsSeen, replayOnboarding }}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run contexts/OnboardingContext.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing settings test**

```tsx
// settings/page.test.tsx — add a mock for the onboarding hook
const mockReplay = vi.fn()
vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({ hasSeenOnboarding: true, markAsSeen: vi.fn(), replayOnboarding: mockReplay }),
}))

it('Xem lại hướng dẫn triggers replayOnboarding', () => {
  render(<SettingsPage />)
  fireEvent.click(screen.getByText('Xem lại hướng dẫn'))
  expect(mockReplay).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run "app/(main)/settings/page.test.tsx"`
Expected: FAIL — `replayOnboarding` not called (row has no handler).

- [ ] **Step 7: Wire the settings row**

In `src/client/app/(main)/settings/page.tsx`:
- Add import: `import { useOnboarding } from '@/contexts/OnboardingContext'`.
- In the component: `const { replayOnboarding } = useOnboarding()`.
- On the "Xem lại hướng dẫn" `<button>` (line 62), add: `onClick={replayOnboarding}`.

- [ ] **Step 8: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run "app/(main)/settings/page.test.tsx"`
Expected: PASS (existing language-toggle tests still green).

- [ ] **Step 9: Commit**

```bash
git add src/client/contexts/OnboardingContext.tsx src/client/contexts/OnboardingContext.test.tsx "src/client/app/(main)/settings/page.tsx" "src/client/app/(main)/settings/page.test.tsx"
git commit -m "feat(client): wire Settings 'Xem lại hướng dẫn' to replay onboarding"
```

---

### Task 5: Fix 2 — OCR client timeout (api + ocr page)

**Files:**
- Modify: `src/client/lib/api.ts` (`postOcr`)
- Test: `src/client/lib/api.test.ts`
- Modify: `src/client/app/(main)/ocr/page.tsx` (error block ~lines 94-113)
- Test: `src/client/app/(main)/ocr/page.test.tsx`

- [ ] **Step 1: Write the failing api test**

```ts
// lib/api.test.ts
import { postOcr, ApiError } from './api'

describe('postOcr timeout', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('throws OCR_TIMEOUT when the request aborts after 10s', async () => {
    vi.mocked(fetch).mockImplementationOnce((_url, init) =>
      new Promise((_resolve, reject) => {
        ;(init!.signal as AbortSignal).addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')))
      }))
    const p = postOcr(new Blob(['x']), 'dev')
    await vi.advanceTimersByTimeAsync(10000)
    await expect(p).rejects.toMatchObject({ code: 'OCR_TIMEOUT', retryable: true })
    await expect(p).rejects.toBeInstanceOf(ApiError)
  })

  it('clears the timer and resolves on a fast response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ formulas: [{ latex: 'x', confidence: 1 }] }), { status: 200 }))
    const res = await postOcr(new Blob(['x']), 'dev')
    expect(res.formulas[0].latex).toBe('x')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run lib/api.test.ts`
Expected: FAIL — `postOcr` has no AbortController, the abort test hangs/never rejects with `OCR_TIMEOUT`.

- [ ] **Step 3: Add the 10s AbortController to `postOcr`**

Replace `postOcr` in `src/client/lib/api.ts` with:

```ts
export async function postOcr(blob: Blob, deviceId: string): Promise<OcrResponse> {
  const form = new FormData()
  form.append('image', blob, 'image.jpg')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  let res: Response
  try {
    res = await fetch(`${BASE}/api/ocr`, {
      method: 'POST',
      headers: { 'X-Device-ID': deviceId },
      body: form,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('OCR_TIMEOUT', 'Nhận dạng quá lâu, vui lòng thử lại hoặc nhập thủ công.', true)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) await handleError(res)
  return res.json() as Promise<OcrResponse>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run lib/api.test.ts`
Expected: PASS (both new tests + existing api tests green).

- [ ] **Step 5: Write the failing ocr-page test**

```tsx
// app/(main)/ocr/page.test.tsx
it('OCR_TIMEOUT shows Thử lại and Nhập thủ công', async () => {
  vi.mocked(postOcr).mockRejectedValueOnce(new ApiError('OCR_TIMEOUT', 'Nhận dạng quá lâu...', true))
  vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, croppedBlob: new Blob(['x']) })
  vi.mocked(useDeviceId).mockReturnValue('dev')
  render(<OcrPage />)
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Nhập thủ công' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Nhập thủ công' }))
  expect(mockPush).toHaveBeenCalledWith('/manual')
})
```

(Match the existing `ocr/page.test.tsx` mock setup — `next/navigation`, `@/contexts/CaptureContext`, `@/hooks/useDeviceId`, `@/lib/api`, `@/components/KaTeXRenderer`. Reuse its `baseContext`/`mockPush`.)

- [ ] **Step 6: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run "app/(main)/ocr/page.test.tsx"`
Expected: FAIL — no "Nhập thủ công" button (current error block only renders Thử lại OR Chụp lại).

- [ ] **Step 7: Add the OCR_TIMEOUT branch to the ocr page error block**

In `src/client/app/(main)/ocr/page.tsx`, replace the error-state CTA block (currently the `errorInfo.retryable ? Thử lại : Chụp lại` ternary, ~lines 97-111) with a code-aware version:

```tsx
{errorInfo.code === 'OCR_TIMEOUT' ? (
  <div className="flex w-full flex-col gap-3">
    <button onClick={runOcr} className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white">
      Thử lại
    </button>
    <button onClick={() => router.push('/manual')} className="h-12 w-full rounded-full border border-black/8 text-[15px] font-medium text-[#0d0d0d]">
      Nhập thủ công
    </button>
  </div>
) : errorInfo.retryable ? (
  <button onClick={runOcr} className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white">
    Thử lại
  </button>
) : (
  <button onClick={() => { reset(); router.push('/camera') }} className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white">
    Chụp lại
  </button>
)}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run "app/(main)/ocr/page.test.tsx"`
Expected: PASS (new timeout test + existing OCR error/confirm tests green; confidence badge untouched).

- [ ] **Step 9: Commit**

```bash
git add src/client/lib/api.ts src/client/lib/api.test.ts "src/client/app/(main)/ocr/page.tsx" "src/client/app/(main)/ocr/page.test.tsx"
git commit -m "feat(client): 10s OCR timeout with manual-input fallback"
```

---

### Task 6: Fix 4 — Camera fallback (useCamera flag + Home probe)

**Files:**
- Modify: `src/client/hooks/useCamera.ts`
- Test: `src/client/hooks/useCamera.test.ts`
- Modify: `src/client/app/(main)/page.tsx`
- Test: `src/client/app/(main)/page.test.tsx`

- [ ] **Step 1: Write the failing useCamera tests** (follow existing `useCamera.test.ts` patterns; use `renderHook`)

```ts
import { renderHook, waitFor } from '@testing-library/react'

afterEach(() => { vi.unstubAllGlobals() }) // prevent navigator stub bleeding across tests

it('sets cameraUnavailable on NotAllowedError', async () => {
  const getUserMedia = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  const { result } = renderHook(() => useCamera())
  await waitFor(() => expect(result.current.cameraUnavailable).toBe(true))
})

it('keeps cameraUnavailable false on success', async () => {
  const stream = { getTracks: () => [] } as unknown as MediaStream
  const getUserMedia = vi.fn().mockResolvedValue(stream)
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  const { result } = renderHook(() => useCamera())
  await waitFor(() => expect(result.current.isReady).toBe(true))
  expect(result.current.cameraUnavailable).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run hooks/useCamera.test.ts`
Expected: FAIL — `cameraUnavailable` is undefined.

- [ ] **Step 3: Implement `cameraUnavailable` in `useCamera`**

In `src/client/hooks/useCamera.ts`:
- Add state: `const [cameraUnavailable, setCameraUnavailable] = useState(false)`.
- Rewrite `startStream` to classify failures instead of swallowing:

```ts
const startStream = useCallback(async (mode: FacingMode) => {
  streamRef.current?.getTracks().forEach(t => t.stop())
  if (!navigator.mediaDevices?.getUserMedia) { setCameraUnavailable(true); return }
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false })
  } catch {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    } catch {
      setCameraUnavailable(true)
      return
    }
  }
  streamRef.current = stream
  if (videoRef.current) videoRef.current.srcObject = stream
  setCameraUnavailable(false)
  setIsReady(true)
}, [])
```
- Add `cameraUnavailable` to the returned object.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/client && pnpm vitest run hooks/useCamera.test.ts`
Expected: PASS (new + existing camera tests green).

- [ ] **Step 5: Write the failing Home test**

```tsx
// app/(main)/page.test.tsx (follow home-screen test mocks: next/navigation, CaptureContext, sonner)
it('hides Chụp ảnh CTA when no camera device, keeps upload/manual', async () => {
  vi.stubGlobal('navigator', { mediaDevices: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'audioinput' }]),
  } })
  render(<HomePage />)
  await waitFor(() => expect(screen.queryByRole('button', { name: /chụp ảnh/i })).toBeNull())
  expect(screen.getByRole('button', { name: /tải lên/i })).toBeTruthy()
  expect(screen.getByText(/nhập latex/i)).toBeTruthy()
  expect((navigator.mediaDevices as any).getUserMedia).not.toHaveBeenCalled()
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd src/client && pnpm vitest run "app/(main)/page.test.tsx"`
Expected: FAIL — Camera CTA always rendered.

- [ ] **Step 7: Add the non-streaming probe to Home**

In `src/client/app/(main)/page.tsx` (add `useState`/`useEffect` imports):

```tsx
const [cameraAvailable, setCameraAvailable] = useState(true)
useEffect(() => {
  let cancelled = false
  ;(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { if (!cancelled) setCameraAvailable(false); return }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      if (!cancelled) setCameraAvailable(devices.some(d => d.kind === 'videoinput'))
    } catch {
      if (!cancelled) setCameraAvailable(false)
    }
  })()
  return () => { cancelled = true }
}, [])
```
Then wrap the "Chụp ảnh" `<Button>` (lines 37-43) in `{cameraAvailable && ( ... )}`.

- [ ] **Step 8: Fix pre-existing Home tests broken by the probe**

happy-dom ships `navigator.mediaDevices` WITHOUT `getUserMedia`, so after this change the probe hides the Camera CTA in any existing test that does not stub `navigator`. In `app/(main)/page.test.tsx`, any test asserting the "Chụp ảnh" CTA is **present** must first stub a camera-available environment, and the file needs cleanup to avoid global bleed:

```ts
afterEach(() => { vi.unstubAllGlobals() })

// inside each test that expects the Camera CTA visible:
vi.stubGlobal('navigator', { mediaDevices: {
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
} })
// then assert with await/waitFor so the post-effect state is observed:
expect(await screen.findByRole('button', { name: /chụp ảnh/i })).toBeTruthy()
```

- [ ] **Step 9: Run test to verify all Home tests pass**

Run: `cd src/client && pnpm vitest run "app/(main)/page.test.tsx"`
Expected: PASS (new hidden-CTA test + the fixed pre-existing tests all green).

- [ ] **Step 10: Commit**

```bash
git add src/client/hooks/useCamera.ts src/client/hooks/useCamera.test.ts "src/client/app/(main)/page.tsx" "src/client/app/(main)/page.test.tsx"
git commit -m "feat(client): surface camera-unavailable and hide dead Camera CTA"
```

---

### Task 7: Verification & wrap-up

- [ ] **Step 1: Full client suite** — Run: `cd src/client && pnpm test` — Expected: all green.
- [ ] **Step 2: Full server suite** — Run: `cd src/server && uv run pytest` — Expected: all green.
- [ ] **Step 3: Lint + typecheck** — Run: `cd src/client && pnpm lint && pnpm typecheck` — Expected: clean.
- [ ] **Step 4: Blast-radius check** — Run: `npx gitnexus detect_changes` — Expected: affected symbols limited to the files in this change's Impact list.
- [ ] **Step 5: Manual browser pass** — `cd src/client && pnpm dev`, then verify: history/bookmark detail all-open; solve all-open; Settings "Xem lại hướng dẫn" opens onboarding; OCR timeout (throttle network) shows Thử lại + Nhập thủ công; Home Camera CTA hidden on a no-camera profile with upload still working.
- [ ] **Step 6: Final commit (if any residual changes)** — `git status` clean or commit remaining test/lint fixups.

---

## Self-Review

- **Spec coverage:** Every delta maps to a task — `ocr-endpoint`→T1, `history-item-detail`→T2, `solution-viewer`→T3, `onboarding-overlay`+`settings-screen`→T4, `api-client`+`formula-preview-edit`→T5, `camera-intake-flow`+`home-screen`→T6. ✓
- **Placeholder scan:** No TBD/"add error handling" placeholders; all code steps include code. ✓
- **Type consistency:** `replayOnboarding` used identically in context + settings + tests; `cameraUnavailable` consistent in hook + tests; `OCR_TIMEOUT` consistent in api + ocr page + tests. ✓
