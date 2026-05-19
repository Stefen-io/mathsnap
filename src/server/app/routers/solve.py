import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from langchain_core.exceptions import OutputParserException

from app.dependencies import validate_device_id
from app.schemas.errors import (
    ErrorResponse,
    LLM_CONTENT_POLICY,
    LLM_INVALID_RESPONSE,
    LLM_TIMEOUT,
    INTERNAL_ERROR,
)
from app.schemas.history import HistoryItem, SolveRequest
from app.services import solver as solver_service
from app.services import supabase as db
from app.services.solver import LANGUAGE_NAMES

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/solve", tags=["Solve"])
async def solve(
    body: SolveRequest,
    background_tasks: BackgroundTasks,
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    try:
        solution = await solver_service.solver_chain.ainvoke(
            {"latex": body.latex, "language": LANGUAGE_NAMES.get(body.language, body.language)}
        )
    except OutputParserException:
        raise HTTPException(
            status_code=502,
            detail=ErrorResponse(
                code=LLM_INVALID_RESPONSE,
                message="LLM returned an invalid response.",
                retryable=True,
            ).model_dump(),
        )
    except Exception as e:
        err = str(e).lower() + type(e).__name__.lower()
        if "timeout" in err or "readtimeout" in err or "timeouterror" in err:
            raise HTTPException(
                status_code=504,
                detail=ErrorResponse(
                    code=LLM_TIMEOUT,
                    message="LLM request timed out.",
                    retryable=True,
                ).model_dump(),
            )
        if "content_filter" in err or "content policy" in err:
            raise HTTPException(
                status_code=502,
                detail=ErrorResponse(
                    code=LLM_CONTENT_POLICY,
                    message="Request was blocked by content policy.",
                    retryable=False,
                ).model_dump(),
            )
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                code=INTERNAL_ERROR,
                message="An unexpected error occurred.",
                retryable=True,
            ).model_dump(),
        )

    item = HistoryItem(
        id=uuid4(),
        device_id=device_id,
        latex=body.latex,
        solution_steps=solution.steps,
        language=body.language,
        created_at=datetime.now(timezone.utc),
        is_bookmarked=False,
    )

    async def _persist() -> None:
        try:
            client = await db.get_supabase()
            await db.insert_history_item(
                client, device_id, body.latex, solution, body.language,
                item_id=item.id,
                created_at=item.created_at,
            )
        except Exception as e:
            logger.warning("Background DB persist failed: %s", e)

    background_tasks.add_task(_persist)

    return item.model_dump(by_alias=True, mode="json")
