## MODIFIED Requirements

### Requirement: Home screen renders 3 CTAs

The system SHALL render `app/(main)/page.tsx` at route `/` with three call-to-action buttons: "Chụp ảnh" (Camera), "Tải lên" (File Picker / FR-1b), and a "Nhập LaTeX" link. The Camera CTA SHALL navigate to `/camera`. The File Picker CTA SHALL open a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` on click; on file selection it MUST validate size ≤ 2MB and navigate to `/crop` passing the selected File blob via CaptureContext. The "Nhập LaTeX" link SHALL navigate to `/manual`.

#### Scenario: Home screen mounts at root route
- **WHEN** the user navigates to `/`
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

---

### Requirement: BottomNav renders 4 tabs with active route highlighting

The system SHALL provide `components/BottomNav.tsx` with 4 tabs: Home (`/`), History (`/history`), Bookmarks (`/bookmarks`), and Settings (`/settings`). The active tab MUST be highlighted with `text-[#18E299]` and `strokeWidth={2.5}` based on the current pathname. Inactive tabs MUST render with `text-gray-500` and `strokeWidth={2}`. BottomNav MUST be visible on the Home screen and MUST NOT be rendered on `/camera`, `/crop`, or `/ocr` routes.

#### Scenario: Bookmarks tab navigates to /bookmarks
- **WHEN** the user taps the Bookmarks tab in BottomNav
- **THEN** the router navigates to `/bookmarks`

#### Scenario: Active tab highlighted at matching route
- **WHEN** the current pathname is `/bookmarks`
- **THEN** the Bookmarks tab has `text-[#18E299]` styling and other tabs do not

#### Scenario: BottomNav is hidden on capture flow routes
- **WHEN** the current pathname is `/camera`, `/crop`, or `/ocr`
- **THEN** BottomNav is not rendered in the DOM

#### Scenario: BottomNav is visible on Home screen
- **WHEN** the current pathname is `/`
- **THEN** BottomNav is rendered and visible
