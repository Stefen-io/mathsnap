## MODIFIED Requirements

### Requirement: History bookmark toggle updates is_bookmarked

The system SHALL expose `PATCH /api/history/{id}/bookmark` that accepts a JSON body `{ "isBookmarked": bool }` and sets the `is_bookmarked` field to the provided value, returning the updated `HistoryItem`. The endpoint MUST be idempotent: calling with the same value multiple times MUST produce the same result.

#### Scenario: Explicit true sets is_bookmarked to true
- **WHEN** client sends `PATCH /api/history/{id}/bookmark` with body `{ "isBookmarked": true }` on an item with `is_bookmarked: false`
- **THEN** server sets `is_bookmarked` to `true` and returns `200` with updated `HistoryItem`

#### Scenario: Explicit false sets is_bookmarked to false
- **WHEN** client sends `PATCH /api/history/{id}/bookmark` with body `{ "isBookmarked": false }` on an item with `is_bookmarked: true`
- **THEN** server sets `is_bookmarked` to `false` and returns `200` with updated `HistoryItem`

#### Scenario: Idempotent — repeated true calls return same result
- **WHEN** client sends `PATCH /api/history/{id}/bookmark` with `{ "isBookmarked": true }` twice in sequence
- **THEN** both responses return `200` with `isBookmarked: true`; state does not flip back to false

#### Scenario: Missing or invalid body returns 400
- **WHEN** client sends `PATCH /api/history/{id}/bookmark` with no body or missing `isBookmarked` field
- **THEN** server returns `400 { "code": "INVALID_REQUEST", "retryable": false }`

#### Scenario: Bookmark of non-owned item returns 404
- **WHEN** client sends `PATCH /api/history/{id}/bookmark` for an item belonging to another device
- **THEN** server returns `404 { "code": "HISTORY_NOT_FOUND", "retryable": false }`
