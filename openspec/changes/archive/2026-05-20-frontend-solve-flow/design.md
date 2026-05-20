## Context

MathSnap's camera-capture pipeline (G1–G3) ends at `/ocr` with a stub page that
shows a loading skeleton but never calls the backend. G4 completes the user journey:
OCR recognition → formula preview & edit → solve → step-by-step solution.

**Current state:**
- `app/(main)/ocr/page.tsx` — stub; only guards `croppedBlob` and renders skeletons
- `CaptureContext` — holds `capturedBlob` + `croppedBlob`; no OCR/solve state
- No `lib/device-id.ts`, `hooks/useDeviceId.ts`, or `lib/api.ts`
- No `/solve` route

**Constraints:**
- Next.js 16 App Router — no React Router route state
- Mobile-first, 480px max width
- `X-Device-ID: UUID v4` required on every API call (server enforces version check)
- KaTeX already installed and wired (`components/KaTeXRenderer.tsx`)
- `motion/react` not yet in package.json — must be added

**Design source of truth:** Figma Make `1GKzZ1kg7MriJrsZpba6XY` (OCR.tsx,
Solution.tsx, routes.tsx). PRD FR-5 disclosure model overridden by Figma decision
(see Decisions §5).

---

## Goals / Non-Goals

**Goals:**
- Deliver screens S-05, S-06, S-07 end-to-end from OCR page through solution detail
- Typed `fetch` wrappers (`lib/api.ts`) for `POST /api/ocr` and `POST /api/solve`
- SSR-safe device ID utility (`lib/device-id.ts` + `hooks/useDeviceId.ts`)
- Realtime KaTeX preview as user edits the LaTeX textarea in S-05
- Smooth accordion animation on step cards (S-07) via `motion/react`
- Passing `pnpm typecheck`, `pnpm test`, `pnpm build` with zero errors

**Non-Goals:**
- Bookmark persistence (FR-7, G6 scope) — button renders but `onClick` is a no-op
- History persistence beyond in-memory `solveResult` in CaptureContext
- Multi-formula / problem-selector flow (G5 scope)
- Manual LaTeX entry screen (`/manual` route)
- OCR error retry UX beyond a Sonner toast + "Chụp lại" navigation

---

## Decisions

### D1 — OCR→Solve state via CaptureContext extension

Next.js App Router has no route-state concept. Encoding LaTeX in the URL (`/solve?latex=...`) is ugly and error-prone with special characters. Extending `CaptureContext` with `ocrLatex: string | null` and `solveResult: HistoryItem | null` is the natural extension of how `croppedBlob` already crosses the crop→ocr boundary. Both fields are cleared by `reset()`, which is called when the user taps "Bài mới".

### D2 — Flat `/solve` route outside `(main)` layout

Figma `routes.tsx` places `/solution` at the same level as `/camera` and `/crop` — outside the `MainLayout` that renders `BottomNav`. This avoids adding `/solve` to `BottomNav`'s `CAPTURE_ROUTES` exclude list. The implementation mirrors the Figma model: `app/solve/page.tsx` — no layout wrapper, no BottomNav.

### D3 — `motion/react` for accordion animations

`AnimatePresence` with `height: "auto"` is the only reliable way to animate variable-height content without JavaScript measurement. Pure CSS `max-height` transitions require a hardcoded ceiling and produce a non-linear ease that feels wrong. The `motion` package (Framer Motion v11, exports `motion/react`) adds ~40kB gzip — acceptable given it's the primary UX differentiator of S-07.

### D4 — `useDeviceId` returns `null` on server render

`localStorage` is not available during SSR. The hook initialises with `useState(null)` and sets the real ID in `useEffect`. Callers gate API calls on `deviceId !== null`, preventing a hydration mismatch or a call with an undefined header. This also means the first render of OCR/solve pages never fires an API call — the effect-triggered call happens after hydration.

### D5 — All-open accordion (overrides FR-5 locked-sequential)

The locked-sequential model requires a more complex state machine (tracking which steps have been "revealed") with no clear UX payoff for a tutor app — students typically scan ahead. Figma shows all steps immediately expandable. Per explicit user confirmation, the simpler all-open model is the target for G4.

### D6 — `ApiError` class with `code` + `retryable`

The backend always returns `{ code, message, retryable }` error envelopes. Wrapping these in a typed `ApiError` class (extends `Error`) allows callers to distinguish rate-limit retryables from hard failures without string matching on `message`.

---

## Risks / Trade-offs

**[Risk] `crypto.randomUUID()` availability** → All modern browsers support it. Not
available in Node.js < 19 without a polyfill, but this code only runs client-side
(inside `useEffect` / `getDeviceId` which guards against SSR).

**[Risk] Large LaTeX strings in CaptureContext** → Context value is a plain React
state; no serialisation cost. LaTeX strings are bounded at 2000 chars by the server
(`SolveRequest.latex` max_length). Not a concern.

**[Risk] `motion/react` bundle size** → ~40kB gzip. Mitigated by the fact that
`motion/react` is only used in `solve/page.tsx` (lazy-loaded as a separate
code-split chunk by Next.js App Router).

**[Risk] `solveResult` lost on page refresh** → The solve flow is ephemeral by
design (camera → solve → done). Refresh on `/solve` redirects to `/camera` via the
`ocrLatex === null` guard. This is expected behaviour.

**[Risk] `croppedBlob` object URL leak** → The OCR page creates an object URL for
the thumbnail. Must call `URL.revokeObjectURL()` in the `useEffect` cleanup to
prevent memory leaks.

---

## Migration Plan

No database migration. No breaking API changes. Incremental additions:

1. `pnpm add motion` — adds dependency
2. New files created (`lib/device-id.ts`, `hooks/useDeviceId.ts`, `lib/api.ts`,
   `app/solve/page.tsx`)
3. `CaptureContext` extended (backward-compatible — new fields added, none removed)
4. `app/(main)/ocr/page.tsx` rewritten (was a stub, no existing behaviour lost)

Rollback: revert the 4 edited files; delete the 5 new files; run `pnpm remove motion`.

---

## Open Questions

None.
