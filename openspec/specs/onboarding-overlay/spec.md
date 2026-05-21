# Spec: onboarding-overlay

## Purpose

Defines the one-time full-screen onboarding overlay shown to first-time users on any route. Covers the 3-step walkthrough UI (`OnboardingOverlay`, `OnboardingStep`, `PaginationDots`), the `useOnboarding()` hook backed by `localStorage`, and the SSR-safe initialization pattern that prevents hydration mismatches in Next.js.

## Requirements

### Requirement: First-time users SHALL see a full-screen onboarding overlay on app launch

The system MUST provide an `OnboardingOverlay` component rendered inside `app/layout.tsx`,
above all page content, that is visible the first time a user opens the app on any route.
The overlay MUST use `fixed inset-0 z-[60] bg-white` styling to cover all underlying content.
It MUST read its shown/hidden state from a `useOnboarding()` hook backed by
`localStorage.getItem('mathsnap.onboarding.seen')`. If the key is present with value `"true"`,
the overlay MUST NOT render (return null).

#### Scenario: Overlay visible on first launch (no localStorage key)
- **WHEN** the user opens the app for the first time and `localStorage['mathsnap.onboarding.seen']` is absent
- **THEN** the `OnboardingOverlay` is rendered and covers the full viewport

#### Scenario: Overlay hidden for returning users
- **WHEN** `localStorage['mathsnap.onboarding.seen']` equals `"true"`
- **THEN** `OnboardingOverlay` returns null and no overlay content is rendered

#### Scenario: Overlay shown on any entry route, not just home
- **WHEN** a first-time user navigates directly to `/history` or `/solve`
- **THEN** the overlay still appears (it is in root layout, not page-specific)

---

### Requirement: The onboarding overlay MUST present exactly 3 steps in sequence

The overlay MUST show one step at a time. Steps are:
- Step 1: "Chụp ảnh bài toán" — Camera icon with mint halo, description of photo capture.
- Step 2: "Nhận diện công thức" — Decorative pill rows (opened row with `#d4fae8` bg, locked row with Lock icon, answer-hint row with CheckCircle2 icon), description of OCR recognition.
- Step 3: "Xem lời giải từng bước" — Bookmark icon with mint halo, description of step-by-step solution.

Each step MUST display `PaginationDots` showing current progress (active dot `bg-[#0d0d0d]`,
inactive dots `bg-transparent border border-[rgba(0,0,0,0.1)]`).

#### Scenario: Step 1 is shown first
- **WHEN** the overlay is first rendered
- **THEN** step content "Chụp ảnh bài toán" is visible and pagination dot 1 of 3 is active

#### Scenario: PaginationDots reflects current step
- **WHEN** the user is on step 2 of 3
- **THEN** the second pagination dot is active (filled dark) and dots 1 and 3 are inactive (outlined)

---

### Requirement: Navigation buttons MUST advance steps and dismiss the overlay

The overlay MUST render:
- A "Bỏ qua" text-only button (`text-[14px] text-[#888888] font-medium`) on steps 1 and 2. Tapping it MUST call `markAsSeen()` immediately (dismisses overlay, sets localStorage).
- A "Tiếp" primary dark pill button on steps 1 and 2. Tapping it MUST advance to the next step.
- On step 3, "Bỏ qua" MUST NOT be shown. A "Bắt đầu" primary dark pill button MUST be shown. Tapping it MUST call `markAsSeen()`.
- Both "Bỏ qua" and "Bắt đầu" MUST set `localStorage['mathsnap.onboarding.seen'] = "true"`.

#### Scenario: Tiếp advances from step 1 to step 2
- **WHEN** the user taps "Tiếp" on step 1
- **THEN** step 2 content is shown and the second pagination dot becomes active

#### Scenario: Bỏ qua on step 1 sets flag and dismisses overlay
- **WHEN** the user taps "Bỏ qua" on step 1
- **THEN** `localStorage['mathsnap.onboarding.seen']` is set to `"true"` and the overlay disappears

#### Scenario: Bắt đầu on step 3 sets flag and dismisses overlay
- **WHEN** the user taps "Bắt đầu" on step 3
- **THEN** `localStorage['mathsnap.onboarding.seen']` is set to `"true"` and the overlay disappears

#### Scenario: Bỏ qua not shown on step 3
- **WHEN** step 3 is active
- **THEN** no "Bỏ qua" button is rendered

---

### Requirement: `useOnboarding()` hook MUST be SSR-safe

The `OnboardingContext` and `useOnboarding()` hook MUST initialize `hasSeenOnboarding`
to `false` on the server (no localStorage access during SSR). It MUST read
`localStorage.getItem('mathsnap.onboarding.seen')` only inside a `useEffect` on the client,
then update state. This prevents hydration mismatches.

#### Scenario: No localStorage access during server render
- **WHEN** the component tree is rendered on the server
- **THEN** `hasSeenOnboarding` is `false` and no `localStorage` call occurs

#### Scenario: State corrected after client mount for returning users
- **WHEN** `useEffect` fires on a client where `mathsnap.onboarding.seen` equals `"true"`
- **THEN** `hasSeenOnboarding` is updated to `true` and the overlay unmounts
