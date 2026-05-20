## MODIFIED Requirements

### Requirement: CaptureContext holds image state between routes

The system SHALL provide `contexts/CaptureContext.tsx` exporting `CaptureProvider`
and `useCaptureContext`. The context SHALL hold `capturedBlob: Blob | null`,
`croppedBlob: Blob | null`, `ocrLatex: string | null`, and
`solveResult: HistoryItem | null`, plus setter functions `setCapturedBlob`,
`setCroppedBlob`, `setOcrLatex`, `setSolveResult`, and a `reset()` function.
Calling `reset()` MUST set all four state values to `null`. Calling
`useCaptureContext()` outside of `CaptureProvider` MUST throw an error with a
descriptive message.

#### Scenario: Initial context state is null
- **WHEN** `CaptureProvider` is mounted without any prior state
- **THEN** `capturedBlob`, `croppedBlob`, `ocrLatex`, and `solveResult` are all `null`

#### Scenario: setCapturedBlob updates state
- **WHEN** `setCapturedBlob(blob)` is called with a Blob
- **THEN** `capturedBlob` returns that Blob on the next render

#### Scenario: reset clears all four fields
- **WHEN** `reset()` is called after all four state values have been set
- **THEN** `capturedBlob`, `croppedBlob`, `ocrLatex`, and `solveResult` are all `null`

#### Scenario: setOcrLatex updates ocrLatex
- **WHEN** `setOcrLatex("x^2 + 1")` is called
- **THEN** `ocrLatex` returns `"x^2 + 1"` on the next render

#### Scenario: useCaptureContext throws outside provider
- **WHEN** `useCaptureContext()` is called in a component not wrapped by `CaptureProvider`
- **THEN** an error is thrown containing the word "CaptureProvider"

---

## MODIFIED Requirements

### Requirement: OCR screen renders a loading skeleton without API calls

This requirement is superseded by the `formula-preview-edit` capability spec. The
OCR screen `app/(main)/ocr/page.tsx` MUST be rewritten to call `POST /api/ocr`. The
skeleton-only, no-network-request behaviour described in the original requirement NO
LONGER APPLIES after G4. The guard on `croppedBlob === null` (redirect to `/camera`)
SHALL be preserved.

#### Scenario: Null croppedBlob redirects to camera
- **WHEN** `/ocr` is navigated to with `croppedBlob === null`
- **THEN** the router redirects to `/camera`
