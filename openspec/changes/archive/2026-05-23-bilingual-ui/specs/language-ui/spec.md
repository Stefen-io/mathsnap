## ADDED Requirements

### Requirement: Language Context Provider

The app SHALL provide a `LanguageProvider` React context at the root layout (`app/layout.tsx`) that exposes the current language (`'vi'` | `'en'`) and a setter to all descendant components. The provider MUST initialize with `'vi'` as the SSR-safe default and read `localStorage.getItem('mathsnap_language')` in a `useEffect` after hydration to avoid hydration mismatches.

#### Scenario: Initial load with no localStorage value
- **WHEN** a user opens the app for the first time with no `mathsnap_language` key in localStorage
- **THEN** all UI text is rendered in Vietnamese

#### Scenario: Initial load with language set to English
- **WHEN** a user opens the app and `localStorage.getItem('mathsnap_language')` returns `'en'`
- **THEN** all UI text is rendered in English after client hydration

#### Scenario: Language context available in solve page
- **WHEN** `app/solve/page.tsx` calls `useLanguage()`
- **THEN** it receives the current language without error (provider covers routes outside `(main)/`)

---

### Requirement: Language Switching

The system SHALL allow users to switch the UI language via the Settings page toggle. Switching MUST update the `LanguageContext` state and persist the selection to `localStorage` under key `mathsnap_language`. The change MUST be immediately visible across all active UI components without a page reload.

#### Scenario: User switches from Vietnamese to English
- **WHEN** a user on the Settings page toggles the language switch to English
- **THEN** all visible UI text (nav labels, page headers, buttons, empty states, aria-labels) immediately switches to English

#### Scenario: User switches back to Vietnamese
- **WHEN** a user on the Settings page toggles the language switch back to Vietnamese
- **THEN** all visible UI text immediately switches to Vietnamese

#### Scenario: Language preference persists across sessions
- **WHEN** a user sets English and reloads the page
- **THEN** the UI renders in English after hydration

---

### Requirement: Translation Catalog

The app SHALL maintain a flat translation object in `lib/i18n.ts` with keys for all client-visible UI strings. The catalog MUST use TypeScript's `satisfies Record<Lang, Record<string, string>>` constraint to enforce key parity between `vi` and `en` at compile time. Missing a key in either language SHALL produce a TypeScript compile error.

#### Scenario: All UI strings covered
- **WHEN** the translation catalog is complete
- **THEN** no Vietnamese string literals remain hardcoded in JSX across the 12 affected files

#### Scenario: Key parity enforced
- **WHEN** a developer adds a new key to `vi` but not `en`
- **THEN** TypeScript reports a type error at compile time

#### Scenario: Test guard for key parity
- **WHEN** `lib/i18n.test.ts` runs
- **THEN** it asserts that `Object.keys(t.en).sort()` equals `Object.keys(t.vi).sort()`

---

### Requirement: Date Locale Formatting

The system SHALL format dates in history and bookmarks pages using the locale matching the selected language: `'en-US'` for English and `'vi-VN'` for Vietnamese.

#### Scenario: Dates in English mode
- **WHEN** language is set to `'en'` and a history item is displayed
- **THEN** `formatDate` uses `'en-US'` locale for `toLocaleDateString`

#### Scenario: Dates in Vietnamese mode
- **WHEN** language is set to `'vi'` and a history item is displayed
- **THEN** `formatDate` uses `'vi-VN'` locale for `toLocaleDateString`

---

### Requirement: Onboarding Overlay Translation

The onboarding overlay MUST render slide titles and descriptions in the currently selected language. The `STEPS` constant SHALL be replaced with a `getSteps(lang: Lang)` function returning the appropriate localized content.

#### Scenario: Onboarding in English
- **WHEN** language is `'en'` and the onboarding overlay is shown
- **THEN** slide titles and descriptions are rendered in English

#### Scenario: Onboarding in Vietnamese
- **WHEN** language is `'vi'` and the onboarding overlay is shown
- **THEN** slide titles and descriptions are rendered in Vietnamese

---

### Requirement: LLM Solve Language Unaffected

The language passed to the LLM solve endpoint in `app/solve/page.tsx` MUST continue reading from `localStorage.getItem('mathsnap_language')` directly (not from context). This requirement exists to ensure the existing working behavior is not disrupted by the context introduction.

#### Scenario: LLM solve language unchanged after refactor
- **WHEN** the bilingual-ui change is implemented
- **THEN** `postSolve` still receives the correct language string from localStorage, identical to the pre-change behavior
