## Design Summary

Crop page currently hardcodes `aspect={4/3}` in `<Cropper>` from react-easy-crop. Users cannot choose other ratios. The fix adds 3 preset ratio buttons in a new row between the cropper and the action buttons.

## Alternatives Considered

### Option A: Free crop (aspect=undefined)
- **Approach**: Pass `aspect={undefined}` to `<Cropper>` for unconstrained crop
- **Pros**: Maximum flexibility
- **Cons**: react-easy-crop v5.5.7 types `aspect: number` (not optional); `defaultProps` hardcodes `4/3` — passing `undefined` silently falls back to 4/3 with no effect. The `cropSize` workaround gives a fixed-size non-resizable box, which is worse UX than presets.
- **Why not used**: Library doesn't support it; workaround is poor UX

### Option B: Overlay selector on top of the cropper
- **Approach**: Absolute-positioned pill row over the crop canvas
- **Pros**: Saves vertical space
- **Cons**: Obstructs crop view; z-index complexity; harder to tap without moving crop
- **Why not used**: Obstructs the main UI

### Option C: Separate settings or modal
- **Approach**: Ratio selection in a settings panel accessed via icon button
- **Pros**: Clean main UI
- **Cons**: Extra navigation step for a 3-option choice; over-engineered
- **Why not used**: Unnecessary ceremony

## Agreed Approach

**3 preset ratio buttons** (4:3 · 16:9 · 1:1) in a new dedicated row, placed between the cropper area and the Hủy/Xác nhận buttons. Default is 4:3 (preserves current behavior).

Layout after change:
```
div.flex.h-dvh.flex-col.bg-black
  div.relative.flex-1          ← Cropper (unchanged)
  div  (ratio selector row)   ← NEW
  div.flex.gap-3.px-6.py-6    ← Action buttons (unchanged)
```

State added: `aspect: number` (default `4/3`).

Critical invariant on switch: `computeSizes()` is the only thing react-easy-crop calls when `aspect` prop changes — it does NOT reset `crop` position or `zoom`. Handler must reset both:
```ts
const handleAspectChange = (newAspect: number) => {
  setAspect(newAspect)
  setCrop({ x: 0, y: 0 })
  setZoom(1)
}
```

`getCroppedImg.ts` is aspect-agnostic (pixel-coordinate only) — no changes needed.

## Key Decisions

- **Scope**: 3 fixed presets only. Free crop explicitly out of scope (library limitation).
- **Reset on switch**: Mandatory. Without reset, crop box position becomes invalid after ratio change.
- **Single file**: Only `src/client/app/(main)/crop/page.tsx` changes.
- **Default preserved**: 4:3 remains default — no behavior change for existing users who don't interact with the selector.

## Open Questions

None — all questions resolved during explore session.
