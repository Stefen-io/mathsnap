## 1. Foundation — Dependencies, Types, Tokens

- [x] 1.1 Install `react-easy-crop` via `pnpm add react-easy-crop` in `src/client/`; verify no React 19 peer dep warnings
- [x] 1.2 Install `@testing-library/react` and `@testing-library/user-event` via `pnpm add -D` if not already present (needed for component tests)
- [x] 1.3 Create `src/client/types/history.ts` — export `SolutionStep` and `HistoryItem` interfaces (camelCase, matching SYSTEM_DESIGN §3.7); spec: `frontend-type-contracts`
- [x] 1.4 Create `src/client/fixtures/solution.ts` — export `MOCK_SOLUTION_STEPS: SolutionStep[]` with ≥3 steps (1 with formula, 1 without, 1 answer); spec: `frontend-type-contracts`
- [x] 1.5 Extend `src/client/app/globals.css` `:root` block with brand tokens: `--color-brand: #18E299`, `--color-brand-light: #d4fae8`, `--color-brand-deep: #0fa76e`; spec: `home-screen`
- [x] 1.6 Run `pnpm typecheck` — confirm `fixtures/history.ts` now compiles cleanly (was blocked by missing types file)

## 2. CaptureContext (TDD)

- [x] 2.1 **TEST FIRST** — write `src/client/contexts/CaptureContext.test.tsx`: tests for (a) initial null state, (b) `setCapturedBlob` updates state, (c) `setCroppedBlob` updates state, (d) `reset()` clears both blobs, (e) `useCaptureContext()` throws outside provider
- [x] 2.2 Implement `src/client/contexts/CaptureContext.tsx` — `CaptureProvider`, `useCaptureContext`, state shape `{ capturedBlob, croppedBlob, setCapturedBlob, setCroppedBlob, reset }`; spec: `camera-intake-flow`
- [x] 2.3 Run `pnpm test` — CaptureContext tests pass

## 3. useCamera Hook (TDD)

- [x] 3.1 **TEST FIRST** — write `src/client/hooks/useCamera.test.ts`: mock `navigator.mediaDevices.getUserMedia`; tests for (a) stream starts on init with `facingMode: 'environment'`, (b) tracks stopped on cleanup, (c) `captureFrame()` returns Blob with `type === 'image/jpeg'`, (d) `flipCamera()` restarts stream with opposite facingMode
- [x] 3.2 Implement `src/client/hooks/useCamera.ts` — `getUserMedia` start/stop, `captureFrame()` via canvas `toBlob` (jpeg 0.85), `flipCamera()` toggle, cleanup on unmount; spec: `camera-intake-flow`
- [x] 3.3 Run `pnpm test` — useCamera tests pass

## 4. BottomNav Component (TDD)

- [x] 4.1 **TEST FIRST** — write `src/client/components/BottomNav.test.tsx`: tests for (a) Home tab has active class at `/`, (b) History tab has active class at `/history`, (c) all 3 tabs render, (d) renders without crashing given any pathname
- [x] 4.2 Implement `src/client/components/BottomNav.tsx` — 3 tabs (Home `/`, History `/history`, Settings `/settings`), active state via `usePathname()`; spec: `home-screen`
- [x] 4.3 Run `pnpm test` — BottomNav tests pass

## 5. KaTeXRenderer Stub (TDD)

- [x] 5.1 **TEST FIRST** — write `src/client/components/KaTeXRenderer.test.tsx`: tests for (a) renders without crashing given a `latex` prop, (b) TypeScript accepts `latex: string` prop
- [x] 5.2 Implement `src/client/components/KaTeXRenderer.tsx` — `KaTeXRendererImpl` renders via `katex.renderToString(latex)` + `dangerouslySetInnerHTML`; default export wrapped with `dynamic(() => import('./KaTeXRendererImpl'), { ssr: false })`; spec: `frontend-type-contracts`
- [x] 5.3 Run `pnpm test` — KaTeXRenderer tests pass

