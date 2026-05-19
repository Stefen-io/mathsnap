from __future__ import annotations
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.schemas.solution import SolutionStep


class HistoryItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    device_id: UUID
    latex: str
    solution_steps: list[SolutionStep]
    language: Literal["vi", "en"]
    created_at: datetime
    is_bookmarked: bool


class SolveRequest(BaseModel):
    latex: str = Field(min_length=1, max_length=2000)
    language: Literal["vi", "en"] = "vi"


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    limit: int
