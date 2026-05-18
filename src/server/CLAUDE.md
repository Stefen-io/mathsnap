# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `src/server/`. Use `uv run` — no manual venv activation needed.

```bash
uv sync																# Install / sync dependencies
uv run uvicorn app.main:app --reload	# Run dev server (hot-reload)
uv add <package>											# Add a dependency
uv remove <package>										# Remove a dependency
uv run pytest													# Run tests (all files)
```

Health check after startup (model takes ~15-30s to load):

```
GET http://localhost:8000/health        → {"status": "ok"} once ready
GET http://localhost:8000/docs          → Swagger UI
```

## Architecture

The app is a single-file FastAPI service (`app/main.py`) — routers and services directories are planned but not yet extracted.

**Request flow for `POST /api/ocr`:**

1. Validate `X-Device-ID` header (UUID v4, required on every request)
2. Validate MIME type (jpeg/png/webp only) and size (≤ 2MB)
3. Pass PIL image to `LatexOCR` (pix2tex) running **in-process**
4. Return `OcrResponse { formulas: [{ latex, confidence }] }`

**Startup:** `LatexOCR()` is loaded once via FastAPI's `lifespan` context manager into the module-level `ocr_model` global. `/health` returns 503 until the model is ready.

**Schemas** (`app/schemas/`):

- `errors.py` — `ErrorResponse(code, message, retryable)` + string constants for all error codes. All `HTTPException` details must use `.model_dump()` of this type.
- `ocr.py` — `OcrFormula(latex, confidence)` / `OcrResponse(formulas)`.

## Environment

Copy `.env.example` → `.env` and fill in:

| Variable          | Purpose                      |
| ----------------- | ---------------------------- |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `OPENAI_MODEL`    | e.g. `gpt-4o`                |
| `OPENAI_BASE_URL` | OpenAI-compatible endpoint   |
| `OPENAI_API_KEY`  | OpenAI key                   |
| `SUPABASE_URL`    | Supabase project URL         |
| `SUPABASE_KEY`    | Supabase anon/service key    |

## Key conventions

- **Error responses:** always raise `HTTPException(status_code=..., detail=ErrorResponse(...).model_dump())` using the constants in `app/schemas/errors.py`.
- **camelCase aliases:** `SolutionStep` and `HistoryItem` use `alias_generator=to_camel` with `populate_by_name=True` — use snake_case internally, camelCase in JSON.
- Images are never written to disk or sent to external services during OCR.
- Python 3.12, managed with `uv` + `pyproject.toml` + `uv.lock`.
