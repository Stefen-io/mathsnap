## Design Summary

G4 `frontend-solve-flow` connects the existing camera-crop pipeline to the backend
solve API, delivering three screens: S-05 (Formula Preview & Edit), S-06 (Solution
Loading), and S-07 (Solution Detail with accordion). Design was validated through a
full codebase explore session with all 6 architectural questions resolved before
writing any artifacts.

## Alternatives Considered

### Option A: React Router–style route state passing (OCR → Solve)
- **How**: Use Next.js `router.push('/solve', { state: ... })` — mirrors Figma Make's
  `navigate("/solution", { state: { latex } })`
- **Pros**: Closest to Figma reference; no extra context fields
- **Cons**: Next.js App Router has no route state concept; state would be lost on
  refresh or direct navigation
- **Why not chosen**: Not supported by the framework

### Option B: URL search params `/solve?latex=...`
- **How**: Encode the LaTeX string into the URL query on navigation
- **Pros**: Survives refresh; shareable
- **Cons**: LaTeX strings contain special characters (braces, backslashes) that
  survive URL-encoding but are ugly; leaks internal representation into the URL bar
- **Why not chosen**: Poor UX; inconsistent with blob-passing pattern already
  established in CaptureContext

### Option C: Extend CaptureContext with `ocrLatex` + `solveResult` ← **Chosen**
- **How**: Add `ocrLatex: string | null` and `solveResult: HistoryItem | null` to
  existing CaptureContext; `reset()` clears both
- **Pros**: Consistent with how `croppedBlob` is already passed between /crop and
  /ocr; no URL pollution; survives within-session navigation; already inside the
  Provider tree
- **Cons**: CaptureContext grows slightly; not persistent across sessions (acceptable
  for a capture flow)
- **Why chosen**: Natural extension of existing pattern; minimal surface area change

---

### Animation: motion/react vs. pure CSS

### Option A: Pure CSS `max-height` transition
- **Pros**: Zero new dependencies; ~0kB bundle impact
- **Cons**: `max-height` transitions require a hardcoded max value or JavaScript
  measurement; janky on variable-height content

### Option B: Add `motion/react` (Framer Motion v11) ← **Chosen**
- **Pros**: `AnimatePresence` with `height: "auto"` handles dynamic content height
  correctly; matches Figma Make's exact implementation; smooth on mobile
- **Cons**: ~40kB gzip bundle addition
- **Why chosen**: The accordion step expansion is the primary UX interaction of S-07;
  it must feel polished on mobile. Bundle cost is acceptable.

---

### Step disclosure: locked-sequential vs. all-open-accordion

### Option A: Locked-sequential (FR-5 spec)
- Steps are locked until previous step is revealed; forces reading order
- More complex state machine; higher implementation cost

### Option B: All-open accordion ← **Chosen**
- All steps immediately expandable; user taps any card to read its content
- Simpler implementation; matches Figma Make exactly
- Overrides FR-5 per explicit user confirmation

## Agreed Approach

Extend `CaptureContext` with two new fields (`ocrLatex`, `solveResult`). The OCR
page fires `POST /api/ocr`, populates `ocrLatex`, then navigates to `/solve`. The
solve page reads `ocrLatex`, fires `POST /api/solve`, and renders steps as an
all-open accordion with `motion/react` animations. Both API calls attach
`X-Device-ID` from `useDeviceId` (localStorage UUID v4, SSR-safe).

## Key Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | State passing via CaptureContext extension | Consistent with blob-passing pattern |
| 2 | Add `motion/react` for accordion | Polished UX; matches Figma; ~40kB acceptable |
| 3 | CTA label: "Giải bài này" + ArrowRight | Figma canonical over PRD text |
| 4 | `/solve` as flat route outside `(main)` | No BottomNav; matches Figma routes.tsx |
| 5 | All-open accordion (no locked state) | Simpler; Figma-aligned; FR-5 overridden |
| 6 | 100px croppedBlob thumbnail in S-05 | Contextual reference for user |

## Open Questions

None — all 6 assumptions confirmed before artifact creation.
