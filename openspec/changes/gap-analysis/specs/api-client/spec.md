## ADDED Requirements

### Requirement: postOcr enforces a 10s client-side timeout

`postOcr` in `lib/api.ts` MUST abort the request if no response arrives within 10000 ms, using an `AbortController` whose `signal` is passed to `fetch`. On timeout it MUST throw an `ApiError` with `code === 'OCR_TIMEOUT'`, `retryable === true`, and a user-facing Vietnamese message. `OCR_TIMEOUT` is a client-only code: it is synthesised on the client and MUST NOT be part of the backend error envelope or sent by the server. The timeout timer MUST be cleared when a response arrives before the deadline.

#### Scenario: Request aborts after 10 seconds
- **WHEN** `postOcr(blob, deviceId)` is called and the server does not respond within 10000 ms
- **THEN** the underlying `fetch` is aborted via its `AbortController`

#### Scenario: Timeout throws OCR_TIMEOUT ApiError
- **WHEN** the `postOcr` request is aborted by the 10s timeout
- **THEN** an `ApiError` is thrown with `code === 'OCR_TIMEOUT'` and `retryable === true`

#### Scenario: Timer cleared on a successful response
- **WHEN** `postOcr` receives a response before the 10s deadline
- **THEN** the timeout timer is cleared and no abort occurs
