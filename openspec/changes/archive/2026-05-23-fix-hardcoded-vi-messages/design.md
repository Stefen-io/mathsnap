## Context

MathSnap is a bilingual (VI/EN) math tutoring app. The `bilingual-ui` change introduced a client-side i18n system (`lib/i18n.ts`) covering all UI labels. However, server-side rate-limit error messages were not included: four Vietnamese strings remain hardcoded in `solve.py` (lines 41, 54) and `ocr.py` (lines 75, 90) and are returned verbatim in HTTP 429 response bodies. The client currently uses `err.message` passthrough for `RATE_LIMITED` errors, so users see Vietnamese text — but only because the server happens to hardcode Vietnamese.

Additionally:
- `api.ts:55` throws an ApiError with a Vietnamese string for client-side OCR timeout (the string is never displayed — `ocr/page.tsx` overrides via code check — but it is inconsistent).
- `main.py:29,71-72` contains Vietnamese in FastAPI app description strings (Swagger UI only, no runtime effect).

The LLM system prompt (`solver.py`) is already entirely in English and is unaffected.

## Goals / Non-Goals

**Goals:**
- Remove all Vietnamese from server HTTP response payloads
- Route rate-limit error display through the client i18n system (`t[lang].rateLimitBurst` / `t[lang].rateLimitDaily`)
- Vietnamese users continue seeing Vietnamese rate-limit errors; English users see English
- Clean up `api.ts:55` and `main.py` Vietnamese strings for consistency
- All existing tests pass; `i18n.test.ts` key-parity assertion continues to hold

**Non-Goals:**
- Touching LLM prompt language or solver logic
- Adding language headers to server requests
- Moving any other error messages (non–rate-limit) out of `err.message` passthrough
- Changing the rate-limit enforcement logic or thresholds

## Decisions

### D1: Use `err.retryable` to distinguish burst from daily

Both `RATE_LIMITED` burst and daily errors share the same `code: "RATE_LIMITED"`. The existing `retryable` boolean already distinguishes them semantically: burst is `retryable: true` (user can retry after 1 min), daily is `retryable: false`. No new API fields are needed.

Mapping rule:
```
RATE_LIMITED + retryable:true  → t[lang].rateLimitBurst
RATE_LIMITED + retryable:false → t[lang].rateLimitDaily
```

### D2: Client owns all user-facing text; server messages become debug-only

After this change, server `message` fields for rate-limit errors exist for logs and API debugging (Swagger UI, curl output), not for user display. The client i18n system is the single source of truth for all user-visible strings.

### D3: Apply code-based mapping only for RATE_LIMITED

`ocr/page.tsx` already maps `OCR_TIMEOUT` via code check (`err.code === 'OCR_TIMEOUT' ? t[lang].ocrErrorTimeout : err.message`). Extend this pattern: check `err.code === 'RATE_LIMITED'` before falling through to `err.message`. All other error codes continue using `err.message` passthrough — this is intentional; rate-limit is the only server-side hardcoded string that breaks language parity.

`solve/page.tsx` currently uses `err.message` for all ApiErrors. Add a `getLocalizedErrorMessage(err, lang)` helper inline or extract the code-check logic similarly to OCR page.

### D4: Two new i18n keys added symmetrically

```ts
// vi
rateLimitBurst: 'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.',
rateLimitDaily: 'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.',

// en
rateLimitBurst: 'You are sending too fast. Please wait 1 minute.',
rateLimitDaily: 'You have reached today\'s limit. Please try again tomorrow.',
```

The `i18n.test.ts` key-parity assertion will automatically validate these are balanced.

### D5: `api.ts:55` message replaced to English (cosmetic)

The string is dead code for display purposes — `ocr/page.tsx` code-checks `OCR_TIMEOUT` and substitutes `t[lang].ocrErrorTimeout`. Replace for consistency and to eliminate all Vietnamese from client source files outside of `i18n.ts`.

## Risks / Trade-offs

- **[Risk] Tests in `test_ocr_rate_limit.py` and `test_solve_rate_limit.py` may assert Vietnamese message strings** → Mitigation: Update test expectations to match the new English messages. The existing tests in `test_rate_limit.py` test behavior (429 status code, `retryable` boolean), not message content, so they are unaffected.
- **[Risk] `api-rate-limiting/spec.md` scenario examples reference Vietnamese strings** → Mitigation: Update spec scenario examples to use English strings as part of this change's modified-capabilities delta spec.
- **[Risk] `ocr/page.tsx` toast path**: The OCR page does not call `toast.error()` for rate-limit errors; the solve page does at line 71 (`toast.error(err instanceof ApiError ? err.message : ...)`). After this change, solve page should use the localized message in the toast as well, not `err.message`. → Mitigation: The solve page error handling is refactored to derive `localizedMessage` once and use it for both `setError` and `toast.error`.

## Migration Plan

No backend migration needed — this is a string-only change. Deployment is safe:
1. Deploy server changes (English messages in 429 responses)
2. Deploy client changes (i18n keys + code mapping)

Steps 1 and 2 can ship together. If server ships before client, users may briefly see English rate-limit messages (client passthrough). If client ships before server, the code-mapping catches `RATE_LIMITED` code and renders i18n strings regardless of server message content. Either ordering is safe.

Rollback: revert either or both sides independently.

## Open Questions

None.
