import io
from uuid import UUID

from PIL import Image
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.dependencies import validate_device_id
from app.schemas.errors import ErrorResponse, INVALID_IMAGE, OCR_NO_FORMULA, INTERNAL_ERROR
from app.schemas.ocr import OcrFormula, OcrResponse

router = APIRouter()

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
