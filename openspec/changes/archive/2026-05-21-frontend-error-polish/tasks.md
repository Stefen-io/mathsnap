## 1. Fix CaptureContext Double-Nesting (P0 Bug)

- [x] 1.1 Remove `<CaptureProvider>` import and wrapper from `src/client/app/(main)/layout.tsx`
- [x] 1.2 Verify `src/client/app/layout.tsx` still has `<CaptureProvider>` wrapping the full tree
- [x] 1.3 Smoke-test: navigate camera → crop → ocr → solve in dev; confirm `ocrLatex` is not null in solve page

## 2. S-10 Error State — OCR Page

- [x] 2.1 Add `errorInfo: { code: string; message: string; retryable: boolean } | null` state to `OcrPage`
- [x] 2.2 Update `.catch` handler in `postOcr` effect: populate `errorInfo` from `ApiError.code`, `ApiError.message`, `ApiError.retryable`; keep `setState('error')`
- [x] 2.3 Replace the static error JSX block with a code-dispatch render: OCR_NO_FORMULA and INVALID_IMAGE → message + "Chụp lại"; RATE_LIMITED retryable=true → message + "Thử lại" (re-trigger postOcr); RATE_LIMITED retryable=false → message + "Chụp lại"; fallback → "Có lỗi xảy ra." + "Chụp lại"
- [x] 2.4 Wire "Thử lại" in OCR error: call `postOcr(croppedBlob, deviceId)` → reset errorInfo → `setState('ocr-loading')` while re-fetching
- [x] 2.5 Update `ocr/page.test.tsx`: add test cases for RATE_LIMITED (burst/daily) and INVALID_IMAGE error variants

## 3. S-10 Error State — Solve Page

- [x] 3.1 Add `errorCode: string | null` state to `SolvePage` alongside existing `ErrorInfo`
- [x] 3.2 Update `catch` block in `runSolve`: populate `errorCode` from `ApiError.code` (or `'UNKNOWN'`); keep existing `ErrorInfo` for message + retryable
- [x] 3.3 Replace the static error JSX block with code-dispatch render: LLM_TIMEOUT + LLM_INVALID_RESPONSE + RATE_LIMITED(retryable) → message + "Thử lại"; LLM_CONTENT_POLICY → message + "Nhập bài toán khác" (calls `reset()` + router.push('/camera')); RATE_LIMITED(retryable=false) → message only (no button); fallback → per `retryable` flag
- [x] 3.4 Confirm `ocrLatex` is never cleared on error (no `reset()` call in catch block — preserve for retry)

## 4. S-12 Onboarding — Context and Hook

- [x] 4.1 Create `src/client/contexts/OnboardingContext.tsx`: export `OnboardingProvider` and `useOnboarding()` hook returning `{ hasSeenOnboarding: boolean, markAsSeen: () => void }`
- [x] 4.2 Initialize `hasSeenOnboarding` to `false`; read `localStorage.getItem('mathsnap.onboarding.seen')` in `useEffect` (SSR-safe); update state if `=== 'true'`
- [x] 4.3 `markAsSeen()`: set `localStorage['mathsnap.onboarding.seen'] = 'true'` and update state to `true`

## 5. S-12 Onboarding — UI Components

- [x] 5.1 Create `src/client/components/PaginationDots.tsx`: props `{ total: number, current: number }`; render `total` dots; active dot `bg-[#0d0d0d] rounded-full w-2 h-2`; inactive `bg-transparent border border-[rgba(0,0,0,0.1)] rounded-full w-2 h-2`
- [x] 5.2 Create `src/client/components/OnboardingStep.tsx`: props `{ title: string, description: string, illustration: React.ReactNode }`; render illustration area (centered, ~160px), heading (36px/600/-0.72px tracking), body (16px/400/1.5/`#666666`)
- [x] 5.3 Create `src/client/components/OnboardingOverlay.tsx`: read `hasSeenOnboarding` from `useOnboarding()`; if true return null; render `fixed inset-0 z-[60] bg-white flex flex-col items-center justify-between px-6 pt-safe pb-safe`
- [x] 5.4 Wire 3 steps in `OnboardingOverlay`: step 1 "Chụp ảnh bài toán" (Camera icon halo), step 2 "Nhận diện công thức" (decorative pill rows), step 3 "Xem lời giải từng bước" (Bookmark icon halo)
- [x] 5.5 Wire navigation: "Bỏ qua" text button (steps 1–2) → `markAsSeen()`; "Tiếp" dark pill button (steps 1–2) → `setStep(s + 1)`; "Bắt đầu" dark pill button (step 3) → `markAsSeen()`
- [x] 5.6 Add `PaginationDots` below illustration in `OnboardingOverlay`

## 6. S-12 Onboarding — Root Layout Integration

- [x] 6.1 Add `OnboardingProvider` to `src/client/app/layout.tsx` wrapping the app (alongside existing `CaptureProvider`)
- [x] 6.2 Render `<OnboardingOverlay />` inside the body so it overlays all routes
- [x] 6.3 Manual test: clear localStorage → open app → overlay visible; complete onboarding → overlay gone; reload → overlay still gone

## 7. Cut Decisions Log

- [x] 7.1 Append S-14 cut entry to `docs/plans/PHASE_2.5_IMPLEMENTATION.md` Section 7 (Cut Decisions Log): date 2026-05-20, trigger "Manual — backend constraint", cut "ProblemSelector component (S-14)", saving ~1h

## 8. Final Verification

- [x] 8.1 Run `pnpm typecheck` in `src/client/` — zero new TypeScript errors
- [x] 8.2 Run `pnpm test` in `src/client/` — all existing tests pass
- [x] 8.3 Run `pnpm lint` in `src/client/` — no new ESLint errors
