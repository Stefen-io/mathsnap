## 1. Backend — Fix PATCH /bookmark contract

- [x] 1.1 [TDD] Write pytest test `test_patch_bookmark_explicit_true_sets_true` verifying `PATCH /api/history/{id}/bookmark` with body `{"isBookmarked": true}` returns 200 with `isBookmarked: true`
- [x] 1.2 [TDD] Write pytest test `test_patch_bookmark_idempotent` verifying two consecutive `PATCH` calls with `{"isBookmarked": true}` both return `isBookmarked: true`
- [x] 1.3 [TDD] Write pytest test `test_patch_bookmark_missing_body_returns_400`
- [x] 1.4 Add `BookmarkRequest(BaseModel)` with field `is_bookmarked: bool` to `src/server/app/schemas/history.py`
- [x] 1.5 Rename `toggle_bookmark` → `set_bookmark` in `src/server/app/services/supabase.py`; replace toggle logic with direct `update({"is_bookmarked": request.is_bookmarked})`
- [x] 1.6 Update `src/server/app/routers/history.py` `toggle_bookmark` handler to accept `BookmarkRequest` body and call `set_bookmark`
- [x] 1.7 Run backend tests — all pass

## 2. Frontend — API layer additions

- [x] 2.1 Add `HistoryListResponse` interface to `src/client/types/history.ts`
- [x] 2.2 [TDD] Write unit tests for `getHistory`, `getHistoryItem`, `deleteHistoryItem`, `toggleBookmark` in `src/client/lib/api.test.ts` using `fetch` mock
- [x] 2.3 Add `getHistory(deviceId, opts?)` to `src/client/lib/api.ts` — `GET /api/history` with `X-Device-ID`, returns `HistoryListResponse`
- [x] 2.4 Add `getHistoryItem(id, deviceId)` to `src/client/lib/api.ts` — `GET /api/history/{id}` with `X-Device-ID`, returns `HistoryItem`
- [x] 2.5 Add `deleteHistoryItem(id, deviceId)` to `src/client/lib/api.ts` — `DELETE /api/history/{id}` with `X-Device-ID`, returns void
- [x] 2.6 Add `toggleBookmark(id, deviceId, isBookmarked: boolean)` to `src/client/lib/api.ts` — `PATCH /api/history/{id}/bookmark` with body `{ isBookmarked }`, returns `HistoryItem`
- [x] 2.7 Run frontend unit tests — all pass

## 3. Frontend — BottomNav (4 tabs)

- [x] 3.1 [TDD] Write unit test in `src/client/components/BottomNav.test.tsx` verifying Bookmarks tab renders and has correct href `/bookmarks`
- [x] 3.2 Add `Bookmark` import from `lucide-react` to `src/client/components/BottomNav.tsx`
- [x] 3.3 Insert `{ href: '/bookmarks', label: 'Bookmark', icon: Bookmark }` between History and Settings in the `TABS` array
- [x] 3.4 Add `strokeWidth` variation: active tab `strokeWidth={2.5}`, inactive `strokeWidth={2}`
- [x] 3.5 Run BottomNav test — passes

## 4. Frontend — S-08 History List page

- [x] 4.1 [TDD] Write unit test `src/client/app/(main)/history/page.test.tsx` for empty state, item rendering, and bookmark toggle — following TDD
- [x] 4.2 Create `src/client/app/(main)/history/page.tsx`: Client Component fetching `getHistory` on mount, renders item cards
- [x] 4.3 Each card shows `item.latex` (KaTeXRenderer), formatted `createdAt`, Bookmark icon button
- [x] 4.4 Implement swipe-to-delete with `motion/react`: drag `x`, constraints `{ left: -80, right: 0 }`, threshold 40px, red trash background
- [x] 4.5 Tapping trash calls `deleteHistoryItem(id, deviceId)` and removes item via `setItems` filter
- [x] 4.6 Inline Bookmark icon button calls `toggleBookmark(id, deviceId, !item.isBookmarked)` and updates local state
- [x] 4.7 Desktop (≥ 1024px) hover-reveal delete button instead of swipe
- [x] 4.8 Empty state renders "Chưa có bài giải nào" and "Chụp bài toán đầu tiên →" link
- [x] 4.9 Tapping a card navigates to `/history/{item.id}`
- [x] 4.10 Run history page tests — pass

## 5. Frontend — S-09 Bookmarks page

- [x] 5.1 [TDD] Write unit test `src/client/app/(main)/bookmarks/page.test.tsx` for empty state and item rendering — following TDD
- [x] 5.2 Create `src/client/app/(main)/bookmarks/page.tsx`: same pattern as History List; calls `getHistory(deviceId, { bookmarked: true })`
- [x] 5.3 Swipe-to-remove-bookmark: revealed action calls `toggleBookmark(id, deviceId, false)` and removes from local list
- [x] 5.4 Empty state renders "Chưa có bài nào được lưu"
- [x] 5.5 Run bookmarks page tests — pass

