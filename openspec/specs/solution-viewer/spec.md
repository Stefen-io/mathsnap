# Spec: solution-viewer

## Purpose

Defines the solve page (`app/solve/page.tsx`) — a flat Client Component route outside the `(main)` layout. Covers dual-mode operation (SOLVE mode for new solutions, VIEW mode for stored solutions), the guard on `ocrLatex`, the `POST /api/solve` call, loading skeleton, the step accordion UI with answer highlighting, bottom action bar, and error handling with optional retry.

## Requirements

### Requirement: Solve page guards on ocrLatex and fires POST /api/solve on mount

The system SHALL provide `app/solve/page.tsx` as a flat Client Component route outside the
`(main)` layout. On mount it MUST determine its mode from `useSearchParams().get('id')`
(read as `viewId`).

In **SOLVE mode** (`viewId` is null/absent): it MUST read `ocrLatex` from `CaptureContext`;
if `null`, it MUST call `router.replace('/camera')`. Once `deviceId` from `useDeviceId` is
non-null and `ocrLatex` is set, it MUST call `postSolve(ocrLatex, deviceId)` exactly once
per component mount — including when React StrictMode fires the triggering effect twice in
development.

In **VIEW mode** (`viewId` is a non-empty string): it MUST NOT call `router.replace('/camera')`
even when `ocrLatex` is null, MUST NOT call `postSolve`, and once `deviceId` is non-null it
MUST call `getHistoryItem(viewId, deviceId)` exactly once per component mount. On a thrown
`ApiError` it MUST call `router.replace('/history')`.

Subsequent effect re-runs due to StrictMode MUST NOT issue a second request in either mode.

#### Scenario: Null ocrLatex redirects to camera in SOLVE mode
- **WHEN** `/solve` is mounted with no `id` param and `CaptureContext.ocrLatex === null`
- **THEN** the router replaces to `/camera`

#### Scenario: postSolve is fired after deviceId is ready in SOLVE mode
- **WHEN** no `id` param is present, `deviceId` becomes non-null, and `ocrLatex` is set
- **THEN** `postSolve(ocrLatex, deviceId)` is called exactly once

#### Scenario: VIEW mode does not redirect to camera when ocrLatex is null
- **WHEN** `/solve?id={itemId}` is mounted with `CaptureContext.ocrLatex === null`
- **THEN** the router does NOT replace to `/camera`

#### Scenario: VIEW mode fetches by id and does not call postSolve
- **WHEN** `viewId` is present and `deviceId` becomes non-null
- **THEN** `getHistoryItem(viewId, deviceId)` is called exactly once and `postSolve` is not called

#### Scenario: VIEW mode redirects to history on fetch error
- **WHEN** `getHistoryItem` throws an `ApiError`
- **THEN** the router replaces to `/history`

#### Scenario: StrictMode double-effect does not produce a second request
- **WHEN** React StrictMode fires the mount effect twice in development
- **THEN** the active mode's request (`postSolve` or `getHistoryItem`) is invoked only once

### Requirement: S-06 loading state renders skeleton and animated label

While `postSolve` is in-flight the solve page MUST render 3 pulsing skeleton rows
and a label in Geist Mono uppercase that reads "Đang phân tích bài toán" with a
blinking underscore cursor. The page MUST be full-screen white with no BottomNav
(flat route, not inside `(main)` layout).

#### Scenario: Loading skeleton rows displayed during API call
- **WHEN** `postSolve` is in-flight
- **THEN** 3 pulsing skeleton rows are rendered

#### Scenario: Animated label present during loading
- **WHEN** the loading state is active
- **THEN** an element containing "Đang phân tích bài toán" is visible

#### Scenario: No BottomNav rendered on solve page
- **WHEN** `/solve` is rendered
- **THEN** no BottomNav component is present in the DOM

---

### Requirement: S-07 solution detail renders steps as an all-open accordion

The solve page MUST, on success (`postSolve` in SOLVE mode or `getHistoryItem` in VIEW
mode), render a sticky header "Lời giải", a problem statement bar showing the active problem
LaTeX via `KaTeXRenderer`, and a scrollable list of `StepCard` components for each
`SolutionStep`. The displayed LaTeX MUST be `ocrLatex` in SOLVE mode and the fetched
`item.latex` in VIEW mode. Each `StepCard` MUST be independently expandable (tap header to
toggle). There MUST be no locked state — all steps are openable freely in any order.

