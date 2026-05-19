from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import validate_device_id
from app.schemas.errors import ErrorResponse, HISTORY_NOT_FOUND
from app.services import supabase as db

router = APIRouter()


async def _get_client():
    return await db.get_supabase()


@router.get("/history", tags=["History"])
async def list_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    bookmarked: bool | None = Query(default=None),
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    client = await _get_client()
    result = await db.get_history_list(client, device_id, page, limit, bookmarked)
    return result.model_dump(by_alias=True, mode="json")


@router.get("/history/{item_id}", tags=["History"])
async def get_history_item(
    item_id: UUID,
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    client = await _get_client()
    item = await db.get_history_item(client, item_id, device_id)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                code=HISTORY_NOT_FOUND,
                message="History item not found.",
                retryable=False,
            ).model_dump(),
        )
    return item.model_dump(by_alias=True, mode="json")


@router.delete("/history/{item_id}", status_code=204, tags=["History"])
async def delete_history_item(
    item_id: UUID,
    device_id: UUID = Depends(validate_device_id),
) -> None:
    client = await _get_client()
    deleted = await db.delete_history_item(client, item_id, device_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                code=HISTORY_NOT_FOUND,
                message="History item not found.",
                retryable=False,
            ).model_dump(),
        )


@router.patch("/history/{item_id}/bookmark", tags=["History"])
async def toggle_bookmark(
    item_id: UUID,
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    client = await _get_client()
    item = await db.toggle_bookmark(client, item_id, device_id)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                code=HISTORY_NOT_FOUND,
                message="History item not found.",
                retryable=False,
            ).model_dump(),
        )
    return item.model_dump(by_alias=True, mode="json")
