## Why

The camera-capture pipeline (G1–G3) delivers a cropped image blob to `/ocr` but
stops there — the page shows only a skeleton and never calls the backend. Users
cannot yet solve a problem. G4 closes this gap by wiring the OCR endpoint, formula
preview, and solve endpoint into a complete screen flow. Completing this flow is the
P0 deliverable for Phase 2.5 Sprint 2 (D5 hard floor: 15/05).

## What Changes

**OCR page (`app/(main)/ocr/page.tsx`)**
- From: Static loading skeleton; no API call; no user interaction
- To: Calls `POST /api/ocr` with `croppedBlob`; shows KaTeX live preview + editable
  textarea; "Giải bài này" CTA navigates to `/solve`
- Reason: Stub was a placeholder until API layer existed
- Impact: Non-breaking rewrite of an unreleased page

**CaptureContext**
- From: Holds `capturedBlob` and `croppedBlob` only
- To: Also holds `ocrLatex: string | null` and `solveResult: HistoryItem | null`;
  `reset()` clears all four
- Reason: Next.js App Router has no route-state concept; context is the idiomatic
  cross-route state mechanism already established by G3
- Impact: Non-breaking addition; existing consumers unaffected

**New `/solve` route**
- From: Does not exist
- To: Flat route at `app/solve/page.tsx` outside `(main)` layout; owns S-06
  (loading skeleton) and S-07 (accordion solution detail)
- Reason: No BottomNav needed; matches Figma routing model
- Impact: New page; no existing code touched

## Capabilities

### New Capabilities

- `device-id-client`: Client-side UUID v4 device identity — `getDeviceId()` utility
  and `useDeviceId()` React hook backed by localStorage
- `api-client`: Typed `fetch` wrappers for `POST /api/ocr` and `POST /api/solve`
  with `X-Device-ID` header injection and `ApiError` typed error class
- `formula-preview-edit`: S-05 screen — OCR result display with realtime KaTeX
  render, editable LaTeX textarea, low-confidence badge, and "Giải bài này" CTA
- `solution-viewer`: S-06 loading skeleton + S-07 accordion solution detail with
  `motion/react` animations, `isAnswer` answer highlighting, and "Bài mới" reset

### Modified Capabilities

- `camera-intake-flow`: CaptureContext gains `ocrLatex` and `solveResult` fields;
  `reset()` scope widens to clear all capture+solve state

## Impact

**New dependencies:** `motion` (Framer Motion v11, ~40kB gzip)

**Files created:** `lib/device-id.ts`, `lib/device-id.test.ts`,
`hooks/useDeviceId.ts`, `lib/api.ts`, `app/solve/page.tsx`

**Files edited:** `contexts/CaptureContext.tsx` (additive), `app/(main)/ocr/page.tsx`
(full rewrite of stub)

**APIs consumed:** `POST /api/ocr` (multipart), `POST /api/solve` (JSON) — both
already deployed; no backend changes required
