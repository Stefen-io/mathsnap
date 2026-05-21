# History & Bookmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the History & Bookmark feature set: fix one backend contract gap, build 5 new frontend pages, and wire 5 existing files.

**Architecture:** The backend already has all 4 history endpoints; only the PATCH /bookmark contract needs fixing (toggle → explicit body). The frontend builds on the existing `api.ts` + `ApiError` fetch pattern, `motion/react` (already installed), and the `CaptureContext`/`useDeviceId` hooks. The `StepCard` component is extracted from `solve/page.tsx` into its own file so both the solve page and the history detail page can share it.

**Tech Stack:** FastAPI (Python 3.12, uv), Next.js 16 App Router, Vitest + happy-dom, `motion/react`, KaTeX, Tailwind v4, shadcn/ui, Supabase.

---

## File Map

**Created:**
- `src/server/tests/test_history.py` — backend PATCH /bookmark tests
- `src/client/components/StepCard.tsx` — extracted from solve page (shared)
- `src/client/app/(main)/history/page.tsx` — S-08 History List
- `src/client/app/(main)/history/[id]/page.tsx` — History Item Detail
- `src/client/app/(main)/bookmarks/page.tsx` — S-09 Bookmark List
- `src/client/app/(main)/settings/page.tsx` — S-13 Settings
- `src/client/app/(main)/manual/page.tsx` — S-11 Manual LaTeX Input

**Modified:**
- `src/server/app/schemas/history.py` — add `BookmarkRequest`
- `src/server/app/services/supabase.py` — `toggle_bookmark` → `set_bookmark`
- `src/server/app/routers/history.py` — accept `BookmarkRequest` body
- `src/client/types/history.ts` — add `HistoryListResponse`
- `src/client/lib/api.ts` — add 4 history/bookmark functions
- `src/client/lib/api.test.ts` — tests for new functions (CREATE if absent)
- `src/client/components/BottomNav.tsx` — add Bookmarks tab
- `src/client/components/BottomNav.test.tsx` — update count assertion
- `src/client/app/solve/page.tsx` — wire bookmark button, use `StepCard`, read language from localStorage
- `src/client/app/solve/page.test.tsx` — add bookmark wiring test
- `src/client/app/(main)/page.tsx` — add file picker + Nhập LaTeX link
- `src/client/app/(main)/page.test.tsx` — update tests

---

### Task 1: Backend — Fix PATCH /bookmark contract

**Files:**
- Modify: `src/server/app/schemas/history.py`
- Modify: `src/server/app/services/supabase.py`
- Modify: `src/server/app/routers/history.py`
- Create: `src/server/tests/test_history.py`

- [ ] **Step 1.1: Write the failing tests**

Create `src/server/tests/test_history.py`:

```python
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4

DEVICE_ID = str(uuid4())
HEADERS = {"X-Device-ID": DEVICE_ID}
ITEM_ID = str(uuid4())


def _mock_item(is_bookmarked: bool) -> dict:
    return {
        "id": ITEM_ID,
        "device_id": DEVICE_ID,
        "latex": "x=1",
        "solution_steps": [],
        "language": "vi",
        "created_at": "2026-05-01T10:00:00+00:00",
        "is_bookmarked": is_bookmarked,
    }


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_patch_bookmark_explicit_true_sets_true(client):
    updated = _mock_item(True)
    with patch("app.services.supabase.get_supabase", new_callable=AsyncMock) as mock_db, \
         patch("app.services.supabase.get_history_item", new_callable=AsyncMock) as mock_get, \
         patch("app.services.supabase.set_bookmark", new_callable=AsyncMock) as mock_set:
        from app.schemas.history import HistoryItem
        mock_set.return_value = HistoryItem(**updated)
        mock_get.return_value = HistoryItem(**_mock_item(False))
        resp = client.patch(
            f"/api/history/{ITEM_ID}/bookmark",
            json={"isBookmarked": True},
            headers=HEADERS,
        )
    assert resp.status_code == 200
    assert resp.json()["isBookmarked"] is True


def test_patch_bookmark_idempotent(client):
    updated = _mock_item(True)
    with patch("app.services.supabase.get_supabase", new_callable=AsyncMock), \
         patch("app.services.supabase.get_history_item", new_callable=AsyncMock) as mock_get, \
         patch("app.services.supabase.set_bookmark", new_callable=AsyncMock) as mock_set:
        from app.schemas.history import HistoryItem
        mock_set.return_value = HistoryItem(**updated)
        mock_get.return_value = HistoryItem(**_mock_item(True))
        # Second call with same value — still returns true, doesn't flip
        resp = client.patch(
            f"/api/history/{ITEM_ID}/bookmark",
            json={"isBookmarked": True},
            headers=HEADERS,
        )
    assert resp.status_code == 200
    assert resp.json()["isBookmarked"] is True


def test_patch_bookmark_missing_body_returns_400(client):
    resp = client.patch(
        f"/api/history/{ITEM_ID}/bookmark",
        headers=HEADERS,
        # no body
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "INVALID_REQUEST"
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
cd src/server && uv run pytest tests/test_history.py -v
```
Expected: FAIL — `set_bookmark` not found, `BookmarkRequest` not found.

- [ ] **Step 1.3: Add `BookmarkRequest` to schemas**

In `src/server/app/schemas/history.py`, add after the existing imports:

```python
class BookmarkRequest(BaseModel):
    is_bookmarked: bool = Field(alias="isBookmarked")

    model_config = ConfigDict(populate_by_name=True)
```

- [ ] **Step 1.4: Replace `toggle_bookmark` → `set_bookmark` in supabase.py**

In `src/server/app/services/supabase.py`, replace the entire `toggle_bookmark` function:

