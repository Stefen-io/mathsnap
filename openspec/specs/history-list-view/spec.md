# Spec: history-list-view

## Purpose

TBD — Defines the History list page that fetches and displays HistoryItems, supports swipe-to-delete on mobile, hover-reveal delete on desktop, and inline bookmark toggle on each item card.

## Requirements

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

---

### Requirement: History list supports swipe-to-delete on mobile

Each history item card MUST support swipe-left gesture via `motion/react` drag. Dragging left more than 40px MUST reveal a red delete background with a Trash icon and snap the card to `x: -80`. Releasing before 40px MUST snap the card back to `x: 0`. Tapping the revealed trash button MUST call `deleteHistoryItem(id, deviceId)` and remove the item from the list. On desktop (≥ 1024px), drag MUST be disabled; a hover-reveal delete button MUST appear instead.

#### Scenario: Swipe > 40px reveals delete action
- **WHEN** user drags a history card left more than 40px and releases
- **THEN** the card snaps to `x: -80` revealing the red trash button

#### Scenario: Swipe < 40px snaps back
- **WHEN** user drags a history card left less than 40px and releases
- **THEN** the card snaps back to `x: 0` and no delete action is revealed

#### Scenario: Tapping trash removes item
- **WHEN** user taps the revealed trash button
- **THEN** `deleteHistoryItem(id, deviceId)` is called and the item exits the list with `AnimatePresence`

#### Scenario: Desktop shows hover-reveal delete button
- **WHEN** viewport width ≥ 1024px and user hovers over an item card
- **THEN** a trash icon button becomes visible (no drag gesture)

---

### Requirement: History list supports inline bookmark toggle

Each history item card MUST render a Bookmark icon button. Tapping it MUST call `toggleBookmark(id, deviceId, !item.isBookmarked)` and update the item's visual state optimistically. When `isBookmarked` is true the icon MUST render `fill="#18E299" color="#18E299"`; when false, `fill="none" color="#666666"`.

#### Scenario: Bookmarked item shows filled icon
- **WHEN** a history item has `isBookmarked: true`
- **THEN** its Bookmark icon renders with `fill="#18E299"`

#### Scenario: Tapping bookmark toggles state
- **WHEN** the user taps the Bookmark icon on an unbookmarked item
- **THEN** `toggleBookmark(id, deviceId, true)` is called and the icon updates to filled state
