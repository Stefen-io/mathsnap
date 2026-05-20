# Backend Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 2-layer rate limiting (in-memory burst + SQL daily quota), LaTeX input sanitization, and structured logging to `/api/ocr` and `/api/solve`.

**Architecture:** A new `app/rate_limit.py` module holds `check_burst()`, `count_daily()`, and `sanitize_latex()`. Both routers call these in sequence (burst first, daily second) before their core logic. Tests are written before implementation (TDD). No new runtime dependencies needed.

**Tech Stack:** FastAPI, Python 3.12, pytest + pytest-asyncio, httpx, unittest.mock (stdlib), Supabase Python client

---

## File Structure

```
src/server/
├── app/
│   ├── rate_limit.py                  ← NEW — burst window, daily count, latex sanitize
│   ├── routers/
│   │   ├── ocr.py                     ← MODIFY — add rate limit calls + logger
│   │   └── solve.py                   ← MODIFY — add rate limit calls + sanitize
│   └── services/
│       └── supabase.py                ← NO CHANGE (count_daily lives in rate_limit.py)
├── tests/
│   ├── __init__.py                    ← NEW — empty, marks directory as package
│   ├── conftest.py                    ← NEW — shared fixtures (burst reset, patched client)
│   ├── test_rate_limit.py             ← NEW — unit tests for rate_limit.py
│   ├── test_ocr_rate_limit.py         ← NEW — endpoint tests for OCR rate limits
│   └── test_solve_rate_limit.py       ← NEW — endpoint tests for Solve rate limits
└── pyproject.toml                     ← MODIFY — add [tool.pytest.ini_options]
```

---

## Task 1: Test Infrastructure

**Files:**
- Create: `src/server/tests/__init__.py`
- Create: `src/server/tests/conftest.py`
- Modify: `src/server/pyproject.toml`

- [ ] **Step 1: Create tests package**

```bash
mkdir -p src/server/tests
touch src/server/tests/__init__.py
```

- [ ] **Step 2: Add pytest asyncio config to pyproject.toml**

Open `src/server/pyproject.toml` and add this section at the end:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

Full file after change:
```toml
[project]
name = "mathsnap"
version = "0.1.0"
description = "Nhận ảnh bài toán, trả về LaTeX (OCR) và lời giải từng bước (LLM)."
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "albumentations<2.0.0",
    "fastapi==0.111.0",
    "langchain-core==0.2.40",
    "langchain-openai==0.1.20",
    "pix2tex==0.1.2",
    "pydantic>=2.0",
    "python-multipart==0.0.9",
    "supabase==2.30.0",
    "uvicorn==0.30.0",
    "websockets>=13",
]

[dependency-groups]
dev = [
    "httpx>=0.25.2",
    "pytest>=9.0.3",
    "pytest-asyncio>=1.3.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: Create conftest.py with shared fixtures**

Create `src/server/tests/conftest.py`:

```python
import pytest
import app.rate_limit as rl


@pytest.fixture(autouse=True)
def reset_burst():
    """Clear in-memory burst state before and after every test."""
    rl._burst.clear()
    yield
    rl._burst.clear()
```

- [ ] **Step 4: Verify pytest can collect (no tests yet)**

Run from `src/server/`:
```bash
uv run pytest --collect-only
```

Expected: `no tests ran` with exit code 5 (or 0 with "no tests found" message). No import errors.

---

## Task 2: Implement `app/rate_limit.py` (TDD)

**Files:**
- Create: `src/server/tests/test_rate_limit.py`
- Create: `src/server/app/rate_limit.py`

- [ ] **Step 1: Write failing tests**

Create `src/server/tests/test_rate_limit.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import app.rate_limit as rl


# ── check_burst ──────────────────────────────────────────────────────────────

def test_burst_allows_up_to_limit():
    device = str(uuid4())
    for _ in range(5):
        assert rl.check_burst(device) is True


def test_burst_blocks_request_over_limit():
    device = str(uuid4())
    for _ in range(5):
        rl.check_burst(device)
    assert rl.check_burst(device) is False


