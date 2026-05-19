from uuid import UUID
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
        from PIL import Image
        import io
        pil_image = Image.open(io.BytesIO(contents))
        latex_result = ocr_model(pil_image)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                code=INTERNAL_ERROR,
                message="OCR processing failed unexpectedly.",
                retryable=True,
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
