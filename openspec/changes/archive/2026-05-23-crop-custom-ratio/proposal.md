## Why

The crop screen currently offers only three fixed aspect ratio presets (4:3, 16:9, 1:1).
Users who need to crop at a non-standard ratio — such as 3:2 for prints, 5:7 for
portraits, or 1.85:1 for cinematic output — have no way to do so. Adding a custom ratio
input removes this ceiling without changing any existing preset behaviour.

## What Changes

**Ratio selector row — custom mode**
- From: row always shows exactly 3 preset buttons (4:3, 16:9, 1:1)
- To: row shows 3 presets + a "Custom" button; tapping "Custom" transforms the row
  inline into two number inputs (W : H) and an Apply button
- Reason: users need arbitrary aspect ratios; inline transform avoids breaking the
  focused crop screen UX
- Impact: non-breaking — preset behaviour is unchanged

**`handleAspectChange` — exits custom mode**
- From: sets `aspect` and resets crop/zoom
- To: additionally sets `isCustom` to `false`
- Reason: tapping any preset while in custom mode must return the row to preset view
- Impact: non-breaking internal change

## Capabilities

### New Capabilities

_(none — this change extends an existing capability)_

### Modified Capabilities

- `crop-ratio-selector`: adds a 4th "Custom" option to the selector row; defines
  requirements for inline W:H input, validation, and Apply behaviour

## Impact

- **Files**: `src/client/app/(main)/crop/page.tsx` only
- **Dependencies**: none added — uses `react-easy-crop` `aspect` prop already in place
- **API / backend**: none
- **Breaking changes**: none
