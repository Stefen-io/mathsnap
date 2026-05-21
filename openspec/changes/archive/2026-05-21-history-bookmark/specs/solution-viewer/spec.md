## MODIFIED Requirements

### Requirement: Bottom action bar has functional Bookmark button and Bài mới CTA

The solve page MUST render a fixed bottom bar with a Bookmark icon button and a "Bài mới" pill button. On `postSolve` success, the page MUST store `result.id` and `result.isBookmarked` in local state. Tapping the Bookmark button MUST call `toggleBookmark(historyItemId, deviceId, !isBookmarked)` from `api.ts` and optimistically toggle the visual state. When `isBookmarked` is true the button MUST render with `bg-[#d4fae8] text-[#0fa76e]` and `fill="currentColor"`; when false it MUST render with `border border-black/5 text-[#0d0d0d]` and `fill="none"`. Tapping "Bài mới" MUST call `reset()` on CaptureContext and navigate to `/`.

#### Scenario: Bookmark button shows filled state when bookmarked
- **WHEN** `isBookmarked` state is `true`
- **THEN** the bookmark button renders with `bg-[#d4fae8]` background and the Bookmark icon has `fill="currentColor"`

#### Scenario: Bookmark button shows outlined state when not bookmarked
- **WHEN** `isBookmarked` state is `false`
- **THEN** the bookmark button renders with `border border-black/5` and Bookmark icon has `fill="none"`

#### Scenario: Tapping bookmark calls toggleBookmark and flips state
- **WHEN** the user taps the Bookmark button with `isBookmarked: false`
- **THEN** `toggleBookmark(historyItemId, deviceId, true)` is called and `isBookmarked` becomes `true`

#### Scenario: Bài mới resets context and navigates home
- **WHEN** the user taps "Bài mới"
- **THEN** `reset()` is called and the router navigates to `/`
