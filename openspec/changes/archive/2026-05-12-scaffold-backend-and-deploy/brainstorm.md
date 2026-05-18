## Design Summary

Scaffold FastAPI backend for MathSnap with eager pix2tex startup, CORS configured for Vercel frontend, and deploy to Railway via Dockerfile. The `/health` endpoint returns 200 only after pix2tex model is fully loaded, serving as both a readiness probe and UptimeRobot keep-alive target.

## Alternatives Considered

### Phương án A: Nixpacks (Railway auto-detect)

- **Làm thế nào**: Không có Dockerfile; Railway tự detect `requirements.txt` Python project và build bằng Nixpacks
- **Ưu điểm**: Zero config, deploy ngay
- **Nhược điểm**: torch/pix2tex (~2GB download) không được cache giữa các deploy → redeploy chậm 10-15 phút mỗi lần; model weights re-download mỗi container start; không portable (không dùng được với docker-compose local)
- **Vì sao không chọn**: Redeploy cost quá cao cho D1-D8 workflow; cache control tốt hơn với Dockerfile

### Phương án B: Dockerfile đơn giản (đã chọn)

- **Làm thế nào**: `python:3.11-slim` base, COPY requirements.txt trước để tận dụng Docker layer cache, CMD dùng `$PORT` env var Railway inject
- **Ưu điểm**: Layer cache cho pip install; portable (docker-compose sau này); kiểm soát build process; tương thích Railway, Render, Fly.io nếu cần migrate
- **Nhược điểm**: Cần viết và maintain Dockerfile
- **Vì sao chọn**: Trade-off rõ ràng nghiêng về Dockerfile — redeploy nhanh hơn đáng kể trong 8 ngày sprint

### Phương án C: Multi-stage Dockerfile

- **Làm thế nào**: Build stage tách biệt với runtime stage để giảm image size
- **Ưu điểm**: Image nhỏ hơn
- **Nhược điểm**: pix2tex/torch không thể tách build vs runtime cleanly — model weights cần có ở runtime; complexity không đổi được image size đáng kể cho Python ML workload
- **Vì sao không chọn**: Overkill cho scaffold; không giảm được RAM footprint thực tế

## Agreed Approach

**Phương án B — Dockerfile đơn giản** với layer cache optimized:

```
python:3.11-slim
  → COPY requirements.txt
  → RUN pip install (cached layer)
  → COPY src/server/
  → CMD uvicorn main:app --host 0.0.0.0 --port $PORT
```

pix2tex được eager-load tại FastAPI startup (lifespan context), không phải lazy load. `/health` endpoint guard bằng `model_ready` flag — trả 503 khi model chưa xong, 200 khi đã ready. Railway plan ≥1GB RAM (Hobby tier).

## Key Decisions

| Quyết định        | Lựa chọn                         | Lý do                                                                     |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Build strategy    | Dockerfile (không Nixpacks)      | Layer cache cho torch/pix2tex; portable                                   |
| pix2tex load      | Eager at startup (lifespan)      | UptimeRobot /health làm warm-keep; không để first request chịu cold start |
| /health semantics | 503 until model ready, 200 after | Railway health check + UptimeRobot readiness                              |
| CORS scope        | Không gộp                        | ALLOWED_ORIGINS đã known; DoD D1 yêu cầu CORS pass                        |
| models.py         | Không gộp                        | Scope của Change #15                                                      |
| python-magic      | Không thêm                       | Scope của Change #20                                                      |
| PORT              | Từ env var `$PORT`               | Railway inject động, không hardcode                                       |

## Open Questions

- Không có — tất cả quyết định đã được chốt trong explore session.
