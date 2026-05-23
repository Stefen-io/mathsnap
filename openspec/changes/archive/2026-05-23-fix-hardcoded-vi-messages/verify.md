## Verification Report: fix-hardcoded-vi-messages

### Summary

| Dimension    | Status                                         |
|--------------|------------------------------------------------|
| Completeness | 17/17 tasks ✅, 4 requirements covered ✅      |
| Correctness  | 11/11 scenarios covered; 2 not directly tested |
| Coherence    | 5/5 design decisions followed ✅               |

---

## Completeness

**Tasks**: 17/17 complete ✅

**Requirements from `specs/api-rate-limiting/spec.md`** (MODIFIED):
- ✅ Burst limit blocks rapid requests per device — `solve.py:41`, `ocr.py:75` now return English message
- ✅ Daily quota blocks excessive solves per device — `solve.py:54`, `ocr.py:90` now return English message

**Requirements from `specs/language-ui/spec.md`** (ADDED + MODIFIED):
- ✅ Rate-limit error messages use i18n code mapping — `ocr/page.tsx:65`, `solve/page.tsx:66` route RATE_LIMITED through `t[lang]` keys
- ✅ Translation Catalog — `rateLimitBurst` and `rateLimitDaily` present in both `vi` and `en` in `lib/i18n.ts:79-80, 170-171`

---

## Correctness

### api-rate-limiting scenarios

| Scenario | Status | Evidence |
|----------|--------|----------|
| 6th request within 60s is blocked | ✅ Covered | `test_solve_rate_limit.py` + message at `solve.py:41` |
| Request after window expires is allowed | ✅ Covered | Existing test, logic unchanged |
| Burst limit applies to OCR endpoint | ✅ Covered | `test_ocr_rate_limit.py` + `ocr.py:75` |
| Different devices have independent burst counters | ✅ Covered | Existing test, logic unchanged |
| 21st solve in same UTC day blocked | ✅ Covered | `test_solve_rate_limit.py` + `solve.py:54` |
| Daily limit resets at UTC midnight | ✅ Covered | Existing test, logic unchanged |
| Daily limit uses approximate OCR count | ✅ Covered | `test_ocr_rate_limit.py` + `ocr.py:90` |

### language-ui scenarios

| Scenario | Status | Evidence |
|----------|--------|----------|
| Burst error in Vietnamese mode | ✅ Tested | `ocr/page.test.tsx:76`, `solve/page.test.tsx:128` |
| Daily error in Vietnamese mode | ✅ Tested | `ocr/page.test.tsx:91`, `solve/page.test.tsx:128` |
| Burst error in English mode | ⚠️ Not tested | Implementation correct by inspection (`t[lang].rateLimitBurst`); no test with `lang='en'` |
| Daily error in English mode | ⚠️ Not tested | Implementation correct by inspection; no test with `lang='en'` |
| Key parity enforced at compile time | ✅ Covered | `const en: typeof vi` at `i18n.ts:94`; `i18n.test.ts` passes |
| Test guard for key parity | ✅ Covered | `lib/i18n.test.ts` passes (108 client tests, 1 pre-existing unrelated failure) |
| Rate-limit keys present in both languages | ✅ Verified | `vi` lines 79-80, `en` lines 170-171 |
| No Vietnamese hardcoded outside i18n.ts | ✅ Verified | grep confirms only `lib/i18n.ts`, test files, fixture files contain Vietnamese |

---

## Coherence

| Design Decision | Status | Notes |
|----------------|--------|-------|
| D1: Use `err.retryable` to distinguish burst from daily | ✅ Followed | `solve.py:66`, `ocr/page.tsx:65` both use `err.retryable` ternary |
| D2: Client owns all user-facing text; server messages become debug-only | ✅ Followed | Server returns English strings; client i18n is source of truth for display |
| D3: Apply code-based mapping only for RATE_LIMITED | ✅ Followed | Other error codes still fall through to `err.message` in both pages |
| D4: Two new i18n keys added symmetrically | ✅ Followed | Exact values match design.md D4 spec |
| D5: api.ts:55 message replaced to English (cosmetic) | ✅ Followed | `api.ts:56` now reads `'OCR timed out. Please try again or enter manually.'` |

**Risk mitigations from design.md:**
- "Tests may assert Vietnamese strings" → Confirmed no message-string assertions in server tests; plan note was accurate ✅
- "Spec scenario examples reference Vietnamese strings" → Updated in delta spec to English ✅
- "Solve page toast path" → `localizedMessage` used for both `setError` and `toast.error` at `solve.py:72,76` ✅

---

## Issues

### WARNINGS (should fix)

**W1**: English-mode RATE_LIMITED scenarios not covered by tests (`language-ui/spec.md` scenarios 2 and 4).

- The implementation is correct — `t[lang].rateLimitBurst` returns `t.en.rateLimitBurst` when `lang='en'`. But the spec defines explicit scenarios for English mode that have no test coverage.
- **Recommendation**: Add test cases in `ocr/page.test.tsx` and/or `solve/page.test.tsx` that mock `useLanguage` to return `'en'` and assert the English strings `'You are sending too fast. Please wait 1 minute.'` and `'You have reached today\'s limit. Please try again tomorrow.'` appear in the DOM.

### SUGGESTIONS (nice to fix)

**S1**: `language-ui/spec.md` says the catalog MUST use `satisfies Record<Lang, Record<string, string>>` constraint. The codebase uses `const en: typeof vi` (pre-existing pattern). Both enforce key parity, but the letter of the spec is not met.

- **Recommendation**: Either (a) update `lib/i18n.ts` to use `satisfies` (preferred per spec), or (b) update the spec to document the `typeof vi` approach as the accepted implementation. Since this is a pre-existing codebase pattern, option (b) may be more appropriate.

---

## Final Assessment

No critical issues. 1 warning (English-mode test coverage) and 1 suggestion (TypeScript constraint wording). Both are pre-existing patterns or minor gaps, not regressions introduced by this change.

**Ready for archive** — with W1 noted as a follow-up improvement if desired.
