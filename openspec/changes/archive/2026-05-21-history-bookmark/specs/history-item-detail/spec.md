## ADDED Requirements

### Requirement: History detail page fetches and renders stored solution

The system SHALL provide `app/(main)/history/[id]/page.tsx` that on mount reads `params.id` and calls `getHistoryItem(id, deviceId)` from `api.ts`. The page MUST NOT call `/api/solve`. On success, it MUST render the stored `solutionSteps` using the same `StepCard` component from `solve/page.tsx`. The page MUST show a loading skeleton while fetching. On `404` it MUST redirect to `/history`.

#### Scenario: Renders stored solution steps from DB
- **WHEN** `getHistoryItem` resolves with a HistoryItem
- **THEN** one StepCard is rendered per entry in `solutionSteps` without calling `/api/solve`

#### Scenario: Loading skeleton shown during fetch
- **WHEN** `getHistoryItem` is in-flight
- **THEN** skeleton placeholder elements are rendered

#### Scenario: 404 redirects to history list
- **WHEN** `getHistoryItem` throws a 404 ApiError
- **THEN** the router replaces to `/history`

#### Scenario: Problem statement bar shows stored LaTeX
- **WHEN** the page is in success state
- **THEN** a KaTeXRenderer displaying `item.latex` is rendered below the header

---

### Requirement: History detail page shows functional bookmark toggle

The history detail page MUST initialize `isBookmarked` state from `item.isBookmarked`. The bottom action bar MUST render a Bookmark button and a "Bài mới" CTA. Tapping Bookmark MUST call `toggleBookmark(id, deviceId, !isBookmarked)` and optimistically update the visual state using the same styles as the solve page (filled+green when true, outlined when false).

#### Scenario: Bookmark state initialized from stored item
- **WHEN** `getHistoryItem` resolves with `isBookmarked: true`
- **THEN** the Bookmark button renders in filled state immediately without user interaction

#### Scenario: Tapping bookmark toggles and calls API
- **WHEN** the user taps the Bookmark button
- **THEN** `toggleBookmark(id, deviceId, !currentIsBookmarked)` is called and visual state flips

#### Scenario: Bài mới navigates to home
- **WHEN** the user taps "Bài mới"
- **THEN** the router navigates to `/`
