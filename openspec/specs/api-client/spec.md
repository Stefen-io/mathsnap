# Spec: api-client

## Purpose

Defines the typed HTTP client layer (`lib/api.ts`) for the MathSnap frontend. Covers the `ApiError` class, `postOcr`, and `postSolve` functions — the two API endpoints the client calls, along with their request/response contracts and error handling.
## Requirements
### Requirement: ApiError class carries typed error envelope fields

The system SHALL provide `lib/api.ts` exporting an `ApiError` class that extends
`Error`. `ApiError` MUST expose `code: string`, `message: string`, and
`retryable: boolean` as public readonly properties. Its `name` property MUST be
`'ApiError'`. Both `postOcr` and `postSolve` MUST throw `ApiError` (never a plain
`Error`) for any non-2xx HTTP response.

#### Scenario: ApiError is thrown with parsed envelope fields
- **WHEN** the API returns a non-2xx response with body `{ code, message, retryable }`
- **THEN** the thrown error is an instance of `ApiError` with matching `code`, `message`, and `retryable` fields

#### Scenario: ApiError name is 'ApiError'
- **WHEN** an `ApiError` is caught
- **THEN** `error.name === 'ApiError'`

---

### Requirement: postOcr sends multipart form with X-Device-ID header

The system SHALL provide a `postOcr(blob: Blob, deviceId: string): Promise<OcrResponse>`
function in `lib/api.ts`. It MUST construct a `FormData` with a field named `image`
containing the blob. It MUST set the `X-Device-ID` request header to `deviceId`. It
MUST `POST` to `${NEXT_PUBLIC_API_URL}/api/ocr`. On success it MUST return a typed
`OcrResponse { formulas: OcrFormula[] }`.

#### Scenario: Request includes X-Device-ID header
- **WHEN** `postOcr(blob, deviceId)` is called
- **THEN** the outgoing request has `X-Device-ID: <deviceId>` header

#### Scenario: Request body is multipart with field 'image'
- **WHEN** `postOcr(blob, deviceId)` is called
- **THEN** the request body is `multipart/form-data` and contains a field named `image` with the blob

#### Scenario: Success returns OcrResponse
- **WHEN** the server returns 200 with `{ formulas: [{ latex, confidence }] }`
- **THEN** `postOcr` resolves with that typed `OcrResponse`

#### Scenario: Non-2xx throws ApiError
- **WHEN** the server returns 422 with `{ code: "OCR_NO_FORMULA", message: "...", retryable: false }`
- **THEN** `postOcr` throws an `ApiError` with `code === 'OCR_NO_FORMULA'` and `retryable === false`

---

### Requirement: postSolve sends JSON body with X-Device-ID header

The system SHALL provide a `postSolve(latex: string, deviceId: string, language?: 'vi' | 'en'): Promise<HistoryItem>`
function in `lib/api.ts`. It MUST `POST` to `${NEXT_PUBLIC_API_URL}/api/solve` with
`Content-Type: application/json` and body `{ latex, language }` (default language
`'vi'`). It MUST set the `X-Device-ID` header. On success it MUST return a typed
`HistoryItem` from `@/types/history`.

#### Scenario: Request includes X-Device-ID and JSON body
- **WHEN** `postSolve(latex, deviceId)` is called
- **THEN** the request has `X-Device-ID` header, `Content-Type: application/json`, and body `{ latex, language: 'vi' }`

#### Scenario: Success returns HistoryItem
- **WHEN** the server returns 200 with a valid HistoryItem JSON
- **THEN** `postSolve` resolves with that typed `HistoryItem`

#### Scenario: 429 throws retryable ApiError
- **WHEN** the server returns 429 with `{ code: "RATE_LIMITED", retryable: true }`
- **THEN** `postSolve` throws an `ApiError` with `retryable === true`

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

