# backend-core-api Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship POST /api/ocr, POST /api/solve, history CRUD endpoints + TS types + client fixtures as a functional FE/BE contract.

**Architecture:** Schemas → services → routers layered split. `LatexOCR` loaded once at startup via lifespan and stored on `app.state`. LCEL chain is a module-level singleton. Supabase AsyncClient created in lifespan and stored on `app.state`. All endpoints share `validate_device_id` FastAPI dependency.

**Tech Stack:** Python 3.12, FastAPI 0.111, pydantic v2, pix2tex 0.1.2, langchain-core 0.2.40, langchain-openai 0.1.20, supabase 2.4.0 (async via `supabase._async.client`), uv. Frontend: TypeScript, Next.js.

---

## File Map

```
CREATE src/server/app/schemas/__init__.py
CREATE src/server/app/schemas/errors.py
CREATE src/server/app/schemas/ocr.py
CREATE src/server/app/schemas/solution.py
CREATE src/server/app/schemas/history.py
CREATE src/server/app/dependencies.py
CREATE src/server/app/services/__init__.py
CREATE src/server/app/services/solver.py
CREATE src/server/app/services/supabase.py
CREATE src/server/app/routers/__init__.py
CREATE src/server/app/routers/ocr.py
CREATE src/server/app/routers/solve.py
CREATE src/server/app/routers/history.py
MODIFY src/server/app/main.py
CREATE src/client/types/history.ts
CREATE src/client/fixtures/history.ts
```

---

## Task 0: Pre-conditions

**Files:** none (environment setup)

- [ ] **Step 1: Create .env from example**

```bash
cd src/server
cp .env.example .env
```

Then edit `.env` and fill in real values:

```
ALLOWED_ORIGINS=http://localhost:3000
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=<your-key>
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_KEY=<your-service-role-key>
DAILY_SOLVE_LIMIT=20
DAILY_OCR_LIMIT=20
BURST_LIMIT_PER_MINUTE=5
```

- [ ] **Step 2: Verify history_items table exists in Supabase**

Go to Supabase SQL Editor and run:

```sql
SELECT 1 FROM history_items LIMIT 1;
```

If error `relation "history_items" does not exist`, apply this DDL first:

```sql
CREATE TABLE history_items (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id      UUID        NOT NULL,
    latex          TEXT        NOT NULL CHECK (char_length(latex) <= 2000),
    solution_steps JSONB       NOT NULL DEFAULT '[]'::jsonb,
    language       VARCHAR(2)  NOT NULL DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_bookmarked  BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_history_items_device_id ON history_items (device_id, created_at DESC);
```

---

## Task 1: Pydantic Schemas

**Files:**

- Create: `src/server/app/schemas/__init__.py`
- Create: `src/server/app/schemas/errors.py`
- Create: `src/server/app/schemas/ocr.py`
- Create: `src/server/app/schemas/solution.py`
- Create: `src/server/app/schemas/history.py`

- [ ] **Step 1: Create schemas package**

```bash
mkdir -p src/server/app/schemas
touch src/server/app/schemas/__init__.py
```

- [ ] **Step 2: Create errors.py**

Create `src/server/app/schemas/errors.py`:

```python
from pydantic import BaseModel

INVALID_IMAGE = "INVALID_IMAGE"
INVALID_DEVICE_ID = "INVALID_DEVICE_ID"
INVALID_REQUEST = "INVALID_REQUEST"
OCR_NO_FORMULA = "OCR_NO_FORMULA"
HISTORY_NOT_FOUND = "HISTORY_NOT_FOUND"
RATE_LIMITED = "RATE_LIMITED"
LLM_TIMEOUT = "LLM_TIMEOUT"
LLM_INVALID_RESPONSE = "LLM_INVALID_RESPONSE"
LLM_CONTENT_POLICY = "LLM_CONTENT_POLICY"
INTERNAL_ERROR = "INTERNAL_ERROR"


class ErrorResponse(BaseModel):
    code: str
    message: str
    retryable: bool
```

- [ ] **Step 3: Create ocr.py**

Create `src/server/app/schemas/ocr.py`:

