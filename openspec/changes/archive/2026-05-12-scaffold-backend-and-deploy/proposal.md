## Why

Frontend (Change #1) đã live tại `https://mathsnap-xi.vercel.app` nhưng chưa có backend để gọi. `src/server/` chưa tồn tại. Không có backend reachable thì các Change D2-D3 (OCR, Solve, Rate Limit) không thể bắt đầu, và DoD D1 "CORS pass" không verify được. Change này unblock toàn bộ backend critical path bằng cách deploy FastAPI skeleton với pix2tex loaded và CORS configured — tất cả trong một Railway deployment.

## What Changes

**Backend codebase — từ không có gì đến scaffold đầy đủ**

- From: `src/server/` không tồn tại
- To: `src/server/main.py` + `requirements.txt` + `Dockerfile` + `.env.example`
- Reason: Unblock D2+ backend tasks; cung cấp public URL cho CORS verify
- Impact: Non-breaking (new capability)

**Deployment — Backend reachable từ public URL**

- From: Chỉ frontend có public URL
- To: Railway deployment có `https://<app>.up.railway.app/health` trả 200
- Reason: DoD D1 yêu cầu end-to-end verify Vercel → Railway
- Impact: Non-breaking (new service)

## Capabilities

### New Capabilities

- `backend-scaffold`: FastAPI app với pix2tex eager-loaded, CORS middleware cho Vercel origin, `/health` readiness endpoint, deployed trên Railway ≥1GB RAM qua Dockerfile

### Modified Capabilities

_(không có — đây là greenfield backend)_

## Impact

- **New files**: `src/server/main.py`, `src/server/requirements.txt`, `src/server/Dockerfile`, `src/server/.env.example`
- **External service**: Railway deployment (new)
- **Dependencies introduced**: fastapi==0.111.0, uvicorn==0.30.0, pix2tex==0.1.2, langchain-openai==0.1.20, langchain-core==0.2.40, supabase==2.4.0, pydantic>=2.0, python-multipart==0.0.9
- **Env vars required on Railway**: `ALLOWED_ORIGINS`, placeholder cho `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
- **Frontend không thay đổi** — chỉ verify bằng browser console fetch
