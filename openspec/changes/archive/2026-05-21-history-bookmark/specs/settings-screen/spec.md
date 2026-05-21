## ADDED Requirements

### Requirement: Settings page renders bilingual toggle persisted to localStorage

The system SHALL provide `app/(main)/settings/page.tsx` at route `/settings`. The page MUST render a language toggle switch (VI / EN) whose state MUST be read from `localStorage['mathsnap_language']` on mount (default `'vi'`). Toggling it MUST write the new value (`'vi'` or `'en'`) to `localStorage['mathsnap_language']` immediately. The switch MUST render as an animated pill: `bg-[#18E299]` when English is active, `bg-white border-black/10` when Vietnamese is active.

#### Scenario: Language toggle reads initial state from localStorage
- **WHEN** `localStorage['mathsnap_language']` is `'en'`
- **THEN** the toggle renders in the English (on) position on mount

#### Scenario: Language defaults to Vietnamese when key absent
- **WHEN** `localStorage['mathsnap_language']` is not set
- **THEN** the toggle renders in the Vietnamese (off) position

#### Scenario: Toggle writes new value to localStorage
- **WHEN** the user taps the language toggle from VI to EN
- **THEN** `localStorage.setItem('mathsnap_language', 'en')` is called

#### Scenario: Toggle visual state matches active language
- **WHEN** the active language is English
- **THEN** the toggle pill renders with `bg-[#18E299]`

---

### Requirement: Settings page renders informational rows

The settings page MUST render a "Thông tin" section with: a version display row showing `1.0.0`, an "Xem lại hướng dẫn" row that triggers the onboarding overlay, and static rows for "Liên hệ hỗ trợ" and "Điều khoản sử dụng" (both non-functional in MVP). Each row MUST be `h-[64px]` with a `ChevronRight` icon.

#### Scenario: Version row displays app version
- **WHEN** the settings page is rendered
- **THEN** a row shows the text "1.0.0" in monospace

#### Scenario: Xem lại hướng dẫn row is present
- **WHEN** the settings page is rendered
- **THEN** a row with text "Xem lại hướng dẫn" and a ChevronRight icon is present
