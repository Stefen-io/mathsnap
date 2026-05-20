## Context

MathSnap is a mobile-first PWA (max 480px) for math problem solving. The frontend scaffold exists (Next.js 16, shadcn/ui, Tailwind v4, KaTeX) but contains only a placeholder home page. No user-facing UI has shipped yet.

G3 builds the camera intake path: the screens a user touches from opening the app through capturing a photo of a math problem and arriving at the OCR loading state. All screens run off local fixtures — no backend calls in this change.

**Current state gaps (from codebase audit 2026-05-20):**
- `app/page.tsx` — placeholder only
- `app/(main)/` route group — does not exist
- `types/history.ts` — missing; `fixtures/history.ts` already imports it (compile-time breakage)
- `react-easy-crop` — not installed
- `globals.css` — brand green (`#18E299`) and full-pill radius not wired

## Goals / Non-Goals

**Goals:**
- Ship 4 navigable screens: Home (S-01), Camera (S-02), Crop (S-03), OCR skeleton (S-04)
- Wire CaptureContext so `capturedBlob` and `croppedBlob` survive route transitions
- Install and configure `react-easy-crop` for the Crop screen
- Create `types/history.ts` matching SYSTEM_DESIGN §3.7 (unblocks fixtures compile)
- Wire brand design tokens into `globals.css` (Mintlify-inspired system from `DESIGN.md`)
- All new components/hooks have co-located Vitest tests (TDD: test first)

**Non-Goals:**
- `POST /api/ocr` integration (G4)
- deviceId wiring (G4)
- Solution / formula rendering with real content (G4)
- History, Bookmarks, Settings screens (G6)
- Camera permission-denied error handling (G5)
- PWA manifest / service worker
- Dark mode
- Desktop breakpoints

## Decisions

### D1 — Route architecture: `app/(main)/` route group

All 4 screens live under `app/(main)/`. The route group provides a shared layout (`(main)/layout.tsx`) that wraps every screen in:
- A 480px-max centered container
- `CaptureProvider` context
- `BottomNav` (conditionally rendered — hidden on capture flow screens)

`app/page.tsx` is deleted; `(main)/page.tsx` serves `/`.

**Why route group over flat routes?** The shared container + context must wrap the capture flow without polluting the root layout (which might later serve non-mobile pages). The route group is the idiomatic Next.js 14+ pattern for this.

### D2 — State bridge: `CaptureContext` (not sessionStorage, not URL params)

```
CaptureContext {
  capturedBlob: Blob | null   // raw camera frame
  croppedBlob: Blob | null    // post-crop output
  setCapturedBlob: (b: Blob) => void
  setCroppedBlob: (b: Blob) => void
  reset: () => void
}
```

Provided in `(main)/layout.tsx`. Scoped to the main route group.

**Why not sessionStorage?** `dataURL` encoding inflates a 500 KB JPEG to ~667 KB. Synchronous `sessionStorage.setItem` blocks on large payloads. Coupling via storage key names across files is fragile.

**Why not URL params?** Binary image data cannot be safely passed in URL params. Object URLs are not stable across navigations.

**Guard pattern**: `/crop` and `/ocr` redirect to `/camera` if their expected blob is null. This prevents broken states from direct URL entry.

### D3 — Camera hook: `useCamera`

Encapsulates `getUserMedia`, canvas capture, and facingMode toggle:

```
useCamera() → {
  videoRef, canvasRef,       // attach to <video> / <canvas>
  facingMode,                // 'environment' | 'user'
  flipCamera,                // () => void — restarts stream
  captureFrame,              // () => Promise<Blob> — jpeg 0.85
  isReady,                   // stream is active
}
```

**Defaults**: `{ video: { facingMode: 'environment' }, audio: false }` — rear camera first.

**Flip fallback**: If `facingMode: { exact: ... }` fails, retry without `exact`. Handles desktop browsers and older iOS.

**SSR safety**: `getUserMedia` is `'use client'` only; hook is never imported in server components.

### D4 — Crop screen: `react-easy-crop` with standard helper

- Aspect ratio: `4 / 3` (landscape photo default, matches SYSTEM_DESIGN §4.2 accepted formats)
- Zoom: 1–3, step 0.1
- `getCroppedImg()`: standard canvas-crop helper returning `Blob` (jpeg, 0.85)
- Confirm → `setCroppedBlob(blob)` → `router.push('/ocr')`
- Cancel → `router.push('/camera')`

**Why `react-easy-crop` over custom?** `react-easy-crop` is already specified in the change brief. It's the standard React crop library with touch support — critical for mobile. Custom canvas crop has no advantage here.

### D5 — OCR screen: skeleton only

No `fetch` call. The screen renders a pulsing skeleton mimicking the eventual solution layout (formula placeholder + steps placeholder). This establishes the visual frame for G4's real content.

### D6 — KaTeXRenderer: `dynamic()` stub

```tsx
// components/KaTeXRenderer.tsx
const KaTeXRenderer = dynamic(() => import('./KaTeXRendererImpl'), { ssr: false })
```

`KaTeXRendererImpl` accepts `latex: string` and renders `katex.renderToString(latex)` via `dangerouslySetInnerHTML`. The component shell is render-ready; G4 wires actual content.

**Why `dynamic` + `ssr: false`?** KaTeX's CSS references browser globals; server-rendering it causes hydration mismatches. `dynamic` is the correct Next.js pattern.

### D7 — Design tokens: `globals.css` extension

Add to existing `:root` block:
- `--color-brand: #18E299`
- `--color-brand-light: #d4fae8`
- `--color-brand-deep: #0fa76e`
- Override `--radius` to `9999px` for pill shapes (as DESIGN.md specifies for buttons/inputs)

Existing shadcn tokens are preserved — only additive changes.

### D8 — TDD requirement

Every new file has a co-located test written **before** implementation:
- `useCamera.test.ts` — mock `navigator.mediaDevices`, verify stream start/stop/flip
- `CaptureContext.test.tsx` — verify state transitions and reset
- `BottomNav.test.tsx` — verify active tab highlighting per pathname
- Screen tests (`page.test.tsx`) — render test + navigation intent (no real camera)

Vitest + happy-dom (already configured). React Testing Library to be added if not present.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `react-easy-crop` peer dep conflict with React 19 | Check before install; v5.x has React 19 support. Pin if needed. |
| `getUserMedia` unavailable in dev over HTTP | Dev runs on `localhost` — browsers grant camera on localhost without HTTPS |
| Canvas `toBlob` async in Safari | Use `toBlob` callback (not `toDataURL`); wrap in `Promise` |
| Large Blob in React state causes re-render cost | Context only updates on capture/crop events (not on every render); acceptable for MVP |
| Direct navigation to `/crop` or `/ocr` without blob | Guard redirect to `/camera` on null blob |
| `@types/react-easy-crop` may not be needed (bundled types) | Verify on install; add `@types` only if package doesn't include them |

## Migration Plan

1. Add `react-easy-crop` to `package.json` via `pnpm add`
2. Extend `globals.css` with brand tokens (additive — no existing styles break)
3. Delete `app/page.tsx` placeholder; create `app/(main)/page.tsx`
4. New files are all net-new — no existing code paths are modified except `globals.css`
5. `types/history.ts` is additive — resolves compile-time import error in `fixtures/history.ts`

No rollback complexity. All changes are net-new files or additive modifications.

## Open Questions

None. All design decisions were resolved in the `/opsx:explore` session (2026-05-20).