def test_burst_different_devices_are_independent():
    a, b = str(uuid4()), str(uuid4())
    for _ in range(5):
        rl.check_burst(a)
    # device b has no prior requests, must be allowed
    assert rl.check_burst(b) is True


# ── sanitize_latex ───────────────────────────────────────────────────────────

def test_sanitize_strips_null_bytes():
    assert rl.sanitize_latex("x\x00=1") == "x=1"


def test_sanitize_strips_control_chars():
    assert rl.sanitize_latex("\x01hello\x07world\x1f") == "helloworld"


def test_sanitize_preserves_normal_latex():
    expr = r"\frac{1}{2} + \sqrt{x^2}"
    assert rl.sanitize_latex(expr) == expr


def test_sanitize_preserves_newline_like_chars_outside_range():
    # \x20 (space) is NOT stripped — range is \x00-\x1f only
    assert rl.sanitize_latex("x = 1 + 2") == "x = 1 + 2"


# ── count_daily ──────────────────────────────────────────────────────────────

async def test_count_daily_returns_count_from_db():
    mock_client = MagicMock()
    mock_execute = AsyncMock(return_value=MagicMock(count=7))
    (mock_client.table.return_value
                .select.return_value
                .eq.return_value
                .gte.return_value
                .lt.return_value
                .execute) = mock_execute

    result = await rl.count_daily(mock_client, uuid4())
    assert result == 7


async def test_count_daily_returns_0_when_count_is_none():
    mock_client = MagicMock()
    mock_execute = AsyncMock(return_value=MagicMock(count=None))
    (mock_client.table.return_value
                .select.return_value
                .eq.return_value
                .gte.return_value
                .lt.return_value
                .execute) = mock_execute

    result = await rl.count_daily(mock_client, uuid4())
    assert result == 0
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
cd src/server && uv run pytest tests/test_rate_limit.py -v
```

Expected: `ModuleNotFoundError: No module named 'app.rate_limit'` or similar. This is the red phase.

- [ ] **Step 3: Implement `app/rate_limit.py`**

Create `src/server/app/rate_limit.py`:

```python
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from time import monotonic
from uuid import UUID

from supabase._async.client import AsyncClient

DAILY_SOLVE_LIMIT = int(os.getenv("DAILY_SOLVE_LIMIT", "20"))
DAILY_OCR_LIMIT   = int(os.getenv("DAILY_OCR_LIMIT",   "20"))
BURST_LIMIT       = int(os.getenv("BURST_LIMIT_PER_MINUTE", "5"))
BURST_WINDOW      = 60.0  # seconds

_burst: dict[str, list[float]] = defaultdict(list)
_CONTROL_RE = re.compile(r"[\x00-\x1f]")


def check_burst(device_id: str) -> bool:
    """Return True if request is within burst limit, False if exceeded."""
    now    = monotonic()
    window = _burst[device_id]
    window[:] = [t for t in window if now - t < BURST_WINDOW]
    if len(window) >= BURST_LIMIT:
        return False
    window.append(now)
    return True


async def count_daily(client: AsyncClient, device_id: UUID) -> int:
    """Return number of history_items rows for device today (UTC)."""
    today    = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    response = await (
        client.table("history_items")
        .select("id", count="exact")
        .eq("device_id", str(device_id))
        .gte("created_at", today.isoformat())
        .lt("created_at", tomorrow.isoformat())
        .execute()
    )
    return response.count or 0


