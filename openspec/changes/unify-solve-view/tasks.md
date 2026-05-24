## 1. Solve page dual-mode + Suspense

- [x] 1.1 Extract the existing `SolvePage` body into a `SolvePageContent` component; make the default export a wrapper that returns `<Suspense fallback={<loading skeleton>}><SolvePageContent/></Suspense>` (loading UI moved into / shared as the fallback).
- [x] 1.2 In `SolvePageContent`, read `const viewId = useSearchParams().get('id')` and derive mode (VIEW when `viewId` truthy, else SOLVE).
- [x] 1.3 Add a `getHistoryItem` import from `@/lib/api` and a fetch path for VIEW mode that sets `steps`, `historyItemId`, `isBookmarked`, all-open `openSteps`, and a `viewLatex` state from `item.latex`.
- [x] 1.4 Branch the mount effect by mode BEFORE the `ocrLatex` guard: SOLVE keeps `if (!ocrLatex) router.replace('/camera')` then `postSolve`; VIEW calls `getHistoryItem(viewId, deviceId)` and on `ApiError` calls `router.replace('/history')`. Never redirect to `/camera` in VIEW mode.
- [x] 1.5 Reuse a single one-shot `startedRef` so each mode fetches exactly once under StrictMode double-effect.
- [x] 1.6 Render the problem statement bar from a unified `displayLatex` = `viewId ? viewLatex : ocrLatex` (instead of `ocrLatex` directly).
- [x] 1.7 Verify SOLVE-mode behavior is unchanged (error states, retry, bookmark, "Bài mới").

## 2. List navigation

- [x] 2.1 `history/page.tsx`: change item `onClick` push target from `/history/${item.id}` to `/solve?id=${item.id}` (keep the drag guard).
- [x] 2.2 `bookmarks/page.tsx`: change item `onClick` push target from `/history/${item.id}` to `/solve?id=${item.id}` (keep the drag guard).

## 3. Responsive StepCard

- [x] 3.1 Reduce step title and explanation font size on ≤480px via Tailwind `[@media(max-width:480px)]:` arbitrary variants.
- [x] 3.2 Replace the answer formula fixed `fontSize: '2.5rem'` with `clamp(1.5rem, 7vw, 2.5rem)`.
- [x] 3.3 Add `overflow-x-auto` to the formula container and stop forcing horizontal centering when content overflows (so wide formulas scroll instead of clipping).

## 4. Remove history detail route + dead i18n

- [x] 4.1 Delete `app/(main)/history/[id]/page.tsx`.
- [x] 4.2 Delete `app/(main)/history/[id]/page.test.tsx`.
- [x] 4.3 Remove `detailTitle`, `detailAriaBack`, `detailAriaBookmark`, `detailNewProblem` from both `vi` and `en` objects in `lib/i18n.ts` (keep en/vi parity).

## 5. Tests

- [x] 5.1 In `solve/page.test.tsx`, add `useSearchParams` to the `next/navigation` mock (default returns empty params = SOLVE mode) and add `getHistoryItem: vi.fn()` to the `@/lib/api` mock.
- [x] 5.2 Add VIEW-mode tests: with `?id`, `getHistoryItem` is called once, `postSolve` is NOT called, no `replace('/camera')` when `ocrLatex` is null, steps render, and the problem bar shows `item.latex`.
- [x] 5.3 Add a VIEW-mode error test: `getHistoryItem` throwing `ApiError` triggers `router.replace('/history')`.

## 6. Verification

- [x] 6.1 Run `pnpm lint`, `pnpm typecheck`, `pnpm test` — all green.
- [x] 6.2 Run `pnpm build` to confirm no `useSearchParams` suspense/deopt failure.
- [ ] 6.3 Manually verify in browser: solve-new flow, tapping a history item opens `/solve?id=`, tapping a bookmark opens `/solve?id=`, back returns to the list, and a long formula scrolls on a ≤480px viewport.
