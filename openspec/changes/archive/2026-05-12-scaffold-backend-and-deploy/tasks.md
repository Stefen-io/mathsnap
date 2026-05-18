## 1. Create src/server/ Files

- [x] 1.1 Tạo `src/server/requirements.txt` với exact versions từ SD 2.2 (fastapi==0.111.0, uvicorn==0.30.0, pix2tex==0.1.2, langchain-openai==0.1.20, langchain-core==0.2.40, supabase==2.4.0, pydantic>=2.0, python-multipart==0.0.9)
- [x] 1.2 Tạo `src/server/.env.example` với 4 env vars: ALLOWED_ORIGINS, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
- [x] 1.3 Tạo `src/server/main.py` với: FastAPI app, lifespan context eager-loading LatexOCR, CORSMiddleware đọc ALLOWED_ORIGINS (default localhost:3000), `GET /health` trả 503 khi model loading / 200 khi ready
- [x] 1.4 Tạo `src/server/Dockerfile` với: python:3.11-slim base, COPY requirements.txt → RUN pip install (layer cache), COPY . . , CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

## 2. Local Verification

- [x] 2.1 Chạy `docker build -t mathsnap-server src/server/` locally — verify build hoàn thành không error (torch dependency resolve OK với slim base)
- [x] 2.2 Chạy container locally với `docker run -p 8000:8000 -e ALLOWED_ORIGINS=http://localhost:3000 mathsnap-server` — verify `/health` trả 200 sau khi model load xong
- [x] 2.3 Nếu `python:3.11-slim` fail do missing system libs (torch build deps), switch sang `python:3.11` full image trong Dockerfile và rebuild

## 3. Railway Deployment

- [x] 3.1 Chọn Railway plan ≥1GB RAM (Hobby tier) — verify plan trước khi deploy
- [x] 3.2 Push `src/server/` lên Railway (GitHub integration hoặc `railway up` CLI từ trong `src/server/`)
- [x] 3.3 Set Railway env vars: `ALLOWED_ORIGINS=https://mathsnap-xi.vercel.app`, thêm placeholder `OPENAI_API_KEY=placeholder`, `SUPABASE_URL=placeholder`, `SUPABASE_KEY=placeholder`
- [x] 3.4 Monitor Railway build log — verify Docker build succeed và container start không OOM

## 4. End-to-End Verification

- [x] 4.1 `curl https://<railway-app>.up.railway.app/health` — verify HTTP 200 `{"status": "ok"}`
- [x] 4.2 Mở browser console tại `https://mathsnap-xi.vercel.app`, chạy `fetch('https://<railway-app>.up.railway.app/health').then(r => r.json()).then(console.log)` — verify không có CORS error, response là `{status: "ok"}`
- [x] 4.3 Ghi lại Railway public URL vào `src/server/.env.example` comment hoặc project README để các Change tiếp theo reference