```python
from pydantic import BaseModel


class OcrFormula(BaseModel):
    latex: str
    # pix2tex 0.1.2 does not expose a confidence score — hardcoded 1.0
    confidence: float = 1.0


class OcrResponse(BaseModel):
    formulas: list[OcrFormula]
```

- [ ] **Step 4: Create solution.py**

Create `src/server/app/schemas/solution.py`:

```python
from pydantic import BaseModel, Field


class SolutionStep(BaseModel):
    # No alias_generator — this schema is passed to LCEL .with_structured_output()
    # and must stay snake_case so OpenAI's JSON schema is unambiguous.
    index: int
    title: str = Field(max_length=100)
    explanation: str = Field(max_length=1000)
    formula: str | None = Field(default=None, max_length=500)
    is_answer: bool


class Solution(BaseModel):
    steps: list[SolutionStep] = Field(min_length=1, max_length=10)
```

- [ ] **Step 5: Create history.py**

Create `src/server/app/schemas/history.py`:

```python
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
```

- [ ] **Step 6: Verify imports work**

```bash
cd src/server
uv run python -c "
from app.schemas.errors import ErrorResponse, INVALID_IMAGE
from app.schemas.ocr import OcrResponse, OcrFormula
from app.schemas.solution import Solution, SolutionStep
from app.schemas.history import HistoryItem, SolveRequest, HistoryListResponse
print('all schemas OK')
"
```

Expected output: `all schemas OK`

- [ ] **Step 7: Verify HistoryItem serializes to camelCase**

```bash
uv run python -c "
from uuid import uuid4
from datetime import datetime
from app.schemas.history import HistoryItem
from app.schemas.solution import SolutionStep
item = HistoryItem(
    id=uuid4(), device_id=uuid4(), latex='x=1',
    solution_steps=[SolutionStep(index=1, title='T', explanation='E', formula=None, is_answer=True)],
    language='vi', created_at=datetime.now(), is_bookmarked=False
)
print(item.model_dump(by_alias=True))
"
```

Expected: dict keys include `deviceId`, `solutionSteps`, `isBookmarked`, `createdAt` (not snake_case).

- [ ] **Step 8: Commit**

```bash
cd src/server
git add app/schemas/
git commit -m "feat(server): add Pydantic schemas — errors, ocr, solution, history"
```

---

## Task 2: Shared Dependency

**Files:**

- Create: `src/server/app/dependencies.py`

- [ ] **Step 1: Create dependencies.py**

Create `src/server/app/dependencies.py`:

```python
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
```

- [ ] **Step 2: Verify UUID validation**

```bash
uv run python -c "
from app.dependencies import validate_device_id
from uuid import UUID
# valid v4
result = validate_device_id('550e8400-e29b-41d4-a716-446655440000')
print('valid UUID accepted:', type(result))
# invalid
try:
    validate_device_id('not-a-uuid')
    print('ERROR: should have raised')
except Exception as e:
    print('invalid rejected correctly:', e.status_code)
"
```

Expected: `valid UUID accepted: <class 'uuid.UUID'>` then `invalid rejected correctly: 400`

- [ ] **Step 3: Commit**

```bash
git add app/dependencies.py
git commit -m "feat(server): add validate_device_id shared dependency"
```

---

## Task 3: Services

**Files:**

- Create: `src/server/app/services/__init__.py`
- Create: `src/server/app/services/solver.py`
- Create: `src/server/app/services/supabase.py`

- [ ] **Step 1: Create services package**

```bash
mkdir -p src/server/app/services
touch src/server/app/services/__init__.py
```

- [ ] **Step 2: Create solver.py**

Create `src/server/app/services/solver.py`:

```python
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.schemas.solution import Solution

SYSTEM_PROMPT = """You are a math tutor. Solve the given math problem step by step.
Return your answer as structured JSON with a list of solution steps.
Each step must have: index (starting at 1), title (short label), explanation (full explanation),
formula (LaTeX string or null), is_answer (true only for the final answer step).
Use {language} for all explanations."""

HUMAN_TEMPLATE = "Solve this math problem: {latex}"

_prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])

_llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    timeout=14,
    max_retries=1,
    temperature=0,
).with_structured_output(Solution)

solver_chain = _prompt | _llm
```

