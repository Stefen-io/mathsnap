import io
import logging
from uuid import UUID

from PIL import Image
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.dependencies import validate_device_id
from app.schemas.errors import ErrorResponse, INVALID_IMAGE, OCR_NO_FORMULA, INTERNAL_ERROR, RATE_LIMITED
from app.schemas.ocr import OcrFormula, OcrResponse
import app.rate_limit as rate_limit
from app.services import supabase as db

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2MB


@router.post("/ocr", response_model=OcrResponse, tags=["OCR"])
async def ocr(
    request: Request,
    image: UploadFile = File(...),
    device_id: UUID = Depends(validate_device_id),
) -> OcrResponse:
    if image.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_IMAGE,
                message="Unsupported file type. Accepted: jpeg, png, webp.",
                retryable=False,
            ).model_dump(),
        )

    contents = await image.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_IMAGE,
                message="File exceeds 2MB limit.",
                retryable=False,
            ).model_dump(),
        )

    if not rate_limit.check_burst(str(device_id)):
        logger.warning("rate_limited device=%s... type=burst endpoint=ocr", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.",
                retryable=True,
            ).model_dump(),
        )

    client = await db.get_supabase()
    # Daily limit uses solve history as proxy (D2: OCR doesn't write to history_items,
    # so count(solve) ≈ count(OCR) at prototype scale. See design.md D2.)
    daily = await rate_limit.count_daily(client, device_id)
    if daily >= rate_limit.DAILY_OCR_LIMIT:
        logger.warning("rate_limited device=%s... type=daily endpoint=ocr", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.",
                retryable=False,
            ).model_dump(),
        )

    ocr_model = request.app.state.ocr_model
    try:
        pil_image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_IMAGE,
                message="Could not decode image file.",
                retryable=False,
            ).model_dump(),
        )

    try:
        latex_result = ocr_model(pil_image)
    except Exception:
        # pix2tex throws for images it cannot process (e.g. blank/uniform images)
        # which semantically means "no formula found", not a server fault
        raise HTTPException(
            status_code=422,
            detail=ErrorResponse(
                code=OCR_NO_FORMULA,
                message="No mathematical formula found in the image.",
                retryable=False,
            ).model_dump(),
        )

    if not latex_result or not latex_result.strip():
        raise HTTPException(
            status_code=422,
            detail=ErrorResponse(
                code=OCR_NO_FORMULA,
                message="No mathematical formula found in the image.",
                retryable=False,
            ).model_dump(),
        )

    return OcrResponse(formulas=[OcrFormula(latex=latex_result.strip())])
