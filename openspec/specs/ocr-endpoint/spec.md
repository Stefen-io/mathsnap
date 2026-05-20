## Purpose

OCR endpoint that accepts image uploads and returns LaTeX formula strings extracted using pix2tex.
## Requirements
### Requirement: OCR endpoint accepts image upload

The system SHALL expose `POST /api/ocr` accepting `multipart/form-data` with a required `image` file field and a required `X-Device-ID` header.

#### Scenario: Valid JPEG image returns formula array
- **WHEN** client sends a valid JPEG (≤ 2MB) with valid `X-Device-ID` header
- **THEN** server returns `200 OK` with `{ "formulas": [{ "latex": "...", "confidence": 1.0 }] }`

#### Scenario: Valid PNG image is accepted
- **WHEN** client sends a valid PNG with valid `X-Device-ID`
- **THEN** server returns `200 OK` with formulas array

#### Scenario: Valid WebP image is accepted
- **WHEN** client sends a valid WebP with valid `X-Device-ID`
- **THEN** server returns `200 OK` with formulas array

---

### Requirement: OCR endpoint rejects unsupported file types

The system SHALL return `400 INVALID_IMAGE` for file MIME types other than `image/jpeg`, `image/png`, `image/webp`.

#### Scenario: PDF file is rejected
- **WHEN** client sends a PDF file
- **THEN** server returns `400 { "code": "INVALID_IMAGE", "retryable": false }`

#### Scenario: File exceeding 2MB is rejected
- **WHEN** client sends an image larger than 2MB
- **THEN** server returns `400 { "code": "INVALID_IMAGE", "retryable": false }`

---

### Requirement: OCR endpoint returns 422 when no formula found

The system SHALL return `422 OCR_NO_FORMULA` when pix2tex cannot identify any mathematical formula in the image.

#### Scenario: pix2tex returns empty result
- **WHEN** pix2tex returns an empty string or None for the uploaded image
- **THEN** server returns `422 { "code": "OCR_NO_FORMULA", "retryable": false }`

---

### Requirement: OCR confidence is hardcoded

The system SHALL set `confidence` to `1.0` for all OCR results until pix2tex exposes a real confidence score.

#### Scenario: All returned formulas have confidence 1.0
- **WHEN** a successful OCR request returns formulas
- **THEN** every item in `formulas[]` has `"confidence": 1.0`

---

### Requirement: Image is never persisted

The system SHALL NOT write the uploaded image to disk or send it to any external service. Image data MUST be processed in-process only.

#### Scenario: OCR processes image in-process
- **WHEN** an image is submitted to `/api/ocr`
- **THEN** image bytes are passed directly to `LatexOCR` with no file write and no external HTTP call

### Requirement: OCR endpoint applies rate limiting before pix2tex invocation

The system SHALL check burst limit and daily quota (per `api-rate-limiting` spec) BEFORE invoking pix2tex. If either limit is exceeded, the system MUST return `429 RATE_LIMITED` without loading or running the OCR model.

#### Scenario: Burst-limited device gets 429 before pix2tex call
- **WHEN** a device exceeds burst limit and sends an OCR request
- **THEN** server returns `429 RATE_LIMITED retryable=true` and pix2tex is NOT invoked

#### Scenario: Daily-limited device gets 429 before pix2tex call
- **WHEN** a device has reached daily quota (approximated via history_items count) and sends an OCR request
- **THEN** server returns `429 RATE_LIMITED retryable=false` and pix2tex is NOT invoked

