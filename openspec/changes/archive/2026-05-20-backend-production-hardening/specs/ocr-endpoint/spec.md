## ADDED Requirements

### Requirement: OCR endpoint applies rate limiting before pix2tex invocation

The system SHALL check burst limit and daily quota (per `api-rate-limiting` spec) BEFORE invoking pix2tex. If either limit is exceeded, the system MUST return `429 RATE_LIMITED` without loading or running the OCR model.

#### Scenario: Burst-limited device gets 429 before pix2tex call
- **WHEN** a device exceeds burst limit and sends an OCR request
- **THEN** server returns `429 RATE_LIMITED retryable=true` and pix2tex is NOT invoked

#### Scenario: Daily-limited device gets 429 before pix2tex call
- **WHEN** a device has reached daily quota (approximated via history_items count) and sends an OCR request
- **THEN** server returns `429 RATE_LIMITED retryable=false` and pix2tex is NOT invoked