- [ ] **Step 3: Create supabase.py**

Create `src/server/app/services/supabase.py`:

```python
import os
from uuid import UUID
from supabase._async.client import AsyncClient, create_client

from app.schemas.history import HistoryItem, HistoryListResponse
from app.schemas.solution import Solution


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
) -> HistoryItem:
    row = {
        "device_id": str(device_id),
        "latex": latex,
        "solution_steps": [step.model_dump() for step in solution.steps],
        "language": language,
        "is_bookmarked": False,
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
    response = (
        await client.table("history_items")
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
    from app.schemas.solution import SolutionStep
    return HistoryItem(
        id=row["id"],
        device_id=row["device_id"],
        latex=row["latex"],
        solution_steps=[SolutionStep(**s) for s in row["solution_steps"]],
        language=row["language"],
        created_at=row["created_at"],
        is_bookmarked=row["is_bookmarked"],
    )
```

- [ ] **Step 4: Verify solver imports (no API call yet)**

```bash
uv run python -c "
from app.services.solver import solver_chain
print('solver_chain type:', type(solver_chain).__name__)
print('solver OK')
"
```

Expected: prints `solver_chain type: RunnableSequence` (or similar) and `solver OK`. This imports the module without calling the API.

- [ ] **Step 5: Commit**

```bash
git add app/services/
git commit -m "feat(server): add solver (LCEL chain) and supabase service"
```

---

## Task 4: Routers Package + OCR Router

**Files:**

- Create: `src/server/app/routers/__init__.py`
- Create: `src/server/app/routers/ocr.py`

- [ ] **Step 1: Create routers package**

```bash
mkdir -p src/server/app/routers
touch src/server/app/routers/__init__.py
```

- [ ] **Step 2: Create routers/ocr.py**

Create `src/server/app/routers/ocr.py`:

```python
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
```

- [ ] **Step 3: Commit**

```bash
git add app/routers/
git commit -m "feat(server): add OCR router (POST /api/ocr)"
```

---

## Task 5: Solve Router

**Files:**

- Create: `src/server/app/routers/solve.py`

- [ ] **Step 1: Create routers/solve.py**

Create `src/server/app/routers/solve.py`:

```python
import asyncio
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
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
from app.schemas.solution import SolutionStep
from app.services import solver as solver_service
from app.services import supabase as db

router = APIRouter()


@router.post("/solve", tags=["Solve"])
async def solve(
    body: SolveRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    device_id: UUID = Depends(validate_device_id),
) -> dict:
    try:
        solution = await solver_service.solver_chain.ainvoke(
            {"latex": body.latex, "language": body.language}
        )
    except OutputParserException:
		    raise HTTPException(
		        status_code=502,
		        detail=ErrorResponse(code=LLM_INVALID_RESPONSE, ...).model_dump()
		    )
		except Exception as e:
		    err = str(e).lower() + type(e).__name__.lower()
		    if "timeout" in err or "readtimeout" in err or "timeouterror" in err:
		        raise HTTPException(
		            status_code=504,
		            detail=ErrorResponse(code=LLM_TIMEOUT, ...).model_dump()
		        )
		    if "content_filter" in err or "content policy" in err:
		        raise HTTPException(
		            status_code=502,
		            detail=ErrorResponse(code=LLM_CONTENT_POLICY, ...).model_dump()
		        )
		    raise HTTPException(
		        status_code=500,
		        detail=ErrorResponse(code=INTERNAL_ERROR, ...).model_dump()
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
            await db.insert_history_item(client, device_id, body.latex, solution, body.language)
        except Exception:
            pass  # fire-and-forget: DB failure does not affect response

    background_tasks.add_task(_persist)

    return item.model_dump(by_alias=True, mode="json")
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/solve.py
git commit -m "feat(server): add solve router (POST /api/solve)"
```

---

## Task 6: History Router

**Files:**

- Create: `src/server/app/routers/history.py`

- [ ] **Step 1: Create routers/history.py**

