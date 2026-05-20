# Spec: solution-viewer

## Purpose

Defines the solve page (`app/solve/page.tsx`) — a flat Client Component route outside the `(main)` layout. Covers the guard on `ocrLatex`, the `POST /api/solve` call, loading skeleton, the step accordion UI with answer highlighting, bottom action bar, and error handling with optional retry.

## Requirements

### Requirement: Solve page guards on ocrLatex and fires POST /api/solve on mount

The system SHALL provide `app/solve/page.tsx` as a flat Client Component route
outside the `(main)` layout. On mount it MUST read `ocrLatex` from `CaptureContext`;
if `null`, it MUST call `router.replace('/camera')`. Once `deviceId` from
`useDeviceId` is non-null, it MUST call `postSolve(ocrLatex, deviceId)` and enter a
`loading` state.

#### Scenario: Null ocrLatex redirects to camera
- **WHEN** `/solve` is mounted with `CaptureContext.ocrLatex === null`
- **THEN** the router replaces to `/camera`

#### Scenario: postSolve is fired after deviceId is ready
- **WHEN** `deviceId` becomes non-null and `ocrLatex` is set
- **THEN** `postSolve(ocrLatex, deviceId)` is called exactly once

---

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

On `postSolve` success, the solve page MUST render a sticky header "Lời giải", a
problem statement bar showing `ocrLatex` via `KaTeXRenderer`, and a scrollable list
of `StepCard` components for each `SolutionStep`. Each `StepCard` MUST be
independently expandable (tap header to toggle). There MUST be no locked state — all
steps are openable freely in any order.

#### Scenario: Solution steps rendered after success
- **WHEN** `postSolve` resolves with a HistoryItem
- **THEN** one StepCard is rendered per entry in `solutionSteps`

#### Scenario: Each step card independently toggles open and closed
- **WHEN** the user taps a step card header
- **THEN** the step body expands; tapping again collapses it; other cards are unaffected

#### Scenario: Problem statement bar shows ocrLatex
- **WHEN** the S-07 success state is active
- **THEN** a KaTeXRenderer displaying `ocrLatex` is rendered below the header

---

### Requirement: Answer step has distinct green styling and large formula display

A `SolutionStep` with `isAnswer === true` MUST render its card with a
`border-l-4 border-[#18E299]` left accent, a green "Đáp án" badge (replacing the
"Bước N" badge), and the `formula` field rendered at large size (`text-[40px]`
font-serif italic) when expanded.

#### Scenario: Answer step has green left border
- **WHEN** a StepCard is rendered with `step.isAnswer === true`
- **THEN** the card element has the class `border-l-4` and `border-[#18E299]`

#### Scenario: Answer badge shown instead of step number
- **WHEN** a StepCard has `isAnswer === true`
- **THEN** the badge reads "Đáp án" (not "Bước N")

#### Scenario: Answer formula is displayed at large size
- **WHEN** an answer StepCard is expanded and has a non-null `formula`
- **THEN** the formula is rendered at `text-[40px]` using KaTeXRenderer

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

### Requirement: Bottom action bar has stubbed Bookmark button and Bài mới CTA

The solve page MUST render a fixed bottom bar with a Bookmark icon button and a
"Bài mới" pill button. Tapping "Bài mới" MUST call `reset()` on CaptureContext and
navigate to `/`. The Bookmark button MUST render visually but its `onClick` MUST be
a no-op (bookmark persistence is G6 scope).

#### Scenario: Bài mới resets context and navigates home
- **WHEN** the user taps "Bài mới"
- **THEN** `reset()` is called and the router navigates to `/`

#### Scenario: Bookmark button is present but does nothing
- **WHEN** the user taps the Bookmark button
- **THEN** no error is thrown and no navigation occurs

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
