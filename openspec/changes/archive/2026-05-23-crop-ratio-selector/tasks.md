## 1. State and handler

- [x] 1.1 Add `aspect` state (`useState<number>(4 / 3)`) to `CropPage`
- [x] 1.2 Add `handleAspectChange` that sets `aspect`, resets `crop` to `{x:0, y:0}`, and resets `zoom` to `1`
- [x] 1.3 Wire `aspect` state into `<Cropper aspect={aspect} />`

## 2. Ratio selector UI

- [x] 2.1 Add a selector row between the cropper `div` and the action buttons `div`
- [x] 2.2 Render 3 pill buttons — `4:3`, `16:9`, `1:1` — each calling `handleAspectChange` with `4/3`, `16/9`, `1` respectively
- [x] 2.3 Apply active/inactive visual state (selected button distinct from unselected)

## 3. Verification

- [x] 3.1 Run `pnpm typecheck` — no new TS errors
- [x] 3.2 Manually verify: load crop screen → default shows 4:3 selected → switch to 16:9 → crop box updates and resets → switch to 1:1 → same → confirm → OCR screen receives correct blob (human step)
