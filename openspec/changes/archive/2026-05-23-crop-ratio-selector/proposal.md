## Why

The crop screen hardcodes `aspect={4/3}` in react-easy-crop, forcing every photo to be cropped at a fixed 4:3 ratio. Users who photograph math problems in landscape, portrait, or square orientations are stuck with a suboptimal crop. Adding 3 preset ratios (4:3, 16:9, 1:1) gives users meaningful control with minimal UI complexity and zero backend changes.

## What Changes

**Crop aspect ratio**
- From: Fixed `aspect={4/3}`, no user control
- To: User-selectable from 3 presets — 4:3 (default), 16:9, 1:1 — via pill buttons
- Reason: Different math problem photos benefit from different aspect ratios
- Impact: Non-breaking; default behavior (4:3) preserved

## Capabilities

### New Capabilities
- `crop-ratio-selector`: Aspect ratio preset selector on the crop screen — 3 buttons (4:3, 16:9, 1:1), state reset on switch, single-file implementation

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **Frontend**: `src/client/app/(main)/crop/page.tsx` only
- **Dependencies**: None — react-easy-crop already installed, no new packages
- **Backend / API**: No changes
- **`getCroppedImg.ts`**: No changes (already aspect-agnostic)