Create `src/server/app/routers/history.py`:

```python
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import validate_device_id
from app.schemas.errors import ErrorResponse, HISTORY_NOT_FOUND
from app.schemas.history import HistoryListResponse
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/history.py
git commit -m "feat(server): add history router (GET/DELETE/PATCH /api/history)"
```

---

## Task 7: Wire Up main.py

**Files:**

- Modify: `src/server/app/main.py`

- [ ] **Step 1: Update main.py to include routers and expose state**

Replace the full contents of `src/server/app/main.py` with:

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pix2tex.cli import LatexOCR

from app.routers import ocr as ocr_router
from app.routers import solve as solve_router
from app.routers import history as history_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.ocr_model = LatexOCR()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="MathSnap API",
    description=(
        "Backend API cho MathSnap — AI-powered math tutor. "
        "Nhận ảnh bài toán, trả về LaTeX (OCR) và lời giải từng bước (LLM)."
    ),
    version="1.0.0",
)

_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-Device-ID"],
)


@app.get(
    "/health",
    summary="Readiness check",
    description=(
        "Trả về `200 ok` khi pix2tex model đã load xong và sẵn sàng nhận request. "
        "Trả về `503 model loading` trong thời gian khởi động (~15-30s)."
    ),
    tags=["Infrastructure"],
)
async def health():
    if not hasattr(app.state, "ocr_model") or app.state.ocr_model is None:
        raise HTTPException(status_code=503, detail="model loading")
    return {"status": "ok"}


app.include_router(ocr_router.router, prefix="/api")
app.include_router(solve_router.router, prefix="/api")
app.include_router(history_router.router, prefix="/api")
```

- [ ] **Step 2: Start server and wait for ready**

```bash
cd src/server
uv run uvicorn app.main:app --reload
```

Wait 15-30s then in a second terminal:

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Verify Swagger shows all routes**

Open `http://localhost:8000/docs` in browser. Should see:

- `POST /api/ocr`
- `POST /api/solve`
- `GET /api/history`
- `GET /api/history/{item_id}`
- `DELETE /api/history/{item_id}`
- `PATCH /api/history/{item_id}/bookmark`
- `GET /health`

- [ ] **Step 4: Commit**

```bash
git add app/main.py
git commit -m "feat(server): wire up routers to FastAPI app"
```

---

## Task 8: Manual Integration Tests

**Files:** none (curl commands)

All commands assume server is running on `localhost:8000`. Replace `DEVICE_ID` with any UUID v4 (e.g., `a1b2c3d4-e5f6-4abc-8def-000000000001`).

- [ ] **Step 1: Test missing X-Device-ID → 400**

```bash
curl -s -X POST http://localhost:8000/api/ocr \
  -F "image=@/dev/null;type=image/jpeg" \
  | python3 -m json.tool
```

Expected: `{"detail": {"code": "INVALID_DEVICE_ID", ...}}`

- [ ] **Step 2: Test OCR with a math image → 200**

Save any math image locally (e.g., `math.jpg`), then:

```bash
curl -s -X POST http://localhost:8000/api/ocr \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001" \
  -F "image=@math.jpg" \
  | python3 -m json.tool
```

Expected: `{"formulas": [{"latex": "...", "confidence": 1.0}]}`

- [ ] **Step 3: Test OCR with non-math image → 422**

```bash
curl -s -X POST http://localhost:8000/api/ocr \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001" \
  -F "image=@any_photo.jpg" \
  | python3 -m json.tool
```

Expected: `{"detail": {"code": "OCR_NO_FORMULA", ...}}`

- [ ] **Step 4: Test POST /api/solve → 200 + Supabase row**

```bash
curl -s -X POST http://localhost:8000/api/solve \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001" \
  -d '{"latex": "2x + 3 = 7", "language": "vi"}' \
  | python3 -m json.tool
```

Expected: JSON with `id`, `deviceId`, `solutionSteps` (array of steps), `isBookmarked: false`.

Then verify in Supabase SQL Editor:

```sql
SELECT id, latex, language FROM history_items
WHERE device_id = 'a1b2c3d4-e5f6-4abc-8def-000000000001'
ORDER BY created_at DESC LIMIT 1;
```

