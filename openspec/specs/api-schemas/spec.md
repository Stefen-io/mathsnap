## ADDED Requirements

### Requirement: ErrorResponse schema standardizes all error bodies

The system SHALL define an `ErrorResponse` Pydantic model with fields `code: str`, `message: str`, `retryable: bool`. All `HTTPException` details MUST use `ErrorResponse(...).model_dump()`. String constants for all 10 error codes MUST be defined in `app/schemas/errors.py`.

#### Scenario: Error response matches standard shape
- **WHEN** any endpoint returns a 4xx or 5xx response
- **THEN** the response body is `{ "code": "<ERROR_CODE>", "message": "...", "retryable": true|false }`

#### Scenario: All 10 error codes are defined as constants
- **WHEN** `app/schemas/errors.py` is imported
- **THEN** the following constants exist: `INVALID_IMAGE`, `INVALID_DEVICE_ID`, `INVALID_REQUEST`, `OCR_NO_FORMULA`, `HISTORY_NOT_FOUND`, `RATE_LIMITED`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `LLM_CONTENT_POLICY`, `INTERNAL_ERROR`

---

### Requirement: OCR schemas define formula response shape

The system SHALL define `OcrFormula(latex: str, confidence: float)` and `OcrResponse(formulas: list[OcrFormula])` in `app/schemas/ocr.py`.

#### Scenario: OcrResponse serializes to expected JSON
- **WHEN** an `OcrResponse` is serialized
- **THEN** JSON is `{ "formulas": [{ "latex": "...", "confidence": 1.0 }] }`

---

### Requirement: Solution schemas use snake_case without alias

The system SHALL define `SolutionStep` and `Solution` in `app/schemas/solution.py` with no `alias_generator`. Fields: `SolutionStep(index: int, title: str, explanation: str, formula: str | None, is_answer: bool)`, `Solution(steps: list[SolutionStep])`. Both MUST use plain snake_case.

#### Scenario: Solution schema passes to with_structured_output without camelCase
- **WHEN** `ChatOpenAI.with_structured_output(Solution)` is called
- **THEN** the JSON schema passed to OpenAI uses snake_case keys (`is_answer`, `solution_steps`), not camelCase

---

### Requirement: HistoryItem schema uses camelCase alias for HTTP responses

The system SHALL define `HistoryItem` in `app/schemas/history.py` with `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)`. Internal code uses snake_case attributes; HTTP responses serialize to camelCase.

#### Scenario: HistoryItem serializes to camelCase JSON
- **WHEN** a `HistoryItem` is returned from any endpoint
- **THEN** JSON keys are `deviceId`, `solutionSteps`, `isBookmarked`, `createdAt`

#### Scenario: HistoryItem can be constructed with snake_case
- **WHEN** `HistoryItem(device_id=..., solution_steps=...)` is used internally
- **THEN** construction succeeds without validation error

---

### Requirement: TypeScript types mirror Pydantic schemas

The system SHALL define `SolutionStep` and `HistoryItem` interfaces in `src/client/types/history.ts` using camelCase keys matching the HTTP response shape from SYSTEM_DESIGN §3.7.

#### Scenario: TypeScript types match API response shape
- **WHEN** `src/client/types/history.ts` is imported
- **THEN** `HistoryItem` has fields: `id: string`, `deviceId: string`, `latex: string`, `solutionSteps: SolutionStep[]`, `language: 'vi' | 'en'`, `createdAt: string`, `isBookmarked: boolean`

---

### Requirement: Client fixtures provide typed sample data

The system SHALL define `MOCK_HISTORY: HistoryItem[]` exported from `src/client/fixtures/history.ts` with at least 5 diverse sample items including: 1 bookmarked item, 1 item with multiple solution steps, 1 item with `formula: undefined` in a step, 1 English-language item, 1 Vietnamese-language item.

#### Scenario: Fixtures are importable without runtime errors
- **WHEN** `import { MOCK_HISTORY } from '@/fixtures/history'` is used in a component
- **THEN** import succeeds and `MOCK_HISTORY.length >= 5`
