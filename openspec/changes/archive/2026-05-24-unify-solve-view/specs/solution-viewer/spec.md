## ADDED Requirements

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

## MODIFIED Requirements

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