```python
async def set_bookmark(
    client: AsyncClient,
    item_id: UUID,
    device_id: UUID,
    is_bookmarked: bool,
) -> HistoryItem | None:
    existing = await get_history_item(client, item_id, device_id)
    if existing is None:
        return None
    response = (
        await client.table("history_items")
        .update({"is_bookmarked": is_bookmarked})
        .eq("id", str(item_id))
        .eq("device_id", str(device_id))
        .execute()
    )
    if not response.data:
        return None
    return _row_to_item(response.data[0])
```

- [ ] **Step 1.5: Update the router handler**

In `src/server/app/routers/history.py`, update the `toggle_bookmark` route:

```python
from app.schemas.history import HistoryItem, HistoryListResponse, SolveRequest, BookmarkRequest

@router.patch("/history/{item_id}/bookmark", tags=["History"])
async def set_bookmark(
    item_id: UUID,
    body: BookmarkRequest,
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    client = await _get_client()
    item = await db.set_bookmark(client, item_id, device_id, body.is_bookmarked)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                code=HISTORY_NOT_FOUND,
                message="History item not found.",
                retryable=False,
            ).model_dump(),
        )
    return item.model_dump(by_alias=True, mode="json")
```

- [ ] **Step 1.6: Run tests — confirm they pass**

```bash
cd src/server && uv run pytest tests/test_history.py -v
```
Expected: 3 tests PASS.

- [ ] **Step 1.7: Run full backend test suite**

```bash
cd src/server && uv run pytest -v
```
Expected: all tests PASS.

- [ ] **Step 1.8: Commit**

```bash
git add src/server/app/schemas/history.py src/server/app/services/supabase.py src/server/app/routers/history.py src/server/tests/test_history.py
git commit -m "fix(server): make PATCH /history/{id}/bookmark idempotent with explicit body"
```

---

### Task 2: Frontend — Types + API layer

**Files:**
- Modify: `src/client/types/history.ts`
- Modify: `src/client/lib/api.ts`
- Create/Modify: `src/client/lib/api.test.ts`

- [ ] **Step 2.1: Add `HistoryListResponse` to types**

In `src/client/types/history.ts`, append:

```typescript
export interface HistoryListResponse {
  items: HistoryItem[]
  total: number
  page: number
  limit: number
}
```

- [ ] **Step 2.2: Write failing tests for new API functions**

Create/append to `src/client/lib/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getHistory, getHistoryItem, deleteHistoryItem, toggleBookmark, ApiError } from './api'

const DEVICE = 'device-uuid-1234'
const ITEM_ID = 'item-uuid-5678'

describe('getHistory', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls GET /api/history with X-Device-ID header', async () => {
    const mockResponse = { items: [], total: 0, page: 1, limit: 20 }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    )
    const result = await getHistory(DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/history'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Device-ID': DEVICE }) })
    )
    expect(result.total).toBe(0)
  })

  it('passes bookmarked=true query param when specified', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], total: 0, page: 1, limit: 20 }), { status: 200 })
    )
    await getHistory(DEVICE, { bookmarked: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('bookmarked=true'),
      expect.any(Object)
    )
  })
})

describe('getHistoryItem', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls GET /api/history/{id} with X-Device-ID header', async () => {
    const mockItem = { id: ITEM_ID, deviceId: DEVICE, latex: 'x', solutionSteps: [], language: 'vi', createdAt: '', isBookmarked: false }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockItem), { status: 200 })
    )
    const result = await getHistoryItem(ITEM_ID, DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}`),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Device-ID': DEVICE }) })
    )
    expect(result.id).toBe(ITEM_ID)
  })

  it('throws ApiError on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'HISTORY_NOT_FOUND', message: 'not found', retryable: false }), { status: 404 })
    )
    await expect(getHistoryItem(ITEM_ID, DEVICE)).rejects.toThrow(ApiError)
  })
})

describe('deleteHistoryItem', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls DELETE /api/history/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await deleteHistoryItem(ITEM_ID, DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}`),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('toggleBookmark', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls PATCH /api/history/{id}/bookmark with isBookmarked in body', async () => {
    const mockItem = { id: ITEM_ID, deviceId: DEVICE, latex: 'x', solutionSteps: [], language: 'vi', createdAt: '', isBookmarked: true }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockItem), { status: 200 })
    )
    const result = await toggleBookmark(ITEM_ID, DEVICE, true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}/bookmark`),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isBookmarked: true }),
      })
    )
    expect(result.isBookmarked).toBe(true)
  })
})
```

- [ ] **Step 2.3: Run tests to confirm they fail**

```bash
cd src/client && pnpm test lib/api.test.ts
```
Expected: FAIL — `getHistory is not a function` etc.

- [ ] **Step 2.4: Implement the 4 new API functions in `api.ts`**

In `src/client/lib/api.ts`, add after the existing imports:

```typescript
import type { HistoryItem, HistoryListResponse } from '@/types/history'
```

Then append the 4 functions:

```typescript
export async function getHistory(
  deviceId: string,
  opts?: { page?: number; limit?: number; bookmarked?: boolean },
): Promise<HistoryListResponse> {
  const params = new URLSearchParams()
  if (opts?.page) params.set('page', String(opts.page))
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.bookmarked !== undefined) params.set('bookmarked', String(opts.bookmarked))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${BASE}/api/history${query}`, {
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryListResponse>
}

export async function getHistoryItem(id: string, deviceId: string): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/history/${id}`, {
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}

