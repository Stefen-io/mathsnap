## ADDED Requirements

### Requirement: useOnboarding exposes a replay action to re-show the overlay

The `useOnboarding()` hook MUST expose a `replayOnboarding()` (replay) action that re-shows the onboarding overlay on demand, so an already-onboarded user can review the walkthrough again from Settings. Calling it MUST set `hasSeenOnboarding` back to `false` (causing the root-mounted `OnboardingOverlay` to render again from step 1). Completing or skipping the replayed walkthrough MUST call `markAsSeen()` as usual, restoring `hasSeenOnboarding` to `true` and `localStorage['mathsnap.onboarding.seen'] = "true"`.

#### Scenario: replayOnboarding re-shows the overlay for a returning user
- **WHEN** `hasSeenOnboarding` is `true` and `replayOnboarding()` is called
- **THEN** `hasSeenOnboarding` becomes `false` and the `OnboardingOverlay` renders again starting at step 1

#### Scenario: Completing the replayed walkthrough re-marks it seen
- **WHEN** the user finishes (or skips) the replayed overlay and `markAsSeen()` is invoked
- **THEN** `hasSeenOnboarding` is `true` again and `localStorage['mathsnap.onboarding.seen']` equals `"true"`
