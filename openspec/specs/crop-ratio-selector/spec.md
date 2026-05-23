# Spec: Crop Ratio Selector

## Purpose

Allows users to select a preset aspect ratio (4:3, 16:9, or 1:1) on the crop screen before confirming a photo crop. The selector is displayed between the cropper area and the action buttons, and switching ratios immediately updates the cropper state.

---

## Requirements

### Requirement: Preset ratio selector displayed on crop screen

The crop screen MUST display a row of 3 preset aspect ratio buttons — 4:3, 16:9, and 1:1 — positioned between the cropper area and the action buttons.

#### Scenario: Selector visible on crop screen

- **WHEN** the user navigates to the crop screen after capturing a photo
- **THEN** three ratio buttons (4:3, 16:9, 1:1) SHALL be visible between the cropper and the Hủy/Xác nhận buttons

#### Scenario: Default ratio is 4:3

- **WHEN** the crop screen first loads
- **THEN** the 4:3 button SHALL appear selected and the cropper SHALL use `aspect={4/3}`

---

### Requirement: Switching preset ratio updates the cropper

The crop screen MUST update the cropper's aspect ratio immediately when the user selects a different preset, and MUST reset crop position and zoom level.

#### Scenario: User selects 16:9

- **WHEN** the user taps the 16:9 button
- **THEN** the cropper SHALL render with `aspect={16/9}`, crop SHALL reset to `{x:0, y:0}`, and zoom SHALL reset to `1`

#### Scenario: User selects 1:1

- **WHEN** the user taps the 1:1 button
- **THEN** the cropper SHALL render with `aspect={1}`, crop SHALL reset to `{x:0, y:0}`, and zoom SHALL reset to `1`

#### Scenario: User switches back to 4:3

- **WHEN** the user taps the 4:3 button after having selected another ratio
- **THEN** the cropper SHALL render with `aspect={4/3}`, crop SHALL reset to `{x:0, y:0}`, and zoom SHALL reset to `1`

---

### Requirement: Crop confirmation works with all presets

The crop confirmation flow MUST produce a correctly cropped image for all 3 preset ratios.

#### Scenario: Confirm crop at 16:9

- **WHEN** the user selects 16:9, positions the crop box, and taps Xác nhận
- **THEN** `getCroppedImg` SHALL receive the pixel-accurate `croppedAreaPixels` for the 16:9 crop and return a correctly sized blob

#### Scenario: Confirm crop at 1:1

- **WHEN** the user selects 1:1, positions the crop box, and taps Xác nhận
- **THEN** `getCroppedImg` SHALL receive the pixel-accurate `croppedAreaPixels` for the 1:1 crop and return a correctly sized blob
