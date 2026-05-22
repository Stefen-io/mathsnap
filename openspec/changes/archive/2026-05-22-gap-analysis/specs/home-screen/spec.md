## MODIFIED Requirements

### Requirement: Home screen renders 3 CTAs

The system SHALL render `app/(main)/page.tsx` at route `/` with three call-to-action buttons: "Chụp ảnh" (Camera), "Tải lên" (File Picker / FR-1b), and a "Nhập LaTeX" link. The Camera CTA SHALL navigate to `/camera`. The File Picker CTA SHALL open a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` on click; on file selection it MUST validate size ≤ 2MB and navigate to `/crop` passing the selected File blob via CaptureContext. The "Nhập LaTeX" link SHALL navigate to `/manual`.

When the camera is unavailable — detected on the client **without starting a camera stream or prompting for permission** (e.g. `navigator.mediaDevices?.getUserMedia` is absent, or `navigator.mediaDevices.enumerateDevices()` reports no `videoinput` device) — the "Chụp ảnh" Camera CTA MUST be hidden so the user is not offered a non-functional action. The "Tải lên" and "Nhập LaTeX" entries MUST remain available so the user can still proceed. The Home screen MUST NOT start a camera stream merely to decide CTA visibility.

#### Scenario: Home screen mounts at root route
- **WHEN** the user navigates to `/` and a video input device is available
- **THEN** the page renders with a visible heading and Camera and file-picker CTAs

#### Scenario: Camera CTA navigates to camera screen
- **WHEN** the user taps the "Chụp ảnh" CTA on the Home screen
- **THEN** the router navigates to `/camera`

#### Scenario: File picker CTA opens OS file picker
- **WHEN** the user taps the "Tải lên" CTA
- **THEN** the OS native file picker opens filtered to image/jpeg, image/png, image/webp

#### Scenario: File too large shows error toast
- **WHEN** the user selects a file larger than 2MB via the file picker
- **THEN** a Sonner `toast.error` is shown and navigation does NOT proceed

#### Scenario: Valid file navigates to crop
- **WHEN** the user selects a valid image file (≤ 2MB, accepted type) via the file picker
- **THEN** the file is stored in CaptureContext and the router navigates to `/crop`

#### Scenario: Nhập LaTeX link navigates to manual
- **WHEN** the user taps the "Nhập LaTeX" link
- **THEN** the router navigates to `/manual`

#### Scenario: Camera CTA hidden when camera unavailable
- **WHEN** the Home screen renders on a client where the camera API is unsupported (no `getUserMedia`) or `enumerateDevices()` reports no `videoinput` device
- **THEN** the "Chụp ảnh" Camera CTA is not rendered, while the "Tải lên" and "Nhập LaTeX" entries remain present, and no camera permission prompt is triggered