- [ ] **Step 5: Test GET /api/history → 200 list**

```bash
curl -s "http://localhost:8000/api/history" \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001" \
  | python3 -m json.tool
```

Expected: `{"items": [...], "total": 1, "page": 1, "limit": 20}`

- [ ] **Step 6: Test PATCH bookmark → isBookmarked flips**

Use the `id` returned from step 4:

```bash
export ITEM_ID=<id-from-step-4>
curl -s -X PATCH "http://localhost:8000/api/history/$ITEM_ID/bookmark" \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001" \
  | python3 -m json.tool
```

Expected: same item with `"isBookmarked": true`.

Run again → `"isBookmarked": false`.

- [ ] **Step 7: Test DELETE → 204**

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "http://localhost:8000/api/history/$ITEM_ID" \
  -H "X-Device-ID: a1b2c3d4-e5f6-4abc-8def-000000000001"
```

Expected: `204`

- [ ] **Step 8: Commit integration test sign-off**

```bash
git commit --allow-empty -m "chore(server): manual integration tests passed — ocr, solve, history CRUD"
```

---

## Task 9: TypeScript Types and Client Fixtures

**Files:**

- Create: `src/client/types/history.ts`
- Create: `src/client/fixtures/history.ts`

- [ ] **Step 1: Create types directory and history.ts**

```bash
mkdir -p src/client/types
```

Create `src/client/types/history.ts`:

```typescript
export interface SolutionStep {
  index: number;
  title: string;
  explanation: string;
  formula?: string;
  isAnswer: boolean;
}

