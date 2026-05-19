from uuid import UUID
from fastapi import Header, HTTPException

from app.schemas.errors import ErrorResponse, INVALID_DEVICE_ID


def validate_device_id(x_device_id: str = Header(...)) -> UUID:
    try:
        uid = UUID(x_device_id, version=4)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_DEVICE_ID,
                message="X-Device-ID header must be a valid UUID v4.",
                retryable=False,
            ).model_dump(),
        )
    return uid
