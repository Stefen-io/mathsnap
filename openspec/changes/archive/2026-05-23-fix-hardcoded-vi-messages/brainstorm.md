## Design Summary

MathSnap currently hardcodes 4 Vietnamese strings in server HTTP 429 response bodies (`solve.py` and `ocr.py`). The client's `RATE_LIMITED` error display uses `err.message` passthrough, so Vietnamese users see correct text today — but only because the server happens to hardcode Vietnamese. This architectural accident breaks as soon as the server message changes or a language-aware feature is added.

Fix: move rate-limit error messages into the client i18n system (where all other UI text already lives), have the server return English, and use `err.retryable` (already on every ApiError) to distinguish burst vs. daily limits.

Additionally, `api.ts:55` contains a Vietnamese string in an ApiError constructor (never displayed, inconsistent), and `main.py` has 2 Vietnamese strings in OpenAPI doc descriptions (cosmetic Swagger UI only). Both are fixed as part of the cleanup.

## Alternatives Considered

### Option A: Code-based client mapping (chosen)
- **Approach:** Server returns English messages. Client maps `RATE_LIMITED` + `retryable` boolean → `t[lang].rateLimitBurst` or `t[lang].rateLimitDaily` via i18n.
- **Pros:** Consistent with how all other client errors are localized; server stays language-agnostic; no new request headers needed; retryable boolean already exists and maps perfectly.
- **Cons:** Client must explicitly handle `RATE_LIMITED` code (small boilerplate).
- **Why chosen:** Fits the existing i18n pattern exactly. The `retryable` field already distinguishes burst (true) from daily (false).

### Option B: Server language-aware responses
- **Approach:** Client sends `Accept-Language` or `language` header on all requests; server selects message language.
- **Pros:** Server messages always match user language without client logic.
- **Cons:** All endpoints need the header; server needs localization logic; `/api/ocr` currently sends no `language`; overkill when client already has i18n.
- **Why not chosen:** Unnecessary complexity — client i18n system already exists and handles this cleanly.

### Option C: Direct VI → EN replace on server, no client changes
- **Approach:** Just replace the 4 Vietnamese strings with English equivalents on the server.
- **Pros:** Trivial 4-line change.
- **Cons:** Vietnamese users would see English rate-limit errors — a regression relative to today's behaviour.
- **Why not chosen:** Breaks user experience for the primary target audience.

## Agreed Approach

**Option A — Code-based client mapping.**

Five concrete changes:
1. `solve.py` lines 41, 54 → English messages
2. `ocr.py` lines 75, 90 → English messages
3. `i18n.ts` → add `rateLimitBurst` and `rateLimitDaily` keys (vi + en)
4. `ocr/page.tsx` + `solve/page.tsx` → map `RATE_LIMITED` + `retryable` → i18n key instead of `err.message` passthrough
5. `api.ts:55` + `main.py:29,71-72` → English strings (cleanup)

The key invariant: `retryable: true` = burst (1-minute cooldown); `retryable: false` = daily limit exhausted. This is already established by the server and trusted by the client for button rendering.

## Key Decisions

- **Burst vs. daily discrimination via `retryable`** — No new API fields needed. The boolean already carries the semantic.
- **Server messages become internal/debug only** — After this change, server `message` fields for rate-limit errors are for server logs and debugging, not user display. Client i18n owns all user-facing text.
- **`api.ts:55` message content doesn't matter** — `ocr/page.tsx` already overrides `OCR_TIMEOUT` message with `t[lang].ocrErrorTimeout` via code check. The fix is cosmetic consistency.
- **OpenAPI doc strings are cosmetic** — `main.py` description strings appear only in Swagger UI, not in any response payload. Fix is low-risk.

## Open Questions

None. Design is complete and agreed.
