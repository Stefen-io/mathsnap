## 1. Package & Dependency

- [x] 1.1 Install `motion` package: `pnpm add motion` in `src/client/`
- [x] 1.2 Verify `motion/react` imports resolve: `import { AnimatePresence, motion } from 'motion/react'`

## 2. Device Identity Layer

- [x] 2.1 Create `src/client/lib/device-id.ts` — `getDeviceId()` reads/writes `mathsnap_device_id` from localStorage using `crypto.randomUUID()`
- [x] 2.2 Create `src/client/lib/device-id.test.ts` — 4 test cases: first call generates UUID, second call returns same, after clear generates new, value matches UUID v4 regex
- [x] 2.3 Create `src/client/hooks/useDeviceId.ts` — SSR-safe hook returning `null` until after client hydration
- [x] 2.4 Run `pnpm test` — `device-id.test.ts` all green

## 3. API Client Layer

- [x] 3.1 Create `src/client/lib/api.ts` — `ApiError` class extending `Error` with `code`, `message`, `retryable` fields
- [x] 3.2 Implement `postOcr(blob, deviceId)` in `api.ts` — multipart POST to `/api/ocr` with `X-Device-ID` header, returns `OcrResponse`
- [x] 3.3 Implement `postSolve(latex, deviceId, language?)` in `api.ts` — JSON POST to `/api/solve` with `X-Device-ID` header, returns `HistoryItem`
- [x] 3.4 Run `pnpm typecheck` — zero errors on new files

## 4. CaptureContext Extension

- [x] 4.1 Edit `src/client/contexts/CaptureContext.tsx` — add `ocrLatex: string | null`, `setOcrLatex`, `solveResult: HistoryItem | null`, `setSolveResult` to interface and state
- [x] 4.2 Update `reset()` in CaptureContext to clear `ocrLatex` and `solveResult` to `null`
- [x] 4.3 Import `HistoryItem` from `@/types/history` in CaptureContext
- [x] 4.4 Run `pnpm typecheck` — zero errors

## 5. OCR Page Rewrite (S-05)

- [x] 5.1 Rewrite `src/client/app/(main)/ocr/page.tsx` — preserve `croppedBlob` null guard (redirect to `/camera`)
- [x] 5.2 Implement OCR loading state: fire `postOcr(croppedBlob, deviceId)` on mount once `deviceId !== null`; show skeleton + "Đang nhận dạng công thức..." label
- [x] 5.3 Implement confirm state: create `objectUrl` from `croppedBlob` for 100px thumbnail; render `KaTeXRenderer` with `editedLatex`; revoke URL on unmount
- [x] 5.4 Add editable LaTeX textarea updating `editedLatex` (controlled) — font-mono, 120px height, green focus ring
- [x] 5.5 Add low-confidence amber badge: visible when `confidence < 0.6`
- [x] 5.6 Implement fixed bottom action bar: "Chụp lại" link + "Giải bài này" pill button (disabled when `editedLatex.trim()` is empty)
- [x] 5.7 Wire "Giải bài này" tap: `setOcrLatex(editedLatex)` then `router.push('/solve')`
- [x] 5.8 Wire "Chụp lại" tap: `reset()` then `router.push('/camera')`
- [x] 5.9 Run `pnpm typecheck` — zero errors on ocr/page.tsx

## 6. Solve Page — S-06 + S-07

- [x] 6.1 Create directory `src/client/app/solve/` and `page.tsx` as a flat Client Component (no `(main)` layout wrapper)
- [x] 6.2 Implement mount guard: if `ocrLatex === null`, `router.replace('/camera')`
- [x] 6.3 Implement S-06 loading state: fire `postSolve(ocrLatex, deviceId)` once `deviceId !== null`; render 3 skeleton rows + animated "Đang phân tích bài toán_" label
- [x] 6.4 Implement `StepCard` component (inline in `solve/page.tsx`): accordion header with step badge, title, `ChevronRight` rotating 90° when open
- [x] 6.5 Implement step body with `AnimatePresence` + `motion.div` height animation; explanation text + optional KaTeX formula block
- [x] 6.6 Implement answer step variant: `border-l-4 border-[#18E299]` card, "Đáp án" badge, `text-[40px]` formula display
- [x] 6.7 Implement S-07 success layout: sticky header "Lời giải", problem statement bar (KaTeXRenderer for `ocrLatex`), scrollable steps list
- [x] 6.8 Implement error state: `toast.error(error.message)` + inline error card with optional "Thử lại" button (retryable only)
- [x] 6.9 Implement fixed bottom bar: stub Bookmark icon button (no-op) + "Bài mới" pill (calls `reset()`, navigates to `/`)
- [x] 6.10 Run `pnpm typecheck` — zero errors on solve/page.tsx

## 7. Verification

- [x] 7.1 `pnpm typecheck` — zero errors across all changed files
- [x] 7.2 `pnpm test` — all tests pass (device-id.test.ts + pre-existing tests)
- [x] 7.3 `pnpm build` — production build succeeds with no errors
- [ ] 7.4 Browser: verify `X-Device-ID` header present on both `/api/ocr` and `/api/solve` network requests
- [ ] 7.5 Browser: confirm typing in LaTeX textarea live-updates KaTeX render (S-05)
- [ ] 7.6 Browser: confirm confidence < 0.6 shows amber badge; ≥ 0.6 no badge
- [ ] 7.7 Browser: confirm all step cards independently expandable (S-07)
- [ ] 7.8 Browser: confirm answer step has green left border + large formula (S-07)
- [ ] 7.9 Browser: confirm `/solve` has no BottomNav rendered
- [ ] 7.10 Browser: confirm "Bài mới" resets context and returns home
- [ ] 7.11 Manual E2E on real mobile: camera → crop → formula preview → edit → "Giải bài này" → see step solution (Hard Floor — cannot skip)
