## Design Summary

G3 builds the camera intake flow: 4 screens (Home, Camera, Crop, OCR skeleton) + shared layout. All screens run off fixtures — no live backend required. Explored in `/opsx:explore` session on 2026-05-20.

Key findings from codebase audit:
- `fixtures/history.ts` already populated (5 items) but `types/history.ts` missing — blocking compile
- No `app/(main)/` route group exists yet
- `react-easy-crop` not installed
- `globals.css` uses neutral shadcn palette — brand green (`#18E299`) and pill radius not wired
- `app/page.tsx` is a placeholder that must be replaced

## Alternatives Considered

### Option A: Separate routes + CaptureContext (chosen)
- **Approach**: 3 separate Next.js routes (`/camera`, `/crop`, `/ocr`); image state held in a `CaptureContext` provided in `(main)/layout.tsx`
- **Pros**: Clean URLs per screen, browser back works naturally, state scoped to main layout (not global), Blob never serialized
- **Cons**: Requires context setup; navigating directly to `/crop` without context is an empty state (handled by redirect back to `/camera`)
- **Why chosen**: Best balance of clean routing and safe image transfer; matches Figma Make's named-screen architecture

### Option B: Single route, internal state machine
- **Approach**: `/(main)/scan` manages `CAMERA | CROP | OCR` states internally; URL stays at `/scan`
- **Pros**: No cross-route state transfer; true native-app feel
- **Cons**: No URL-per-step; back button goes to Home, not Camera; harder to deep-link or test individual screens
- **Why not chosen**: Kills URL addressability; makes testing each screen in isolation harder

### Option C: sessionStorage bridge
- **Approach**: Camera stores dataURL to `sessionStorage`; Crop reads it
- **Pros**: No extra deps, survives page refresh
- **Cons**: dataURL is base64 (~33% larger than Blob); sessionStorage is synchronous and blocking; couples storage key names across components
- **Why not chosen**: Image size penalty and coupling to storage keys; Context is cleaner

## Agreed Approach

**Separate routes + CaptureContext (Option A)**

`CaptureContext` holds `{ capturedBlob: Blob | null, croppedBlob: Blob | null }` and is provided in `app/(main)/layout.tsx`. The context is scoped to the main route group — invisible to other parts of the app. Image data never touches URL params or localStorage (BR-10 compliant).

Navigation flow:
```
Home (/)  →  /camera  →  /crop  →  /ocr
              ↑ rear cam    ↑ react-easy-crop   ↑ skeleton only
              getUserMedia  confirm → croppedBlob  no API call
```

BottomNav shows on Home; hidden on Camera/Crop/OCR (capture flow).

## Key Decisions

1. **Route group**: `app/(main)/` wraps all screens in 480px container + BottomNav; `app/page.tsx` replaced/redirected
2. **State bridge**: `CaptureContext` in `(main)/layout.tsx` — blob never serialized
3. **Camera**: `facingMode: 'environment'` default, flip toggle between front/rear, canvas → Blob (jpeg, 0.85)
4. **Crop**: `react-easy-crop` with 4:3 aspect ratio, `getCroppedImg()` returns Blob
5. **OCR screen**: Skeleton UI only — no fetch, no loading state beyond animation
6. **KaTeXRenderer**: `dynamic(() => import(...), { ssr: false })` shell, accepts `latex: string`, no render logic yet
7. **TDD**: test file co-located with every component/hook, test written before implementation
8. **Types**: `types/history.ts` created as part of this change (G1 owned the contract; file never shipped)

## Open Questions

All resolved in explore session. No blocking open questions remain.