def sanitize_latex(latex: str) -> str:
    """Strip ASCII control characters (\\x00–\\x1f) from LaTeX string."""
    return _CONTROL_RE.sub("", latex)
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
cd src/server && uv run pytest tests/test_rate_limit.py -v
```

Expected output (all green):
```
tests/test_rate_limit.py::test_burst_allows_up_to_limit PASSED
tests/test_rate_limit.py::test_burst_blocks_request_over_limit PASSED
tests/test_rate_limit.py::test_burst_different_devices_are_independent PASSED
tests/test_rate_limit.py::test_sanitize_strips_null_bytes PASSED
tests/test_rate_limit.py::test_sanitize_strips_control_chars PASSED
tests/test_rate_limit.py::test_sanitize_preserves_normal_latex PASSED
tests/test_rate_limit.py::test_sanitize_preserves_newline_like_chars_outside_range PASSED
tests/test_rate_limit.py::test_count_daily_returns_count_from_db PASSED
tests/test_rate_limit.py::test_count_daily_returns_0_when_count_is_none PASSED
9 passed
```

- [ ] **Step 5: Commit**

```bash
git add src/server/app/rate_limit.py src/server/tests/test_rate_limit.py src/server/tests/__init__.py src/server/tests/conftest.py src/server/pyproject.toml
git commit -m "feat(server): add rate_limit module with burst window, daily count, latex sanitize"
```

---

## Task 3: Integrate Rate Limiting into `/api/ocr` (TDD)

**Files:**
- Create: `src/server/tests/test_ocr_rate_limit.py`
- Modify: `src/server/app/routers/ocr.py`

- [ ] **Step 1: Write failing OCR rate limit tests**

Create `src/server/tests/test_ocr_rate_limit.py`:

```python
import io
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from uuid import uuid4
from PIL import Image


VALID_UUID = str(uuid4())


def _jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_ocr_burst_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is True
    assert "빠른" in body["message"] or "nhanh" in body["message"] or "빠" in body["message"] or "nhanh" in body["message"]


def test_ocr_daily_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is False


def test_ocr_burst_message_is_retryable(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    assert resp.json()["retryable"] is True


def test_ocr_daily_message_is_not_retryable(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/ocr",
            files={"image": ("t.jpg", _jpeg_bytes(), "image/jpeg")},
            headers={"X-Device-ID": VALID_UUID},
        )
    assert resp.status_code == 429
    assert resp.json()["retryable"] is False
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
cd src/server && uv run pytest tests/test_ocr_rate_limit.py -v
```

Expected: All 4 tests FAIL with 200 or 422 status (no rate limiting yet). Red phase confirmed.

- [ ] **Step 3: Update `routers/ocr.py` with rate limit checks**

Full updated file `src/server/app/routers/ocr.py`:

```python
import io
import logging
from uuid import UUID

from PIL import Image
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

import app.rate_limit as rate_limit
from app.dependencies import validate_device_id
from app.schemas.errors import (
    ErrorResponse,
    INVALID_IMAGE,
    OCR_NO_FORMULA,
    INTERNAL_ERROR,
    RATE_LIMITED,
)
from app.schemas.ocr import OcrFormula, OcrResponse
from app.services import supabase as db

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_MIME  = {"image/jpeg", "image/png", "image/webp"}
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

    # ── Rate limiting ─────────────────────────────────────────────────────
    if not rate_limit.check_burst(str(device_id)):
        logger.warning("rate_limited device=%s... type=burst endpoint=ocr", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.",
                retryable=True,
            ).model_dump(),
        )

    client = await db.get_supabase()
    daily = await rate_limit.count_daily(client, device_id)
    if daily >= rate_limit.DAILY_OCR_LIMIT:
        logger.warning("rate_limited device=%s... type=daily endpoint=ocr", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.",
                retryable=False,
            ).model_dump(),
        )
    # ─────────────────────────────────────────────────────────────────────

    ocr_model = request.app.state.ocr_model
    try:
        pil_image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                code=INVALID_IMAGE,
                message="Could not decode image file.",
                retryable=False,
            ).model_dump(),
        )

    try:
        latex_result = ocr_model(pil_image)
    except Exception:
        raise HTTPException(
            status_code=422,
            detail=ErrorResponse(
                code=OCR_NO_FORMULA,
                message="No mathematical formula found in the image.",
                retryable=False,
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

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
cd src/server && uv run pytest tests/test_ocr_rate_limit.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/app/routers/ocr.py src/server/tests/test_ocr_rate_limit.py
git commit -m "feat(server): add rate limiting to /api/ocr endpoint"
```

---

## Task 4: Integrate Rate Limiting and Sanitize into `/api/solve` (TDD)

**Files:**
- Create: `src/server/tests/test_solve_rate_limit.py`
- Modify: `src/server/app/routers/solve.py`

- [ ] **Step 1: Write failing solve rate limit tests**

Create `src/server/tests/test_solve_rate_limit.py`:

```python
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from uuid import uuid4


VALID_UUID = str(uuid4())
SOLVE_HEADERS = {"X-Device-ID": VALID_UUID}


@pytest.fixture
def client():
    from app.main import app
    with patch("app.main.LatexOCR") as MockOCR:
        MockOCR.return_value = MagicMock()
        with TestClient(app) as c:
            yield c


def test_solve_burst_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=False):
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is True


def test_solve_daily_limit_returns_429(client):
    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=20):
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    body = resp.json()
    assert body["code"] == "RATE_LIMITED"
    assert body["retryable"] is False


