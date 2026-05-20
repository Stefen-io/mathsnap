## 1. Thiết lập test infrastructure

- [x] 1.1 Tạo `src/server/tests/test_rate_limit.py` — file test cho `rate_limit.py` (following TDD: viết test trước khi có implementation)
- [x] 1.2 Tạo `src/server/tests/test_ocr_rate_limit.py` — integration test cho rate limit tại `/api/ocr` endpoint (following TDD)
- [x] 1.3 Tạo `src/server/tests/test_solve_rate_limit.py` — integration test cho rate limit và LaTeX sanitize tại `/api/solve` endpoint (following TDD)

## 2. Implement `app/rate_limit.py`

- [x] 2.1 Chạy tests từ 1.1 — xác nhận thất bại (TDD: red phase) cho `check_burst()` và `count_daily()`
- [x] 2.2 Implement `check_burst(device_id: str) -> bool` — in-memory sliding window, đọc `BURST_LIMIT_PER_MINUTE` từ env (default 5), window 60s dùng `time.monotonic()` (following TDD: green phase)
- [x] 2.3 Implement `count_daily(client: AsyncClient, device_id: UUID) -> int` — SQL COUNT từ `history_items` WHERE device_id = ? AND created_at >= today UTC (following TDD: green phase)
- [x] 2.4 Implement `sanitize_latex(latex: str) -> str` — strip `\x00–\x1f` bằng `re.sub(r'[\x00-\x1f]', '', latex)` (following TDD: green phase)
- [x] 2.5 Chạy `uv run pytest tests/test_rate_limit.py` — xác nhận tất cả pass (TDD: verify)

## 3. Thêm `count_daily` helper vào `supabase.py`

- [x] 3.1 Chạy tests từ 1.1 liên quan đến `count_daily` — xác nhận thất bại (TDD: red phase)
- [x] 3.2 Thêm function `count_daily_solves(client: AsyncClient, device_id: UUID) -> int` vào `app/services/supabase.py` với query: `SELECT COUNT(*) FROM history_items WHERE device_id=$1 AND created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'` (following TDD: green phase)
- [x] 3.3 Chạy `uv run pytest tests/test_rate_limit.py` — xác nhận pass (TDD: verify)

## 4. Integrate rate limiting vào `/api/ocr`

- [x] 4.1 Chạy tests từ 1.2 — xác nhận thất bại (TDD: red phase) cho burst check và daily check tại OCR
- [x] 4.2 Thêm `check_burst(str(device_id))` call vào `routers/ocr.py` sau `validate_device_id`, trả về `429 RATE_LIMITED retryable=true` khi `False` (following TDD: green phase)
- [x] 4.3 Thêm `await count_daily_solves(client, device_id)` call sau burst check, trả về `429 RATE_LIMITED retryable=false` khi `>= DAILY_SOLVE_LIMIT` (following TDD: green phase)
- [x] 4.4 Thêm `logger.warning("rate_limited device=%s... type=%s endpoint=ocr", ...)` cho cả hai limit type (following TDD: green phase)
- [x] 4.5 Chạy `uv run pytest tests/test_ocr_rate_limit.py` — xác nhận tất cả pass (TDD: verify)

## 5. Integrate rate limiting và LaTeX sanitize vào `/api/solve`

- [x] 5.1 Chạy tests từ 1.3 — xác nhận thất bại (TDD: red phase) cho burst, daily, và sanitize tại Solve
- [x] 5.2 Thêm `check_burst(str(device_id))` call vào `routers/solve.py` trước LCEL invoke, trả về `429 RATE_LIMITED retryable=true` khi `False` (following TDD: green phase)
- [x] 5.3 Thêm `await count_daily_solves(client, device_id)` call sau burst check, trả về `429 RATE_LIMITED retryable=false` khi `>= DAILY_SOLVE_LIMIT` (following TDD: green phase)
- [x] 5.4 Thêm `logger.warning("rate_limited device=%s... type=%s endpoint=solve", ...)` cho cả hai limit type (following TDD: green phase)
- [x] 5.5 Thêm `latex = sanitize_latex(body.latex)` call ngay trước `solver_service.solver_chain.ainvoke(...)`, dùng sanitized string thay vì `body.latex` (following TDD: green phase)
- [x] 5.6 Chạy `uv run pytest tests/test_solve_rate_limit.py` — xác nhận tất cả pass (TDD: verify)

## 6. Config và documentation

- [x] 6.1 Thêm 3 env vars vào `src/server/.env.example`: `DAILY_SOLVE_LIMIT=20`, `BURST_LIMIT_PER_MINUTE=5` với comment giải thích
- [x] 6.2 Cập nhật `src/server/CLAUDE.md` nếu cần — ghi lại pattern rate_limit module

## 7. Full test suite và manual verify

- [x] 7.1 Chạy `uv run pytest` (toàn bộ test suite) — xác nhận 0 failures, 0 regressions
- [ ] 7.2 Manual verify burst: gửi 6 requests liên tiếp tới `/api/solve` bằng curl — request thứ 6 trả về 429 với `retryable: true`
- [ ] 7.3 Manual verify log: kiểm tra Railway log (hoặc local server log) xuất hiện WARNING khi limit hit
- [ ] 7.4 Manual verify LaTeX sanitize: gửi latex chứa `\x00` — verify kết quả không chứa null byte (bằng cách inspect LLM prompt log hoặc response)

<!-- Tasks 7.2–7.4 require a running server with real OpenAI/Supabase credentials. Run manually before deploy. -->