export async function deleteHistoryItem(id: string, deviceId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/history/${id}`, {
    method: 'DELETE',
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
}

export async function toggleBookmark(
  id: string,
  deviceId: string,
  isBookmarked: boolean,
): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/history/${id}/bookmark`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify({ isBookmarked }),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}
```

Note: `api.ts` already imports `HistoryItem` at line 1. Remove that import line and add the combined import above.

- [ ] **Step 2.5: Run tests — confirm they pass**

```bash
cd src/client && pnpm test lib/api.test.ts
```
Expected: all PASS.

- [ ] **Step 2.6: Run typecheck**

```bash
cd src/client && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 2.7: Commit**

```bash
git add src/client/types/history.ts src/client/lib/api.ts src/client/lib/api.test.ts
git commit -m "feat(client): add history and bookmark API functions to api.ts"
```

---

### Task 3: Frontend — BottomNav (4 tabs)

**Files:**
- Modify: `src/client/components/BottomNav.tsx`
- Modify: `src/client/components/BottomNav.test.tsx`

- [ ] **Step 3.1: Update the failing test**

In `src/client/components/BottomNav.test.tsx`, update the `renders 3 tab links` test and add a new one:

```typescript
it('renders 4 tab links', () => {
  vi.mocked(usePathname).mockReturnValue('/')
  render(<BottomNav />)
  expect(screen.getAllByRole('link')).toHaveLength(4)
})

it('Bookmarks tab has href /bookmarks', () => {
  vi.mocked(usePathname).mockReturnValue('/bookmarks')
  render(<BottomNav />)
  const link = screen.getByRole('link', { name: /bookmark/i })
  expect(link.getAttribute('href')).toBe('/bookmarks')
  expect(link.getAttribute('aria-current')).toBe('page')
})
```

- [ ] **Step 3.2: Run to confirm they fail**

```bash
cd src/client && pnpm test components/BottomNav.test.tsx
```
Expected: `renders 4 tab links` FAIL (count is 3), `Bookmarks tab` FAIL.

- [ ] **Step 3.3: Update BottomNav.tsx**

Replace the `TABS` constant and add `Bookmark` to the import in `src/client/components/BottomNav.tsx`:

```typescript
import { Home, Clock, Bookmark, Settings } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/history', label: 'Lịch sử', icon: Clock },
  { href: '/bookmarks', label: 'Bookmark', icon: Bookmark },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
] as const
```

Also update the Icon rendering to pass `strokeWidth` based on active state:

```tsx
<Icon
  className="size-5"
  strokeWidth={active ? 2.5 : 2}
  aria-hidden="true"
/>
```

- [ ] **Step 3.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test components/BottomNav.test.tsx
```
Expected: all PASS.

- [ ] **Step 3.5: Commit**

```bash
git add src/client/components/BottomNav.tsx src/client/components/BottomNav.test.tsx
git commit -m "feat(client): add Bookmarks tab to BottomNav (4 tabs)"
```

---

### Task 4: Frontend — Extract StepCard component

**Files:**
- Create: `src/client/components/StepCard.tsx`
- Modify: `src/client/app/solve/page.tsx` (import from new file)

This extraction must happen before Task 6 (history detail page uses StepCard).

- [ ] **Step 4.1: Create `src/client/components/StepCard.tsx`**

```typescript
'use client'

import { AnimatePresence, motion } from 'motion/react'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { SolutionStep } from '@/types/history'

interface StepCardProps {
  step: SolutionStep
  isOpen: boolean
  onToggle: () => void
}

