## MODIFIED Requirements

### Requirement: Preset ratio selector displayed on crop screen

The crop screen MUST display a row of 3 preset aspect ratio buttons — 4:3, 16:9, and
1:1 — plus a "Custom" button, positioned between the cropper area and the action
buttons. The row MUST have constant height regardless of which mode is active.

#### Scenario: Selector visible on crop screen

- **WHEN** the user navigates to the crop screen after capturing a photo
- **THEN** four buttons (4:3, 16:9, 1:1, Custom) SHALL be visible between the cropper
  and the Hủy/Xác nhận buttons

#### Scenario: Default ratio is 4:3

- **WHEN** the crop screen first loads
- **THEN** the 4:3 button SHALL appear selected, the Custom button SHALL appear
  unselected, and the cropper SHALL use `aspect={4/3}`

---

### Requirement: Switching preset ratio updates the cropper

The crop screen MUST update the cropper's aspect ratio immediately when the user
selects a preset, reset crop position and zoom level, and exit custom mode if active.

#### Scenario: User selects 16:9

- **WHEN** the user taps the 16:9 button
- **THEN** the cropper SHALL render with `aspect={16/9}`, crop SHALL reset to
  `{x:0, y:0}`, zoom SHALL reset to `1`, and the row SHALL show preset buttons

#### Scenario: User selects 1:1

- **WHEN** the user taps the 1:1 button
- **THEN** the cropper SHALL render with `aspect={1}`, crop SHALL reset to `{x:0, y:0}`,
  zoom SHALL reset to `1`, and the row SHALL show preset buttons

#### Scenario: User switches back to 4:3

- **WHEN** the user taps the 4:3 button after having selected another ratio
- **THEN** the cropper SHALL render with `aspect={4/3}`, crop SHALL reset to
  `{x:0, y:0}`, zoom SHALL reset to `1`, and the row SHALL show preset buttons

#### Scenario: User taps a preset while in custom mode

- **WHEN** the user is in custom mode (W:H inputs visible) and taps any preset button
- **THEN** custom mode SHALL exit, the row SHALL revert to showing preset buttons, the
  tapped preset SHALL appear selected, and the cropper SHALL update to that preset's ratio

---

## ADDED Requirements

### Requirement: Custom ratio inline input mode

When the user taps the "Custom" button, the selector row MUST transform inline into two
number inputs and an Apply button. The row MUST NOT open a modal or sheet.

#### Scenario: User taps Custom button

- **WHEN** the user taps the Custom button
- **THEN** the selector row SHALL replace the preset buttons with a [W] : [H] input pair
  and an Apply (✓) button, without changing the row height

#### Scenario: Custom button appears active while inputs are shown

- **WHEN** the custom input row is visible
- **THEN** the Apply button SHALL use the brand-green style (`#18E299`) and the
  W/H inputs SHALL use `border-white/20 text-white bg-transparent` styling

---

### Requirement: Custom ratio apply validation

The Apply button MUST be disabled until both W and H inputs contain a positive numeric
value greater than zero.

#### Scenario: Apply disabled with empty inputs

- **WHEN** the custom input row is first shown (W and H are empty)
- **THEN** the Apply button SHALL be disabled

#### Scenario: Apply disabled when a value is zero or negative

- **WHEN** the user enters 0 or a negative number in either W or H
- **THEN** the Apply button SHALL remain disabled

#### Scenario: Apply enabled with valid inputs

- **WHEN** both W and H contain a number greater than zero
- **THEN** the Apply button SHALL be enabled

---

### Requirement: Applying a custom ratio updates the cropper

When the user taps the enabled Apply button, the cropper MUST update to the entered
W:H ratio, crop position and zoom MUST reset, and the row MUST return to preset view
with no button selected as active preset.

#### Scenario: User applies a valid custom ratio

- **WHEN** the user enters valid W and H values and taps Apply
- **THEN** the cropper SHALL render with `aspect={parseFloat(W) / parseFloat(H)}`,
  crop SHALL reset to `{x:0, y:0}`, zoom SHALL reset to `1`, and the row SHALL show
  preset buttons with no preset highlighted

#### Scenario: Crop confirmation works with custom ratio

- **WHEN** the user applies a custom ratio, positions the crop box, and taps Xác nhận
- **THEN** `getCroppedImg` SHALL receive the pixel-accurate `croppedAreaPixels` for
  the custom ratio and return a correctly sized blob
