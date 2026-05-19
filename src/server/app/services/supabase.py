import os
from datetime import datetime
from uuid import UUID
from supabase._async.client import AsyncClient, create_client

from app.schemas.history import HistoryItem, HistoryListResponse
from app.schemas.solution import Solution, SolutionStep


async def get_supabase() -> AsyncClient:
    return await create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )


async def insert_history_item(
    client: AsyncClient,
    device_id: UUID,
    latex: str,
    solution: Solution,
    language: str,
    item_id: UUID,
    created_at: datetime,
) -> HistoryItem:
    row = {
        "id": str(item_id),
        "device_id": str(device_id),
        "latex": latex,
        "solution_steps": [step.model_dump() for step in solution.steps],
        "language": language,
        "is_bookmarked": False,
        "created_at": created_at.isoformat(),
    }
    response = await client.table("history_items").insert(row).execute()
    data = response.data[0]
    return _row_to_item(data)


async def get_history_list(
    client: AsyncClient,
    device_id: UUID,
    page: int,
    limit: int,
    bookmarked: bool | None,
) -> HistoryListResponse:
    query = (
        client.table("history_items")
        .select("*", count="exact")
        .eq("device_id", str(device_id))
        .order("created_at", desc=True)
        .range((page - 1) * limit, page * limit - 1)
    )
    if bookmarked is not None:
        query = query.eq("is_bookmarked", bookmarked)
    response = await query.execute()
    items = [_row_to_item(r) for r in response.data]
    return HistoryListResponse(items=items, total=response.count or 0, page=page, limit=limit)


async def get_history_item(
    client: AsyncClient,
    item_id: UUID,
    device_id: UUID,
) -> HistoryItem | None:
    response = await (
        client.table("history_items")
        .select("*")
        .eq("id", str(item_id))
        .eq("device_id", str(device_id))
        .execute()
    )
    if not response.data:
        return None
    return _row_to_item(response.data[0])


async def delete_history_item(
    client: AsyncClient,
    item_id: UUID,
    device_id: UUID,
) -> bool:
    response = (
        await client.table("history_items")
        .delete()
        .eq("id", str(item_id))
        .eq("device_id", str(device_id))
        .execute()
    )
    return bool(response.data)


async def toggle_bookmark(
    client: AsyncClient,
    item_id: UUID,
    device_id: UUID,
) -> HistoryItem | None:
    existing = await get_history_item(client, item_id, device_id)
    if existing is None:
        return None
    response = (
        await client.table("history_items")
        .update({"is_bookmarked": not existing.is_bookmarked})
        .eq("id", str(item_id))
        .eq("device_id", str(device_id))
        .execute()
    )
    if not response.data:
        return None
    return _row_to_item(response.data[0])


def _row_to_item(row: dict) -> HistoryItem:
    return HistoryItem(
        id=row["id"],
        device_id=row["device_id"],
        latex=row["latex"],
        solution_steps=[SolutionStep(**s) for s in row["solution_steps"]],
        language=row["language"],
        created_at=row["created_at"],
        is_bookmarked=row["is_bookmarked"],
    )
