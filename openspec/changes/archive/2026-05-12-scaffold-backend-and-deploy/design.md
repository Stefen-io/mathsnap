## Context

Change #2 trên critical path D1 của Phase 2.5. Frontend đã live tại `https://mathsnap-xi.vercel.app` (Change #1 archived 12/05). Backend chưa tồn tại — `src/server/` chưa có file nào. Change này tạo xương sống tối thiểu để backend reachable từ frontend, làm nền cho Change #3 (Supabase DDL + UptimeRobot) và Change #15 (Pydantic models).

**Constraint chính:** pix2tex (~870MB RAM) yêu cầu Railway plan ≥1GB. Railway inject `$PORT` env var động — không hardcode port.

## Goals / Non-Goals

**Goals:**

- Tạo `src/server/` với `main.py`, `requirements.txt`, `Dockerfile`, `.env.example`
- FastAPI app khởi động với pix2tex eager-loaded tại startup
- `/health` endpoint: 503 khi model đang load, 200 khi ready
- CORSMiddleware cho `ALLOWED_ORIGINS=https://mathsnap-xi.vercel.app` (và localhost:3000 dev)
- Deploy lên Railway, verify `/health` return 200 từ public URL
- Verify CORS pass: `fetch()` từ Vercel → Railway `/health` không bị block

**Non-Goals:**

- `models.py` (Pydantic) — Change #15
- `python-magic` MIME check — Change #20
- Bất kỳ API endpoint nào ngoài `/health`
- Supabase connection — Change #3
- UptimeRobot setup — Change #3

## Decisions

### 1. Dockerfile thay vì Nixpacks

Railway Nixpacks auto-detect Python project qua `requirements.txt` nhưng không cache pip install layer giữa các deploy. `pix2tex==0.1.2` kéo theo `torch` (~2GB download) → mỗi redeploy tốn 10-15 phút với Nixpacks. Dockerfile cho phép:

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # ← cached layer
COPY . .
```

Khi chỉ thay đổi source code (không đổi requirements.txt), Railway rebuild bỏ qua pip install layer.

### 2. Eager load pix2tex tại startup (FastAPI lifespan)

```python
from contextlib import asynccontextmanager

ocr_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ocr_model
    ocr_model = LatexOCR()   # block until model ready (~15-30s)
    yield
    # cleanup nếu cần
```

`/health` guard bằng flag:

```python
@app.get("/health")
async def health():
    if ocr_model is None:
        raise HTTPException(status_code=503, detail="model loading")
    return {"status": "ok"}
```

Lý do eager load: UptimeRobot ping `/health` mỗi 5 phút để keep container warm (SD 12.4). Nếu lazy load, cold start vẫn hit user ở lần đầu — không nhất quán với strategy. Railway health check cũng dùng `/health` để xác nhận container ready trước khi route traffic.

### 3. CORS gộp vào Change #2, dùng `ALLOWED_ORIGINS` (mảng)

Vercel origin đã known tại thời điểm implement. DoD D1 yêu cầu "CORS pass từ Vercel → Railway `/health`". Để tránh "half-configured" deploy, CORS được gộp vào Change #2.

```python
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-Device-ID"],
)
```

Railway env var: `ALLOWED_ORIGINS=https://mathsnap-xi.vercel.app`. Fallback `"http://localhost:3000"` cho local dev.

### 4. PORT từ env var

Railway inject `$PORT` tại runtime. CMD không hardcode:

```dockerfile
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Shell form (không exec form) để `$PORT` expand. Fallback 8000 cho local.

### 5. Module structure: `app/main.py` thay vì `main.py` ở root

`main.py` được đặt trong `src/server/app/main.py` (Python package với `__init__.py`) thay vì root `src/server/main.py`. Lý do: chuẩn bị cho việc thêm module sau (routers, dependencies, models) mà không cần restructure. CMD cập nhật thành `uvicorn app.main:app`.

### 6. OpenAPI metadata và endpoint documentation

FastAPI app được configure với `title`, `description`, `version` để Swagger UI tại `/docs` readable. Mỗi endpoint có `summary`, `description`, `tags`:

```python
app = FastAPI(
    title="MathSnap API",
    description="Backend API cho MathSnap — AI-powered math tutor...",
    version="1.0.0",
)

@app.get("/health", summary="Readiness check", tags=["Infrastructure"])
```

## Risks / Trade-offs

| Risk                                                                 | Mitigation                                                                                                                                                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Railway OOM khi pix2tex load (~870MB)                                | Chọn Hobby plan (≥1GB RAM) trước khi deploy; verify trong DoD                                                                                                                                            |
| pix2tex download model weights tại container start (nếu không cache) | `pix2tex==0.1.2` download vào `~/.cache/` lần đầu; Railway không persist cache giữa deploy → mỗi deploy download lại ~300MB. Acceptable cho scaffold; workaround (bake weights vào image) để sau nếu cần |
| torch dependency build thất bại trên `python:3.11-slim`              | `slim` thiếu một số system libs. Nếu `pip install pix2tex` fail, switch sang `python:3.11` (full). Test locally với `docker build` trong DoD                                                             |
| ALLOWED_ORIGINS cần update thủ công nếu thêm origin mới              | Dùng format comma-separated nên chỉ cần edit Railway env var + redeploy; không cần code change                                                                                                           |

## Migration Plan

1. Tạo `src/server/` files locally
2. `docker build` test locally — verify build không error
3. Push to Railway (GitHub integration hoặc Railway CLI)
4. Set env vars: `ALLOWED_ORIGINS`, giữ placeholder cho `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
5. Verify Railway deployment: `curl https://<railway-url>.up.railway.app/health`
6. Verify CORS từ Vercel: `fetch('https://<railway-url>.up.railway.app/health')` trong browser console tại `https://mathsnap-xi.vercel.app`

**Rollback:** Railway tự động giữ previous deployment — 1-click rollback qua Railway dashboard nếu cần.

## Open Questions

Không có — tất cả quyết định đã chốt trong explore session.
