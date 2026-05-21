## Context

MathSnap already persists every solve result as a `HistoryItem` in Supabase (G2 done). The backend history CRUD API (`GET /history`, `GET /history/{id}`, `DELETE /history/{id}`, `PATCH /history/{id}/bookmark`) exists and is registered. No frontend pages consume these endpoints yet — the History, Bookmarks, Settings, and Manual screens are absent. The BottomNav has 3 tabs; Bookmarks tab is missing. The solve page has a non-functional bookmark button (no onClick, no state). One backend contract gap exists: PATCH /bookmark toggles instead of accepting an explicit body.

**Dependencies met:** G2 (backend hardening), G4 (frontend solve flow — CaptureContext, solve/page.tsx, api.ts pattern)

## Goals / Non-Goals

**Goals:**
- Fix PATCH /history/{id}/bookmark to accept explicit `{ isBookmarked: bool }` body (idempotent)
- S-08 History List page with swipe-to-delete and bookmark toggle per item
- S-09 Bookmarks page (same list pattern, filtered `?bookmarked=true`)
- `/history/{id}` detail page — renders stored solution from DB, no re-solve
- S-11 Manual LaTeX Input — text entry → `/ocr` loading → `/api/solve`
- S-13 Settings — EN/VI language toggle persisted to `localStorage['mathsnap_language']`
- Wire bookmark button on solve page (`/solve`)
- Add Bookmarks tab to BottomNav (4 tabs total)
- FR-1b: file picker on Home page alongside Camera CTA

**Non-Goals:**
- User authentication / multi-device sync
- Search or filter beyond `?bookmarked=true`
- Pagination UI controls (load first page only; `limit=20` is sufficient for MVP)
- Push notifications or cloud backup
- History size cap enforcement UI (max 100 items — server-side concern already documented)

## Decisions

**D1 — Explicit PATCH body (not toggle)**
`PATCH /api/history/{id}/bookmark` receives `{ "isBookmarked": bool }` and sets the value directly. Toggle was the original impl but violated the idempotency guarantee in System Design §4.7. A client retrying on network failure must not accidentally flip state back.
- Backend: add `BookmarkRequest(BaseModel)` with `is_bookmarked: bool` field; update `toggle_bookmark` → `set_bookmark` in supabase.py and update route handler
- Frontend: `toggleBookmark(id, deviceId, isBookmarked: boolean)` sends the desired new state

**D2 — Manual inside `(main)` layout**
`app/(main)/manual/page.tsx` inherits the 480px max-width container and BottomNav visibility — consistent with Home. The Manual screen uses a full-height layout but the `(main)` wrapper doesn't break that since `main` is `flex-1`. BottomNav hides itself for capture routes but Manual is a normal page that should show the nav.

**D3 — `/history/{id}` fetches from DB**
Navigating to a history item shows the stored solution. Does NOT call `/api/solve` again — avoids LLM cost and provides instant render. Fetches `GET /api/history/{id}` with `X-Device-ID` header. 404 response redirects to `/history`. The page reuses the `StepCard` component from solve/page.tsx.

**D4 — Swipe-to-delete via motion/react**
Framer Motion (`motion/react`) is already installed. Drag `x` constraint `{ left: -80, right: 0 }`, threshold 40px. Red background with Trash icon revealed at -80px. Desktop: hover-reveal delete button (`group`/`group-hover:opacity-100`). No new library needed.

**D5 — Language toggle in localStorage**
`mathsnap_language` key in localStorage, values `'vi' | 'en'`, default `'vi'`. Settings page reads and writes this key. The existing `postSolve()` API call already accepts a `language` param — `solve/page.tsx` needs to read from localStorage when building the solve request.

**D6 — api.ts stays as raw fetch (no SWR/React Query)**
Existing pattern is plain `fetch` + `ApiError`. Adding 4 new functions follows the same pattern. No new data-fetching library introduced for MVP.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| PATCH /bookmark breaking change — existing frontend code calls toggle | No existing frontend code calls PATCH /bookmark yet (explore confirmed); safe to change |
| Swipe gesture on iOS Safari — momentum scrolling conflict with drag | `dragConstraints` + `dragElastic={0.1}` reduces the chance; acceptable for MVP |
| `/history/{id}` cold render on slow network | Show skeleton (same pattern as solve/page.tsx loading state) |
| `mathsnap_language` not set before first solve | `postSolve()` already defaults to `'vi'` when no language param — add localStorage read in solve page |
| File picker (FR-1b) MIME type bypass | `accept="image/*"` is a hint, not a guarantee — backend already validates MIME + size at `/api/ocr`; client-side validation is UX-only |

## Migration Plan

1. Deploy backend fix (PATCH contract change) — no DB migration needed
2. Deploy frontend — new pages, BottomNav update, solve page wiring
3. No rollback complexity: backend change is backward-compatible with frontend that hasn't called PATCH yet

## Open Questions

None.