export function StepCard({ step, isOpen, onToggle }: StepCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)] ${
        step.isAnswer
          ? 'border-l-4 border-[#18E299] border-t-black/5 border-r-black/5 border-b-black/5'
          : 'border-black/5'
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
        <svg
          className={`size-4 shrink-0 text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
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
                    <span style={{ fontSize: '2.5rem' }} className="text-[#0d0d0d]">
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
```

- [ ] **Step 4.2: Update solve/page.tsx to import from new file**

In `src/client/app/solve/page.tsx`:
- Remove the inline `StepCard` function and `StepCardProps` interface
- Remove the `AnimatePresence`/`motion` imports (now inside StepCard.tsx)
- Add import: `import { StepCard } from '@/components/StepCard'`
- Keep `AnimatePresence` import if still used elsewhere in the file (it's not — remove it)

- [ ] **Step 4.3: Run typecheck + existing tests**

```bash
cd src/client && pnpm typecheck && pnpm test app/solve/page.test.tsx
```
Expected: no errors, tests PASS.

- [ ] **Step 4.4: Commit**

```bash
git add src/client/components/StepCard.tsx src/client/app/solve/page.tsx
git commit -m "refactor(client): extract StepCard into shared component"
```

---

### Task 5: Frontend — Solve page bookmark wiring

**Files:**
- Modify: `src/client/app/solve/page.tsx`
- Modify: `src/client/app/solve/page.test.tsx`

- [ ] **Step 5.1: Write failing test**

Append to `src/client/app/solve/page.test.tsx`:

```typescript
import { fireEvent, waitFor } from '@testing-library/react'
import { toggleBookmark } from '@/lib/api'

// Add to the vi.mock('@/lib/api') block:
// toggleBookmark: vi.fn().mockResolvedValue({ ...mockItem, isBookmarked: true }),

describe('SolvePage bookmark button', () => {
  const mockItem = {
    id: 'item-123',
    deviceId: 'device-456',
    latex: 'x^2 + 1 = 0',
    solutionSteps: [
      { index: 1, title: 'Step', explanation: 'Exp', formula: null, isAnswer: true },
    ],
    language: 'vi',
    createdAt: '2026-05-01T10:00:00Z',
    isBookmarked: false,
  }

  it('calls toggleBookmark(true) when bookmark button is tapped', async () => {
    vi.mocked(postSolve).mockResolvedValueOnce(mockItem as any)
    vi.mocked(toggleBookmark).mockResolvedValueOnce({ ...mockItem, isBookmarked: true } as any)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await screen.findByText('Step') // wait for success state

    const bookmarkBtn = screen.getByRole('button', { name: /đánh dấu/i })
    fireEvent.click(bookmarkBtn)

    await waitFor(() => {
      expect(toggleBookmark).toHaveBeenCalledWith('item-123', 'device-456', true)
    })
  })
})
```

- [ ] **Step 5.2: Run to confirm it fails**

```bash
cd src/client && pnpm test app/solve/page.test.tsx
```
Expected: FAIL — `toggleBookmark` not called.

- [ ] **Step 5.3: Implement bookmark wiring in solve/page.tsx**

In `src/client/app/solve/page.tsx`:

Add imports:
```typescript
import { postSolve, toggleBookmark, ApiError } from '@/lib/api'
```

Add to state declarations:
```typescript
const [historyItemId, setHistoryItemId] = useState<string | null>(null)
const [isBookmarked, setIsBookmarked] = useState(false)
```

In `runSolve` success branch, after `setSteps(result.solutionSteps)`:
```typescript
setHistoryItemId(result.id)
setIsBookmarked(result.isBookmarked)
```

Replace the Bookmark button in the bottom action bar:
```tsx
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
  aria-label="Đánh dấu"
>
  <Bookmark
    className="size-5"
    fill={isBookmarked ? 'currentColor' : 'none'}
    strokeWidth={isBookmarked ? 1.5 : 2}
    aria-hidden="true"
  />
</button>
```

Also read language from localStorage when calling `postSolve`. In `runSolve`:
```typescript
const language = (localStorage.getItem('mathsnap_language') as 'vi' | 'en') ?? 'vi'
const result = await postSolve(ocrLatex, deviceId, language)
```

- [ ] **Step 5.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test app/solve/page.test.tsx
```
Expected: all PASS.

- [ ] **Step 5.5: Commit**

```bash
git add src/client/app/solve/page.tsx src/client/app/solve/page.test.tsx
git commit -m "feat(client): wire bookmark button on solve page with optimistic toggle"
```

---

### Task 6: Frontend — S-08 History List page

**Files:**
- Create: `src/client/app/(main)/history/page.tsx`
- Create: `src/client/app/(main)/history/page.test.tsx`

- [ ] **Step 6.1: Write failing tests**

Create `src/client/app/(main)/history/page.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-123' }))
vi.mock('@/lib/api', () => ({
  getHistory: vi.fn(),
  deleteHistoryItem: vi.fn(),
  toggleBookmark: vi.fn(),
}))
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, drag, dragConstraints, dragElastic, onDragEnd, animate, ...props }: any) =>
      <div {...props}>{children}</div>,
  },
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import HistoryPage from './page'
import { getHistory, deleteHistoryItem, toggleBookmark } from '@/lib/api'

const MOCK_ITEMS = [
  {
    id: 'id-1', deviceId: 'd', latex: 'x^2', solutionSteps: [], language: 'vi',
    createdAt: '2026-05-01T10:00:00Z', isBookmarked: false,
  },
]