def test_solve_burst_check_runs_before_daily_check(client):
    """Burst check (no DB) must short-circuit before daily DB query."""
    with patch("app.rate_limit.check_burst", return_value=False) as mock_burst, \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock) as mock_daily:
        resp = client.post(
            "/api/solve",
            json={"latex": "x=1"},
            headers=SOLVE_HEADERS,
        )
    assert resp.status_code == 429
    mock_burst.assert_called_once()
    mock_daily.assert_not_called()


def test_solve_sanitizes_control_chars_before_llm(client):
    mock_solution = MagicMock()
    mock_solution.steps = []

    with patch("app.rate_limit.check_burst", return_value=True), \
         patch("app.services.supabase.get_supabase", new_callable=AsyncMock, return_value=MagicMock()), \
         patch("app.rate_limit.count_daily", new_callable=AsyncMock, return_value=0), \
         patch("app.services.solver.solver_chain.ainvoke", new_callable=AsyncMock, return_value=mock_solution) as mock_invoke:

        client.post(
            "/api/solve",
            json={"latex": "x\x07=1"},   # \x07 is BEL, within \x00-\x1f range
            headers=SOLVE_HEADERS,
        )

    # The latex passed to the chain must have control chars stripped
    invoked_latex = mock_invoke.call_args[0][0]["latex"]
    assert "\x07" not in invoked_latex
    assert invoked_latex == "x=1"
```

- [ ] **Step 2: Run tests — confirm they FAIL**

```bash
cd src/server && uv run pytest tests/test_solve_rate_limit.py -v
```

Expected: All 4 tests FAIL (no rate limiting or sanitization in solve.py yet). Red phase confirmed.

- [ ] **Step 3: Update `routers/solve.py` with rate limits and sanitize**

Full updated file `src/server/app/routers/solve.py`:

```python
import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from langchain_core.exceptions import OutputParserException

import app.rate_limit as rate_limit
from app.dependencies import validate_device_id
from app.schemas.errors import (
    ErrorResponse,
    LLM_CONTENT_POLICY,
    LLM_INVALID_RESPONSE,
    LLM_TIMEOUT,
    INTERNAL_ERROR,
    RATE_LIMITED,
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
    # ── Rate limiting ─────────────────────────────────────────────────────
    if not rate_limit.check_burst(str(device_id)):
        logger.warning("rate_limited device=%s... type=burst endpoint=solve", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.",
                retryable=True,
            ).model_dump(),
        )

    client = await db.get_supabase()
    daily = await rate_limit.count_daily(client, device_id)
    if daily >= rate_limit.DAILY_SOLVE_LIMIT:
        logger.warning("rate_limited device=%s... type=daily endpoint=solve", str(device_id)[:8])
        raise HTTPException(
            status_code=429,
            detail=ErrorResponse(
                code=RATE_LIMITED,
                message="Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.",
                retryable=False,
            ).model_dump(),
        )
    # ─────────────────────────────────────────────────────────────────────

    latex = rate_limit.sanitize_latex(body.latex)

    try:
        solution = await solver_service.solver_chain.ainvoke(
            {"latex": latex, "language": LANGUAGE_NAMES.get(body.language, body.language)}
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
        latex=latex,
        solution_steps=solution.steps,
        language=body.language,
        created_at=datetime.now(timezone.utc),
        is_bookmarked=False,
    )

    async def _persist() -> None:
        try:
            await db.insert_history_item(
                client, device_id, latex, solution, body.language,
                item_id=item.id,
                created_at=item.created_at,
            )
        except Exception as e:
            logger.warning("Background DB persist failed: %s", e)

    background_tasks.add_task(_persist)

    return item.model_dump(by_alias=True, mode="json")
