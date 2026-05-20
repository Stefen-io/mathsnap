## Why

MathSnap's core value proposition is a one-tap camera-to-solution flow. The frontend scaffold exists but has no user-facing UI — only a placeholder page. Sprint 1 (D4) requires the camera intake path to be navigable on mobile before the OCR and solve integrations can be wired in G4/G5. Building this now unblocks all downstream frontend work and allows QA to validate the capture flow independently of the backend.

## What Changes

**Frontend app — placeholder → functional camera intake flow**
- From: `app/page.tsx` renders a static "Project ready!" placeholder
- To: `app/(main)/page.tsx` renders the Home screen (3 CTAs + BottomNav); `/camera`, `/crop`, `/ocr` routes fully navigable
- Reason: Unblocks Sprint 1 D4 milestone and G4 OCR integration
- Impact: Non-breaking; replaces only the placeholder page

**TypeScript type contract — missing → present**
- From: `types/history.ts` does not exist; `fixtures/history.ts` has a compile-time import error
- To: `types/history.ts` defines `HistoryItem` and `SolutionStep` matching SYSTEM_DESIGN §3.7 camelCase shape
- Reason: Fixtures were created in G1 but the type file was never written; this unblocks any component that imports history data
- Impact: Non-breaking additive file

**Design tokens — neutral shadcn palette → Mintlify-inspired brand palette**
- From: `globals.css` has no brand green or pill-radius overrides
- To: `--color-brand: #18E299`, `--color-brand-light`, `--color-brand-deep`, `--radius: 9999px` added to `:root`
- Reason: All 4 screens use the Mintlify-inspired design system specified in `DESIGN.md`
- Impact: Additive CSS variables only; existing shadcn component rendering unchanged

## Capabilities

### New Capabilities

- `home-screen`: Home page (S-01) with 3 CTAs (Camera, Gallery, History), shared `app/(main)/layout.tsx` with 480px container, BottomNav component with 3 tabs and active-route highlighting, brand design tokens wired into `globals.css`

- `camera-intake-flow`: `CaptureContext` holding `capturedBlob` / `croppedBlob` across routes; Camera screen (S-02) with `useCamera` hook (`getUserMedia`, canvas frame capture, flip toggle); Crop screen (S-03) with `react-easy-crop` (4:3 aspect, `getCroppedImg()` → Blob); OCR loading skeleton (S-04, no API call); guard redirects on null blob

- `frontend-type-contracts`: `types/history.ts` (`HistoryItem`, `SolutionStep` interfaces matching API camelCase shape); `fixtures/solution.ts` (sample `SolutionStep[]` for parallel dev); `KaTeXRenderer` lazy-load stub (`dynamic` + `ssr: false`, accepts `latex: string`)

### Modified Capabilities

None. No existing spec-level requirements are changing.

## Impact

- **Frontend only** — no backend changes, no API contract changes
- **New dependency**: `react-easy-crop` (client bundle, ~15 KB gzipped)
- **Deleted file**: `app/page.tsx` (placeholder replaced by `app/(main)/page.tsx`)
- **`globals.css`**: additive CSS variable additions only
- **`types/history.ts`**: additive — resolves existing compile error in `fixtures/history.ts`
- No database migrations, no environment variable changes, no infra changes
