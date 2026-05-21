## ADDED Requirements

### Requirement: History list endpoint returns paginated items

The system SHALL expose `GET /api/history` with query params `page` (default 1), `limit` (default 20, max 50), and optional `bookmarked` boolean filter. All results MUST be scoped to the `X-Device-ID` header value.

#### Scenario: Returns list of HistoryItems for device
- **WHEN** client sends `GET /api/history` with valid `X-Device-ID`
- **THEN** server returns `200 { "items": [...], "total": N, "page": 1, "limit": 20 }` with items belonging only to that device

#### Scenario: Bookmarked filter returns only bookmarked items
- **WHEN** client sends `GET /api/history?bookmarked=true`
- **THEN** server returns only items where `is_bookmarked = true` for that device

#### Scenario: Empty history returns empty array
- **WHEN** device has no history items
- **THEN** server returns `200 { "items": [], "total": 0, "page": 1, "limit": 20 }`

#### Scenario: solutionSteps returned in full
- **WHEN** items are returned in the list
- **THEN** each item includes full `solutionSteps` array (backend does NOT filter steps)

---

### Requirement: History detail endpoint returns single item

The system SHALL expose `GET /api/history/{id}` returning the full `HistoryItem` for the given `id`, scoped to the `X-Device-ID` header.

#### Scenario: Returns HistoryItem for matching id and device
- **WHEN** client sends `GET /api/history/{id}` with valid `X-Device-ID` matching the item's `device_id`
- **THEN** server returns `200` with full `HistoryItem`

#### Scenario: Returns 404 for id belonging to different device
- **WHEN** client requests an `id` that exists but belongs to a different `device_id`
- **THEN** server returns `404 { "code": "HISTORY_NOT_FOUND", "retryable": false }`

#### Scenario: Returns 404 for non-existent id
- **WHEN** client requests an `id` that does not exist in `history_items`
- **THEN** server returns `404 { "code": "HISTORY_NOT_FOUND", "retryable": false }`

---

### Requirement: History delete endpoint removes an item

The system SHALL expose `DELETE /api/history/{id}` removing the item scoped to the `X-Device-ID` header, returning `204 No Content`.

#### Scenario: Successful delete returns 204
- **WHEN** client sends `DELETE /api/history/{id}` with matching device ownership
- **THEN** server returns `204` with no response body and item is removed from `history_items`

#### Scenario: Delete of non-existent or foreign-device item returns 404
- **WHEN** client sends `DELETE /api/history/{id}` for an item that does not belong to this device
- **THEN** server returns `404 { "code": "HISTORY_NOT_FOUND", "retryable": false }`

---

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