## 6. Frontend — History detail page `/history/[id]`

- [x] 6.1 [TDD] Write unit test `src/client/app/(main)/history/[id]/page.test.tsx` for loading, success render, 404 redirect — following TDD
- [x] 6.2 Create `src/client/app/(main)/history/[id]/page.tsx`: Client Component reading `params.id`, calls `getHistoryItem(id, deviceId)`
- [x] 6.3 On 404 `ApiError` redirect to `/history` via `router.replace`
- [x] 6.4 Render skeleton during fetch; on success render sticky header, LaTeX bar (KaTeXRenderer), step accordion using `StepCard` from solve page
- [x] 6.5 Initialize `isBookmarked` from `item.isBookmarked`; bottom bar with Bookmark button (filled/outlined based on state) and "Bài mới" CTA
- [x] 6.6 Tapping Bookmark calls `toggleBookmark(id, deviceId, !isBookmarked)` and flips visual state
- [x] 6.7 "Bài mới" navigates to `/`
- [x] 6.8 Run history detail tests — pass

## 7. Frontend — Solve page bookmark wiring

- [x] 7.1 [TDD] Write unit test for solve page Bookmark button: verify `toggleBookmark` called with correct args on click — following TDD
- [x] 7.2 In `src/client/app/solve/page.tsx`: add `historyItemId` and `isBookmarked` to local state
- [x] 7.3 On `postSolve` success: set `historyItemId` from `result.id`, `isBookmarked` from `result.isBookmarked`
- [x] 7.4 Wire Bookmark button `onClick`: call `toggleBookmark(historyItemId, deviceId, !isBookmarked)`, update `isBookmarked` state
- [x] 7.5 Apply visual styles: `bg-[#d4fae8] text-[#0fa76e] fill="currentColor"` when bookmarked; `border border-black/5 text-[#0d0d0d] fill="none"` when not
- [x] 7.6 Run solve page tests — pass

## 8. Frontend — S-11 Manual LaTeX Input page

- [x] 8.1 [TDD] Write unit test `src/client/app/(main)/manual/page.test.tsx` for submit disabled when empty, navigate on submit, Escape key — following TDD
- [x] 8.2 Create `src/client/app/(main)/manual/page.tsx`: Client Component with auto-focus textarea, sticky KaTeXRenderer preview, submit button
- [x] 8.3 Preview shows `KaTeXRenderer` when textarea non-empty; placeholder text when empty
- [x] 8.4 Submit button disabled when `latex.trim().length === 0`; on submit calls `setOcrLatex(latex.trim())` and navigates to `/solve`
- [x] 8.5 Back button (`ChevronLeft`) and Escape key listener both call `router.back()`
- [x] 8.6 Run manual page tests — pass

## 9. Frontend — S-13 Settings page

- [x] 9.1 [TDD] Write unit test `src/client/app/(main)/settings/page.test.tsx` verifying localStorage read on mount and write on toggle — following TDD
- [x] 9.2 Create `src/client/app/(main)/settings/page.tsx`: Client Component reading `localStorage['mathsnap_language']` on mount (default `'vi'`)
- [x] 9.3 Language toggle switch: animated `motion.div` pill, `bg-[#18E299]` when EN active, `bg-white border-black/10` when VI
- [x] 9.4 Toggle writes `localStorage.setItem('mathsnap_language', ...)` on change
- [x] 9.5 "Thông tin" section: version row showing `1.0.0`, "Xem lại hướng dẫn" row, static rows for support and terms
- [x] 9.6 Run settings tests — pass

## 10. Frontend — FR-1b File Picker on Home page

- [x] 10.1 [TDD] Write unit test for Home page file picker: file too large shows toast, valid file navigates to `/crop` — following TDD
- [x] 10.2 In `src/client/app/(main)/page.tsx`: add hidden `<input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef}>`
- [x] 10.3 Add "Tải lên" CTA button that calls `fileInputRef.current?.click()` on tap
- [x] 10.4 `onChange` handler: validate file size ≤ 2MB (toast.error if too large); store blob in CaptureContext and navigate to `/crop`
- [x] 10.5 Add "Nhập LaTeX" text link that navigates to `/manual`
- [x] 10.6 Run home page tests — pass

## 11. Integration verification

- [x] 11.1 Run `pnpm typecheck` — no errors (2 pre-existing errors in crop/page.test.tsx excluded)
- [x] 11.2 Run `pnpm lint` — no errors
- [x] 11.3 Run `pnpm test` — all tests pass (68 tests, 16 files)
- [x] 11.4 Run backend `uv run pytest` — all tests pass (20 tests)
- [ ] 11.5 Start dev server and manually verify: S-08 swipe-to-delete, S-09 empty state, `/history/{id}` bookmark toggle, S-11 submit flow, S-13 language toggle persists on page reload, BottomNav 4 tabs active states
