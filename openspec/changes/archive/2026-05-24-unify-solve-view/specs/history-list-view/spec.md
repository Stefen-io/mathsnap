## MODIFIED Requirements

### Requirement: History list page fetches and displays HistoryItems

The system SHALL provide `app/(main)/history/page.tsx` that on mount calls
`getHistory(deviceId, { page: 1, limit: 20 })` from `api.ts` and renders the result. While
loading, a skeleton MUST be shown. On success, items MUST be rendered newest-first. The
page MUST display an empty state when `items.length === 0`. Tapping an item card MUST
navigate to the unified solve page in view mode at `/solve?id={item.id}` (not to a
standalone history detail route).

#### Scenario: History items rendered after successful fetch
- **WHEN** `getHistory` resolves with items
- **THEN** one card is rendered per item showing the LaTeX formula and formatted date

#### Scenario: Empty state shown when no history
- **WHEN** `getHistory` resolves with `{ items: [], total: 0 }`
- **THEN** the empty state message "Chưa có bài giải nào" is rendered

#### Scenario: Loading skeleton shown during fetch
- **WHEN** `getHistory` is in-flight
- **THEN** skeleton placeholder elements are rendered instead of item cards

#### Scenario: Tapping an item navigates to the unified solve view
- **WHEN** the user taps a history item card (without an active swipe drag)
- **THEN** the router navigates to `/solve?id={item.id}`
