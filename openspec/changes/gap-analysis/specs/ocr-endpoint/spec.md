## ADDED Requirements

### Requirement: OCR endpoint returns structured INTERNAL_ERROR on unexpected failure

The `POST /api/ocr` handler MUST wrap its processing body so that any unexpected exception (one not already mapped to `INVALID_IMAGE`, `OCR_NO_FORMULA`, or `RATE_LIMITED`) is caught and returned as a structured `500` response whose body uses `code: "INTERNAL_ERROR"` (matching the existing `ErrorResponse` definition for that code), instead of a bare/unstructured 500. Already-mapped `AppError` / `HTTPException` responses MUST pass through unchanged and MUST NOT be re-wrapped.

#### Scenario: Unexpected exception returns structured INTERNAL_ERROR
- **WHEN** the OCR handler raises an unexpected exception during image decoding or pix2tex invocation
- **THEN** the server returns a `500` response with body `code === "INTERNAL_ERROR"` in the standard error envelope

#### Scenario: Mapped errors are not masked by the catch-all
- **WHEN** the handler raises a known `INVALID_IMAGE`, `OCR_NO_FORMULA`, or `RATE_LIMITED` error
- **THEN** that original error code and HTTP status are returned unchanged (not converted to `INTERNAL_ERROR`)
