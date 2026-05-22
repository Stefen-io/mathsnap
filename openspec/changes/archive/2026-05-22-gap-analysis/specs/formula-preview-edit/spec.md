## MODIFIED Requirements

### Requirement: OCR error state MUST dispatch on ApiError.code and show variant-specific CTAs

When `postOcr` throws, the OCR page MUST transition to `state === 'error'` and
display a message and CTA set determined by `ApiError.code` and `ApiError.retryable`:

| `ApiError.code` | `retryable` | Message | CTA |
|---|---|---|---|
| `OCR_NO_FORMULA` | false | `err.message` (from backend) | "Chụp lại" → `reset()` + navigate `/camera` |
| `INVALID_IMAGE` | false | `err.message` (from backend) | "Chụp lại" → `reset()` + navigate `/camera` |
| `RATE_LIMITED` | true | `err.message` (burst: ~"đợi 1 phút") | "Thử lại" → re-trigger `postOcr` |
| `RATE_LIMITED` | false | `err.message` (daily: ~"vào ngày mai") | "Chụp lại" → `reset()` + navigate `/camera` |
| `OCR_TIMEOUT` | true | `err.message` (~"Nhận dạng quá lâu, vui lòng thử lại") | "Thử lại" → re-trigger `postOcr` **and** "Nhập thủ công" → navigate `/manual` |
| fallback | any | "Có lỗi xảy ra. Vui lòng thử lại." | "Chụp lại" → `reset()` + navigate `/camera` |

The page MUST store the caught error reference so the error state render section can
access `err.code`, `err.message`, and `err.retryable`. The error state MAY include a
"Nhập thủ công" CTA that navigates to `/manual` (the S-11 manual-input route now
exists); for `OCR_TIMEOUT` it MUST.

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

#### Scenario: OCR_TIMEOUT shows retry and manual-input CTAs
- **WHEN** `postOcr` throws `ApiError` with `code === "OCR_TIMEOUT"`
- **THEN** the error card displays `err.message`, a "Thử lại" button that re-fires `postOcr`, and a "Nhập thủ công" button that navigates to `/manual`

#### Scenario: Unknown error shows fallback message and Chụp lại
- **WHEN** `postOcr` throws a non-ApiError or an unknown code
- **THEN** the error card displays "Có lỗi xảy ra. Vui lòng thử lại." and a "Chụp lại" button
