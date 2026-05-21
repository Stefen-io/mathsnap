## ADDED Requirements

### Requirement: Bookmarks page fetches and displays bookmarked HistoryItems

The system SHALL provide `app/(main)/bookmarks/page.tsx` that on mount calls `getHistory(deviceId, { page: 1, limit: 20, bookmarked: true })` and renders the result. The page MUST display an empty state when `items.length === 0`. All items in this list are guaranteed to have `isBookmarked: true`.

#### Scenario: Bookmarked items rendered after successful fetch
- **WHEN** `getHistory` with `bookmarked: true` resolves with items
- **THEN** one card is rendered per item showing the LaTeX formula and formatted date

#### Scenario: Empty state shown when no bookmarks
- **WHEN** `getHistory` resolves with `{ items: [], total: 0 }`
- **THEN** the empty state message "Chưa có bài nào được lưu" is rendered

#### Scenario: Tapping an item navigates to history detail
- **WHEN** the user taps a bookmark item card
- **THEN** the router navigates to `/history/{item.id}`

---

### Requirement: Bookmarks list supports swipe-to-remove-bookmark on mobile

Each bookmark item card MUST support swipe-left gesture (same pattern as history-list-view). Tapping the revealed action MUST call `toggleBookmark(id, deviceId, false)` and remove the item from the list (since it is no longer bookmarked). On desktop (≥ 1024px) a hover-reveal remove button MUST appear instead.

#### Scenario: Swipe > 40px reveals remove action
- **WHEN** user drags a bookmark card left more than 40px and releases
- **THEN** the card snaps to `x: -80` revealing the removal button

#### Scenario: Tapping remove calls toggleBookmark false and removes card
- **WHEN** user taps the revealed action button
- **THEN** `toggleBookmark(id, deviceId, false)` is called and the item exits the list
