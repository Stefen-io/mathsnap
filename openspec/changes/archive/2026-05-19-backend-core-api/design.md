## Context

MathSnap v2.0.0 backend scaffold: FastAPI app với `lifespan` load pix2tex model, CORS middleware, `/health` endpoint. Không có schemas, routes, hay service logic. FE (Next.js) chưa có types hay API integration.

Dependencies đã pin và install trong venv: `pix2tex==0.1.2`, `langchain-core==0.2.40`, `langchain-openai==0.1.20`, `supabase==2.4.0`.

Timeline: D9 (19/05), chậm 7 ngày so với D2 plan. Solo dev, 0 buffer.

## Goals / Non-Goals

**Goals:**
- Lock Pydantic schemas và TS types làm FE/BE contract
- `POST /api/ocr` hoạt động end-to-end (pix2tex → OcrResponse)
- `POST /api/solve` hoạt động end-to-end (LCEL → ChatOpenAI → Supabase INSERT → HistoryItem)
- History CRUD endpoints (`GET`, `DELETE`, `PATCH /bookmark`)
- Client fixtures cho FE parallel development
- X-Device-ID validation trên tất cả endpoints

**Non-Goals:**
- Rate limiting (daily quota + burst sliding window) → G2
- Pytest test suite → G2
- 100-item history eviction → G2
- Input validation ngoài MIME type và UUID format → G2
- Logging (Railway/LangSmith) → G2

## Decisions

### D1: Module structure — Schemas + Services + Routers tách biệt

```
src/server/app/
├── schemas/
│   ├── errors.py      — ErrorResponse + 10 error code string constants
│   ├── ocr.py         — OcrFormula(latex, confidence=1.0), OcrResponse(formulas)
│   ├── solution.py    — SolutionStep (snake_case), Solution (snake_case, no alias)
│   └── history.py     — HistoryItem (camelCase alias), SolveRequest, HistoryListResponse
├── services/
│   ├── solver.py      — LCEL chain module-level singleton
│   └── supabase.py    — AsyncClient factory + CRUD functions
├── routers/
│   ├── ocr.py         — POST /api/ocr
│   ├── solve.py       — POST /api/solve
│   └── history.py     — GET/DELETE/PATCH /api/history/*
├── dependencies.py    — validate_device_id() FastAPI Depends
└── main.py            — include_router() + giữ nguyên lifespan
```

Rationale: `Solution` schema (pass vào LCEL) phải không có alias để LLM nhận JSON schema sạch. `HistoryItem` dùng `alias_generator=to_camel` chỉ ở HTTP boundary. Tách biệt tránh circular import.

### D2: pix2tex confidence — hardcoded 1.0

`LatexOCR` trong pix2tex 0.1.2 trả về `str` đơn thuần, không expose confidence score. `OcrFormula.confidence` được set `1.0` cố định với comment giải thích. FE vẫn check `< 0.6` threshold — sẽ không trigger cho đến khi G2 implement real confidence (nếu có).

### D3: Supabase DB write — fire-and-forget via BackgroundTasks

`/api/solve` response không chờ DB write hoàn thành. Dùng FastAPI `BackgroundTasks` để INSERT `history_items` sau khi trả response. Nếu DB fail, lời giải vẫn được trả về cho user. Per SYSTEM_DESIGN §4.3.

### D4: LCEL chain — module-level singleton

```python
# app/services/solver.py
_llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    timeout=14,
    max_retries=1,
    temperature=0,
).with_structured_output(Solution)

solver_chain = _prompt | _llm
```

Chain khởi tạo một lần khi module được import (cùng pattern với `ocr_model` trong lifespan). Per SYSTEM_DESIGN §7.3. `model` overridable qua `OPENAI_MODEL` env var.

### D5: Supabase — AsyncClient

`from supabase import create_async_client` — tương thích với `async def` endpoints. Client được tạo lazy trong dependency hoặc `lifespan`. `SUPABASE_KEY` trong `.env` là service role key (bypass RLS) vì backend tự manage device_id scoping.

### D6: Error handling

10 error codes từ SYSTEM_DESIGN §4.8 được implement đầy đủ dưới dạng string constants trong `schemas/errors.py`. Tất cả `HTTPException` raise với `detail=ErrorResponse(...).model_dump()`.

### D7: Client fixtures

`src/client/fixtures/history.ts` — TypeScript file export array `MOCK_HISTORY: HistoryItem[]` với 5 items bao gồm: 1 đã bookmark, 1 với nhiều steps, 1 với formula null, 1 tiếng Anh, 1 tiếng Việt. FE import trực tiếp.

## Risks / Trade-offs

**[R1] Supabase table chưa tồn tại** → Mitigation: Task đầu tiên trong tasks.md là verify DDL đã apply. Nếu chưa: apply DDL từ SYSTEM_DESIGN §3.5 trước khi implement `/api/solve`.

**[R2] langchain-core 0.2.40 API surface khác docs hiện tại** → Mitigation: Verify `ChatOpenAI.with_structured_output()` parameter names với `python -c "from langchain_openai import ChatOpenAI; help(ChatOpenAI.with_structured_output)"` trong venv trước khi viết service code.

**[R3] pix2tex 15-30s startup làm dev loop chậm** → Mitigation: Đã handled bởi `/health` 503 check. Không có workaround — đây là đặc tính của model load. Test OCR endpoint sau khi `/health` trả 200.

**[R4] BackgroundTask DB write không được retry nếu fail** → Accepted trade-off per SYSTEM_DESIGN §4.3. G2 sẽ add structured logging để catch DB failures.

**[R5] `.env` không tồn tại** → Mitigation: Pre-condition documented trong tasks.md task 0. User phải copy `.env.example` → `.env` và fill credentials trước khi bắt đầu implement services.

## Migration Plan

1. User tạo `.env` từ `.env.example` với real credentials
2. User verify `history_items` table tồn tại trên Supabase
3. Implement schemas → dependencies → services → routers → main.py wiring
4. Manual test với Postman/curl theo thứ tự: /health → /api/ocr → /api/solve → /api/history
5. Commit với message: `feat(server): implement core API endpoints (ocr, solve, history)`
6. Tạo `src/client/types/history.ts` và `src/client/fixtures/history.ts`
7. Commit với message: `feat(client): add TS types and fixtures for history`

Rollback: `git revert` — không có DB migration trong change này (DDL apply riêng).

## Open Questions

Tất cả resolved trong explore session. Không còn open questions.
