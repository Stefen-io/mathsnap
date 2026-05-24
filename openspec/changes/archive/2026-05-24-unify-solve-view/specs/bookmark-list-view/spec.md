## MODIFIED Requirements

### Requirement: Bookmarks page fetches and displays bookmarked HistoryItems

The system SHALL provide `app/(main)/bookmarks/page.tsx` that on mount calls
`getHistory(deviceId, { page: 1, limit: 20, bookmarked: true })` and renders the result.
The page MUST display an empty state when `items.length === 0`. All items in this list are
guaranteed to have `isBookmarked: true`. Tapping an item card MUST navigate to the unified
solve page in view mode at `/solve?id={item.id}` (not to a standalone history detail route).

#### Scenario: Bookmarked items rendered after successful fetch
- **WHEN** `getHistory` with `bookmarked: true` resolves with items
- **THEN** one card is rendered per item showing the LaTeX formula and formatted date

#### Scenario: Empty state shown when no bookmarks
- **WHEN** `getHistory` resolves with `{ items: [], total: 0 }`
- **THEN** the empty state message "Chưa có bài nào được lưu" is rendered

#### Scenario: Tapping an item navigates to the unified solve view
- **WHEN** the user taps a bookmark item card (without an active swipe drag)
- **THEN** the router navigates to `/solve?id={item.id}`
