## ADDED Requirements

### Requirement: History detail renders all steps expanded

The history detail page (`app/(main)/history/[id]/page.tsx`) MUST render the stored solution with every `StepCard` initialised to the expanded (open) state, so a user arriving from the History or Bookmark list sees the full solution without tapping each step. This mirrors the S-07 all-open accordion behaviour of the live solve page (`solution-viewer`).

#### Scenario: All stored steps start expanded
- **WHEN** `getHistoryItem` resolves with a HistoryItem containing N `solutionSteps`
- **THEN** all N `StepCard`s render in the expanded state on first paint, with no step collapsed by default

#### Scenario: Steps remain individually collapsible
- **WHEN** the user taps an expanded step header on the history detail page
- **THEN** that step collapses while the other steps are unaffected
