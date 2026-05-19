## 0. Pre-conditions (phải hoàn thành trước khi bắt đầu)

- [x] 0.1 Tạo `src/server/.env` từ `.env.example` — điền `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_MODEL=gpt-4o-mini`
- [x] 0.2 Verify `history_items` table tồn tại trên Supabase: chạy `SELECT 1 FROM history_items LIMIT 1` trong Supabase SQL Editor — nếu lỗi, apply DDL từ SYSTEM_DESIGN §3.5 trước khi tiếp tục

## 1. Pydantic Schemas (app/schemas/)

- [ ] 1.1 Tạo `app/schemas/__init__.py` (empty)
- [ ] 1.2 Tạo `app/schemas/errors.py` — `ErrorResponse(code, message, retryable)` + 10 string constants: `INVALID_IMAGE`, `INVALID_DEVICE_ID`, `INVALID_REQUEST`, `OCR_NO_FORMULA`, `HISTORY_NOT_FOUND`, `RATE_LIMITED`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `LLM_CONTENT_POLICY`, `INTERNAL_ERROR`
- [ ] 1.3 Tạo `app/schemas/ocr.py` — `OcrFormula(latex: str, confidence: float = 1.0)`, `OcrResponse(formulas: list[OcrFormula])`
- [ ] 1.4 Tạo `app/schemas/solution.py` — `SolutionStep(index: int, title: str, explanation: str, formula: str | None, is_answer: bool)` snake_case no alias; `Solution(steps: list[SolutionStep] = Field(min_length=1, max_length=10))`
- [ ] 1.5 Tạo `app/schemas/history.py` — `HistoryItem` với `ConfigDict(alias_generator=to_camel, populate_by_name=True)`, `SolveRequest(latex: str = Field(min_length=1, max_length=2000), language: Literal["vi", "en"] = "vi")`, `HistoryListResponse(items, total, page, limit)`

## 2. Shared Dependency

- [ ] 2.1 Tạo `app/dependencies.py` — `validate_device_id(x_device_id: str = Header(...))` function: parse UUID, raise `HTTPException(400, ErrorResponse(INVALID_DEVICE_ID,...).model_dump())` nếu không phải UUID v4 hợp lệ; return `UUID` object

## 3. Services

- [ ] 3.1 Tạo `app/services/__init__.py` (empty)
- [ ] 3.2 Tạo `app/services/solver.py` — verify `ChatOpenAI.with_structured_output()` parameter API trong venv trước khi viết; tạo module-level `solver_chain = ChatPromptTemplate | ChatOpenAI(model=os.getenv("OPENAI_MODEL","gpt-4o-mini"), timeout=14, max_retries=1, temperature=0).with_structured_output(Solution)`; định nghĩa `SYSTEM_PROMPT` và `HUMAN_TEMPLATE` (bilingual, instruction dùng language param)
- [ ] 3.3 Tạo `app/services/supabase.py` — factory function tạo `AsyncClient` từ env vars; CRUD functions: `insert_history_item()`, `get_history_list()`, `get_history_item()`, `delete_history_item()`, `toggle_bookmark()`

## 4. Routers

- [ ] 4.1 Tạo `app/routers/__init__.py` (empty)
- [ ] 4.2 Tạo `app/routers/ocr.py` — `POST /api/ocr`: validate file MIME + size, `Depends(validate_device_id)`, gọi `ocr_model.predict()` (access qua `app.state` hoặc module-level global), handle `OCR_NO_FORMULA`, trả `OcrResponse`
- [ ] 4.3 Tạo `app/routers/solve.py` — `POST /api/solve`: `Depends(validate_device_id)`, gọi `solver_chain.ainvoke()`, dùng `BackgroundTasks` cho Supabase INSERT, catch `TimeoutError → 504`, catch `OutputParserException → 502`, trả `HistoryItem` (serialize với `by_alias=True`)
- [ ] 4.4 Tạo `app/routers/history.py` — `GET /api/history` (pagination + bookmarked filter), `GET /api/history/{id}`, `DELETE /api/history/{id}`, `PATCH /api/history/{id}/bookmark` — tất cả dùng `Depends(validate_device_id)`, raise `404 HISTORY_NOT_FOUND` khi item không thuộc device

## 5. Wire Up main.py

- [ ] 5.1 Sửa `app/main.py`: thêm `include_router()` cho 3 router (prefix `/api`); expose `ocr_model` qua `app.state.ocr_model` trong lifespan để router có thể access; giữ nguyên lifespan và CORS

## 6. Manual Integration Test

- [ ] 6.1 Start server: `uv run uvicorn app.main:app --reload`; chờ `/health` trả `200 ok`
- [ ] 6.2 Test `POST /api/ocr` với ảnh toán học thực tế — verify trả `200` với `formulas` array
- [ ] 6.3 Test `POST /api/ocr` với ảnh không có công thức — verify `422 OCR_NO_FORMULA`
- [ ] 6.4 Test `POST /api/solve` với LaTeX hợp lệ — verify `200` với `solutionSteps[]`, verify row mới xuất hiện trong Supabase
- [ ] 6.5 Test `GET /api/history` với device_id đã có solve — verify list trả về đúng items
- [ ] 6.6 Test `PATCH /api/history/{id}/bookmark` — verify `isBookmarked` toggle
- [ ] 6.7 Test `DELETE /api/history/{id}` — verify item bị xóa khỏi Supabase
- [ ] 6.8 Test thiếu `X-Device-ID` header — verify `400 INVALID_DEVICE_ID`

## 7. TypeScript Types và Client Fixtures

- [ ] 7.1 Tạo `src/client/types/history.ts` — `SolutionStep` interface (camelCase), `HistoryItem` interface (camelCase, `language: 'vi' | 'en'`) per SYSTEM_DESIGN §3.7
- [ ] 7.2 Tạo `src/client/fixtures/history.ts` — export `MOCK_HISTORY: HistoryItem[]` với 5 items: 1 bookmarked, 1 nhiều steps (5+), 1 step có `formula: undefined`, 1 tiếng Anh, 1 tiếng Việt

## 8. Commit

- [ ] 8.1 Commit backend changes: `feat(server): implement core API — ocr, solve, history endpoints`
- [ ] 8.2 Commit frontend types + fixtures: `feat(client): add TS types and sample fixtures for history`