## 6. Main Layout + Home Screen (TDD)

- [x] 6.1 Create `src/client/app/(main)/layout.tsx` — wraps children in 480px centered container, provides `CaptureProvider`, renders `<BottomNav />` conditionally (hidden on paths matching `/camera`, `/crop`, `/ocr`); spec: `home-screen`
- [x] 6.2 **TEST FIRST** — write `src/client/app/(main)/page.test.tsx`: tests for (a) 3 CTA buttons render, (b) Camera CTA click calls `router.push('/camera')`, (c) page mounts without crash
- [x] 6.3 Implement `src/client/app/(main)/page.tsx` — Home screen: heading, 3 CTA buttons ("Chụp ảnh" → `/camera`, "Thư viện" → no-op, "Lịch sử" → no-op); spec: `home-screen`
- [x] 6.4 Delete `src/client/app/page.tsx` (placeholder replaced by `(main)/page.tsx`)
- [x] 6.5 Run `pnpm test` — Home screen tests pass

## 7. Camera Screen (TDD)

- [x] 7.1 **TEST FIRST** — write `src/client/app/(main)/camera/page.test.tsx`: mock `useCamera`; tests for (a) `<video>` element present with `autoPlay` and `playsInline`, (b) shutter button present, (c) shutter click calls `setCapturedBlob` and `router.push('/crop')`, (d) flip button calls `flipCamera`
- [x] 7.2 Implement `src/client/app/(main)/camera/page.tsx` — `'use client'`, attaches `useCamera` `videoRef` to `<video>`, shutter button calls `captureFrame()` → `setCapturedBlob(blob)` → `router.push('/crop')`, flip button calls `flipCamera()`; spec: `camera-intake-flow`
- [x] 7.3 Run `pnpm test` — Camera screen tests pass

## 8. Crop Screen (TDD)

- [x] 8.1 **TEST FIRST** — write `src/client/app/(main)/crop/page.test.tsx`: mock `react-easy-crop`; tests for (a) redirects to `/camera` when `capturedBlob` is null, (b) `Cropper` renders with valid image src when blob present, (c) Confirm button calls `setCroppedBlob` and navigates to `/ocr`, (d) Cancel button navigates to `/camera`
- [x] 8.2 Implement `src/client/app/(main)/crop/page.tsx` — `'use client'`, reads `capturedBlob` from context (redirect if null), renders `<Cropper>` from `react-easy-crop` (aspectRatio 4/3, zoom 1–3), Confirm calls `getCroppedImg()` → `setCroppedBlob(blob)` → `/ocr`, Cancel → `/camera`; spec: `camera-intake-flow`
- [x] 8.3 Implement `src/client/lib/getCroppedImg.ts` — canvas crop helper returning `Promise<Blob>` (jpeg 0.85); standard `react-easy-crop` pattern
- [x] 8.4 Run `pnpm test` — Crop screen tests pass

## 9. OCR Loading Screen (TDD)

- [x] 9.1 **TEST FIRST** — write `src/client/app/(main)/ocr/page.test.tsx`: tests for (a) redirects to `/camera` when `croppedBlob` is null, (b) skeleton elements are present in DOM when blob exists, (c) no fetch/network calls are made
- [x] 9.2 Implement `src/client/app/(main)/ocr/page.tsx` — `'use client'`, reads `croppedBlob` (redirect if null), renders pulsing skeleton (formula area placeholder + step list placeholder, no API call); spec: `camera-intake-flow`
- [x] 9.3 Run `pnpm test` — OCR screen tests pass

## 10. Final Verification

- [x] 10.1 Run `pnpm typecheck` — zero TypeScript errors across all new files
- [x] 10.2 Run `pnpm test` — all tests pass with 0 failures
- [x] 10.3 Run `pnpm lint` — no lint errors
- [x] 10.4 Manually verify on mobile (or browser devtools mobile simulation): Home screen visible → tap Camera → rear camera activates → shutter → Crop screen → Confirm → OCR skeleton; BottomNav hidden on capture flow screens
