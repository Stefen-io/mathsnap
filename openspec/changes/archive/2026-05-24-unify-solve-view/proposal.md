## Why

Hiện bài giải hiển thị ở hai nơi: `/solve` (giải mới, tràn màn hình, ngoài `(main)`)
và `/history/[id]` (xem lại, trong `(main)` nên bị giới hạn 480px + BottomNav). Hai
trang render gần như y hệt UI — sticky header, KaTeX problem bar, danh sách `StepCard`,
bottom action bar — dẫn tới code trùng lặp dễ drift và trải nghiệm xem lại không tràn
màn hình. Gộp về một trang `/solve` dual-mode loại bỏ trùng lặp, đồng nhất trải nghiệm,
và tận dụng việc `getHistoryItem` và `postSolve` cùng trả về type `HistoryItem`. Làm
ngay vì UI còn nhỏ nên chi phí gộp thấp; để lâu hai bản sao càng phân kỳ.

## What Changes

**Solve page rendering mode**
- From: `/solve` chỉ phục vụ SOLVE mode (đọc `ocrLatex`, gọi `postSolve`); xem lại đi qua
  trang riêng `/history/[id]`.
- To: `/solve` dual-mode — đọc query param `?id`. Có `id` → VIEW mode, fetch
  `getHistoryItem(id, deviceId)`; không có → SOLVE mode như cũ.
- Reason: loại bỏ UI trùng lặp, đồng nhất trải nghiệm tràn màn hình.
- Impact: non-breaking với người dùng (route `/history/[id]` chưa public lâu dài).

**ocrLatex guard**
- From: mount luôn `router.replace('/camera')` khi `ocrLatex === null`.
- To: chỉ redirect khi `!viewId && !ocrLatex` (VIEW mode có `id` nên không bị bounce).
- Reason: tránh đá nhầm người dùng VIEW mode (deep link) về camera.

**History / Bookmarks navigation**
- From: tap item → `router.push('/history/${item.id}')`.
- To: tap item → `router.push('/solve?id=${item.id}')`.
- Impact: non-breaking; chỉ đổi đích điều hướng.

**Removals**
- Xóa `app/(main)/history/[id]/page.tsx` và test của nó (không còn được điều hướng tới).
- Xóa 4 i18n keys `detail*` (`detailTitle`, `detailAriaBack`, `detailAriaBookmark`,
  `detailNewProblem`) — dead code; các keys `solve*` đã cover với nội dung trùng hệt.

**Responsive StepCard**
- Thêm thu nhỏ font text và answer formula khi màn hình ≤480px; bọc KaTeX formula
  container với `overflow-x: auto` để công thức dài cuộn ngang thay vì tràn.

## Capabilities

### New Capabilities
- (none) — "view mode" là mở rộng của capability `solution-viewer` hiện có, không phải
  capability mới.

### Modified Capabilities
- `solution-viewer`: thêm VIEW mode (fetch theo `?id`), `<Suspense>` boundary cho
  `useSearchParams`, guard `ocrLatex` theo mode, displayLatex thống nhất, và responsive
  StepCard (text + answer formula + overflow-x cho KaTeX).
- `history-list-view`: đích điều hướng khi tap item đổi sang `/solve?id={item.id}`.
- `bookmark-list-view`: đích điều hướng khi tap item đổi sang `/solve?id={item.id}`.
- `history-item-detail`: **REMOVED** — toàn bộ requirements bị gỡ; trang `/history/[id]`
  và test bị xóa.

## Impact

- **Code**:
  - `src/client/app/solve/page.tsx` — dual-mode + Suspense wrapper.
  - `src/client/app/(main)/history/page.tsx` — đổi 1 dòng navigation.
  - `src/client/app/(main)/bookmarks/page.tsx` — đổi 1 dòng navigation.
  - `src/client/app/(main)/history/[id]/page.tsx` — XÓA.
  - `src/client/app/(main)/history/[id]/page.test.tsx` — XÓA.
  - `src/client/components/StepCard.tsx` — responsive.
  - `src/client/lib/i18n.ts` — xóa 4 keys `detail*`.
  - `src/client/app/solve/page.test.tsx` — thêm mock `useSearchParams` + `getHistoryItem`
    và test cases VIEW mode.
- **APIs**: không đổi backend; tái dùng `GET /api/history/{id}` qua `getHistoryItem`.
- **Dependencies**: không thêm package.
- **Build risk**: `useSearchParams()` thiếu `<Suspense>` sẽ làm `next build` fail — đã xử
  lý bằng wrapper.
