# scaffold-backend-and-deploy Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** Tạo FastAPI backend skeleton với pix2tex eager-loaded, CORS configured, và deploy lên Railway để DoD D1 "CORS pass từ Vercel → Railway /health" verify được.

**Architecture:** Một FastAPI app đơn giản trong `src/server/main.py` sử dụng lifespan context để eager-load pix2tex LatexOCR tại startup. CORSMiddleware đọc `ALLOWED_ORIGINS` env var. `/health` endpoint guard bằng `model_ready` flag — 503 khi chưa xong, 200 khi ready. Deploy qua Dockerfile với layer cache cho pip install.

**Tech Stack:** Python 3.11-slim, FastAPI 0.111.0, uvicorn 0.30.0, pix2tex 0.1.2, Railway (Docker deploy), Docker layer cache

---

## Task 1: Create src/server/ Files

- [ ] **Step 1:** Tạo `src/server/requirements.txt` với nội dung exact:

  ```
  fastapi==0.111.0
  uvicorn==0.30.0
  pix2tex==0.1.2
  langchain-openai==0.1.20
  langchain-core==0.2.40
  supabase==2.4.0
  pydantic>=2.0
  python-multipart==0.0.9
  ```

- [ ] **Step 2:** Tạo `src/server/.env.example`:

  ```
  ALLOWED_ORIGINS=http://localhost:3000
  OPENAI_API_KEY=
  SUPABASE_URL=
  SUPABASE_KEY=
  ```

- [ ] **Step 3:** Tạo `src/server/main.py` với cấu trúc sau:

  ```python
  import os
  from contextlib import asynccontextmanager
  from fastapi import FastAPI, HTTPException
  from fastapi.middleware.cors import CORSMiddleware
  from pix2tex.cli import LatexOCR

  ocr_model = None

  @asynccontextmanager
  async def lifespan(app: FastAPI):
      global ocr_model
      ocr_model = LatexOCR()
      yield

  app = FastAPI(lifespan=lifespan)

  app.add_middleware(
      CORSMiddleware,
      allow_origins=[os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")],
      allow_methods=["GET", "POST", "PATCH", "DELETE"],
      allow_headers=["Content-Type", "X-Device-ID"],
  )

  @app.get("/health")
  async def health():
      if ocr_model is None:
          raise HTTPException(status_code=503, detail="model loading")
      return {"status": "ok"}
  ```

- [ ] **Step 4:** Tạo `src/server/Dockerfile`:

  ```dockerfile
  FROM python:3.11-slim

  WORKDIR /app

  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  COPY . .

  CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```

## Task 2: Local Verification

- [ ] **Step 1:** Chạy từ root repo:

  ```bash
  docker build -t mathsnap-server src/server/
  ```

  Verify: build output shows "Successfully built" — không có pip error, không có missing system lib error.

  Nếu fail do `python:3.11-slim` thiếu system libs (phổ biến với torch): đổi base image sang `python:3.11` trong Dockerfile rồi rebuild.

- [ ] **Step 2:** Chạy container test:

  ```bash
  docker run -p 8000:8000 -e ALLOWED_ORIGINS=http://localhost:3000 mathsnap-server
  ```

  Theo dõi log — đợi xuất hiện dòng báo pix2tex model loaded (có thể mất 15-30s).

- [ ] **Step 3:** Verify `/health` sau khi model ready:

  ```bash
  curl http://localhost:8000/health
  # Expected: {"status":"ok"}
  ```

- [ ] **Step 4:** Commit khi local verify pass:
  ```
  feat(server): scaffold FastAPI with pix2tex startup, CORS, /health endpoint
  ```

## Task 3: Railway Deployment

- [ ] **Step 1:** Verify Railway plan ≥1GB RAM — kiểm tra plan hiện tại trong Railway dashboard. Upgrade lên Hobby ($5/mo) nếu đang dùng Starter (512MB).

- [ ] **Step 2:** Connect Railway project với GitHub repo hoặc chạy `railway up` CLI từ `src/server/`. Đảm bảo Railway detect và dùng `Dockerfile` (không phải Nixpacks) — Railway auto-detect Dockerfile trong thư mục deploy.

- [ ] **Step 3:** Set env vars trong Railway dashboard:
  - `ALLOWED_ORIGINS` = `https://mathsnap-xi.vercel.app`
  - `OPENAI_API_KEY` = placeholder (sẽ set thật ở Change #17)
  - `SUPABASE_URL` = placeholder (sẽ set thật ở Change #3)
  - `SUPABASE_KEY` = placeholder (sẽ set thật ở Change #3)

- [ ] **Step 4:** Monitor Railway build log — verify Docker build layer cache hoạt động và container start không bị OOM kill. Nếu OOM → verify plan RAM, nếu đã ≥1GB thì xem log chi tiết.

## Task 4: End-to-End Verification

- [ ] **Step 1:** Sau khi Railway deploy done, lấy public URL từ Railway dashboard. Chạy:

  ```bash
  curl https://<railway-app>.up.railway.app/health
  # Expected: {"status":"ok"}
  ```

  Đợi đủ thời gian cho pix2tex load (15-30s sau container start).

- [ ] **Step 2:** Mở browser tại `https://mathsnap-xi.vercel.app`, mở DevTools Console, chạy:

  ```javascript
  fetch('https://<railway-app>.up.railway.app/health')
    .then(r => r.json())
    .then(console.log);
  // Expected: {status: "ok"} — không có CORS error trong Console
  ```

- [ ] **Step 3:** Ghi lại Railway URL. Commit/update session notes trong `PHASE_2.5_IMPLEMENTATION.md` (D1 tasks 2 và 7 tick done, ghi Railway URL vào session notes).
