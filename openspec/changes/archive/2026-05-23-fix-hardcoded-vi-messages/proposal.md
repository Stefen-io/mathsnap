## Why

The `bilingual-ui` change introduced a client-side i18n system for all user-visible text, but server-side rate-limit error messages were left out: four Vietnamese strings are hardcoded in server response bodies, and the client displays them via `err.message` passthrough. Vietnamese users see correct text today only because the server hardcodes Vietnamese — not because of i18n. Any future server change or language addition would silently break rate-limit message localization. Fixing this now, while the i18n system is fresh, keeps the architecture clean and the invariant clear: all user-facing text lives in `lib/i18n.ts`.

## What Changes

**Server rate-limit response messages**
- From: `"Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút."` / `"Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai."` (Vietnamese, hardcoded)
- To: `"You are sending requests too fast. Please wait 1 minute."` / `"You have reached today's limit. Please try again tomorrow."` (English, debug-only)
- Reason: Server messages become internal/debugging artifacts; client i18n owns all user-facing text.
- Impact: Non-breaking — client stops using `err.message` for `RATE_LIMITED` and uses i18n keys instead.

**Client i18n catalog**
- From: No rate-limit keys in `lib/i18n.ts`
- To: Two new keys (`rateLimitBurst`, `rateLimitDaily`) added in both `vi` and `en`
- Reason: Client needs localized strings to replace server passthrough.
- Impact: Non-breaking addition; i18n key-parity test automatically validates.

**Client error display — `ocr/page.tsx` and `solve/page.tsx`**
- From: `RATE_LIMITED` errors displayed via `err.message` passthrough
- To: `RATE_LIMITED` errors mapped via `err.retryable` → `t[lang].rateLimitBurst` or `t[lang].rateLimitDaily`
- Reason: Language-correct display regardless of server message content.
- Impact: Non-breaking behavior change; users see same text as today in VI mode, correct English in EN mode.

**`api.ts:55`** — Vietnamese string in client-side `OCR_TIMEOUT` ApiError replaced with English (cosmetic; string is never displayed due to code-check override in `ocr/page.tsx`).

**`main.py` OpenAPI doc strings** — 2 Vietnamese strings in FastAPI app description and health endpoint description replaced with English (Swagger UI only, no runtime effect).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `api-rate-limiting`: Scenario examples currently specify Vietnamese message strings in expected HTTP responses; update to English to match new server behavior.
- `language-ui`: Translation catalog gains 2 new keys (`rateLimitBurst`, `rateLimitDaily`); client error-display requirements expand to cover rate-limit code mapping.

## Impact

- **Server**: `src/server/app/routers/solve.py` (lines 41, 54), `src/server/app/routers/ocr.py` (lines 75, 90), `src/server/app/main.py` (lines 29, 71–72)
- **Client**: `src/client/lib/i18n.ts`, `src/client/lib/api.ts` (line 55), `src/client/app/(main)/ocr/page.tsx`, `src/client/app/solve/page.tsx`
- **Tests**: `src/server/tests/test_ocr_rate_limit.py`, `src/server/tests/test_solve_rate_limit.py` — update message string assertions
- **Specs**: `openspec/specs/api-rate-limiting/spec.md`, `openspec/specs/language-ui/spec.md` — delta specs needed
- No database changes. No new dependencies.
