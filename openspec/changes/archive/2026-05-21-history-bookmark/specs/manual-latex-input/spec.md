## ADDED Requirements

### Requirement: Manual LaTeX input page provides textarea with live preview

The system SHALL provide `app/(main)/manual/page.tsx` at route `/manual`. The page MUST render a `<textarea>` for raw LaTeX input and a sticky preview panel above it that renders the formula via `KaTeXRenderer`. When the textarea is empty the preview MUST show the placeholder text "Bắt đầu nhập để xem preview". The textarea MUST auto-focus on mount.

#### Scenario: Auto-focus on mount
- **WHEN** the user navigates to `/manual`
- **THEN** the textarea receives focus automatically

#### Scenario: Preview updates as user types
- **WHEN** the user types valid LaTeX into the textarea
- **THEN** the preview panel renders the formula via KaTeXRenderer

#### Scenario: Empty textarea shows placeholder preview text
- **WHEN** the textarea is empty
- **THEN** the preview panel shows "Bắt đầu nhập để xem preview" in muted text

---

### Requirement: Manual submit navigates to OCR loading state with stored LaTeX

The page MUST render a full-width "Xác nhận" submit button (disabled when textarea empty). On submit, the page MUST store the trimmed LaTeX into `CaptureContext` via `setOcrLatex` and navigate to `/solve`. The button MUST render `bg-[#0d0d0d] text-white` when enabled and `bg-[#e5e5e5] text-[#888888] cursor-not-allowed` when disabled.

#### Scenario: Submit button is disabled when textarea is empty
- **WHEN** the textarea value is empty or whitespace only
- **THEN** the "Xác nhận" button has `disabled` attribute and `cursor-not-allowed` styling

#### Scenario: Submit stores LaTeX and navigates to solve
- **WHEN** the user taps "Xác nhận" with non-empty LaTeX
- **THEN** `setOcrLatex(latex.trim())` is called on CaptureContext and the router navigates to `/solve`

---

### Requirement: Manual page has a back navigation button

The page MUST render a `ChevronLeft` back button in the top bar that calls `router.back()` on tap. Pressing the Escape key MUST also call `router.back()`.

#### Scenario: Back button navigates back
- **WHEN** the user taps the back button
- **THEN** `router.back()` is called

#### Scenario: Escape key navigates back
- **WHEN** the user presses the Escape key
- **THEN** `router.back()` is called
