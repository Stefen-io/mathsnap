# Spec: formula-preview-edit

## Purpose

Defines the OCR result confirmation screen (`app/(main)/ocr/page.tsx`) after the camera-intake-flow hands off a `croppedBlob`. Covers the network call to `POST /api/ocr`, the confirm state with editable LaTeX, live KaTeX preview, confidence badge, and the CTA bar that stores the formula and navigates to the solve flow.
## Requirements
### Requirement: OCR page calls POST /api/ocr and enters a confirm state on success

The system SHALL call `postOcr(croppedBlob, deviceId)` exactly once per component
mount once `deviceId` is non-null. A change in `lang` after mount MUST NOT trigger
a second API call. While awaiting the response, it MUST display a pulsing loading
skeleton with label "Đang nhận dạng công thức...". On a successful response it MUST
transition to a `confirm` state with `editedLatex` initialised to `formulas[0].latex`
and `confidence` set to `formulas[0].confidence`.

#### Scenario: OCR loading skeleton displayed while request is in-flight
- **WHEN** `/ocr` is mounted with a non-null `croppedBlob` and the API call is pending
- **THEN** a pulsing skeleton and the text "Đang nhận dạng công thức..." are visible

#### Scenario: Confirm state entered after successful OCR
- **WHEN** `postOcr` resolves with `formulas[0]`
- **THEN** the confirm UI is rendered with the returned `latex` value

#### Scenario: Null croppedBlob redirects to camera
- **WHEN** `/ocr` is mounted with `croppedBlob === null`
- **THEN** the router redirects to `/camera`

#### Scenario: Lang change after mount does not trigger a second API call
- **WHEN** `LanguageContext` transitions from `'vi'` to `'en'` after the OCR page mounts
- **THEN** only one `POST /ocr` request is issued (no duplicate on lang change)

---

### Requirement: Formula preview shows croppedBlob thumbnail and live KaTeX render

In the `confirm` state the OCR page MUST display a thumbnail `<img>` sourced from
`URL.createObjectURL(croppedBlob)` at 100px height. It MUST render `<KaTeXRenderer latex={editedLatex} />`
that updates in realtime as `editedLatex` changes. The object URL MUST be revoked in
a `useEffect` cleanup callback to prevent memory leaks.

#### Scenario: Thumbnail renders from croppedBlob
- **WHEN** the confirm state is active
- **THEN** an `<img>` element is present with an object URL as `src`

#### Scenario: KaTeX render updates on textarea change
- **WHEN** the user modifies the LaTeX textarea
- **THEN** the KaTeX render block reflects the updated LaTeX without a page reload

#### Scenario: Object URL is revoked on unmount
- **WHEN** the OCR page unmounts
- **THEN** `URL.revokeObjectURL` is called for the croppedBlob object URL

---

### Requirement: Low-confidence badge shown when confidence is below 0.6

The OCR page MUST display an amber-styled badge reading "Độ chính xác thấp — kiểm tra lại"
when `confidence < 0.6`. The badge MUST NOT be visible when `confidence >= 0.6`.

#### Scenario: Amber badge visible for low confidence
- **WHEN** the OCR response has `confidence < 0.6`
- **THEN** the amber confidence warning badge is rendered in the UI

#### Scenario: No badge for normal confidence
- **WHEN** the OCR response has `confidence >= 0.6`
- **THEN** no confidence badge is rendered

---

### Requirement: Giải bài này CTA navigates to solve with edited LaTeX stored

The OCR page MUST display a fixed bottom action bar with a "Chụp lại" secondary
link and a "Giải bài này" primary pill button (52px height, dark fill, ArrowRight icon).
Tapping "Giải bài này" MUST call `setOcrLatex(editedLatex)` on `CaptureContext` and
then `router.push('/solve')`. The button MUST be disabled when `editedLatex.trim()`
is empty. Tapping "Chụp lại" MUST call `reset()` and navigate to `/camera`.