export interface HistoryItem {
  id: string; // UUID
  deviceId: string; // UUID
  latex: string;
  solutionSteps: SolutionStep[];
  language: 'vi' | 'en';
  createdAt: string; // ISO 8601
  isBookmarked: boolean;
}
```

- [ ] **Step 2: Create fixtures directory and history.ts**

```bash
mkdir -p src/client/fixtures
```

Create `src/client/fixtures/history.ts`:

```typescript
import type { HistoryItem } from '@/types/history';

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000001',
    deviceId: 'device-0000-0000-0000-000000000001',
    latex: '2x + 3 = 7',
    language: 'vi',
    createdAt: '2026-05-01T08:00:00.000Z',
    isBookmarked: true,
    solutionSteps: [
      {
        index: 1,
        title: 'Chuyển vế',
        explanation: 'Chuyển +3 sang vế phải, đổi dấu thành -3',
        formula: '2x = 7 - 3',
        isAnswer: false,
      },
      {
        index: 2,
        title: 'Rút gọn',
        explanation: 'Tính 7 - 3 = 4',
        formula: '2x = 4',
        isAnswer: false,
      },
      {
        index: 3,
        title: 'Kết quả',
        explanation: 'Chia cả hai vế cho 2',
        formula: 'x = 2',
        isAnswer: true,
      },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000002',
    deviceId: 'device-0000-0000-0000-000000000001',
    latex: 'x^2 - 5x + 6 = 0',
    language: 'vi',
    createdAt: '2026-05-02T09:30:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      {
        index: 1,
        title: 'Nhận dạng',
        explanation: 'Đây là phương trình bậc 2 dạng ax² + bx + c = 0 với a=1, b=-5, c=6',
        formula: undefined,
        isAnswer: false,
      },
      {
        index: 2,
        title: 'Tính delta',
        explanation: 'Δ = b² - 4ac = 25 - 24 = 1',
        formula: '\\Delta = 1',
        isAnswer: false,
      },
      {
        index: 3,
        title: 'Nghiệm 1',
        explanation: 'x₁ = (-b + √Δ) / 2a = (5 + 1) / 2 = 3',
        formula: 'x_1 = 3',
        isAnswer: false,
      },
      {
        index: 4,
        title: 'Nghiệm 2',
        explanation: 'x₂ = (-b - √Δ) / 2a = (5 - 1) / 2 = 2',
        formula: 'x_2 = 2',
        isAnswer: false,
      },
      {
        index: 5,
        title: 'Kết luận',
        explanation: 'Phương trình có hai nghiệm phân biệt',
        formula: 'x_1 = 3, x_2 = 2',
        isAnswer: true,
      },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000003',
    deviceId: 'device-0000-0000-0000-000000000001',
    latex: '\\int_0^1 x^2 \\, dx',
    language: 'vi',
    createdAt: '2026-05-03T14:00:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      {
        index: 1,
        title: 'Tích phân bất định',
        explanation: 'Áp dụng công thức ∫xⁿ dx = xⁿ⁺¹/(n+1)',
        formula: '\\frac{x^3}{3}',
        isAnswer: false,
      },
      {
        index: 2,
        title: 'Kết quả',
        explanation: 'Tính tại cận trên và cận dưới: F(1) - F(0) = 1/3 - 0',
        formula: '\\frac{1}{3}',
        isAnswer: true,
      },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000004',
    deviceId: 'device-0000-0000-0000-000000000001',
    latex: '3x - 2 = 10',
    language: 'en',
    createdAt: '2026-05-04T11:00:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      {
        index: 1,
        title: 'Add 2 to both sides',
        explanation: 'Adding 2 to both sides isolates the term with x',
        formula: '3x = 12',
        isAnswer: false,
      },
      {
        index: 2,
        title: 'Divide both sides by 3',
        explanation: 'Dividing both sides by 3 gives us the value of x',
        formula: 'x = 4',
        isAnswer: true,
      },
    ],
  },
  {
    id: 'a1b2c3d4-e5f6-4abc-8def-000000000005',
    deviceId: 'device-0000-0000-0000-000000000001',
    latex: '\\frac{d}{dx}(x^3)',
    language: 'vi',
    createdAt: '2026-05-05T16:45:00.000Z',
    isBookmarked: false,
    solutionSteps: [
      {
        index: 1,
        title: 'Quy tắc lũy thừa',
        explanation: 'Áp dụng d/dx(xⁿ) = n·xⁿ⁻¹ với n = 3',
        formula: undefined,
        isAnswer: false,
      },
      {
        index: 2,
        title: 'Kết quả',
        explanation: 'Đạo hàm của x³ là 3x²',
        formula: '3x^2',
        isAnswer: true,
      },
    ],
  },
];
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd src/client
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd src/client
git add types/history.ts fixtures/history.ts
git commit -m "feat(client): add TS types and sample fixtures for history"
```

---

## Task 10: Final Backend Commit

- [ ] **Step 1: Stage all backend files and commit**

```bash
cd src/server
git add app/
git commit -m "feat(server): implement core API — ocr, solve, history CRUD endpoints"
```

---

## Self-Review Checklist

**Spec coverage:**

- ✅ `ocr-endpoint`: POST /api/ocr, MIME validation, size check, OCR_NO_FORMULA, confidence=1.0, no disk write
- ✅ `solve-endpoint`: POST /api/solve, LCEL chain, LLM_TIMEOUT/LLM_INVALID_RESPONSE, fire-and-forget DB, camelCase response
- ✅ `history-crud`: GET list (pagination+filter), GET detail, DELETE (204), PATCH bookmark, all with 404 on not-found/foreign-device
- ✅ `api-schemas`: ErrorResponse + 10 constants, OcrFormula/OcrResponse, SolutionStep/Solution (snake_case), HistoryItem (camelCase alias), TS types, fixtures (5 items)
- ✅ `device-identity`: UUID v4 validation, 400 INVALID_DEVICE_ID, shared dependency, reused across all routers

**Type consistency check:**

- `SolutionStep` fields: `index, title, explanation, formula, is_answer` — used consistently in solution.py, supabase.py `_row_to_item`, and fixtures
- `HistoryItem` constructed with `device_id=`, `solution_steps=` (snake_case) and serialized with `by_alias=True` — consistent in solve.py, history.py, supabase.py
- `solver_chain.ainvoke({"latex": ..., "language": ...})` — matches `HUMAN_TEMPLATE` variables in solver.py
- `db.insert_history_item(client, device_id, body.latex, solution, body.language)` — matches function signature in supabase.py
