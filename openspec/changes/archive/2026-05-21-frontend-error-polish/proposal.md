## Why

The OCR→Solve happy path is silently broken: a duplicate `CaptureProvider` in the main layout creates split state trees, so `ocrLatex` is always `null` in the solve page, redirecting every user back to the camera. Additionally, all error states across the app collapse into a single generic UI regardless of root cause — a rate-limited user and a corrupted-image user see identical screens with identical CTAs, which is incorrect and confusing. First-time users receive no onboarding. This change fixes the P0 flow breakage, upgrades error handling to the spec-required 3-variant model, and delivers the one-time onboarding overlay before the Phase 2.5 deadline.

## What Changes

**CaptureProvider scope**
- From: Two nested `CaptureProvider` instances — one in root layout, one in `(main)` layout — create isolated state trees. Solve page reads from root (always null).
- To: Single `CaptureProvider` in root layout only. `(main)` layout removed as a provider.
- Reason: OCR→Solve state sharing is broken without this fix.
- Impact: Non-breaking. No API or behavioral change for users.

**S-10 Error State — OCR page**
- From: Generic "Không nhận diện được công thức." + single "Chụp lại" button for all errors.
- To: Code-dispatched messages and CTAs per `ApiError.code` (OCR_NO_FORMULA, INVALID_IMAGE, RATE_LIMITED daily/burst).
- Reason: Spec SD §5.5, §5.7 requires distinct error variants with appropriate actions.
- Impact: Non-breaking. Frontend-only.

**S-10 Error State — Solve page**
- From: Generic retryable check with a single "Thử lại" CTA or no button.
- To: Code-dispatched CTAs — "Nhập bài toán khác" for LLM_CONTENT_POLICY; no button for RATE_LIMITED daily; "Thử lại" for all retryable codes.
- Reason: Spec SD §5.6, §5.7. State preservation (ocrLatex) already correct — unchanged.
- Impact: Non-breaking. Frontend-only.

**S-12 Onboarding overlay**
- From: No onboarding. First-time users see the home screen immediately.
- To: Full-screen 3-step overlay on first app launch. Dismissed by "Bắt đầu" or "Bỏ qua". Both set `localStorage['mathsnap.onboarding.seen']`. Never shown again.
- Reason: PRD OQ-3 / SD requirement. Improves first-time user experience.
- Impact: New localStorage key. No backend impact. Overlay does not appear for returning users.

**S-14 Problem Selector**
- From: OCR page hardcodes `formulas[0]`.
- To: Same. S-14 cut — no change.
- Reason: Backend pix2tex always returns 1 formula. Implementing a selector for a list that never exceeds length 1 is dead code. Recorded in Cut Decisions Log.
- Impact: None.

## Capabilities

### New Capabilities
- `onboarding-overlay`: First-time user onboarding overlay — 3-step full-screen UI, localStorage persistence, `useOnboarding()` hook.

### Modified Capabilities
- `formula-preview-edit`: S-10 OCR error variants added to the OCR confirm/error flow.
- `solution-viewer`: S-10 LLM/rate-limit error variants added to the solve page error flow.

## Impact

**Files modified:**
- `src/client/app/layout.tsx` — add `OnboardingProvider`, render `<OnboardingOverlay />`
- `src/client/app/(main)/layout.tsx` — remove `CaptureProvider`
- `src/client/app/(main)/ocr/page.tsx` — S-10 OCR error variant dispatch
- `src/client/app/solve/page.tsx` — S-10 LLM/rate-limit error variant dispatch
- `docs/plans/PHASE_2.5_IMPLEMENTATION.md` — S-14 cut entry in Section 7

**Files created:**
- `src/client/contexts/OnboardingContext.tsx`
- `src/client/components/OnboardingOverlay.tsx`
- `src/client/components/OnboardingStep.tsx`
- `src/client/components/PaginationDots.tsx`

**No backend changes. No database migrations. No API changes.**
