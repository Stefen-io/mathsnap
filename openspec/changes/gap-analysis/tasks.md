## 1. Fix 3 — OCR server catch-all (backend, `ocr-endpoint`)

- [ ] 1.1 Following TDD: add a pytest in `src/server/tests/` asserting that when the OCR handler hits an unexpected exception (e.g. patch the pix2tex/model call to raise `RuntimeError`), the response is `500` with body `code == "INTERNAL_ERROR"` in the standard envelope. Run it and confirm it FAILS.
- [ ] 1.2 Following TDD: add a pytest asserting a mapped error (`INVALID_IMAGE` / `OCR_NO_FORMULA` / `RATE_LIMITED`) is returned unchanged (not converted to `INTERNAL_ERROR`). Confirm it FAILS (or passes if already covered) before implementing.
- [ ] 1.3 Wrap the `routers/ocr.py` handler body in `try/except Exception` raising the existing `INTERNAL_ERROR` `AppError`, ensuring typed `AppError`/`HTTPException` propagate first so mapped errors are not masked.
- [ ] 1.4 Run `pytest` for the OCR tests; confirm 1.1 and 1.2 now PASS and no existing OCR test regressed.

## 2. Fix 1 — History detail renders all steps expanded (`history-item-detail`)

- [ ] 2.1 Following TDD: update/add a test in `app/(main)/history/[id]/page.test.tsx` asserting that after `getHistoryItem` resolves with N steps, all N StepCards render expanded (no step collapsed by default). Run and confirm it FAILS.
- [ ] 2.2 Change the initial open-step state in `app/(main)/history/[id]/page.tsx` to all step indices (e.g. `new Set(steps.map((_, i) => i + 1))`).
- [ ] 2.3 Run the test; confirm it PASSES and steps remain individually collapsible.

## 3. Fix 6 — Solve page starts all-open (`solution-viewer`)

- [ ] 3.1 Following TDD: update/add a test in `app/solve/page.test.tsx` asserting that on `postSolve` success all StepCards start expanded. Run and confirm it FAILS.
- [ ] 3.2 Change the initial open-step state in `app/solve/page.tsx` from `new Set([1])` to all step indices.
- [ ] 3.3 Run the test; confirm it PASSES and individual toggle still works (no locked state).

## 4. Fix 7 — Settings re-onboarding (`onboarding-overlay` + `settings-screen`)

- [ ] 4.1 Following TDD: add a test in `contexts/OnboardingContext.test.tsx` asserting that `useOnboarding()` exposes `replayOnboarding()` and that calling it sets `hasSeenOnboarding` back to `false` (overlay re-shows). Run and confirm it FAILS.
- [ ] 4.2 Add `replayOnboarding()` to `OnboardingContext` that sets `hasSeenOnboarding = false`; include it in the context value and `OnboardingState` type. Run the test; confirm it PASSES.
- [ ] 4.3 Following TDD: update/add a test in `app/(main)/settings/page.test.tsx` (mock `@/contexts/OnboardingContext`'s `useOnboarding`) asserting that clicking the "Xem lại hướng dẫn" row calls `replayOnboarding()`. Run and confirm it FAILS.
- [ ] 4.4 Wire the row's `onClick` in `app/(main)/settings/page.tsx` to `useOnboarding().replayOnboarding()`.
- [ ] 4.5 Run the settings test; confirm it PASSES.

## 5. Fix 2 — OCR client timeout (`api-client` + `formula-preview-edit`)

- [ ] 5.1 Following TDD: add tests in `lib/api.test.ts` asserting `postOcr` (a) passes an `AbortController` signal to fetch, (b) aborts after 10000 ms (use fake timers), (c) throws an `ApiError` with `code === 'OCR_TIMEOUT'` and `retryable === true`, and (d) clears the timer on a successful response. Run and confirm they FAIL.
- [ ] 5.2 Implement the 10s `AbortController` timeout in `lib/api.ts` `postOcr`; synthesise the client-only `OCR_TIMEOUT` `ApiError` on abort; clear the timer on settle.
- [ ] 5.3 Following TDD: add a test in `app/(main)/ocr/page.test.tsx` asserting an `OCR_TIMEOUT` error renders the message plus a "Thử lại" button (re-fires `postOcr`) and a "Nhập thủ công" button (navigates `/manual`). Confirm it FAILS.
- [ ] 5.4 Add the `OCR_TIMEOUT` branch to the OCR page error dispatch (message + "Thử lại" + "Nhập thủ công" → `/manual`); ensure no other error variant gained the manual CTA unintentionally.
- [ ] 5.5 Run `lib/api.test.ts` and `ocr/page.test.tsx`; confirm all PASS and no existing OCR error-variant test regressed.

## 6. Fix 4 — Camera fallback (`camera-intake-flow` + `home-screen`)

- [ ] 6.1 Following TDD: add tests in `hooks/useCamera.test.ts` asserting `cameraUnavailable` becomes `true` for `NotAllowedError`, `NotFoundError`, and unsupported API (absent `navigator.mediaDevices` / `NotSupportedError`), and stays `false` on success. Run and confirm they FAIL.
- [ ] 6.2 Implement error classification in `hooks/useCamera.ts`; expose `cameraUnavailable`; stop swallowing errors.
- [ ] 6.3 Following TDD: add a test in `app/(main)/page.test.tsx` (mock `navigator.mediaDevices`) asserting the "Chụp ảnh" Camera CTA is hidden when the camera API is unsupported / no `videoinput` device, while "Tải lên" and "Nhập LaTeX" remain, and that no `getUserMedia` call is made on render. Confirm it FAILS.
- [ ] 6.4 Add a non-streaming availability probe to `app/(main)/page.tsx` (check `navigator.mediaDevices?.getUserMedia` presence + `enumerateDevices()` for a `videoinput`) and conditionally render the Camera CTA. Do NOT mount `useCamera` on Home (it would start a stream/prompt).
- [ ] 6.5 Fix pre-existing `app/(main)/page.test.tsx` tests broken by the probe: happy-dom's `navigator.mediaDevices` has no `getUserMedia`, so the probe hides the CTA. Tests asserting the Camera CTA is present must stub `navigator.mediaDevices` (getUserMedia defined + `enumerateDevices` returning a `videoinput`) and assert via `await`/`findBy*`; add `afterEach(() => vi.unstubAllGlobals())`.
- [ ] 6.6 Run both tests + the full home test file; confirm they PASS.

## 7. Verification & wrap-up

- [ ] 7.1 Run the full client suite (`pnpm test` / vitest) in `src/client/` — all green, no regressions.
- [ ] 7.2 Run the full server suite (`pytest`) in `src/server/` — all green, no regressions.
- [ ] 7.3 Run client lint (`pnpm lint`) — clean.
- [ ] 7.4 Run `npx gitnexus detect_changes` and confirm affected symbols are limited to the files in this change's Impact list; no unexpected blast radius.
- [ ] 7.5 Manual browser check: history/bookmark detail all-open; solve all-open; settings "Xem lại hướng dẫn" opens onboarding; OCR timeout path (throttle/abort) shows Thử lại + Nhập thủ công; Home camera CTA hidden when permission denied (desktop no-camera or denied) with upload still working.