describe('HistoryPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no items', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<HistoryPage />)
    expect(await screen.findByText(/chưa có bài giải nào/i)).toBeTruthy()
  })

  it('renders items after fetch', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: MOCK_ITEMS, total: 1, page: 1, limit: 20 })
    render(<HistoryPage />)
    expect(await screen.findByTestId('katex')).toBeTruthy()
  })

  it('calls deleteHistoryItem when trash is clicked', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: MOCK_ITEMS, total: 1, page: 1, limit: 20 })
    vi.mocked(deleteHistoryItem).mockResolvedValueOnce(undefined)
    render(<HistoryPage />)
    await screen.findByTestId('katex')
    fireEvent.click(screen.getByRole('button', { name: /xóa/i }))
    await waitFor(() => expect(deleteHistoryItem).toHaveBeenCalledWith('id-1', 'device-123'))
  })
})
```

- [ ] **Step 6.2: Run to confirm it fails**

```bash
cd src/client && pnpm test 'app/\(main\)/history/page.test.tsx'
```
Expected: FAIL — module not found.

- [ ] **Step 6.3: Create `src/client/app/(main)/history/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, Bookmark, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistory, deleteHistoryItem, toggleBookmark } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { HistoryItem } from '@/types/history'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const deviceId = useDeviceId()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [swipedId, setSwipedId] = useState<string | null>(null)

  useEffect(() => {
    if (!deviceId) return
    getHistory(deviceId, { page: 1, limit: 20 })
      .then(r => { setItems(r.items); setLoading(false) })
      .catch(() => setLoading(false))
  }, [deviceId])

  async function handleDelete(id: string) {
    if (!deviceId) return
    setItems(prev => prev.filter(i => i.id !== id))
    try {
      await deleteHistoryItem(id, deviceId)
    } catch {
      toast.error('Không thể xóa bài toán. Vui lòng thử lại.')
      // Reload to restore state
      getHistory(deviceId, { page: 1, limit: 20 }).then(r => setItems(r.items))
    }
  }

  async function handleToggleBookmark(item: HistoryItem) {
    if (!deviceId) return
    const next = !item.isBookmarked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isBookmarked: next } : i))
    try {
      await toggleBookmark(item.id, deviceId, next)
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isBookmarked: item.isBookmarked } : i))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 px-6 py-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[80px] animate-pulse rounded-[16px] bg-gray-100" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6">
        <PenTool className="size-12 stroke-1 text-[#e5e5e5]" />
        <p className="text-[16px] text-[#666666]">Chưa có bài giải nào</p>
        <button
          onClick={() => router.push('/camera')}
          className="text-[15px] font-medium text-[#18E299] hover:underline"
        >
          Chụp bài toán đầu tiên →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Lịch sử</h1>
      </div>

      <div className="space-y-4 px-6 py-6 pb-[100px]">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden rounded-[16px] bg-[#d45656]"
            >
              {/* Delete reveal background */}
              <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#d45656]">
                <button
                  aria-label="Xóa"
                  onClick={() => handleDelete(item.id)}
                  className="flex size-full items-center justify-center text-white"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>

              {/* Foreground card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) setSwipedId(item.id)
                  else setSwipedId(null)
                }}
                animate={{ x: swipedId === item.id ? -80 : 0 }}
                onClick={() => router.push(`/history/${item.id}`)}
                className="relative z-10 flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-black/5 bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.03)] transition-colors active:bg-[#fafafa]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-1 text-[16px] text-[#0d0d0d]">
                    <KaTeXRenderer latex={item.latex} />
                  </div>
                  <p className="text-[13px] text-[#888888]">{formatDate(item.createdAt)}</p>
                </div>
                <button
                  aria-label={item.isBookmarked ? 'Bỏ lưu' : 'Lưu'}
                  onClick={e => { e.stopPropagation(); void handleToggleBookmark(item) }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-black/5"
                >
                  <Bookmark
                    className="size-5"
                    fill={item.isBookmarked ? '#18E299' : 'none'}
                    color={item.isBookmarked ? '#18E299' : '#666666'}
                    strokeWidth={item.isBookmarked ? 1.5 : 2}
                  />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/history/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 6.5: Commit**

```bash
git add src/client/app/'(main)'/history/
git commit -m "feat(client): add S-08 History List page with swipe-to-delete"
```

---

### Task 7: Frontend — S-09 Bookmarks page

**Files:**
- Create: `src/client/app/(main)/bookmarks/page.tsx`
- Create: `src/client/app/(main)/bookmarks/page.test.tsx`

- [ ] **Step 7.1: Write failing tests**

Create `src/client/app/(main)/bookmarks/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-123' }))
vi.mock('@/lib/api', () => ({
  getHistory: vi.fn(),
  toggleBookmark: vi.fn(),
}))
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: { div: ({ children, drag, dragConstraints, dragElastic, onDragEnd, animate, ...p }: any) => <div {...p}>{children}</div> },
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import BookmarksPage from './page'
import { getHistory } from '@/lib/api'

describe('BookmarksPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no bookmarks', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<BookmarksPage />)
    expect(await screen.findByText(/chưa có bài nào được lưu/i)).toBeTruthy()
  })

  it('calls getHistory with bookmarked: true', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<BookmarksPage />)
    await screen.findByText(/chưa có bài nào được lưu/i)
    expect(getHistory).toHaveBeenCalledWith('device-123', expect.objectContaining({ bookmarked: true }))
  })

  it('renders bookmark items', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({
      items: [{ id: 'b1', deviceId: 'd', latex: 'y=mx', solutionSteps: [], language: 'vi', createdAt: '2026-05-01T10:00:00Z', isBookmarked: true }],
      total: 1, page: 1, limit: 20,
    })
    render(<BookmarksPage />)
    expect(await screen.findByTestId('katex')).toBeTruthy()
  })
})
```

- [ ] **Step 7.2: Run to confirm it fails**

```bash
cd src/client && pnpm test 'app/\(main\)/bookmarks/page.test.tsx'
```
Expected: FAIL.

- [ ] **Step 7.3: Create `src/client/app/(main)/bookmarks/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistory, toggleBookmark } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { HistoryItem } from '@/types/history'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BookmarksPage() {
  const router = useRouter()
  const deviceId = useDeviceId()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [swipedId, setSwipedId] = useState<string | null>(null)

  useEffect(() => {
    if (!deviceId) return
    getHistory(deviceId, { page: 1, limit: 20, bookmarked: true })
      .then(r => { setItems(r.items); setLoading(false) })
      .catch(() => setLoading(false))
  }, [deviceId])

  async function handleRemoveBookmark(id: string) {
    if (!deviceId) return
    setItems(prev => prev.filter(i => i.id !== id))
    await toggleBookmark(id, deviceId, false)
  }

  if (loading) {
    return (
      <div className="space-y-3 px-6 py-6">
        {[1, 2].map(i => <div key={i} className="h-[80px] animate-pulse rounded-[16px] bg-gray-100" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6">
        <Bookmark className="size-12 stroke-1 text-[#e5e5e5]" />
        <p className="text-[16px] text-[#666666]">Chưa có bài nào được lưu</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Bookmark</h1>
      </div>

      <div className="space-y-4 px-6 py-6 pb-[100px]">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden rounded-[16px] bg-[#d45656]"
            >
              <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#d45656]">
                <button
                  aria-label="Bỏ lưu"
                  onClick={() => handleRemoveBookmark(item.id)}
                  className="flex size-full items-center justify-center text-white"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>

              <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) setSwipedId(item.id)
                  else setSwipedId(null)
                }}
                animate={{ x: swipedId === item.id ? -80 : 0 }}
                onClick={() => router.push(`/history/${item.id}`)}
                className="relative z-10 flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-black/5 bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.03)] transition-colors active:bg-[#fafafa]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-1 text-[16px] text-[#0d0d0d]">
                    <KaTeXRenderer latex={item.latex} />
                  </div>
                  <p className="text-[13px] text-[#888888]">{formatDate(item.createdAt)}</p>
                </div>
                <button
                  aria-label="Bỏ lưu"
                  onClick={e => { e.stopPropagation(); void handleRemoveBookmark(item.id) }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-black/5"
                >
                  <Bookmark className="size-5" fill="#18E299" color="#18E299" strokeWidth={1.5} />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 7.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/bookmarks/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 7.5: Commit**

```bash
git add src/client/app/'(main)'/bookmarks/
git commit -m "feat(client): add S-09 Bookmarks page"
```

---

### Task 8: Frontend — History detail page `/history/[id]`

**Files:**
- Create: `src/client/app/(main)/history/[id]/page.tsx`
- Create: `src/client/app/(main)/history/[id]/page.test.tsx`

- [ ] **Step 8.1: Write failing tests**

Create `src/client/app/(main)/history/[id]/page.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useParams: () => ({ id: 'item-123' }),
}))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-456' }))
vi.mock('@/lib/api', () => ({
  getHistoryItem: vi.fn(),
  toggleBookmark: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string; retryable: boolean
    constructor(code: string, message: string, retryable: boolean) {
      super(message); this.code = code; this.retryable = retryable
    }
  },
}))
vi.mock('@/components/StepCard', () => ({
  StepCard: ({ step }: any) => <div data-testid="step-card">{step.title}</div>,
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import HistoryDetailPage from './page'
import { getHistoryItem, ApiError } from '@/lib/api'

const MOCK_ITEM = {
  id: 'item-123', deviceId: 'device-456', latex: 'x^2',
  solutionSteps: [{ index: 1, title: 'Bước 1', explanation: 'exp', formula: null, isAnswer: false }],
  language: 'vi', createdAt: '2026-05-01T10:00:00Z', isBookmarked: false,
}

describe('HistoryDetailPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders step cards after fetch', async () => {
    vi.mocked(getHistoryItem).mockResolvedValueOnce(MOCK_ITEM as any)
    render(<HistoryDetailPage />)
    expect(await screen.findByTestId('step-card')).toBeTruthy()
  })

  it('redirects to /history on 404', async () => {
    vi.mocked(getHistoryItem).mockRejectedValueOnce(
      new (ApiError as any)('HISTORY_NOT_FOUND', 'not found', false)
    )
    render(<HistoryDetailPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/history'))
  })

  it('initializes bookmark state from item', async () => {
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...MOCK_ITEM, isBookmarked: true } as any)
    render(<HistoryDetailPage />)
    await screen.findByTestId('step-card')
    const btn = screen.getByRole('button', { name: /đánh dấu/i })
    expect(btn.className).toContain('bg-[#d4fae8]')
  })
})
```

- [ ] **Step 8.2: Run to confirm it fails**

```bash
cd src/client && pnpm test 'app/\(main\)/history/\[id\]/page.test.tsx'
```
Expected: FAIL.

- [ ] **Step 8.3: Create `src/client/app/(main)/history/[id]/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Bookmark } from 'lucide-react'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistoryItem, toggleBookmark, ApiError } from '@/lib/api'
import { StepCard } from '@/components/StepCard'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { HistoryItem } from '@/types/history'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

export default function HistoryDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const deviceId = useDeviceId()
  const [item, setItem] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (!deviceId || !params.id) return
    getHistoryItem(params.id, deviceId)
      .then(data => {
        setItem(data)
        setIsBookmarked(data.isBookmarked)
        setLoading(false)
      })
      .catch(err => {
        if (err instanceof ApiError) router.replace('/history')
        setLoading(false)
      })
  }, [deviceId, params.id, router])

  function toggleStep(index: number) {
    setOpenSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleBookmark() {
    if (!item || !deviceId) return
    const next = !isBookmarked
    setIsBookmarked(next)
    try {
      await toggleBookmark(item.id, deviceId, next)
    } catch {
      setIsBookmarked(!next)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {loading && (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-[70%]" />
          <Skeleton className="h-16 w-[50%]" />
        </div>
      )}

      {!loading && item && (
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
            <KaTeXRenderer latex={item.latex} />
          </div>

          <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[88px]">
            {item.solutionSteps.map(step => (
              <StepCard
                key={step.index}
                step={step}
                isOpen={openSteps.has(step.index)}
                onToggle={() => toggleStep(step.index)}
              />
            ))}
          </main>

          <div className="fixed bottom-0 left-1/2 flex w-full max-w-[480px] -translate-x-1/2 items-center gap-3 border-t border-black/5 bg-white px-4 py-3">
            <button
              onClick={handleBookmark}
              className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                isBookmarked ? 'bg-[#d4fae8] text-[#0fa76e]' : 'border border-black/5 text-[#0d0d0d]'
              }`}
              aria-label="Đánh dấu"
            >
              <Bookmark
                className="size-5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                strokeWidth={isBookmarked ? 1.5 : 2}
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => router.push('/')}
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

- [ ] **Step 8.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/history/\[id\]/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 8.5: Commit**

```bash
git add src/client/app/'(main)'/history/'[id]'/
git commit -m "feat(client): add history item detail page /history/[id]"
```

---

### Task 9: Frontend — S-11 Manual LaTeX Input page

**Files:**
- Create: `src/client/app/(main)/manual/page.tsx`
- Create: `src/client/app/(main)/manual/page.test.tsx`

- [ ] **Step 9.1: Write failing tests**

Create `src/client/app/(main)/manual/page.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({ setOcrLatex: vi.fn(), ocrLatex: null }),
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import ManualPage from './page'

describe('ManualPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    render(<ManualPage />)
    expect(screen.getByPlaceholderText(/nhập công thức/i)).toBeTruthy()
  })

  it('submit button disabled when textarea empty', () => {
    render(<ManualPage />)
    const btn = screen.getByRole('button', { name: /xác nhận/i })
    expect(btn).toBeDisabled()
  })

  it('submit button enabled when textarea has content', () => {
    render(<ManualPage />)
    fireEvent.change(screen.getByPlaceholderText(/nhập công thức/i), { target: { value: 'x=1' } })
    expect(screen.getByRole('button', { name: /xác nhận/i })).not.toBeDisabled()
  })

  it('navigates to /solve on submit', async () => {
    render(<ManualPage />)
    fireEvent.change(screen.getByPlaceholderText(/nhập công thức/i), { target: { value: 'x=1' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/solve'))
  })

  it('back button calls router.back()', () => {
    render(<ManualPage />)
    fireEvent.click(screen.getByRole('button', { name: /quay lại/i }))
    expect(mockBack).toHaveBeenCalled()
  })

  it('Escape key calls router.back()', () => {
    render(<ManualPage />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockBack).toHaveBeenCalled()
  })
})
```

- [ ] **Step 9.2: Run to confirm it fails**

```bash
cd src/client && pnpm test 'app/\(main\)/manual/page.test.tsx'
```
Expected: FAIL.

- [ ] **Step 9.3: Create `src/client/app/(main)/manual/page.tsx`**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useCaptureContext } from '@/contexts/CaptureContext'
import KaTeXRenderer from '@/components/KaTeXRenderer'

export default function ManualPage() {
  const router = useRouter()
  const { setOcrLatex } = useCaptureContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [latex, setLatex] = useState('')

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const isDisabled = latex.trim().length === 0

  function handleSubmit() {
    if (isDisabled) return
    setOcrLatex(latex.trim())
    router.push('/solve')
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#d4fae8]/40 via-white to-white">
      <div className="flex-1 overflow-y-auto pb-[100px]">
        {/* Top bar */}
        <div className="relative flex h-16 items-center justify-center px-6">
          <button
            onClick={() => router.back()}
            className="absolute left-6 flex size-11 items-center justify-center rounded-full text-[#0d0d0d] hover:bg-[#fafafa]"
            aria-label="Quay lại"
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#0d0d0d]">Nhập công thức</h1>
        </div>

        {/* Preview */}
        <div className="sticky top-16 z-10 mx-6 mb-6 mt-6">
          <div className="flex min-h-[120px] items-center justify-center rounded-[16px] border border-black/5 bg-[#fafafa] p-6">
            {latex.trim() ? (
              <KaTeXRenderer latex={latex} />
            ) : (
              <span className="text-center text-[14px] text-[#888888]">
                Bắt đầu nhập để xem preview
              </span>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="mx-6 flex flex-col gap-3">
          <span className="rounded border border-black/5 bg-[#fafafa] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.6px] text-[#666666] self-start">
            LaTeX
          </span>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={e => setLatex(e.target.value)}
            className="h-[200px] w-full resize-none rounded-[16px] border border-black/10 bg-white p-4 font-mono text-[14px] text-[#0d0d0d] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all focus:border-[#18E299] focus:outline-none focus:ring-1 focus:ring-[#18E299]"
            placeholder="Nhập công thức LaTeX..."
          />
        </div>
      </div>

      {/* Sticky submit */}
      <div className="sticky bottom-0 z-20 mx-auto w-full border-t border-black/5 bg-white/90 p-6 backdrop-blur-md">
        <motion.button
          whileTap={!isDisabled ? { scale: 0.98 } : undefined}
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all ${
            isDisabled
              ? 'cursor-not-allowed bg-[#e5e5e5] text-[#888888]'
              : 'bg-[#0d0d0d] text-white hover:opacity-90'
          }`}
        >
          Xác nhận
          <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/manual/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 9.5: Commit**

```bash
git add src/client/app/'(main)'/manual/
git commit -m "feat(client): add S-11 Manual LaTeX Input page"
```

---

### Task 10: Frontend — S-13 Settings page

**Files:**
- Create: `src/client/app/(main)/settings/page.tsx`
- Create: `src/client/app/(main)/settings/page.test.tsx`

- [ ] **Step 10.1: Write failing tests**

Create `src/client/app/(main)/settings/page.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('motion/react', () => ({
  motion: { div: ({ children, layout, ...p }: any) => <div {...p}>{children}</div> },
}))

import SettingsPage from './page'

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders language toggle and version row', () => {
    render(<SettingsPage />)
    expect(screen.getByText(/ngôn ngữ/i)).toBeTruthy()
    expect(screen.getByText('1.0.0')).toBeTruthy()
  })

  it('reads initial language from localStorage', () => {
    localStorage.setItem('mathsnap_language', 'en')
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    // English is active when bg-[#18E299] class is present
    expect(toggle.className).toContain('bg-[#18E299]')
  })

  it('writes to localStorage on toggle', () => {
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    fireEvent.click(toggle)
    expect(localStorage.getItem('mathsnap_language')).toBe('en')
  })

  it('toggling back writes vi to localStorage', () => {
    localStorage.setItem('mathsnap_language', 'en')
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    fireEvent.click(toggle)
    expect(localStorage.getItem('mathsnap_language')).toBe('vi')
  })
})
```

- [ ] **Step 10.2: Run to confirm it fails**

```bash
cd src/client && pnpm test 'app/\(main\)/settings/page.test.tsx'
```
Expected: FAIL.

- [ ] **Step 10.3: Create `src/client/app/(main)/settings/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'

