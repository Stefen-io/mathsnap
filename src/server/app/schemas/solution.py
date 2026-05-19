from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class SolutionStep(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    index: int
    title: str = Field(max_length=100)
    explanation: str = Field(max_length=1000)
    formula: str | None = Field(default=None, max_length=500)
    is_answer: bool


class Solution(BaseModel):
    steps: list[SolutionStep] = Field(min_length=1, max_length=10)