```

Key changes from original:
1. Added `import app.rate_limit as rate_limit` and `RATE_LIMITED` import
2. Added burst check block (lines after `# ── Rate limiting`)
3. Added daily check block (reuses `client` for later `_persist`)
4. Added `latex = rate_limit.sanitize_latex(body.latex)` before LCEL invoke
5. `_persist()` now uses `client` from outer scope (created once, not twice)
6. `HistoryItem.latex` and `ainvoke` both use sanitized `latex`

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
cd src/server && uv run pytest tests/test_solve_rate_limit.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/app/routers/solve.py src/server/tests/test_solve_rate_limit.py
git commit -m "feat(server): add rate limiting and latex sanitization to /api/solve"
```

---

## Task 5: Full Test Suite and Manual Verification

**Files:** None (read-only verification)

- [ ] **Step 1: Run full test suite**

```bash
cd src/server && uv run pytest -v
```

Expected: All tests pass, 0 failures, 0 errors.

If any test fails, do NOT proceed to manual testing. Fix the failure first.

- [ ] **Step 2: Verify .env.example has rate limit vars**

```bash
grep -E "DAILY_SOLVE_LIMIT|BURST_LIMIT" src/server/.env.example
```

Expected output (already present from earlier work):
```
DAILY_SOLVE_LIMIT=20
DAILY_OCR_LIMIT=20
BURST_LIMIT_PER_MINUTE=5
```

If missing, add to `src/server/.env.example`:
```
# Rate limiting
DAILY_SOLVE_LIMIT=20     # Max solve requests per device per UTC day
DAILY_OCR_LIMIT=20       # Max OCR requests per device per UTC day (approx via history_items)
BURST_LIMIT_PER_MINUTE=5 # Max requests per device per 60 seconds
```

- [ ] **Step 3: Start dev server**

```bash
cd src/server && uv run uvicorn app.main:app --reload
```

Wait for `/health` to return 200 (pix2tex loads in ~15-30s):
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 4: Manual verify burst limit**

Send 6 rapid solve requests. First 5 should succeed (or fail for other reasons), 6th must return 429:

```bash
UUID=$(python3 -c "import uuid; print(uuid.uuid4())")
for i in $(seq 1 6); do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:8000/api/solve \
    -H "Content-Type: application/json" \
    -H "X-Device-ID: $UUID" \
    -d '{"latex":"x=1"}'
  echo
done
```

Expected output (status codes):
```
Request 1: 200 (or 502 if OpenAI not configured)
Request 2: 200 (or 502)
Request 3: 200 (or 502)
Request 4: 200 (or 502)
Request 5: 200 (or 502)
Request 6: 429   ← rate limited
```

- [ ] **Step 5: Manual verify burst 429 body**

```bash
UUID=$(python3 -c "import uuid; print(uuid.uuid4())")
for i in $(seq 1 5); do
  curl -s -o /dev/null http://localhost:8000/api/solve \
    -X POST -H "Content-Type: application/json" \
    -H "X-Device-ID: $UUID" -d '{"latex":"x=1"}'
done
curl -s http://localhost:8000/api/solve \
  -X POST -H "Content-Type: application/json" \
  -H "X-Device-ID: $UUID" -d '{"latex":"x=1"}'
```

Expected response body:
```json
{"code":"RATE_LIMITED","message":"Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.","retryable":true}
```

- [ ] **Step 6: Verify WARNING log appears in server terminal**

Look at the running server terminal after step 5. Expected log line (approximate):
```
WARNING:app.routers.solve:rate_limited device=<8chars>... type=burst endpoint=solve
```

- [ ] **Step 7: Final commit**

```bash
git add -p   # review and stage only expected changes
git commit -m "chore(server): verify rate limiting and env config complete"
```
