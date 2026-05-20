## ADDED Requirements

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
