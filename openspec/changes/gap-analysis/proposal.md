## Why

A pre-G7 gap audit (`docs/plans/G7_GAP_REGISTER.md`) compared the codebase against the canonical `openspec/specs/` and found the core flow works end-to-end, but **four correctness gaps touch Hard Floor screens** and several behaviours diverge from their specs. This change brings the codebase back into conformance with the existing specs and closes the release-blocking gaps before G7 `audit-and-release`. It is a conformance + small-delta change, not a new feature.

## What Changes

Six fixes (one original proposal item — removing the low-confidence badge — was **dropped** after the audit showed the badge is intentional dormant design per `ocr-endpoint` + `formula-preview-edit`, not dead code):

- **Fix 1 — History detail opens all steps.** `history/[id]/page.tsx` initialises only step 1 open; it MUST render the stored solution with all steps expanded (matches the S-07 all-open accordion pattern).
- **Fix 2 — OCR client timeout.** `postOcr` has no timeout; a slow OCR call hangs indefinitely. Add a 10s `AbortController`; on timeout the OCR page shows an error state with a "Nhập thủ công" (manual input) escape. Also removes a now-stale spec constraint that forbade that CTA before S-11 existed.
- **Fix 3 — OCR server catch-all.** `routers/ocr.py` has no catch-all, so unexpected exceptions escape as unstructured 500s. Wrap the handler to return the structured `INTERNAL_ERROR` envelope.
- **Fix 4 — Camera fallback.** `useCamera` swallows `getUserMedia` errors. Stop swallowing and expose a `cameraUnavailable` flag on permission-denied / unsupported / no-device errors. The Home "Chụp ảnh" CTA is always shown even when there is no camera; hide it using a **non-streaming** availability probe (so Home never starts a camera stream or prompts on load). Upload + manual entry remain.
- **Fix 6 — Solve starts all-open.** `solve/page.tsx` starts with only step 1 open, contradicting `solution-viewer`'s "all-open, no locked state" requirement. Make all steps start expanded. (No "Xem tất cả" button — the spec already mandates all-open.)
- **Fix 7 — Settings re-onboarding.** The "Xem lại hướng dẫn" row is a dead button; `settings-screen` already requires it to trigger the onboarding overlay, but `useOnboarding()` exposes no replay action. Add a `replayOnboarding()` to the onboarding context and wire the row to it.

No new error code enters the **backend** contract: the OCR timeout is a client-side abort surfaced as a client-only `OCR_TIMEOUT` `ApiError` (documented in design).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `history-item-detail`: clarify that the stored solution renders with all `StepCard`s expanded (Fix 1).
- `api-client`: `postOcr` enforces a 10s `AbortController` timeout and throws a client-only `OCR_TIMEOUT` `ApiError` on abort (Fix 2).
- `formula-preview-edit`: error dispatch handles the OCR timeout (message + "Nhập thủ công" CTA → `/manual`); remove the stale "error state MUST NOT add a 'Nhập thủ công' CTA" constraint now that S-11 exists (Fix 2).
- `ocr-endpoint`: add a catch-all requirement — unexpected exceptions return the structured `INTERNAL_ERROR` envelope instead of a bare 500 (Fix 3).
- `camera-intake-flow`: `useCamera` exposes `cameraUnavailable` on `NotAllowedError` / `NotFoundError` / `NotSupportedError` (Fix 4).
- `home-screen`: the Camera ("Chụp ảnh") CTA is hidden when the camera is unavailable, detected via a non-streaming probe (Fix 4).
- `solution-viewer`: clarify that on `postSolve` success all `StepCard`s start expanded (Fix 6).
- `onboarding-overlay`: `useOnboarding()` gains a `replayOnboarding()` action that re-shows the overlay (Fix 7).

_Conformance-only (no spec delta):_ `settings-screen` (Fix 7) — the existing requirement (the "Xem lại hướng dẫn" row triggers onboarding) is satisfied by wiring the row to the new `replayOnboarding()` action.

## Impact

- **Frontend** (`src/client/`): `app/(main)/history/[id]/page.tsx`, `app/solve/page.tsx`, `app/(main)/ocr/page.tsx`, `app/(main)/page.tsx`, `app/(main)/settings/page.tsx`, `hooks/useCamera.ts`, `lib/api.ts`, `contexts/OnboardingContext.tsx` + their `.test.tsx`/`.test.ts` siblings.
- **Backend** (`src/server/`): `app/routers/ocr.py` + `tests/`.
- **Contracts**: no backend error-code or schema change; `OCR_TIMEOUT` is client-only. `formula-preview-edit` loses a stale constraint.
- **Risk**: low — surgical, mostly conformance. The two highest-touch items (Fix 2 api.ts + ocr page, Fix 4 hook + home) need careful testing (desktop no-camera + mobile). Validate with `gitnexus detect_changes` that the blast radius stays within the listed files.
