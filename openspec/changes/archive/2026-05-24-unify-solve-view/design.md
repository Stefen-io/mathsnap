## Context

Hai luồng hiển thị bài giải hiện tách rời:

- `app/solve/page.tsx` — Client Component **ngoài** `(main)` group → tràn màn hình, không
  BottomNav. Đọc `ocrLatex` từ `CaptureContext`, gọi `postSolve`.
- `app/(main)/history/[id]/page.tsx` — **trong** `(main)` group → bị giới hạn `max-w-[480px]`
  + BottomNav. Đọc `params.id`, gọi `getHistoryItem`.

Cả hai render gần như cùng UI (sticky header, KaTeX problem bar, danh sách `StepCard`,
fixed bottom action bar với Bookmark + "Bài mới"). `getHistoryItem` và `postSolve` cùng
trả về `HistoryItem` (`{ id, deviceId, latex, solutionSteps, language, createdAt,
isBookmarked }`).

Ràng buộc kỹ thuật: Next.js App Router — `useSearchParams()` trong page yêu cầu một
`<Suspense>` boundary, nếu thiếu `next build` sẽ fail (`'use client'` là cần nhưng KHÔNG
đủ). Tailwind v4 (CSS variables, không config file). Test: Vitest + happy-dom.

## Goals / Non-Goals

**Goals:**
- Một trang `/solve` duy nhất, tràn màn hình, phục vụ cả SOLVE và VIEW mode.
- Loại bỏ UI trùng lặp giữa `/solve` và `/history/[id]`.
- Xem lại bài cũ (history/bookmarks) điều hướng tới `/solve?id={id}`.
- StepCard đọc tốt trên màn hình ≤480px (text + answer formula + công thức dài cuộn ngang).
- `next build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` đều xanh.

**Non-Goals:**
- Không đổi `(main)/layout.tsx`.
- Không đổi URL structure của history/bookmarks list.
- Không đổi backend API hay schema.
- Không giữ tương thích ngược cho route `/history/[id]` (xóa hẳn, không redirect).

## Decisions

### 1. Dual-mode qua query param thay vì hai trang
Đọc `searchParams.get('id')`: có → VIEW mode (fetch), không → SOLVE mode (giải mới). Tái
dùng nguyên success UI. **Vì sao**: zero adapter (cùng `HistoryItem`), một nguồn UI duy
nhất. Loại phương án giữ hai trang (duplicate UI) và phương án redirect (indirection thừa).

### 2. Cấu trúc Suspense
```
export default function SolvePage() {
  return <Suspense fallback={<LoadingSkeleton/>}><SolvePageContent/></Suspense>
}
function SolvePageContent() { const searchParams = useSearchParams(); ... }
```
`SolvePageContent` chứa toàn bộ logic + `useSearchParams`. **Vì sao Suspense (Option A)
thay vì đọc `window.location.search` trong `useEffect` (Option B)**: Option A là pattern
chính thống của App Router, an toàn với `next build`; Option B né được hook nhưng kém
idiomatic và dễ lệ thuộc thời điểm hydrate. Đã chốt Option A trong explore.

### 3. Mode branching trong mount effect — đặt TRƯỚC guard ocrLatex
Effect hiện tại: `if (!ocrLatex) router.replace('/camera')`. Phải sửa thành:
- VIEW mode (`viewId` truthy): gọi `getHistoryItem(viewId, deviceId)`; KHÔNG đụng guard
  `ocrLatex`.
- SOLVE mode (`viewId` null): giữ nguyên — `if (!ocrLatex) replace('/camera')`, rồi
  `postSolve`.
Giữ một `startedRef` (đổi tên hoặc tái dùng `solveStartedRef`) để mỗi mode chỉ fetch một
lần, kể cả StrictMode double-effect. **Vì sao**: nếu không branch trước, VIEW mode (ocrLatex
null) sẽ bị `replace('/camera')` ngay.

