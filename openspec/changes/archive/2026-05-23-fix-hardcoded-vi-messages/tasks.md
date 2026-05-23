## 1. Server: Replace Vietnamese rate-limit messages with English

- [x] 1.1 In `src/server/app/routers/solve.py` line 41, replace `"Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút."` with `"You are sending requests too fast. Please wait 1 minute."`
- [x] 1.2 In `src/server/app/routers/solve.py` line 54, replace `"Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai."` with `"You have reached today's limit. Please try again tomorrow."`
- [x] 1.3 In `src/server/app/routers/ocr.py` line 75, replace `"Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút."` with `"You are sending requests too fast. Please wait 1 minute."`
- [x] 1.4 In `src/server/app/routers/ocr.py` line 90, replace `"Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai."` with `"You have reached today's limit. Please try again tomorrow."`

## 2. Server: Fix OpenAPI doc strings in main.py

- [x] 2.1 In `src/server/app/main.py` line 29, replace the Vietnamese `description` string with English: `"Receive a math problem image, return LaTeX (OCR) and step-by-step solution (LLM)."`
- [x] 2.2 In `src/server/app/main.py` lines 71–72, replace the Vietnamese health endpoint `description` with English: `"Returns 200 ok when the pix2tex model has loaded and is ready to accept requests. Returns 503 model loading during startup (~15-30s)."`

## 3. Client: Add rate-limit i18n keys to translation catalog

- [x] 3.1 In `src/client/lib/i18n.ts`, add `rateLimitBurst` and `rateLimitDaily` keys to the `vi` translation object with Vietnamese strings
- [x] 3.2 In `src/client/lib/i18n.ts`, add `rateLimitBurst` and `rateLimitDaily` keys to the `en` translation object with English strings

## 4. Client: Map RATE_LIMITED errors to i18n keys in ocr/page.tsx

- [x] 4.1 In `src/client/app/(main)/ocr/page.tsx`, update the catch block to check `err.code === 'RATE_LIMITED'` and map `err.retryable` → `t[lang].rateLimitBurst` (true) or `t[lang].rateLimitDaily` (false) instead of using `err.message` passthrough

## 5. Client: Map RATE_LIMITED errors to i18n keys in solve/page.tsx

- [x] 5.1 In `src/client/app/solve/page.tsx`, update the catch block so that `RATE_LIMITED` errors use `t[lang].rateLimitBurst` or `t[lang].rateLimitDaily` (via `err.retryable`) rather than `err.message`, both for `setError` and `toast.error`

## 6. Client: Fix Vietnamese string in api.ts

- [x] 6.1 In `src/client/lib/api.ts` line 55, replace `'Nhận dạng quá lâu, vui lòng thử lại hoặc nhập thủ công.'` with `'OCR timed out. Please try again or enter manually.'`

## 7. Update server tests to expect English messages

- [x] 7.1 In `src/server/tests/test_ocr_rate_limit.py`, update any assertions that check for Vietnamese rate-limit message strings to expect the new English messages
- [x] 7.2 In `src/server/tests/test_solve_rate_limit.py`, update any assertions that check for Vietnamese rate-limit message strings to expect the new English messages

## 8. Verify

- [x] 8.1 Run server tests: `cd src/server && uv run pytest` — all pass
- [x] 8.2 Run client tests: `cd src/client && npx vitest run` — all pass, including `i18n.test.ts` key-parity assertion
- [x] 8.3 Verify no Vietnamese strings remain outside `lib/i18n.ts` in client source files (grep check)
- [x] 8.4 Verify no Vietnamese strings remain in server response payloads (grep check on solve.py, ocr.py)
