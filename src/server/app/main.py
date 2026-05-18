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


app = FastAPI(
    lifespan=lifespan,
    title="MathSnap API",
    description=(
        "Backend API cho MathSnap — AI-powered math tutor. "
        "Nhận ảnh bài toán, trả về LaTeX (OCR) và lời giải từng bước (LLM)."
    ),
    version="1.0.0",
)

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


@app.get(
    "/health",
    summary="Readiness check",
    description=(
        "Trả về `200 ok` khi pix2tex model đã load xong và sẵn sàng nhận request. "
        "Trả về `503 model loading` trong thời gian khởi động (~15-30s)."
    ),
    tags=["Infrastructure"],
)
async def health():
    if ocr_model is None:
        raise HTTPException(status_code=503, detail="model loading")
    return {"status": "ok"}
