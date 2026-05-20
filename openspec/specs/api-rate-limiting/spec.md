# api-rate-limiting Specification

## Purpose
TBD - created by archiving change backend-production-hardening. Update Purpose after archive.
## Requirements
### Requirement: Burst limit blocks rapid requests per device

The system SHALL maintain an in-memory sliding window per `device_id` and return `429 RATE_LIMITED` with `retryable: true` when a device sends more than `BURST_LIMIT_PER_MINUTE` (default 5) requests to `/api/ocr` or `/api/solve` within 60 seconds.

#### Scenario: 6th request within 60s is blocked
- **WHEN** a device sends 5 requests to `/api/solve` within 60 seconds, then sends a 6th
- **THEN** server returns `429 { "code": "RATE_LIMITED", "message": "Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.", "retryable": true }`

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
- **THEN** server returns `429 { "code": "RATE_LIMITED", "message": "Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.", "retryable": false }`

#### Scenario: Daily limit resets at UTC midnight
- **WHEN** a device had 20 rows yesterday (UTC) and sends its first request today (UTC)
- **THEN** server processes the request normally

#### Scenario: Daily limit uses approximate OCR count
- **WHEN** a device sends a `/api/ocr` request after already having 20 solve rows today
- **THEN** server returns `429 RATE_LIMITED retryable=false` (approximation via history_items)

---

### Requirement: Rate limit check order is burst-before-daily

The system SHALL check burst limit before daily quota on every rate-limited endpoint so that the cheaper in-memory check runs first.

#### Scenario: Burst check runs before daily SQL query
- **WHEN** a device is simultaneously over burst limit AND over daily limit
- **THEN** server returns `429 RATE_LIMITED retryable=true` (burst response, not daily)

---

### Requirement: Rate limit events are logged

The system SHALL emit a WARNING log entry for every request blocked by rate limiting, including the first 8 characters of `device_id`, limit type (`daily` or `burst`), and the endpoint path.

#### Scenario: Burst block produces warning log
- **WHEN** a request is blocked by burst limit
- **THEN** a log line at WARNING level appears with `type=burst` and the endpoint name

#### Scenario: Daily block produces warning log
- **WHEN** a request is blocked by daily limit
- **THEN** a log line at WARNING level appears with `type=daily` and the endpoint name

---

### Requirement: Rate limits are configurable via environment variables

The system SHALL read `DAILY_SOLVE_LIMIT` and `BURST_LIMIT_PER_MINUTE` from environment variables at startup, with defaults of `20` and `5` respectively.

#### Scenario: Custom daily limit is respected
- **WHEN** `DAILY_SOLVE_LIMIT=5` is set in the environment and a device has 5 rows today
- **THEN** the 6th solve request returns `429 RATE_LIMITED retryable=false`

#### Scenario: Custom burst limit is respected
- **WHEN** `BURST_LIMIT_PER_MINUTE=2` is set and a device sends 2 requests within 60s
- **THEN** the 3rd request returns `429 RATE_LIMITED retryable=true`