#### Scenario: Giải bài này stores latex and navigates to solve
- **WHEN** the user taps "Giải bài này" with a non-empty `editedLatex`
- **THEN** `setOcrLatex` is called with `editedLatex` and the router navigates to `/solve`

#### Scenario: CTA is disabled when textarea is empty
- **WHEN** `editedLatex.trim()` is empty
- **THEN** the "Giải bài này" button has the `disabled` attribute

#### Scenario: Chụp lại resets context and returns to camera
- **WHEN** the user taps "Chụp lại"
- **THEN** `reset()` is called on CaptureContext and the router navigates to `/camera`

---

### Requirement: OCR error state MUST dispatch on ApiError.code and show variant-specific CTAs

When `postOcr` throws, the OCR page MUST transition to `state === 'error'` and
display a message and CTA set determined by `ApiError.code` and `ApiError.retryable`:

| `ApiError.code` | `retryable` | Message | CTA |
|---|---|---|---|
| `OCR_NO_FORMULA` | false | `err.message` (from backend) | "Chụp lại" → `reset()` + navigate `/camera` |
| `INVALID_IMAGE` | false | `err.message` (from backend) | "Chụp lại" → `reset()` + navigate `/camera` |
| `RATE_LIMITED` | true | `err.message` (burst: ~"đợi 1 phút") | "Thử lại" → re-trigger `postOcr` |
| `RATE_LIMITED` | false | `err.message` (daily: ~"vào ngày mai") | "Chụp lại" → `reset()` + navigate `/camera` |
| fallback | any | "Có lỗi xảy ra. Vui lòng thử lại." | "Chụp lại" → `reset()` + navigate `/camera` |

The page MUST store the caught error reference so the error state render section can
access `err.code`, `err.message`, and `err.retryable`. The error state MUST NOT add
a "Nhập thủ công" CTA (S-11 route does not exist in this change).

#### Scenario: OCR_NO_FORMULA shows backend message and Chụp lại button
- **WHEN** `postOcr` throws an `ApiError` with `code === "OCR_NO_FORMULA"`
- **THEN** the error card displays `err.message` and a "Chụp lại" button that calls `reset()` and navigates to `/camera`

#### Scenario: INVALID_IMAGE shows backend message and Chụp lại button
- **WHEN** `postOcr` throws an `ApiError` with `code === "INVALID_IMAGE"`
- **THEN** the error card displays `err.message` and a "Chụp lại" button

#### Scenario: RATE_LIMITED burst shows backend message and Thử lại button
- **WHEN** `postOcr` throws `ApiError` with `code === "RATE_LIMITED"` and `retryable === true`
- **THEN** the error card displays `err.message` and a "Thử lại" button that re-fires `postOcr`

#### Scenario: RATE_LIMITED daily shows backend message and Chụp lại button (no retry)
- **WHEN** `postOcr` throws `ApiError` with `code === "RATE_LIMITED"` and `retryable === false`
- **THEN** the error card displays `err.message` and a "Chụp lại" button (no "Thử lại")

#### Scenario: Unknown error shows fallback message and Chụp lại
- **WHEN** `postOcr` throws a non-ApiError or an unknown code
- **THEN** the error card displays "Có lỗi xảy ra. Vui lòng thử lại." and a "Chụp lại" button

### Requirement: OCR error strings SHALL use the locale settled at response time

When `postOcr` rejects or returns an empty formulas array, the displayed error message
MUST reflect the user's locale as it exists at the time the response resolves — not
the locale captured at the time the call was initiated. If `lang` transitioned from
`'vi'` to `'en'` between call start and response, the error string MUST be in `'en'`.

#### Scenario: Error message language matches settled locale
- **WHEN** `lang` is `'vi'` at call-start and transitions to `'en'` before `postOcr` resolves
- **THEN** the displayed error message is in English (`'en'`), not Vietnamese (`'vi'`)

#### Scenario: Error message correct when lang does not change
- **WHEN** `lang` remains `'vi'` throughout the OCR call lifecycle
- **THEN** the displayed error message is in Vietnamese

