## Context

`crop/page.tsx` renders a single `<Cropper>` from react-easy-crop v5.5.7 with `aspect={4/3}` hardcoded. The page has a `flex-col` layout: cropper (`flex-1`) on top, action buttons (`Hủy` / `Xác nhận`) below. No aspect state exists today.

Key library constraint discovered during exploration: react-easy-crop v5 types `aspect` as `number` (not optional), and `defaultProps` sets `aspect: 4/3`. Passing `undefined` silently falls back to 4/3 — there is no native free-crop mode.

## Goals / Non-Goals

**Goals:**
- Let users choose from 3 aspect ratio presets: 4:3, 16:9, 1:1
- Preserve 4:3 as the default (no behavior change for users who ignore the selector)
- Reset crop position and zoom when switching ratios

**Non-Goals:**
- Free (unconstrained) crop — not supported by react-easy-crop v5 without a poor workaround
- Persisting the last-selected ratio across sessions
- More than 3 presets

## Decisions

**D1 — Selector row between cropper and action buttons, not overlaid**
Overlay saves space but obstructs the crop view and creates tap-target conflicts with the crop drag gesture. A dedicated row is unambiguous and fits the existing `flex-col` structure cleanly.

**D2 — Must manually reset `crop` and `zoom` on aspect switch**
When the `aspect` prop changes, react-easy-crop calls only `computeSizes()` internally (`componentDidUpdate` line 776). It does not reset `crop` position or `zoom`. Without manual reset, the crop box ends up in an invalid position after switching. Handler:
```ts
const handleAspectChange = (newAspect: number) => {
  setAspect(newAspect)
  setCrop({ x: 0, y: 0 })
  setZoom(1)
}
```

**D3 — `getCroppedImg.ts` unchanged**
The function receives `Area` pixel coordinates and draws them to canvas — it has no knowledge of aspect ratio. No adaptation needed.

**D4 — Single file change**
All changes are contained in `crop/page.tsx`. No new files, no new dependencies.

## Risks / Trade-offs

- **Crop box position after zoom** — If user has zoomed in and then switches ratio, resetting zoom to 1 may feel abrupt. Acceptable: the alternative (keeping zoom) produces a worse crop box placement with the new ratio.
- **3 presets only** — Some users may want free crop. Risk is low given the library limitation is well-documented and free crop can be revisited if the library adds support.

## Migration Plan

No migration needed — purely additive frontend change, no data or API contract changes. Rollback is a one-line revert of the `aspect` prop.