#### Scenario: Solution steps rendered after success
- **WHEN** the active request resolves with a HistoryItem
- **THEN** one StepCard is rendered per entry in `solutionSteps`

#### Scenario: Each step card independently toggles open and closed
- **WHEN** the user taps a step card header
- **THEN** the step body expands; tapping again collapses it; other cards are unaffected

#### Scenario: Problem statement bar shows the active LaTeX
- **WHEN** the success state is active
- **THEN** a KaTeXRenderer displays `ocrLatex` in SOLVE mode or the fetched `item.latex` in VIEW mode

---

### Requirement: Answer step has distinct green styling and large formula display

A `SolutionStep` with `isAnswer === true` MUST render its card with a
`border-l-4 border-[#18E299]` left accent, a green "Đáp án" badge (replacing the
"Bước N" badge), and the `formula` field rendered at a large size when expanded. The large
size MUST scale responsively via a CSS `clamp` (e.g. `clamp(1.5rem, 7vw, 2.5rem)`) so the
formula shrinks on narrow screens instead of overflowing.

#### Scenario: Answer step has green left border
- **WHEN** a StepCard is rendered with `step.isAnswer === true`
- **THEN** the card element has the class `border-l-4` and `border-[#18E299]`

#### Scenario: Answer badge shown instead of step number
- **WHEN** a StepCard has `isAnswer === true`
- **THEN** the badge reads "Đáp án" (not "Bước N")

#### Scenario: Answer formula is displayed at a responsive large size
- **WHEN** an answer StepCard is expanded and has a non-null `formula`
- **THEN** the formula is rendered via KaTeXRenderer at a `clamp`-based size that does not exceed 2.5rem and does not go below 1.5rem

---

### Requirement: Solve page wraps the search-param consumer in a Suspense boundary

The `app/solve/page.tsx` default export MUST render the component that calls
`useSearchParams()` inside a React `<Suspense>` boundary, so that `next build` does not
fail with a missing-suspense client-side-rendering bailout. The Suspense `fallback` MUST
render the loading skeleton UI.

#### Scenario: Production build succeeds without suspense deopt
- **WHEN** `next build` is run
- **THEN** it completes without a `useSearchParams` missing-suspense / deopt error

#### Scenario: Suspense fallback renders the skeleton
- **WHEN** the search-param consumer suspends during render
- **THEN** the loading skeleton UI is shown as the Suspense fallback

---

### Requirement: StepCard is responsive on small screens

`StepCard` MUST reduce the font size of its step title and explanation text on viewports
≤480px. The formula container MUST apply `overflow-x: auto` so a wide KaTeX formula
scrolls horizontally instead of overflowing the card. When a formula overflows, the
container MUST NOT force horizontal centering that would clip both ends of the formula.

#### Scenario: Wide formula scrolls horizontally
- **WHEN** a StepCard renders a formula wider than its container
- **THEN** the formula container is horizontally scrollable via `overflow-x: auto` rather than overflowing the card

#### Scenario: Text shrinks at ≤480px
- **WHEN** the viewport width is ≤480px
- **THEN** the step title and explanation render at a reduced font size relative to the default

---

### Requirement: Step accordion uses motion/react AnimatePresence for height animation

Each StepCard body MUST animate open and closed using `AnimatePresence` and
`motion.div` from `motion/react` with `initial={{ height: 0, opacity: 0 }}`,
`animate={{ height: "auto", opacity: 1 }}`, and `exit={{ height: 0, opacity: 0 }}`.
The card wrapper MUST apply `overflow: hidden` during transition.

#### Scenario: Step body animates to height auto when opened
- **WHEN** a StepCard transitions from closed to open
- **THEN** the body element animates from `height: 0` to `height: auto`

---

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

---

### Requirement: Error state shows Sonner toast and inline retry for retryable errors

If `postSolve` throws an `ApiError`, the solve page MUST display the error message
via `toast.error(error.message)` (Sonner). It MUST render an inline error card. If
`error.retryable === true`, the card MUST include a "Thử lại" button that re-fires
`postSolve(ocrLatex, deviceId)`.

#### Scenario: Error toast shown on API failure
- **WHEN** `postSolve` throws an ApiError
- **THEN** `toast.error` is called with the error message

#### Scenario: Retry button present for retryable errors
- **WHEN** the error state is active and `error.retryable === true`
- **THEN** a "Thử lại" button is rendered in the error card

#### Scenario: No retry button for non-retryable errors
- **WHEN** the error state is active and `error.retryable === false`
- **THEN** no "Thử lại" button is rendered

