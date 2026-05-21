## MODIFIED Requirements

### Requirement: Error state shows Sonner toast and inline retry for retryable errors

If `postSolve` throws, the solve page MUST display the error message via `toast.error(error.message)`
(Sonner) and render an inline error card. The card content MUST be determined by
`ApiError.code` and `ApiError.retryable`:

| `ApiError.code` | `retryable` | CTA rendered |
|---|---|---|
| `LLM_TIMEOUT` | true | "Thử lại" button — re-fires `postSolve(ocrLatex, deviceId)` |
| `LLM_INVALID_RESPONSE` | true | "Thử lại" button |
| `LLM_CONTENT_POLICY` | false | "Nhập bài toán khác" button → `reset()` + navigate `/camera` |
| `RATE_LIMITED` | true | "Thử lại" button |
| `RATE_LIMITED` | false | No button (informational message only) |
| fallback (retryable) | true | "Thử lại" button |
| fallback (non-retryable) | false | No button |

The page MUST preserve `ocrLatex` in `CaptureContext` across all error states (MUST NOT
call `reset()` on error, only on "Nhập bài toán khác" or explicit user action). This
ensures "Thử lại" can re-fire `postSolve` with the original formula.

#### Scenario: Error toast shown on API failure
- **WHEN** `postSolve` throws an ApiError
- **THEN** `toast.error` is called with `error.message`

#### Scenario: Retry button present for retryable errors (LLM_TIMEOUT)
- **WHEN** the error state is active with `code === "LLM_TIMEOUT"` and `retryable === true`
- **THEN** a "Thử lại" button is rendered that re-fires `postSolve`

#### Scenario: Nhập bài toán khác shown for LLM_CONTENT_POLICY
- **WHEN** the error state is active with `code === "LLM_CONTENT_POLICY"` and `retryable === false`
- **THEN** a "Nhập bài toán khác" button is rendered that calls `reset()` and navigates to `/camera`

#### Scenario: No button for RATE_LIMITED daily (non-retryable)
- **WHEN** the error state is active with `code === "RATE_LIMITED"` and `retryable === false`
- **THEN** no action button is rendered — only the error message is displayed

#### Scenario: Retry button present for RATE_LIMITED burst (retryable)
- **WHEN** the error state is active with `code === "RATE_LIMITED"` and `retryable === true`
- **THEN** a "Thử lại" button is rendered

#### Scenario: ocrLatex preserved across error → retry cycle
- **WHEN** `postSolve` fails and the user taps "Thử lại"
- **THEN** `postSolve` is called again with the original `ocrLatex` value (context not reset)
