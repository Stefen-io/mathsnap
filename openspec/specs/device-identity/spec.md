## ADDED Requirements

### Requirement: X-Device-ID header is required on all API endpoints

The system SHALL require the `X-Device-ID` header on `POST /api/ocr`, `POST /api/solve`, `GET /api/history`, `GET /api/history/{id}`, `DELETE /api/history/{id}`, and `PATCH /api/history/{id}/bookmark`. Endpoints without this header MUST return `400 INVALID_DEVICE_ID`.

#### Scenario: Missing X-Device-ID header returns 400
- **WHEN** client sends any API request without the `X-Device-ID` header
- **THEN** server returns `400 { "code": "INVALID_DEVICE_ID", "retryable": false }`

#### Scenario: Valid UUID v4 header is accepted
- **WHEN** client sends `X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000000` (valid UUID v4)
- **THEN** server proceeds with request processing

---

### Requirement: X-Device-ID must be a valid UUID v4

The system SHALL validate that the `X-Device-ID` header value is a valid UUID v4 format. Non-UUID strings MUST return `400 INVALID_DEVICE_ID`.

#### Scenario: Non-UUID string returns 400
- **WHEN** client sends `X-Device-ID: not-a-uuid`
- **THEN** server returns `400 { "code": "INVALID_DEVICE_ID", "retryable": false }`

#### Scenario: UUID v1 format returns 400
- **WHEN** client sends a UUID that is not v4 (e.g., UUID v1 format with different version digit)
- **THEN** server returns `400 { "code": "INVALID_DEVICE_ID", "retryable": false }`

#### Scenario: Empty string returns 400
- **WHEN** client sends `X-Device-ID: ` (empty string)
- **THEN** server returns `400 { "code": "INVALID_DEVICE_ID", "retryable": false }`

---

### Requirement: Device ID validation is implemented as a shared FastAPI dependency

The system SHALL implement UUID v4 validation in `app/dependencies.py` as a single `validate_device_id()` function using `Depends()`, reused by all router endpoints. Code duplication of this logic across router files is NOT allowed.

#### Scenario: All routers use the shared dependency
- **WHEN** any router file is inspected
- **THEN** device ID validation is imported from `app.dependencies` and applied via `Depends(validate_device_id)`
