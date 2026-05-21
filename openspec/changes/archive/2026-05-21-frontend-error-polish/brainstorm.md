## Design Summary

Change G5 `frontend-error-polish` resolves a P0 state-sharing bug that breaks the OCR→Solve flow, upgrades error handling to display 3 semantically distinct error variants (S-10), and adds a one-time onboarding overlay (S-12). S-14 Problem Selector is cut because the backend always returns exactly one formula, making it dead code.

The explore session confirmed all decisions before brainstorming. No clarifying questions were needed.

## Alternatives Considered

### Approach A: Fix CaptureContext via sessionStorage bridge

**Approach:** Keep two CaptureProvider instances; sync state between them via `sessionStorage` on every `setOcrLatex` call.

**Pros:** No layout restructuring; isolated change.

**Cons:** Two sources of truth, race conditions, significantly more complexity for a trivial fix.

**Why not chosen:** The root cause is the duplicate provider. Removing it is a one-line fix with no downside.

### Approach B: Remove CaptureProvider from `(main)/layout.tsx` (chosen)

**Approach:** Delete the `<CaptureProvider>` wrapper from `(main)/layout.tsx`. The root `app/layout.tsx` already wraps the entire tree, so all pages — including `solve/page.tsx` outside the `(main)` group — share a single context instance.

**Pros:** Correct, minimal, one-line change. No architectural complexity.

**Cons:** None. Root layout already provides the context.

**Why chosen:** Simplest correct fix.

### Approach C: Move solve page inside `(main)` route group

**Approach:** Relocate `app/solve/page.tsx` to `app/(main)/solve/page.tsx` so it benefits from the inner CaptureProvider.

**Pros:** Keeps root layout clean.

**Cons:** Solve page intentionally lacks BottomNav (it has its own header). Moving it into `(main)` would add BottomNav unless the main layout is restructured. More disruptive than the one-line fix.

**Why not chosen:** More risky change for the same result.

---

### S-10 Error Handling — Approach A: Single generic error card

Keep the current approach (generic message + single CTA), just update copy.

**Why not chosen:** Violates spec SD §5.5–5.7. Rate-limited users and OCR-failed users need different CTAs. A daily-rate-limited user should NOT see "Chụp lại" — they cannot retry until tomorrow.

### S-10 Error Handling — Approach B: Code-dispatch with variant components (chosen)

Check `ApiError.code` in the catch handler; render the appropriate message + CTA set per code.

**Why chosen:** Matches spec exactly. Each error variant is clear and actionable. Backend already returns distinct codes and messages — frontend just needs to dispatch on them.

### S-10 Error Handling — Approach C: Centralized ErrorCard component

Abstract all error variants into a single `<ErrorCard code={} message={} retryable={} />` component.

**Why not chosen:** Only two pages need error handling. Premature abstraction for 2 callsites. The variant logic is simple enough to inline.

---

### S-12 Onboarding — Approach A: Modal via Radix Dialog

Reuse the existing Radix Dialog primitive.

**Why not chosen:** Dialog is semantically for transient user-initiated actions. Onboarding is app-initiated and full-screen. Radix Dialog would require fighting its scroll-lock and backdrop behavior. The design guide (s12-onboarding-round1.md E3) explicitly rules this out.

### S-12 Onboarding — Approach B: Custom full-screen overlay (chosen)

Custom `OnboardingOverlay.tsx` with `fixed inset-0 z-[60]` styling, controlled by `useOnboarding()` hook.

**Why chosen:** Full control, no fighting primitives, matches the design guide spec exactly.

### S-12 Onboarding — Approach C: Route-based onboarding page (`/onboarding`)

Redirect first-time users to a dedicated route.

**Why not chosen:** Deep-link users landing on `/history` or `/solve` would bypass it. A route-based approach cannot intercept arbitrary entry points. The overlay in root layout covers all routes naturally.

## Agreed Approach

1. **CaptureContext fix (P0):** Remove `<CaptureProvider>` from `(main)/layout.tsx` — root layout already provides it.
2. **S-10 Error State:** Dispatch on `ApiError.code` in both `ocr/page.tsx` and `solve/page.tsx`. Show code-specific messages (from backend where available) and context-appropriate CTAs. No new shared component — inline in each page.
3. **S-12 Onboarding:** Custom `OnboardingOverlay` in root layout. Hook `useOnboarding()` owns localStorage (`mathsnap.onboarding.seen`). Both "Bỏ qua" and "Bắt đầu" set the flag. 3 steps with PaginationDots.
4. **S-14:** Cut. Record in Cut Decisions Log.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| CaptureContext fix strategy | Remove duplicate from `(main)/layout.tsx` | One-line fix; root layout is correct single source |
| "Nhập thủ công" CTA in OCR error | Skip | S-11 route doesn't exist; broken link is worse than no link |
| Rate limit reset time display | Use backend message verbatim | Backend already embeds "vào ngày mai"; no schema change needed |
| S-14 Problem Selector | Cut | Backend always returns 1 formula; real implementation requires backend change |
| S-12 Settings entry | Skip | S-13 not built; add "Xem lại hướng dẫn" when S-13 is implemented |
| Onboarding "Bỏ qua" behavior | Sets seen flag | Respects user intent — do not show again after an explicit skip |
| localStorage key | `mathsnap.onboarding.seen` | Dot-notation namespace convention per design guide |
| Onboarding entry point | `app/layout.tsx` (root) | Covers all routes including deep links |

## Open Questions

None — all questions resolved in explore session.
