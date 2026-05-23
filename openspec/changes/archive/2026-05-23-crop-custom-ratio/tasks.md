## 1. State

- [x] 1.1 Add `isCustom: boolean` state (default `false`) to `CropPage`
- [x] 1.2 Add `customW: string` and `customH: string` state (default `''`) to `CropPage`
- [x] 1.3 Add `setIsCustom(false)` to `handleAspectChange` so switching any preset exits custom mode

## 2. Custom ratio handler

- [x] 2.1 Add `handleCustomApply` function: computes `parseFloat(customW) / parseFloat(customH)` and calls `handleAspectChange` with the result

## 3. Validation

- [x] 3.1 Derive `isApplyDisabled` boolean: true when either `parseFloat(customW) <= 0`, `parseFloat(customH) <= 0`, or either is `NaN`

## 4. UI — ratio selector row

- [x] 4.1 Wrap the ratio selector row in a conditional: render preset buttons when `!isCustom`, render custom inputs when `isCustom`
- [x] 4.2 Add "Custom" pill button to the preset list; clicking it sets `isCustom(true)`; active style when `isCustom`
- [x] 4.3 Render custom row: two `<input type="number" min="0.1" step="any">` for W and H with `border-white/20 text-white bg-transparent w-14 text-center` styling, a `:` separator, and an Apply (✓) pill button
- [x] 4.4 Apply button uses brand-green style (`bg-[#18E299] text-[#0d0d0d]`) and is `disabled={isApplyDisabled}`; on click calls `handleCustomApply`
