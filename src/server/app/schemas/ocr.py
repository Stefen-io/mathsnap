from pydantic import BaseModel


class OcrFormula(BaseModel):
    latex: str
    confidence: float = 1.0


class OcrResponse(BaseModel):
    formulas: list[OcrFormula]
