## ADDED Requirements

### Requirement: Rate-limit error messages use i18n code mapping

The client SHALL map `RATE_LIMITED` ApiError codes to localized strings from the translation catalog using `err.retryable` to distinguish burst from daily. The client MUST NOT display `err.message` from the server for `RATE_LIMITED` errors.

Mapping rule:
- `code === 'RATE_LIMITED'` AND `retryable === true` → `t[lang].rateLimitBurst`
- `code === 'RATE_LIMITED'` AND `retryable === false` → `t[lang].rateLimitDaily`

This mapping SHALL be applied in both `app/(main)/ocr/page.tsx` and `app/solve/page.tsx`, including any toast notifications triggered by those errors.

#### Scenario: Burst rate-limit error in Vietnamese mode
- **WHEN** a user with language set to `'vi'` receives a `RATE_LIMITED retryable=true` error from `/api/ocr` or `/api/solve`
- **THEN** the UI displays `"Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút."` (from `t.vi.rateLimitBurst`)

#### Scenario: Burst rate-limit error in English mode
- **WHEN** a user with language set to `'en'` receives a `RATE_LIMITED retryable=true` error
- **THEN** the UI displays `"You are sending too fast. Please wait 1 minute."` (from `t.en.rateLimitBurst`)

#### Scenario: Daily rate-limit error in Vietnamese mode
- **WHEN** a user with language set to `'vi'` receives a `RATE_LIMITED retryable=false` error
- **THEN** the UI displays `"Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai."` (from `t.vi.rateLimitDaily`)

#### Scenario: Daily rate-limit error in English mode
- **WHEN** a user with language set to `'en'` receives a `RATE_LIMITED retryable=false` error
- **THEN** the UI displays `"You have reached today's limit. Please try again tomorrow."` (from `t.en.rateLimitDaily`)

---

## MODIFIED Requirements

### Requirement: Translation Catalog

The app SHALL maintain a flat translation object in `lib/i18n.ts` with keys for all client-visible UI strings, including rate-limit error messages. The catalog MUST use TypeScript's `satisfies Record<Lang, Record<string, string>>` constraint to enforce key parity between `vi` and `en` at compile time. Missing a key in either language SHALL produce a TypeScript compile error.

The catalog MUST include the following rate-limit keys:
- `rateLimitBurst`: shown when `RATE_LIMITED retryable=true`
- `rateLimitDaily`: shown when `RATE_LIMITED retryable=false`

#### Scenario: All UI strings covered including rate-limit messages
- **WHEN** the translation catalog is complete
- **THEN** no Vietnamese string literals remain hardcoded in any client source file outside `lib/i18n.ts`

#### Scenario: Key parity enforced
- **WHEN** a developer adds a new key to `vi` but not `en`
- **THEN** TypeScript reports a type error at compile time

#### Scenario: Test guard for key parity
- **WHEN** `lib/i18n.test.ts` runs
- **THEN** it asserts that `Object.keys(t.en).sort()` equals `Object.keys(t.vi).sort()`

#### Scenario: Rate-limit keys present in both languages
- **WHEN** `lib/i18n.test.ts` runs
- **THEN** both `t.vi.rateLimitBurst` and `t.en.rateLimitBurst` are non-empty strings, and same for `rateLimitDaily`
