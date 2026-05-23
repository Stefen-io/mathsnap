## Context

The crop page (`src/client/app/(main)/crop/page.tsx`) is a full-screen black-background
UI built around `react-easy-crop`. It has three fixed aspect ratio presets (4:3, 16:9,
1:1) rendered as pill buttons in a compact row. The `aspect` state is a `number` passed
directly to `<Cropper>`. The existing `handleAspectChange(ratio)` helper sets the new
aspect and resets crop position and zoom.

## Goals / Non-Goals

**Goals:**
- Let users enter any positive W:H ratio without leaving the crop screen
- Add a "Custom" button that transforms the preset row inline into two number inputs
- Integrate cleanly with the existing `handleAspectChange` flow — no parallel crop logic

**Non-Goals:**
- Animation or transition effects on the row swap
- Clamping or warning on extreme ratios (e.g. 100:1)
- Persisting the last-used custom ratio across sessions
- Any changes outside `crop/page.tsx`

## Decisions

**Inline row transform over modal/sheet**
The crop page is a focused camera-like UI. A bottom sheet or modal would break the
user's visual connection to the crop area. Transforming the existing row inline keeps
the UI surface area constant and mirrors native camera app conventions.

**`isCustom: boolean` over `aspect: number | 'custom'`**
`<Cropper>` requires `aspect` to always be a `number`. Encoding the custom-mode flag
into the aspect type forces a separate "pending aspect" variable anyway. A dedicated
`isCustom` boolean alongside the existing `aspect: number` is unambiguous and requires
no branching at the Cropper callsite.

**`customW` / `customH` as strings**
Number inputs with an empty initial value must handle the `''` state before the user
has typed anything. Storing as `string` and parsing with `parseFloat` at Apply time
handles the empty case cleanly without coercion.

**`setIsCustom(false)` inside `handleAspectChange`**
Any aspect change — whether from a preset or from Apply — should exit custom mode.
Centralising this in `handleAspectChange` avoids the caller needing to remember the
reset, and ensures the preset buttons correctly deactivate the custom state.

**Disabled Apply over inline error messages**
Apply is disabled whenever the parsed values are ≤ 0 or NaN. This is sufficient
feedback for a 2-field form; inline error text would add DOM complexity for minimal
UX gain on a compact dark UI.

## Risks / Trade-offs

- **`type="number"` UX on mobile**: Virtual keyboards for number inputs vary across
  Android/iOS. `min="0.1" step="any"` allows decimals, but users may see different
  keyboard layouts. → Acceptable: the inputs accept any positive number, and the
  `parseFloat` gate prevents invalid values from reaching the Cropper.

- **Extreme ratios**: A ratio like 100:1 produces a very thin crop rectangle that is
  hard to interact with. → No mitigation; the user is in control and can zoom to adjust.
  Clamping would introduce magic behaviour that is harder to predict than no clamping.
