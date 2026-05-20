## Context

G1 (`backend-core-api`, archived 19/05) đã deliver:
- 6 endpoints đầy đủ (`/api/ocr`, `/api/solve`, history CRUD)
- 10 error codes + `ErrorResponse` schema trong `schemas/errors.py`
- UUID v4 validation trong `dependencies.py`
- Content-Type MIME check và size limit trong `routers/ocr.py`
- LaTeX `max_length=2000` trong `SolveRequest`

G2 scope sau explore session: thêm rate limiting 2 lớp, LaTeX sanitize, và structured logging. Không viết lại những gì G1 đã làm.

Timeline: D3 (13/05) theo PHASE_2.5. Backend phải đạt production-grade trước khi FE integration bắt đầu.

## Goals / Non-Goals

**Goals:**
- Daily quota: chặn request thứ 21+ trong ngày per device_id
- Burst limit: chặn request thứ 6+ trong vòng 60 giây per device_id
- Apply rate limits cho cả `/api/ocr` và `/api/solve`
- LaTeX input sanitization trước khi LLM invocation
- Structured log khi limit hit (visibility trên Railway)
- Config qua env vars không cần redeploy

**Non-Goals:**
- Persistent rate limit state (Redis, DB counter) — accepted trade-off cho MVP
- python-magic MIME validation — Content-Type header check đủ cho prototype scale
- Separate error codes cho DAILY vs BURST — `RATE_LIMITED` + `retryable` field đủ để FE phân biệt
- Rate limit cho history endpoints — không tốn external service cost
- OCR-specific daily counter — dùng `history_items` approximation per SD §9.2

## Decisions

### D1: Module structure — `app/rate_limit.py` (plain module, không dùng middleware)

```
app/rate_limit.py
├── _burst: dict[str, list[float]]   # in-memory per device_id
├── check_burst(device_id: str) -> bool
└── count_daily(client, device_id: UUID) -> int  # SQL COUNT via supabase
```

**Tại sao không dùng Middleware:** Daily check cần async Supabase client và cần device_id đã validate — phức tạp hơn khi inject vào middleware. Plain module match pattern của `solver.py` và `supabase.py` trong codebase.

**Tại sao không dùng FastAPI Depends:** Burst check cần device_id string; daily check cần client. Kết hợp 2 dependencies và xử lý 429 trong Depends làm flow khó đọc hơn explicit calls trong router.

### D2: Daily count dùng `history_items` approximation

```sql
SELECT COUNT(*)
FROM   history_items
WHERE  device_id   = $1
AND    created_at >= CURRENT_DATE
AND    created_at <  CURRENT_DATE + INTERVAL '1 day'
```

Per SYSTEM_DESIGN §9.2: OCR không insert row vào `history_items`, nhưng user thường OCR rồi solve → `count(solve) ≈ count(OCR)`. MVP chấp nhận xấp xỉ này. Không tạo `api_call_log` table riêng.

**Tại sao không dùng `CURRENT_DATE`:** Supabase Postgres timezone default là UTC — `CURRENT_DATE` trả về ngày UTC, consistent với `created_at TIMESTAMPTZ`. Reset lúc midnight UTC là acceptable cho prototype.

### D3: Burst limit — in-memory sliding window

```python
from collections import defaultdict
from time import monotonic

_burst: dict[str, list[float]] = defaultdict(list)
BURST_LIMIT  = int(os.getenv("BURST_LIMIT_PER_MINUTE", "5"))
BURST_WINDOW = 60.0  # seconds

def check_burst(device_id: str) -> bool:
    now    = monotonic()
    window = _burst[device_id]
    window[:] = [t for t in window if now - t < BURST_WINDOW]
    if len(window) >= BURST_LIMIT:
        return False
    window.append(now)
    return True
```

`monotonic()` thay vì `time()` để tránh clock skew khi system clock adjust. State in-memory mất khi restart — acceptable cho single-container Railway deployment.

### D4: Rate limit check order trong router

```
Request arrives
    ↓
validate_device_id (existing Depends)
    ↓
check_burst(str(device_id))  → False → 429 RATE_LIMITED retryable=true
    ↓
count_daily(client, device_id)  → ≥ limit → 429 RATE_LIMITED retryable=false
    ↓
... existing logic
```

Burst check trước daily check vì burst không cần DB round-trip. Fail fast.

### D5: LaTeX sanitize — strip \x00–\x1f

```python
import re
_CONTROL_CHARS = re.compile(r'[\x00-\x1f]')

def sanitize_latex(latex: str) -> str:
    return _CONTROL_CHARS.sub('', latex)
```

Đặt trong `rate_limit.py` hoặc inline trong `solve.py`. Strip trước khi `ainvoke` LCEL chain. `max_length=2000` Pydantic validation chạy trước khi request vào router — không thay đổi.

### D6: Logging format

```python
logger.warning(
    "rate_limited device=%s... type=%s endpoint=%s",
    str(device_id)[:8],
    "burst" if retryable else "daily",
    endpoint,
)
```

Dùng `%s` format (lazy evaluation). Không expose full UUID. Không thêm library mới — `logging` stdlib đủ cho Railway log stream.

### D7: Env var defaults trong code

```python
DAILY_SOLVE_LIMIT = int(os.getenv("DAILY_SOLVE_LIMIT", "20"))
BURST_LIMIT_PER_MINUTE = int(os.getenv("BURST_LIMIT_PER_MINUTE", "5"))
```

Defaults hardcoded trong `rate_limit.py` cho môi trường không có `.env`. Documented trong `.env.example`.

## Risks / Trade-offs

**[R1] Burst state mất khi container restart** → Accepted trade-off per SD §9.2.1. User có thể bypass bằng cách trigger restart, nhưng Railway không cho phép manual restart từ client. Upgrade Redis Upstash cho v2 nếu cần.

**[R2] Daily count xấp xỉ cho OCR** → User có thể gọi OCR nhiều lần mà không solve (crop ảnh, thử lại). Daily OCR limit sẽ thấp hơn thực tế. Acceptable vì threshold 20 là generous cho demo. Nếu cần chính xác: tạo `api_call_log` table (SD §9.2.2).

**[R3] Thread safety của `_burst` dict** → FastAPI dùng asyncio event loop (single thread per worker), không có race condition với `defaultdict(list)`. Nếu chuyển sang multi-worker Gunicorn: cần đồng bộ hóa.

**[R4] `count_daily` thêm 1 DB round-trip mỗi request** → Supabase query ~5-20ms per request. Với ~5 users concurrent, negligible. Nếu scale: add Redis cache với TTL 60s.

## Migration Plan

1. Implement `rate_limit.py` (TDD: viết test trước)
2. Add `count_daily` function vào `supabase.py` (TDD)
3. Integrate rate limit checks vào `ocr.py` và `solve.py` (TDD)
4. Integrate LaTeX sanitize vào `solve.py` (TDD)
5. Update `.env.example` với 3 env vars mới
6. Run `uv run pytest` — all tests pass
7. Manual verify trên Railway: burst 6th request → 429; 21st request/day → 429
8. Commit: `feat(server): add rate limiting and input sanitization`

Rollback: `git revert` — không có DB migration trong change này.

## Open Questions

Tất cả resolved trong explore session và design phase. Không còn open questions.
