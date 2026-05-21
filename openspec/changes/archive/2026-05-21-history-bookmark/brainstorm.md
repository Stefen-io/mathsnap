## Design Summary

This change adds the full History & Bookmark feature set for MathSnap (G6, Phase 2.5 Sprint 2). The backend history CRUD endpoints were already implemented in G2 (verified), so work is focused on:
1. Fixing one backend contract gap (PATCH /bookmark: toggle → explicit)
2. Building 5 new frontend pages
3. Wiring 5 existing frontend files

The explore session (`/opsx:explore history-bookmark`) surfaced all gaps and confirmed all design decisions before this proposal was written.

## Alternatives Considered

### Option A: Toggle-based PATCH /bookmark (existing implementation)
- **Approach**: `PATCH /api/history/{id}/bookmark` has no body; server reads current `is_bookmarked` and flips it
- **Pros**: Fewer lines of code; frontend just calls PATCH once
- **Cons**: Not idempotent — calling twice returns to original state; violates System Design §4.7 intent; risky if network retries
- **Why not chosen**: System Design explicitly calls for idempotency ("explicit để đảm bảo idempotency")

### Option B: Explicit-body PATCH /bookmark (chosen)
- **Approach**: Request body `{ "isBookmarked": bool }`, server sets the value directly
- **Pros**: Idempotent; safe to retry; matches §4.7 spec; frontend controls desired state
- **Cons**: Frontend must track current `isBookmarked` state (already needed for optimistic UI)
- **Why chosen**: Correct spec compliance, no added complexity at the frontend since local state is already required for visual toggle

### Option C: Separate PUT /bookmark and DELETE /bookmark
- **Approach**: `PUT /history/{id}/bookmark` to set, `DELETE /history/{id}/bookmark` to unset
- **Pros**: RESTfully pure
- **Cons**: Two endpoints instead of one; overkill for a boolean toggle in an MVP; not in System Design
- **Why not chosen**: Unnecessary complexity for MVP

## Agreed Approach

**Option B** — explicit-body PATCH with `{ "isBookmarked": bool }`. Backend changes are minimal (add `BookmarkRequest` schema, update one service function). Frontend tracks `isBookmarked` state locally for optimistic UI.

**Manual route (D2)**: `app/(main)/manual/page.tsx` — inside `(main)` layout so it inherits the 480px container and BottomNav (consistent with Home/History/Settings pattern).

**History item detail (D3)**: `/history/{id}` — separate route that fetches `GET /api/history/{id}`, renders the stored solution without calling `/api/solve` again. This avoids re-charging LLM credits and provides instant load from DB.

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | PATCH /bookmark takes explicit `{ isBookmarked: bool }` body | Idempotent, matches §4.7 spec |
| D2 | Manual at `app/(main)/manual/page.tsx` | Consistent with Home/History layout pattern, inherits 480px container |
| D3 | `/history/{id}` fetches from DB, no re-solve | No wasted LLM credits, instant render |
| D4 | Swipe-to-delete via `motion/react` drag | Library already installed; matches Figma Make design |
| D5 | Settings language persists to `localStorage['mathsnap_language']` | Consistent with existing `deviceId` localStorage pattern |

## Open Questions

None — all decisions confirmed by user before proposal was written.