### 4. displayLatex thống nhất
Header render problem bar:
- SOLVE mode → `ocrLatex` (từ context).
- VIEW mode → `item.latex` (từ fetch; `ocrLatex` null khi deep link).
Dùng một biến dẫn xuất (vd `displayLatex = viewId ? fetchedLatex : ocrLatex`). **Vì sao**:
hiện code chỉ render `ocrLatex` → VIEW mode sẽ trống nếu không xử lý.

### 5. Responsive StepCard (Tailwind v4 arbitrary)
- Text title/explanation: `[@media(max-width:480px)]:text-[…]` giảm cỡ.
- Answer formula: thay `fontSize: '2.5rem'` cứng bằng `clamp(1.5rem, 7vw, 2.5rem)`.
- Formula container (StepCard.tsx:64): thêm `overflow-x-auto`; bỏ ép `justify-center` khi
  tràn để scroll hoạt động (center + overflow sẽ clip hai đầu công thức dài).
**Vì sao clamp + media query**: không thêm dependency, đúng convention Tailwind v4 của repo.

### 6. Xóa history-item-detail + i18n dead keys
Xóa `history/[id]/page.tsx` + `page.test.tsx`. Xóa `detailTitle/detailAriaBack/
detailAriaBookmark/detailNewProblem` khỏi cả `vi` và `en` (giá trị trùng hệt `solve*`).
`i18n.test.ts` chỉ kiểm tra parity en/vi → xóa cân cả hai bên là an toàn.

### 7. Test cho solve/page.test.tsx
- Thêm mock `useSearchParams` vào `vi.mock('next/navigation', …)` (mặc định trả
  `new URLSearchParams()` = SOLVE mode; override để test VIEW mode).
- Thêm `getHistoryItem: vi.fn()` vào `vi.mock('@/lib/api', …)`.
- Test mới: VIEW mode fetch theo `?id`, render steps, KHÔNG gọi `postSolve`, KHÔNG redirect
  camera khi `ocrLatex` null; problem bar hiện `item.latex`.
**Vì sao bắt buộc**: mock hiện thiếu cả hai → page sẽ crash khi gọi `useSearchParams`.

## Risks / Trade-offs

- **`next build` fail nếu quên Suspense** → Mitigation: Quyết định #2 bọc `<Suspense>`;
  task verify chạy `pnpm build` (không chỉ `pnpm dev`/test).
- **VIEW mode bị bounce về /camera** (guard sai thứ tự) → Mitigation: Quyết định #3 branch
  trước guard; test case khẳng định không `replace('/camera')` khi có `?id`.
- **Double fetch dưới StrictMode** → Mitigation: tái dùng `startedRef` one-shot cho cả mode.
- **Công thức dài vẫn tràn nếu chỉ thêm overflow mà vẫn center** → Mitigation: bỏ center khi
  overflow (Quyết định #5).
- **VIEW mode "Bài mới" gọi `reset()` + push('/')** giống SOLVE — chấp nhận (không cần xử lý
  riêng); back về list vẫn hoạt động qua `router.back()`.
- **Mất full-width trên desktop cho trang xem lại**: trước đây `/history/[id]` bị cap 480px;
  giờ `/solve` full-bleed → nội dung rộng hơn trên desktop. Mobile-first nên chấp nhận.

## Migration Plan

Frontend-only, không migration dữ liệu. Triển khai trong một PR:
1. Refactor `solve/page.tsx` (Suspense + dual-mode) — verify SOLVE mode không hồi quy.
2. Đổi navigation ở history + bookmarks.
3. Responsive StepCard.
4. Xóa `history/[id]` page + test; xóa i18n `detail*`.
5. Cập nhật `solve/page.test.tsx`.
6. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh.

Rollback: revert PR (không có state ngoài code).

## Open Questions

Không còn — mọi fork đã chốt trong explore (Suspense Option A đã chọn).
