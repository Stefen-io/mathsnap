## Purpose

Solve endpoint that accepts a LaTeX string and returns a step-by-step solution via LLM (LCEL chain), persisting the result to history.
## Requirements
### Requirement: Solve endpoint accepts LaTeX and returns HistoryItem

The system SHALL expose `POST /api/solve` accepting JSON body `{ "latex": string, "language": "vi" | "en" }` with a required `X-Device-ID` header, and return a full `HistoryItem` on success.

#### Scenario: Valid LaTeX returns solved HistoryItem
- **WHEN** client sends `{ "latex": "2x + 3 = 7", "language": "vi" }` with valid `X-Device-ID`
- **THEN** server returns `200 OK` with a `HistoryItem` including `id`, `deviceId`, `latex`, `language`, `createdAt`, `isBookmarked: false`, `solutionSteps[]`

#### Scenario: Language defaults to "vi" when omitted
- **WHEN** client sends `{ "latex": "x^2 = 4" }` without `language` field
- **THEN** server uses language `"vi"` for the LCEL chain prompt and returns `HistoryItem` with `"language": "vi"`

---

### Requirement: Solve endpoint validates latex field

The system SHALL return `400 INVALID_REQUEST` when `latex` is missing, empty, or exceeds 2000 characters.

#### Scenario: Empty latex is rejected
- **WHEN** client sends `{ "latex": "" }`
- **THEN** server returns `400 { "code": "INVALID_REQUEST", "retryable": false }`

#### Scenario: latex exceeding 2000 chars is rejected
- **WHEN** client sends `latex` with more than 2000 characters
- **THEN** server returns `400 { "code": "INVALID_REQUEST", "retryable": false }`

---

### Requirement: Solve endpoint uses LCEL chain for structured output

The system SHALL use a LangChain LCEL chain (`ChatPromptTemplate | ChatOpenAI.with_structured_output(Solution)`) to generate solution steps. The chain MUST use `timeout=14` seconds and `max_retries=1`.

#### Scenario: LCEL chain produces Solution with steps
- **WHEN** a valid solve request is processed
- **THEN** the LCEL chain returns a `Solution` with 1–10 `SolutionStep` objects

#### Scenario: OpenAI timeout returns 504
- **WHEN** the LCEL chain does not respond within 14 seconds
- **THEN** server returns `504 { "code": "LLM_TIMEOUT", "retryable": true }`

#### Scenario: Structured output parse failure returns 502
- **WHEN** the LCEL chain raises `OutputParserException`
- **THEN** server returns `502 { "code": "LLM_INVALID_RESPONSE", "retryable": true }`

---

### Requirement: Solve endpoint persists HistoryItem via fire-and-forget

The system SHALL INSERT a new row into Supabase `history_items` after generating the solution. The DB write MUST be executed as a background task so that DB failures do NOT block the response.

#### Scenario: DB write failure does not affect response
- **WHEN** Supabase INSERT fails but LCEL chain succeeded
- **THEN** server still returns `200 OK` with the full `HistoryItem`

#### Scenario: Successful solve creates new history row
- **WHEN** a valid solve request succeeds end-to-end
- **THEN** a new row appears in `history_items` with matching `device_id`, `latex`, `solution_steps`, `language`

---

### Requirement: Solve endpoint returns camelCase HistoryItem

The system SHALL serialize the response `HistoryItem` with camelCase keys per SYSTEM_DESIGN §4.3 response example.

#### Scenario: Response uses camelCase
- **WHEN** a successful solve response is returned
- **THEN** JSON keys include `deviceId`, `solutionSteps`, `isBookmarked`, `createdAt` (not snake_case variants)

### Requirement: Solve endpoint applies rate limiting before LLM invocation

The system SHALL check burst limit and daily quota (per `api-rate-limiting` spec) BEFORE invoking the LCEL chain. If either limit is exceeded, the system MUST return `429 RATE_LIMITED` without calling OpenAI.

#### Scenario: Burst-limited device gets 429 before OpenAI call
- **WHEN** a device exceeds burst limit and sends a solve request
- **THEN** server returns `429 RATE_LIMITED retryable=true` and OpenAI is NOT called

#### Scenario: Daily-limited device gets 429 before OpenAI call
- **WHEN** a device has reached daily solve quota and sends another solve request
- **THEN** server returns `429 RATE_LIMITED retryable=false` and OpenAI is NOT called

---

### Requirement: Solve endpoint sanitizes latex input before LLM invocation

The system SHALL strip all control characters (`\x00–\x1f`) from the `latex` field before passing it to the LCEL chain. The `max_length=2000` Pydantic constraint MUST remain in place and run before sanitization.

#### Scenario: Null bytes are stripped from latex
- **WHEN** client sends `latex` containing null bytes (`\x00`)
- **THEN** the string passed to the LCEL chain has all null bytes removed

#### Scenario: Control chars are stripped from latex
- **WHEN** client sends `latex` containing control characters (e.g. `\x01`, `\x1f`)
- **THEN** the string passed to the LCEL chain has those characters removed

#### Scenario: Normal latex is not modified
- **WHEN** client sends `latex` containing only printable characters and standard LaTeX syntax
- **THEN** the string passed to the LCEL chain is identical to the input

