## Why

Backend hiện chỉ có `/health` endpoint. FE không thể gọi OCR hay nhận lời giải, và không có contract schema nào giữa FE/BE. Phase 2.5 M4 deadline đã qua (18/05) — cần ship core API ngay để unblock G2 (hardening), G3 (camera flow), G4 (solve flow) đang bị block hoàn toàn.

## What Changes

**Backend: từ scaffold sang functional API**
- From: `app/main.py` chỉ có `/health` endpoint, không có schemas, không có business logic.
- To: Đầy đủ `POST /api/ocr`, `POST /api/solve`, `GET/DELETE/PATCH /api/history/*` với Pydantic schemas, LCEL chain, Supabase CRUD.
- Reason: Prerequisite cho tất cả G2–G4 changes.
- Impact: Non-breaking (additive); requires `.env` credentials trước khi deploy.

**Frontend: từ không có types sang typed contract**
- From: Không có TypeScript types cho history, không có fixtures.
- To: `src/client/types/history.ts` (SolutionStep, HistoryItem) + `src/client/fixtures/` (3-5 sample items).
- Reason: Cho phép FE dev song song với BE implementation.
- Impact: Non-breaking; FE components có thể import types ngay.

## Capabilities

### New Capabilities
- `ocr-endpoint`: POST /api/ocr — nhận ảnh, chạy pix2tex in-process, trả OcrResponse với formulas array
- `solve-endpoint`: POST /api/solve — nhận LaTeX, chạy LCEL chain → ChatOpenAI structured output, INSERT Supabase history_items, trả HistoryItem
- `history-crud`: GET/DELETE/PATCH /api/history endpoints — list, detail, delete, toggle bookmark theo device_id scope
- `api-schemas`: Pydantic schemas (ErrorResponse, OcrFormula, OcrResponse, SolutionStep, Solution, HistoryItem) + TypeScript types + client fixtures
- `device-identity`: X-Device-ID header validation dependency — UUID v4 format check, 400 INVALID_DEVICE_ID nếu sai

### Modified Capabilities
- (none — tất cả là additive mới)

## Impact

- **Files mới**: `app/schemas/` (4 files), `app/services/` (2 files), `app/routers/` (3 files), `app/dependencies.py`, `src/client/types/history.ts`, `src/client/fixtures/history.ts`
- **Files sửa**: `app/main.py` (add `include_router()` calls)
- **Dependencies**: Đã có trong `pyproject.toml` — pix2tex, langchain-openai, langchain-core, supabase, pydantic
- **Environment**: Cần `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` trong `.env`
- **Supabase**: `history_items` table phải tồn tại (DDL tại SYSTEM_DESIGN §3.5) trước khi `/api/solve` hoạt động
