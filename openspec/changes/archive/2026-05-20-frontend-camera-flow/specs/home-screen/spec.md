## ADDED Requirements

### Requirement: Main layout wraps all screens in a 480px mobile container

The system SHALL provide `app/(main)/layout.tsx` that wraps all routes under the `(main)` route group in a centered container with `max-width: 480px` and provides `CaptureProvider` context and conditional `BottomNav` rendering.

#### Scenario: Container constrains content width
- **WHEN** any page under `app/(main)/` is rendered
- **THEN** the content area has `max-width: 480px` and is centered horizontally

#### Scenario: CaptureContext is available to all (main) pages
- **WHEN** any component under `app/(main)/` calls `useCaptureContext()`
- **THEN** the hook returns a valid context object without throwing

---

### Requirement: Home screen renders 3 CTAs

The system SHALL render `app/(main)/page.tsx` at route `/` with three call-to-action buttons: "Chụp ảnh" (Camera), "Thư viện" (Gallery), and "Lịch sử" (History). The Camera CTA SHALL navigate to `/camera`. The Gallery CTA SHALL be rendered but non-functional (no-op) in G3. The History CTA SHALL be rendered but non-functional in G3.

#### Scenario: Home screen mounts at root route
- **WHEN** the user navigates to `/`
- **THEN** the page renders with a visible heading and all 3 CTA buttons

#### Scenario: Camera CTA navigates to camera screen
- **WHEN** the user taps the "Chụp ảnh" CTA on the Home screen
- **THEN** the router navigates to `/camera`

#### Scenario: Gallery and History CTAs render without crashing
- **WHEN** the user taps the Gallery or History CTA
- **THEN** no navigation error or runtime crash occurs

---

### Requirement: BottomNav renders 3 tabs with active route highlighting

The system SHALL provide `components/BottomNav.tsx` with 3 tabs: Home (`/`), History (`/history`), and Settings (`/settings`). The active tab MUST be highlighted based on the current pathname. BottomNav MUST be visible on the Home screen and MUST NOT be rendered on `/camera`, `/crop`, or `/ocr` routes.

#### Scenario: Home tab is active at root route
- **WHEN** the current pathname is `/`
- **THEN** the Home tab in BottomNav has an active visual state and other tabs do not

#### Scenario: BottomNav is hidden on capture flow routes
- **WHEN** the current pathname is `/camera`, `/crop`, or `/ocr`
- **THEN** BottomNav is not rendered in the DOM

#### Scenario: BottomNav is visible on Home screen
- **WHEN** the current pathname is `/`
- **THEN** BottomNav is rendered and visible

---

### Requirement: Brand design tokens are wired in globals.css

The system SHALL add `--color-brand: #18E299`, `--color-brand-light: #d4fae8`, `--color-brand-deep: #0fa76e` to the `:root` block in `globals.css`. The existing shadcn neutral tokens MUST NOT be removed or modified.

#### Scenario: Brand color variable is accessible
- **WHEN** any component references `var(--color-brand)` in its styles
- **THEN** the computed value resolves to `#18E299` (or its oklch equivalent)

#### Scenario: Existing shadcn tokens remain intact
- **WHEN** shadcn components (Button, etc.) are rendered after the globals.css change
- **THEN** their visual appearance is unchanged from before
