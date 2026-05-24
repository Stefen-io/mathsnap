## Design Summary

> Brainstorming was conducted verbally during `/opsx:explore` (per the
> superpowers-bridge routing: verbal brainstorm → promote to propose). This file
> captures the already-validated design rather than re-running an interactive session.

Thống nhất màn hình hiển thị bài giải toán thành **một trang `/solve` duy nhất, tràn
màn hình**, phục vụ hai luồng:

- **SOLVE mode** — giải bài mới: đến từ `/ocr` hoặc `/manual`, dùng `ocrLatex` trong
  `CaptureContext`, gọi `postSolve`.
- **VIEW mode** — xem lại bài cũ: đến từ history/bookmarks qua `/solve?id={itemId}`,
  fetch `getHistoryItem(id, deviceId)`.

Trang `history/[id]` (và test của nó) bị xóa. `StepCard` thêm responsive cho màn hình
≤480px. 4 i18n keys `detail*` (dead code) bị xóa.

## Alternatives Considered

### Phương án A: Dual-mode `/solve` page (query param) — CHỌN
- **Làm**: Một page `/solve`, đọc `?id`. Có `id` → VIEW mode (fetch); không có → SOLVE
  mode (giải mới). Tái dùng toàn bộ success UI, bottom bar, StepCard.
- **Ưu**: `getHistoryItem` và `postSolve` trả về cùng type `HistoryItem` → zero adapter.
  Một nguồn UI duy nhất, không trùng lặp. `/solve` đã nằm ngoài `(main)` → đã tràn màn
  hình sẵn, đạt mục tiêu #1 mà không cần đụng layout.
- **Nhược**: `useSearchParams()` bắt buộc `<Suspense>` boundary; cần refactor cấu trúc
  export của page. Logic mount phải branch theo mode trước guard `ocrLatex`.
- **Vì sao thắng**: Loại bỏ hoàn toàn UI trùng lặp giữa `/solve` và `/history/[id]`, tận
  dụng type tương thích sẵn có, và đúng tinh thần "một màn hình tràn".

### Phương án B: Giữ `/history/[id]` nhưng chuyển ra ngoài `(main)` cho tràn màn hình
- **Làm**: Để hai page riêng; chỉ move `history/[id]` ra khỏi `(main)` group để full-bleed.
- **Ưu**: Thay đổi nhỏ, không cần `useSearchParams`/Suspense, không đụng routing list.
- **Nhược**: UI success (header + KaTeX + StepCard list + bottom bar) bị **duplicate** ở
  hai nơi → drift theo thời gian. Không thực sự "thống nhất một màn hình".
- **Vì sao không**: Mâu thuẫn mục tiêu cốt lõi (unify), để lại nợ kỹ thuật song trùng.

### Phương án C: `/history/[id]` redirect sang `/solve?id=`
- **Làm**: Giữ route `[id]`, nội dung chỉ redirect tới `/solve?id=`.
- **Ưu**: Giữ deep-link cũ tương thích ngược.
- **Nhược**: Thêm một hop điều hướng thừa; vẫn còn file/route phải bảo trì; không có yêu
  cầu giữ URL cũ (chưa publish).
- **Vì sao không**: Indirection không cần thiết; xóa hẳn sạch hơn.

## Agreed Approach

**Phương án A** — Dual-mode `/solve` với mode detection qua `searchParams.get('id')`.
Component nội dung được tách thành `SolvePageContent` (dùng `useSearchParams`), export
default là wrapper bọc `<Suspense>` với skeleton loading hiện có làm fallback.

## Key Decisions

1. **Suspense pattern**: `export default` là wrapper `<Suspense fallback={<LoadingUI/>}>`
   bọc `SolvePageContent`. `'use client'` không đủ — `next build` sẽ lỗi nếu thiếu Suspense.
2. **Mode detection**: `const viewId = searchParams.get('id')`; có → VIEW, không → SOLVE.
3. **Guard `ocrLatex`**: chỉ `router.replace('/camera')` khi `!viewId && !ocrLatex` (tránh
   bounce nhầm người dùng VIEW mode).
4. **Display LaTeX**: header render `item.latex` ở VIEW mode (vì `ocrLatex` null khi deep
   link), render `ocrLatex` ở SOLVE mode — cần một nguồn "displayLatex" thống nhất.
5. **One-shot fetch guard**: VIEW mode cũng cần guard kiểu `solveStartedRef` chống double
   fetch dưới StrictMode.
6. **Responsive StepCard**: `[@media(max-width:480px)]` giảm font text; `clamp(1.5rem,
   7vw, 2.5rem)` cho answer formula; `overflow-x: auto` cho KaTeX container (bỏ ép center
   khi tràn để scroll hoạt động).
7. **i18n**: xóa `detailTitle/detailAriaBack/detailAriaBookmark/detailNewProblem` khỏi cả
   `vi` và `en` (giá trị trùng hệt `solve*`); parity test giữ nguyên.
8. **Navigation**: history & bookmarks đổi `router.push('/history/${id}')` →
   `router.push('/solve?id=${id}')`. Back & "Bài mới" giữ hành vi hiện có.

## Open Questions

Không còn — tất cả design forks đã chốt trong explore. Quyết định cuối cùng cần lock
(Suspense Option A vs window.location Option B) đã chọn **Option A (Suspense)**.