export default function SettingsPage() {
  const [isEnglish, setIsEnglish] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('mathsnap_language') === 'en'
  })

  function handleLanguageToggle() {
    const next = !isEnglish
    setIsEnglish(next)
    localStorage.setItem('mathsnap_language', next ? 'en' : 'vi')
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Cài đặt</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6 pb-[100px]">
        {/* Language section */}
        <section>
          <h2 className="mb-3 px-2 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888888]">
            Ngôn ngữ
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">Ngôn ngữ / Language</span>
              <button
                aria-label="Ngôn ngữ"
                onClick={handleLanguageToggle}
                className={`flex h-[26px] w-12 items-center rounded-full border p-1 transition-colors ${
                  isEnglish ? 'justify-end border-[#18E299] bg-[#18E299]' : 'justify-start border-black/10 bg-white'
                }`}
              >
                <motion.div
                  layout
                  className={`size-[18px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
                    isEnglish ? 'bg-[#0d0d0d]' : 'bg-[#888888]'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Info section */}
        <section>
          <h2 className="mb-3 px-2 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888888]">
            Thông tin
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">Phiên bản</span>
              <span className="font-mono text-[14px] text-[#888888]">1.0.0</span>
            </div>
            <button className="group flex w-full items-center justify-between border-b border-black/5 px-6 h-[64px] transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Xem lại hướng dẫn</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex w-full items-center justify-between border-b border-black/5 px-6 h-[64px] transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Liên hệ hỗ trợ</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex w-full items-center justify-between px-6 h-[64px] transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Điều khoản sử dụng</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 10.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/settings/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 10.5: Commit**

```bash
git add src/client/app/'(main)'/settings/
git commit -m "feat(client): add S-13 Settings page with bilingual toggle"
```

---

### Task 11: Frontend — FR-1b File Picker on Home page

**Files:**
- Modify: `src/client/app/(main)/page.tsx`
- Modify: `src/client/app/(main)/page.test.tsx`

- [ ] **Step 11.1: Write failing tests**

Update `src/client/app/(main)/page.test.tsx` — replace existing tests and add new ones:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockSetCapturedBlob = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({ setCapturedBlob: mockSetCapturedBlob }),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import HomePage from './page'
import { toast } from 'sonner'

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders Camera and Tải lên CTAs', () => {
    render(<HomePage />)
    expect(screen.getByText('Chụp ảnh')).toBeTruthy()
    expect(screen.getByText('Tải lên')).toBeTruthy()
  })

  it('Camera CTA navigates to /camera', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('Chụp ảnh'))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('Nhập LaTeX link navigates to /manual', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: /nhập latex/i })
    expect(link.getAttribute('href')).toBe('/manual')
  })

  it('shows toast and no navigation when file > 2MB', async () => {
    render(<HomePage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [bigFile] })
    fireEvent.change(input)
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mockPush).not.toHaveBeenCalledWith('/crop')
  })

  it('stores blob and navigates to /crop for valid file', async () => {
    render(<HomePage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = new File([new ArrayBuffer(100 * 1024)], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [validFile] })
    fireEvent.change(input)
    await waitFor(() => expect(mockSetCapturedBlob).toHaveBeenCalled())
    expect(mockPush).toHaveBeenCalledWith('/crop')
  })
})
```

- [ ] **Step 11.2: Run to confirm new tests fail**

```bash
cd src/client && pnpm test 'app/\(main\)/page.test.tsx'
```
Expected: new tests FAIL.

- [ ] **Step 11.3: Update `src/client/app/(main)/page.tsx`**

```typescript
'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Upload, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCaptureContext } from '@/contexts/CaptureContext'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function HomePage() {
  const router = useRouter()
  const { setCapturedBlob } = useCaptureContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ảnh không được vượt quá 2MB.')
      return
    }
    setCapturedBlob(file)
    router.push('/crop')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0d0d0d]">MathSnap</h1>
        <p className="mt-2 text-sm text-gray-500">Chụp ảnh bài toán, nhận lời giải từng bước</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          className="h-12 w-full rounded-full bg-[#18E299] font-medium text-[#0d0d0d] hover:bg-[#0fa76e] hover:text-white"
          onClick={() => router.push('/camera')}
        >
          <Camera className="mr-2 size-5" />
          Chụp ảnh
        </Button>

        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 size-5" />
          Tải lên
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <Link
          href="/manual"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-[#666666] hover:text-[#18E299] transition-colors"
        >
          <PenLine className="size-4" />
          Nhập LaTeX
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.4: Run tests — confirm they pass**

```bash
cd src/client && pnpm test 'app/\(main\)/page.test.tsx'
```
Expected: all PASS.

- [ ] **Step 11.5: Commit**

```bash
git add src/client/app/'(main)'/page.tsx src/client/app/'(main)'/page.test.tsx
git commit -m "feat(client): add FR-1b file picker and Nhập LaTeX link to Home page"
```

---

### Task 12: Integration verification

- [ ] **Step 12.1: TypeScript check**

```bash
cd src/client && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 12.2: Lint check**

```bash
cd src/client && pnpm lint
```
Expected: 0 warnings or errors.

- [ ] **Step 12.3: Full frontend test suite**

```bash
cd src/client && pnpm test
```
Expected: all tests PASS.

- [ ] **Step 12.4: Full backend test suite**

```bash
cd src/server && uv run pytest -v
```
Expected: all tests PASS.

- [ ] **Step 12.5: Start dev server and manually verify**

```bash
cd src/client && pnpm dev
```

Verify checklist:
- BottomNav shows 4 tabs; Bookmarks tab navigates to `/bookmarks`
- `/history` renders empty state or history items from backend
- Swipe left on a history item reveals red trash button
- Tapping trash removes the item
- Tapping history item navigates to `/history/{id}` with lời giải from DB
- Bookmark button on `/history/{id}` toggles filled/outlined and persists
- `/bookmarks` shows filtered list; swipe removes from list
- `/solve` bookmark button toggles immediately after a new solve
- `/manual` textarea auto-focuses; preview updates while typing; submit navigates to `/solve`
- `/settings` language toggle: set to EN, reload page → still EN
- Home file picker: select image → navigates to `/crop`

- [ ] **Step 12.6: Final commit**

```bash
git add .
git commit -m "chore(client): integration verification — history-bookmark change complete"
```
