## Design Summary

Explore session (`/opsx:explore`) đã hoàn thành trước khi propose. Scope được lock sau khi phân tích codebase G1 và SYSTEM_DESIGN §9, §4.8. Brainstorm.md này ghi lại các quyết định đã được confirm.

**Mục tiêu:** Đưa backend từ "chạy được" (G1) lên "production-grade" bằng cách thêm rate limiting 2 lớp, LaTeX sanitization, và structured logging khi limit hit. Các phần G1 đã làm (error codes, ErrorResponse schema, UUID validation, MIME check) được tái sử dụng, không viết lại.

## Alternatives Considered

### Phương án A: In-memory sliding window (Agreed)
- **Làm:** `collections.defaultdict(list)` per `device_id`, loại timestamps cũ > 60s mỗi request
- **Ưu điểm:** Zero dependency, zero latency, match SYSTEM_DESIGN §9.2.1 snippet chính xác
- **Nhược điểm:** State mất khi container restart; không scale multi-instance
- **Kết quả:** Được chọn — prototype scale ~5 users, single container, trade-off chấp nhận được

### Phương án B: Redis/Upstash sliding window
- **Làm:** Upstash free tier, atomic ZADD/ZCOUNT per device_id
- **Ưu điểm:** Persist qua restart, scale multi-instance
- **Nhược điểm:** Thêm external dependency, thêm infra config, overkill cho MVP
- **Vì sao không chọn:** SYSTEM_DESIGN §9.2.1 explicitly note "nâng cấp Redis cho v2 nếu cần" — hiện tại không cần

### Phương án C: FastAPI Middleware cho rate limit
- **Làm:** Middleware class intercept tất cả requests, check header, raise 429
- **Ưu điểm:** Centralized, DRY
- **Nhược điểm:** Daily check cần Supabase client (async, lazy-init), device_id cần parse header — phức tạp hơn, khó test
- **Vì sao không chọn:** Explicit calls trong từng router dễ test hơn; chỉ 2 endpoints cần rate limit, không justify middleware

## Agreed Approach

**Phương án A — Plain module `app/rate_limit.py`** với 2 functions:
- `check_burst(device_id: str) -> bool` — in-memory sliding window, 5 req/min per device
- `count_daily(client, device_id: UUID) -> int` — SQL COUNT từ `history_items` (per SYSTEM_DESIGN §9.2)

Cả hai endpoints (`/api/ocr`, `/api/solve`) gọi explicit trước khi process. Khớp với pattern codebase hiện tại (solver.py, supabase.py là plain modules).

## Key Decisions

| # | Quyết định | Lý do |
|---|-----------|-------|
| D1 | Single `RATE_LIMITED` code (không split DAILY/BURST) | Match SYSTEM_DESIGN §4.8; FE phân biệt qua `retryable` field |
| D2 | OCR daily limit dùng xấp xỉ qua `history_items` (không tạo `api_call_log`) | Per SD §9.2 MVP decision; prototype scale chấp nhận được |
| D3 | Bỏ python-magic, giữ Content-Type header check | Prototype scale ~5 users, không có threat model justifying Dockerfile dep |
| D4 | LaTeX sanitize = strip `\x00–\x1f` (control chars) | LLM input protection; max_length=2000 đã có từ G1 |
| D5 | Log format: device_id prefix (8 chars), limit type, endpoint | Đủ để debug trên Railway logs mà không expose full UUID |
| D6 | Env vars: `DAILY_SOLVE_LIMIT=20`, `BURST_LIMIT_PER_MINUTE=5` với hardcoded defaults | Changeable via Railway env vars không cần redeploy |

## Open Questions

Tất cả resolved trong explore session. Không còn open questions.
