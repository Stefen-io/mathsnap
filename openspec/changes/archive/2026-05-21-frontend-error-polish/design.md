## Context

Phase 2.5 G4 (`frontend-solve-flow`) shipped the OCR and Solve pages, but left two issues:

1. **CaptureContext double-nesting bug (P0):** `app/(main)/layout.tsx` wraps pages with its own `<CaptureProvider>`, and `app/layout.tsx` (root) also wraps the full tree with another `<CaptureProvider>`. The `solve/` route sits *outside* the `(main)` route group, so it reads from the root provider instance. The OCR page writes `ocrLatex` into the *inner* (main) provider instance. These are different React state trees — `ocrLatex` is always `null` in the solve page, causing an immediate redirect back to `/camera`. The happy path E2E flow is silently broken.

2. **S-10 Error State:** Both `ocr/page.tsx` and `solve/page.tsx` handle errors generically — a single message + single CTA regardless of error code. This conflates OCR failure, LLM failure, rate-limit-burst, and rate-limit-daily into the same UI, violating SD §5.5–5.7.

3. **S-12 Onboarding:** No implementation exists. First-time users see no onboarding guidance.

4. **S-14 Problem Selector:** Specified in PRD OQ-4 but infeasible — the pix2tex backend always returns exactly one formula per image.

## Goals / Non-Goals

**Goals:**
- Fix CaptureContext so OCR→Solve state flows through a single provider instance
- Implement S-10 with 3 semantically distinct error variants: OCR Fail, LLM Fail, Rate Limited
- Implement S-12 as a full-screen one-time overlay, triggered from root layout
- Record the S-14 cut in the Cut Decisions Log

**Non-Goals:**
- S-11 Manual LaTeX Input (`/manual` route) — dependency for "Nhập thủ công" CTA
- S-13 Settings page — dependency for "Xem lại hướng dẫn" entry
- S-14 Problem Selector — cut (backend constraint)
- Backend schema changes (no `reset_at` field needed)
- Internationalization of error messages (backend already returns Vietnamese strings)

## Decisions

### D1 — CaptureContext: remove from `(main)/layout.tsx`

Root `app/layout.tsx` wraps the entire Next.js tree and is never remounted during client-side navigation. All pages — inside or outside `(main)` — get the same context instance. The fix is to delete the `<CaptureProvider>` import and wrapper from `(main)/layout.tsx`.

Why not move `solve/` into `(main)/`: the solve page intentionally omits `BottomNav`. Restructuring the main layout to conditionally hide nav would be more disruptive than the one-line fix.

### D2 — S-10: inline code dispatch, no shared ErrorCard component

Both `ocr/page.tsx` and `solve/page.tsx` get a `errorCode` state field alongside the existing `error` state. The `catch` handler sets both. The render section dispatches on `errorCode` to select message and CTAs.

No shared `ErrorCard` component is introduced. Only two callsites exist; abstracting would be premature. Each page's error variants differ (OCR page: no "Nhập bài toán khác"; Solve page: no "Chọn ảnh khác").

Error code dispatch table — OCR page:

| `ApiError.code` | `retryable` | Message source | CTAs |
|---|---|---|---|
| `OCR_NO_FORMULA` | false | `err.message` (backend) | Chụp lại |
| `INVALID_IMAGE` | false | `err.message` (backend) | Chụp lại |
| `RATE_LIMITED` | true | `err.message` (backend) | Thử lại (re-trigger OCR) |
| `RATE_LIMITED` | false | `err.message` (backend) | Chụp lại |
| fallback | any | "Có lỗi xảy ra." | Chụp lại |

Error code dispatch table — Solve page:

| `ApiError.code` | `retryable` | Message source | CTAs |
|---|---|---|---|
| `LLM_TIMEOUT` | true | `err.message` | Thử lại |
| `LLM_INVALID_RESPONSE` | true | `err.message` | Thử lại |
| `LLM_CONTENT_POLICY` | false | `err.message` | Nhập bài toán khác → `/camera` |
| `RATE_LIMITED` | true | `err.message` | Thử lại |
| `RATE_LIMITED` | false | `err.message` | (no button — informational only) |
| fallback | true | "Không thể tạo lời giải." | Thử lại |
| fallback | false | "Không thể tạo lời giải." | (no button) |

SD §5.6 state preservation: `ocrLatex` is never cleared on LLM error. "Thử lại" re-calls `runSolve()` with the preserved latex. This is already the existing behavior — no change needed.

### D3 — S-12: custom overlay in root layout, hook owns localStorage

`OnboardingContext.tsx` exports `OnboardingProvider` and `useOnboarding()`. The hook reads `localStorage.getItem('mathsnap.onboarding.seen')` on mount (SSR-safe via `useEffect`). `markAsSeen()` sets `localStorage` and updates state.

`OnboardingOverlay.tsx` reads `hasSeenOnboarding` from the hook. If true, returns `null`. Otherwise renders a `fixed inset-0 z-[60] bg-white` full-screen overlay with 3 steps.

Step content (from s12-onboarding-round1.md design guide):
- Step 1 — "Chụp ảnh bài toán" — Camera Lucide icon halo + description
- Step 2 — "Nhận diện công thức" — decorative pill rows (opened, locked, sparkle) 
- Step 3 — "Xem lời giải từng bước" — Bookmark Lucide icon halo + description

Navigation: "Bỏ qua" (text-only, all steps except last) → `markAsSeen()`; "Tiếp" → next step; "Bắt đầu" (last step only) → `markAsSeen()`. Both skip and complete set the flag (per design guide D17 override).

`PaginationDots.tsx`: `total` dots, dot at index `current` rendered as `bg-[#0d0d0d]`, others as `bg-transparent border border-[rgba(0,0,0,0.1)]`.

`OnboardingProvider` + `<OnboardingOverlay />` are added to `app/layout.tsx` alongside the existing `CaptureProvider`. No changes to any route page.

### D4 — S-14: cut, record in plan

S-14 is not implemented. The Cut Decisions Log in `PHASE_2.5_IMPLEMENTATION.md` Section 7 receives one row: date 2026-05-20, trigger "Manual — backend constraint", tasks cut "ProblemSelector component", saving ~1h.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Removing CaptureProvider from main layout could reveal other components that assumed it existed there | `useCaptureContext()` throws if no provider is found — any such component would error immediately in dev. No such component exists (only camera, crop, ocr pages use it, all still covered by root). |
| OnboardingOverlay with `z-[60]` could obscure modals or toasts | Sonner toast uses `z-[var(--z-toast)]` which defaults to 9999 — above z-60. No collision. No modal dialogs currently exist. |
| SSR hydration mismatch for onboarding state | `hasSeenOnboarding` initializes to `false` on server (no localStorage), reads `true` on client after hydration for returning users. This causes a brief flash of the overlay before it hides. Mitigated by initializing state from `useEffect` only — component returns `null` until client mount confirms status. |
| Backend rate limit messages could change | Messages are displayed verbatim from `err.message`. A backend message change auto-propagates. No hardcoded strings on frontend for rate limit copy. |

## Migration Plan

Frontend-only change. No database migrations, no backend deployments, no API changes.

Deploy order: single Vercel deployment after merge. No staged rollout needed.

Rollback: revert the PR. No persistent state side effects (localStorage `mathsnap.onboarding.seen` is additive — its presence has no negative effect on rollback since the overlay simply won't appear again for users who already dismissed it).

## Open Questions

None.
