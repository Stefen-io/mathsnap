## Why

MathSnap đã persist lời giải vào Supabase từ G2, nhưng người dùng chưa có cách xem lại hay lưu bài toán quan trọng. Đây là khoảng trống lớn nhất trong UX hiện tại: sau khi giải xong, bài toán biến mất. Change này hoàn thiện vòng lặp: chụp → giải → lưu → xem lại → bookmark → học lại.

## What Changes

**PATCH /api/history/{id}/bookmark — contract fix**
- From: toggle ngầm, không có body, không idempotent
- To: nhận body `{ "isBookmarked": bool }`, set value trực tiếp, idempotent
- Reason: System Design §4.7 yêu cầu idempotency; client retry không được flip state
- Impact: non-breaking (không có frontend code nào gọi endpoint này hiện tại)

**BottomNav — thêm tab Bookmarks**
- From: 3 tabs (Home | Lịch sử | Cài đặt)
- To: 4 tabs (Home | Lịch sử | Bookmark | Cài đặt)
- Reason: Bookmark là tính năng core của change này
- Impact: UX navigation

**Bookmark button trên solve page — wiring**
- From: button render nhưng không có onClick, không có state
- To: onClick gọi `PATCH /api/history/{id}/bookmark`, visual toggle (outlined ↔ filled + green bg)
- Reason: Người dùng cần bookmark ngay sau khi giải
- Impact: solve/page.tsx

## Capabilities

### New Capabilities
- `history-list-view`: S-08 — danh sách bài toán đã giải, swipe-to-delete, bookmark toggle inline
- `bookmark-list-view`: S-09 — danh sách bài đã bookmark, cùng pattern với history list
- `history-item-detail`: `/history/{id}` — xem lại lời giải đã lưu từ DB, không re-solve
- `manual-latex-input`: S-11 — nhập LaTeX thủ công → submit → /ocr → /solve
- `settings-screen`: S-13 — toggle EN/VI, persist vào localStorage

### Modified Capabilities
- `history-crud`: PATCH /bookmark contract thay đổi từ toggle → explicit body
- `solution-viewer`: thêm bookmark state và onClick wiring vào solve/page.tsx
- `home-screen`: FR-1b — thêm file picker bên cạnh Camera CTA

## Impact

**Backend:**
- `src/server/app/routers/history.py` — update `toggle_bookmark` endpoint signature
- `src/server/app/schemas/history.py` — thêm `BookmarkRequest` model
- `src/server/app/services/supabase.py` — rename/update `toggle_bookmark` → `set_bookmark`

**Frontend:**
- `src/client/lib/api.ts` — thêm 4 functions: `getHistory`, `getHistoryItem`, `deleteHistoryItem`, `toggleBookmark`
- `src/client/types/history.ts` — thêm `HistoryListResponse` interface
- `src/client/components/BottomNav.tsx` — thêm Bookmarks tab
- `src/client/app/(main)/history/page.tsx` — CREATE
- `src/client/app/(main)/history/[id]/page.tsx` — CREATE
- `src/client/app/(main)/bookmarks/page.tsx` — CREATE
- `src/client/app/(main)/settings/page.tsx` — CREATE
- `src/client/app/(main)/manual/page.tsx` — CREATE
- `src/client/app/solve/page.tsx` — wire bookmark button
- `src/client/app/(main)/page.tsx` — add file picker
