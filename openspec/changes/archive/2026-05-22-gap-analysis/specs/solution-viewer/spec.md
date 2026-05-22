## MODIFIED Requirements

### Requirement: S-07 solution detail renders steps as an all-open accordion

On `postSolve` success, the solve page MUST render a sticky header "Lời giải", a
problem statement bar showing `ocrLatex` via `KaTeXRenderer`, and a scrollable list
of `StepCard` components for each `SolutionStep`. All `StepCard`s MUST start in the
expanded (open) state on the first render of the success state. Each `StepCard` MUST
be independently expandable (tap header to toggle). There MUST be no locked state —
all steps are openable freely in any order.

#### Scenario: Solution steps rendered after success
- **WHEN** `postSolve` resolves with a HistoryItem
- **THEN** one StepCard is rendered per entry in `solutionSteps`

#### Scenario: All steps start expanded on success
- **WHEN** the S-07 success state first renders with N `solutionSteps`
- **THEN** all N StepCards are in the expanded (open) state, with no step collapsed by default

#### Scenario: Each step card independently toggles open and closed
- **WHEN** the user taps a step card header
- **THEN** the step body expands; tapping again collapses it; other cards are unaffected

#### Scenario: Problem statement bar shows ocrLatex
- **WHEN** the S-07 success state is active
- **THEN** a KaTeXRenderer displaying `ocrLatex` is rendered below the header
