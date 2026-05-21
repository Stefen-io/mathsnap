import os
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pix2tex.cli import LatexOCR

from app.schemas.errors import ErrorResponse, INVALID_REQUEST

from app.routers import ocr as ocr_router
from app.routers import solve as solve_router
from app.routers import history as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.ocr_model = LatexOCR()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="MathSnap API",
    description=(
        "MathSnap — AI-powered math tutor. "
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


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            code=INVALID_REQUEST,
            message="Invalid request parameters.",
            retryable=False,
        ).model_dump(),
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
    if not hasattr(app.state, "ocr_model") or app.state.ocr_model is None:
        raise HTTPException(status_code=503, detail="model loading")
    return {"status": "ok"}


app.include_router(ocr_router.router, prefix="/api")
app.include_router(solve_router.router, prefix="/api")
app.include_router(history_router.router, prefix="/api")
