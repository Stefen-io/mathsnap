## Design Summary

MathSnap backend core API: lock Pydantic schemas + TS types làm contract FE/BE; implement POST /api/ocr (pix2tex), POST /api/solve (LCEL → Supabase), và toàn bộ CRUD history endpoints; tạo client fixtures cho FE parallel dev.

## Alternatives Considered

### Phương án A: Monolithic endpoint file (current scaffold)
- **Làm**: Đặt toàn bộ routes trong `app/main.py` cùng với schemas inline.
- **Ưu điểm**: Ít file hơn, đơn giản để bắt đầu.
- **Nhược điểm**: `main.py` phình to, khó navigate, schemas không reusable từ tests hoặc CLI.
- **Vì sao không chọn**: Theo SYSTEM_DESIGN §7.5, solver.py là service riêng; schemas directory đã được documented trong server CLAUDE.md.

### Phương án B: Schemas + Services tách biệt (CHOSEN)
- **Làm**: `app/schemas/` chứa Pydantic models; `app/services/` chứa business logic (solver.py, supabase client); `app/routers/` chứa FastAPI routes (ocr.py, solve.py, history.py); `app/dependencies.py` chứa shared deps (device_id validation).
- **Ưu điểm**: Separation of concerns rõ ràng; schemas reusable trong LCEL chain và HTTP layer; dễ test từng layer riêng.
- **Nhược điểm**: Nhiều file hơn (nhưng mỗi file nhỏ).
- **Vì sao chọn**: Phù hợp với SYSTEM_DESIGN documentation, server CLAUDE.md conventions, và setup sẵn sàng cho G2 (pytest sẽ import từng module).

### Phương án C: FastAPI with APIRouter + inline Pydantic
- **Làm**: Dùng APIRouter nhưng giữ Pydantic models inline trong router files.
- **Ưu điểm**: Fewer files than B.
- **Nhược điểm**: `Solution` (dùng cả trong LCEL chain và HTTP response) phải import từ router — circular import risk.
- **Vì sao không chọn**: camelCase alias chỉ cần ở HTTP boundary; `Solution` schema cần tách khỏi HTTP layer để pass vào `.with_structured_output()` sạch.

## Agreed Approach

**Phương án B** — Schemas + Services + Routers tách biệt.

```
src/server/app/
├── schemas/
│   ├── errors.py      — ErrorResponse + 10 error code constants
│   ├── ocr.py         — OcrFormula, OcrResponse
│   ├── solution.py    — SolutionStep (snake_case), Solution
│   └── history.py     — HistoryItem (camelCase alias), SolveRequest, ...
├── services/
│   ├── solver.py      — LCEL chain (ChatPromptTemplate | ChatOpenAI.with_structured_output(Solution))
│   └── supabase.py    — AsyncClient wrapper, CRUD history_items
├── routers/
│   ├── ocr.py         — POST /api/ocr
│   ├── solve.py       — POST /api/solve
│   └── history.py     — GET/DELETE/PATCH /api/history
├── dependencies.py    — validate_device_id() FastAPI dependency
└── main.py            — include_router(), giữ lifespan
```

## Key Decisions

| Quyết định | Giá trị | Lý do |
|---|---|---|
| pix2tex confidence | `confidence=1.0` (hardcoded) | pix2tex 0.1.2 không expose confidence score |
| camelCase alias | Chỉ trên `HistoryItem`, `SolutionStep` HTTP response | `Solution` schema pass vào LCEL phải giữ snake_case tránh confuse LLM |
| Rate limiting | OUT OF SCOPE → G2 | D9 timing, solo dev, 0 buffer |
| DB write `/api/solve` | Fire-and-forget (background task) | Nếu DB fail, vẫn trả 200 với lời giải — per SD §4.3 |
| 100-item eviction | OUT OF SCOPE → G2 | Không block G1 functionality |
| History endpoints | IN SCOPE G1 | HISTORY_NOT_FOUND error code cần endpoints để có nghĩa |
| Supabase client | `create_async_client()` | FastAPI endpoint là `async def` |
| LangChain model | `gpt-4o-mini` (default, overridable via OPENAI_MODEL env) | Cost-effective cho MVP |
| Fixtures location | `src/client/fixtures/history.ts` | TypeScript export để FE import type-safe |

## Open Questions

Tất cả questions từ explore đã được resolved. Không còn open questions trước khi implement.

Pre-condition: User phải:
1. Tạo `src/server/.env` từ `.env.example` với real credentials
2. Verify `history_items` table đã được apply lên Supabase (DDL tại SYSTEM_DESIGN §3.5)
