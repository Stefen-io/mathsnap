# Verification Report: backend-core-api

**Schema:** superpowers-bridge  
**Verified:** 2026-05-19  
**Branch:** worktree-backend-core-api (15 commits)

---

## Summary

| Dimension    | Status                              |
|--------------|-------------------------------------|
| Completeness | 19/27 tasks done; 8 integration tests pending |
| Correctness  | 16/16 requirements covered; 2 divergences fixed |
| Coherence    | Design decisions followed; 1 minor pattern note |

---

## Issues by Priority

### CRITICAL (Must fix before archive)

**1. Manual integration tests 6.1–6.8 not yet executed**

Tasks 6.1–6.8 in `tasks.md` are unchecked. These require a running server with real credentials (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY) and a math image file. They cannot be automated in isolation.

- **Recommendation:** Start the server (`uv run uvicorn app.main:app --reload`), wait for `/health → 200 ok`, then execute each curl command from `plan.md §Task 8`. Mark tasks complete after each passes.
- **Scope:** `src/server/` — runtime behavior, not static code

---

### WARNING (Should fix)

~~**1. `LLM_INVALID_RESPONSE` error has `retryable=False` but spec requires `retryable: true`**~~ ✅ **FIXED** (commit: fix(server): retryable=True for LLM_INVALID_RESPONSE)

~~**2. Empty/invalid `latex` returns FastAPI 422, not spec's `400 INVALID_REQUEST`**~~ ✅ **FIXED** — Added `RequestValidationError` handler in `main.py` mapping Pydantic validation errors to `400 INVALID_REQUEST` (same commit)

---

### SUGGESTION (Nice to fix)

**1. `solver.py` fails to import without `OPENAI_API_KEY` set**

- **File:** `src/server/app/services/solver.py:22`
- `ChatOpenAI(...)` is instantiated at module load time. If `OPENAI_API_KEY` is not in the environment, the entire app fails to start at import time.
- **Context:** Documented in `design.md §R5` as accepted — `.env` pre-condition. Not a bug for production; affects running in CI/CD without secrets.
- **Recommendation:** Wrap the LLM instantiation in a lazy factory (e.g., `lru_cache`) or defer to the lifespan if secret-free import is needed for testing. Low priority given D4 decision.

**2. Timeout detection uses substring matching instead of typed exceptions**

- **File:** `src/server/app/routers/solve.py:47–60`
- `str(e).lower() + type(e).__name__.lower()` checks for "timeout" in combined string. Works today but is fragile across LangChain/OpenAI SDK versions.
- **Recommendation:** Catch `httpx.ReadTimeout`, `openai.APITimeoutError`, `asyncio.TimeoutError` explicitly before the broad fallback.

---

## Requirement Coverage

| Spec | Requirements | Status |
|------|-------------|--------|
| api-schemas | ErrorResponse + constants, OCR schemas, Solution schemas, HistoryItem camelCase, TS types, fixtures | ✅ All met |
| device-identity | Required on all endpoints, UUID v4 validation, missing header → 400, shared dependency | ✅ All met |
| ocr-endpoint | POST /api/ocr, MIME check, 2MB limit, OCR_NO_FORMULA, confidence=1.0, no disk write | ✅ All met |
| solve-endpoint | POST /api/solve, latex validation, LCEL chain, fire-and-forget, camelCase, error codes | ✅ All met (warnings fixed) |
| history-crud | GET list (pagination+filter), GET detail, DELETE 204, PATCH bookmark, 404 on foreign device | ✅ All met |

\* `latex` validation triggers 422 (FastAPI default) instead of spec's `400 INVALID_REQUEST`

---

## Design Adherence

| Decision | Status |
|----------|--------|
| D1: schemas/services/routers module split | ✅ Followed exactly |
| D2: confidence hardcoded 1.0 | ✅ Followed |
| D3: fire-and-forget via BackgroundTasks | ✅ Followed |
| D4: LCEL chain module-level singleton | ✅ Followed |
| D5: AsyncClient from supabase._async | ✅ Followed |
| D6: 10 error codes as string constants | ✅ Followed |
| D7: Client fixtures 5 items | ✅ Followed |

---

## Final Assessment

**1 critical issue remaining: integration tests 6.1–6.8 not yet executed.**

All code-level warnings have been fixed (retryable value, validation error format). The remaining gate is runtime verification with a live server, real credentials, and a math image.

**Execute integration tests (tasks 6.1–6.8), then archive.**
