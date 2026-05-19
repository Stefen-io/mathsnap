from uuid import UUID
from fastapi import Header, HTTPException

from app.schemas.errors import ErrorResponse, INVALID_DEVICE_ID


def validate_device_id(x_device_id: str | None = Header(default=None)) -> UUID:
    if x_device_id is None:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_DEVICE_ID,
                message="X-Device-ID header is required.",
                retryable=False,
            ).model_dump(),
        )
    try:
        uid = UUID(x_device_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_DEVICE_ID,
                message="X-Device-ID header must be a valid UUID v4.",
                retryable=False,
            ).model_dump(),
        )
    if uid.version != 4:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_DEVICE_ID,
                message="X-Device-ID header must be a valid UUID v4.",
                retryable=False,
            ).model_dump(),
        )
    return uid
