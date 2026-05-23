## Design Summary

Add a 4th "Custom" button to the crop ratio selector row. When tapped, the row
transforms inline (no modal) into two number inputs (W : H) plus an Apply button.
Confirmed ratio applies immediately via the existing `handleAspectChange` helper.
Only `src/client/app/(main)/crop/page.tsx` is touched.

## Alternatives Considered

### Option A: Modal / Bottom Sheet
- **Approach**: A `<Vaul>` drawer slides up with W and H inputs
- **Pros**: More room for inputs and labels; familiar pattern for form-heavy flows
- **Cons**: Context-switching breaks the focused camera crop UX; too heavy for 2 inputs
- **Why not used**: Inline transform matches native camera app conventions and keeps the user visually anchored to the crop area

### Option B: `number | 'custom'` state type
- **Approach**: Change `aspect` state to `number | 'custom'`; keep a separate `pendingAspect: number`
- **Pros**: Single source of truth for which mode is active
- **Cons**: `<Cropper aspect={...}>` always needs a `number`; forces double-tracking anyway
- **Why not used**: A dedicated `isCustom: boolean` alongside `aspect: number` is cleaner — no branching needed at the Cropper callsite

## Agreed Approach

**Inline row transform** — the ratio selector row conditionally renders two states
with a plain DOM swap (no animation):

```
Normal:   [4:3]  [16:9]  [1:1]  [Custom]
Custom:   [ W: __ ] : [ H: __ ]  [✓]
```

State additions (existing `aspect: number` unchanged):
```ts
const [isCustom, setIsCustom] = useState(false)
const [customW, setCustomW]   = useState('')
const [customH, setCustomH]   = useState('')
```

`handleAspectChange` gains `setIsCustom(false)`, so clicking any preset while in
custom mode auto-resets. `handleCustomApply` only needs to call
`handleAspectChange(parseFloat(customW) / parseFloat(customH))`.

Validation: Apply disabled when either value is ≤ 0 or non-numeric.
Inputs: `type="number" min="0.1" step="any"`. No clamping on extreme ratios.

## Key Decisions

- No animation — DOM swap only; React re-render is instant and sufficient
- `setIsCustom(false)` lives in `handleAspectChange`, not duplicated in `handleCustomApply`
- `customW`/`customH` are strings (not numbers) to correctly handle the empty-string state
- No inline error messages — disabled Apply button is sufficient user feedback
- No extreme-ratio clamping — `react-easy-crop` handles any positive ratio

## Open Questions

None — design fully resolved during `/opsx:explore` session.
