## Why

G1 (`backend-core-api`) đã deliver các endpoint hoạt động đúng schema nhưng chưa có bảo vệ về rate. Bất kỳ client nào cũng có thể gọi `/api/solve` không giới hạn, tiêu hết budget OpenAI trong vài phút. Backend cũng chưa làm sạch input trước khi đưa vào LLM. G2 phải hoàn thành trước khi bất kỳ user thật nào sử dụng app — đây là prerequisite của Sprint 1 Pass Criteria (PHASE_2.5 §2).

## What Changes

**Rate Limiting — `/api/ocr` và `/api/solve`**
- From: Không có giới hạn — mọi request đều được xử lý
- To: 2 lớp kiểm soát: daily quota (SQL COUNT) + burst limit (sliding window 5/phút)
- Reason: Chống cost spike OpenAI và abuse pix2tex CPU/RAM (SYSTEM_DESIGN §9.1)
- Impact: Non-breaking — client nhận 429 thay vì xử lý khi vượt ngưỡng

**LaTeX Input Sanitization — `/api/solve`**
- From: `SolveRequest.latex` chỉ có `max_length=2000`, không làm sạch control chars
- To: Strip `\x00–\x1f` trước khi pass vào LCEL chain
- Reason: Loại bỏ null bytes và control chars có thể gây hành vi không xác định trong prompt
- Impact: Non-breaking — input hợp lệ không bị ảnh hưởng

**Structured Logging khi Rate Limit Hit**
- From: Không có log khi request bị chặn
- To: Log structured tại WARN level với device_id prefix, limit type, endpoint
- Reason: Visibility trên Railway logs để debug và monitor abuse
- Impact: Additive only

## Capabilities

### New Capabilities
- `api-rate-limiting`: Rate limiting 2 lớp (daily quota via SQL + burst via in-memory sliding window) cho `/api/ocr` và `/api/solve`, với env-configurable limits và structured logging khi limit hit

### Modified Capabilities
- `solve-endpoint`: Thêm LaTeX sanitization (strip control chars) và rate limit pre-check trước khi invoke LCEL chain
- `ocr-endpoint`: Thêm rate limit pre-check trước khi invoke pix2tex

## Impact

- **New file:** `src/server/app/rate_limit.py`
- **Modified files:** `routers/ocr.py`, `routers/solve.py`, `services/supabase.py`, `.env.example`
- **No new dependencies** (python-magic excluded per D3)
- **No schema changes** — `RATE_LIMITED` code đã có trong `errors.py` từ G1
- **No DB migration** — daily count query dùng existing `history_items` table
