## ADDED Requirements

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
