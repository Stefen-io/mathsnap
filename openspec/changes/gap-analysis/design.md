## Context

The pre-G7 audit (`docs/plans/G7_GAP_REGISTER.md`) compared the codebase against the canonical `openspec/specs/` (the `changes/` dir is empty, so the specs *are* the contract). The core flow works end-to-end with full backend contract fidelity, but four correctness gaps touch Hard Floor screens and a few behaviours diverge from their specs. This change is a conformance pass before `audit-and-release` (G7), scoped to 6 fixes. Stack: Next.js App Router frontend (`src/client/`), FastAPI backend (`src/server/`). Tests: Vitest (client), pytest (server).

## Goals / Non-Goals

**Goals:**
- Make `solve` and `history/[id]` render solutions all-open per `solution-viewer` (Fixes 1, 6).
- Prevent indefinite OCR hangs with a 10s client abort and a graceful manual-input escape (Fix 2).
- Return a structured `INTERNAL_ERROR` from the OCR endpoint on unexpected failure (Fix 3).
- Surface camera unavailability and hide the dead Camera CTA (Fix 4).
- Wire the Settings "Xem lại hướng dẫn" row to re-trigger onboarding (Fix 7, pure conformance).
- Keep the backend error/data contract unchanged.

**Non-Goals:**
- Removing the low-confidence badge (dropped — intentional dormant design).
- FR-8 UI i18n (next-intl), FR-1d crop rotate, desktop layouts, dark-mode screen wiring, S-14 multi-formula — all out of scope.
- Any new backend error code or schema change.

## Decisions

- **D1 — `OCR_TIMEOUT` is client-only.** `postOcr` wraps `fetch` with an `AbortController` (10s). On abort it throws `new ApiError('OCR_TIMEOUT', <vi message>, retryable=true)`. The backend never emits this code; `api-schemas`/`errors.py` are untouched. Chosen over reusing `LLM_TIMEOUT` (solve-only, misleading) and over a new backend code (the timeout is purely a client concern).
- **D2 — `formula-preview-edit` error table gains an `OCR_TIMEOUT` row** (message + "Thử lại" + "Nhập thủ công" → `/manual`). The stale "error state MUST NOT add a 'Nhập thủ công' CTA" line is removed because the S-11 manual route now exists.
- **D3 — All-open is the default, not a toggle.** Both `solve/page.tsx` and `history/[id]/page.tsx` initialise their open-step set to *all* step indices (`new Set(steps.map((_, i) => i + 1))`). No "Xem tất cả"/"Thu gọn" control — `solution-viewer` mandates all-open with free toggling, so a show-all button would be redundant.
- **D4 — OCR catch-all reuses the existing envelope.** Wrap the `routers/ocr.py` body in `try/except Exception` that raises the existing `INTERNAL_ERROR` `AppError`; let already-typed `AppError`/`HTTPException` propagate (catch `Exception` after the specific handlers, or re-raise known types) so mapped errors (`INVALID_IMAGE`, `OCR_NO_FORMULA`, `RATE_LIMITED`) are not masked.
- **D5 — `useCamera` exposes `cameraUnavailable`; Home uses a separate non-streaming probe.** `useCamera` classifies `getUserMedia` rejections (`NotAllowedError`/`NotFoundError`/`NotSupportedError`, plus absent `navigator.mediaDevices`) into a boolean and stops swallowing errors — this serves the camera page (and prevents the unhandled-rejection crash). The **Home page MUST NOT mount `useCamera`**, because that would start a camera stream and trigger a permission prompt on Home load. Instead Home runs a lightweight, no-prompt probe: hide the Camera CTA when `navigator.mediaDevices?.getUserMedia` is absent or `enumerateDevices()` reports no `videoinput`. This is a deliberate refinement of the original "page.tsx reads `cameraUnavailable`" sketch. (Permission-denied specifically is not pre-detectable on Home without prompting; that case is handled where the stream actually runs.)
- **D6 — Fix 7 needs an `onboarding-overlay` extension, not just settings wiring.** `OnboardingContext` currently exposes only `hasSeenOnboarding` + `markAsSeen()`; the overlay (mounted in `app/layout.tsx`) shows when `!hasSeenOnboarding`. To replay, add `replayOnboarding()` that sets `hasSeenOnboarding = false` (re-rendering the root overlay over the current screen — no navigation needed). `settings-screen` itself stays conformance: wire the row's `onClick` to `replayOnboarding()`.

## Risks / Trade-offs

- **Camera fallback false-positives** → A transient `getUserMedia` failure could hide the Camera CTA for a usable camera. Mitigation: only set `cameraUnavailable` for the three terminal error names + unsupported-API, not generic errors; test desktop-no-camera and permission-denied paths.
- **Catch-all masking real errors** → A broad `except Exception` could swallow the mapped `INVALID_IMAGE`/`OCR_NO_FORMULA`/`RATE_LIMITED`. Mitigation: order handlers so typed errors are raised/propagated before the catch-all, with a test asserting a mapped error passes through unchanged.
- **AbortController interaction with retry** → "Thử lại" after a timeout must create a fresh controller/timer. Mitigation: scope the controller per `postOcr` call; clear the timer on settle.
- **All-open performance** → Large solutions render every step expanded. Acceptable: solutions are short (a handful of steps); `motion` animation only runs on toggle.

## Migration Plan

Pure code change, no data migration. Deploy frontend (Vercel) and backend (Railway) independently; each fix is isolated and reversible by revert. Suggested merge order (low-risk → higher-touch): Fix 3 (backend-only) → Fix 1 → Fix 6 → Fix 7 → Fix 2 (api.ts + ocr page) → Fix 4 (hook + home). Validate with `gitnexus detect_changes` that the blast radius stays within the listed files before committing.

## Open Questions

- None blocking. The exact Vietnamese copy for the `OCR_TIMEOUT` message can be finalised during implementation (placeholder: "Nhận dạng quá lâu, vui lòng thử lại hoặc nhập thủ công.").
