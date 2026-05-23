## MODIFIED Requirements

### Requirement: Burst limit blocks rapid requests per device

The system SHALL maintain an in-memory sliding window per `device_id` and return `429 RATE_LIMITED` with `retryable: true` when a device sends more than `BURST_LIMIT_PER_MINUTE` (default 5) requests to `/api/ocr` or `/api/solve` within 60 seconds.

#### Scenario: 6th request within 60s is blocked
- **WHEN** a device sends 5 requests to `/api/solve` within 60 seconds, then sends a 6th
- **THEN** server returns `429 { "code": "RATE_LIMITED", "message": "You are sending requests too fast. Please wait 1 minute.", "retryable": true }`

#### Scenario: Request after window expires is allowed
- **WHEN** a device had 5 requests blocked, then waits 61 seconds and sends another
- **THEN** server processes the request normally (no 429)

#### Scenario: Burst limit applies to OCR endpoint
- **WHEN** a device sends 6 requests to `/api/ocr` within 60 seconds
- **THEN** the 6th request returns `429 RATE_LIMITED retryable=true`

#### Scenario: Different devices have independent burst counters
- **WHEN** device A sends 5 requests within 60s, then device B sends its first request
- **THEN** device B's request is processed normally

---

### Requirement: Daily quota blocks excessive solves per device

The system SHALL query `history_items` to count successful solves for the current UTC day per `device_id` and return `429 RATE_LIMITED` with `retryable: false` when the count reaches `DAILY_SOLVE_LIMIT` (default 20).

#### Scenario: 21st solve in the same UTC day is blocked
- **WHEN** a device has 20 rows in `history_items` with `created_at` in the current UTC day, and sends another `/api/solve` request
- **THEN** server returns `429 { "code": "RATE_LIMITED", "message": "You have reached today's limit. Please try again tomorrow.", "retryable": false }`

#### Scenario: Daily limit resets at UTC midnight
- **WHEN** a device had 20 rows yesterday (UTC) and sends its first request today (UTC)
- **THEN** server processes the request normally

#### Scenario: Daily limit uses approximate OCR count
- **WHEN** a device sends a `/api/ocr` request after already having 20 solve rows today
- **THEN** server returns `429 RATE_LIMITED retryable=false` (approximation via history_items)
