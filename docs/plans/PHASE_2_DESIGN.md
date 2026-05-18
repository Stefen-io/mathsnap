# Phase 2 — Hi-fi Design Plan

## MathSnap

| Thông tin         | Chi tiết                                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| **Dự án**         | MathSnap                                                                         |
| **Phiên bản**     | 1.1.0                                                                            |
| **Ngày cập nhật** | 10/05/2026                                                                       |
| **Tác giả**       | Thanh Thinh Nguyen                                                               |
| **Phase**         | 2 — Hi-fi Design                                                                 |
| **Thời gian**     | 06/05 – 10/05/2026 (5 ngày)                                                      |
| **Trạng thái**    | ✅ Done                                                                          |
| **Tham chiếu**    | ROADMAP v2.0.0 · BRD v2.0.0 · PRD v2.0.0                                         |
| **Đối tượng**     | Tác giả đồ án (executor), giảng viên (reviewer), developer (input cho Phase 2.5) |

> **Phạm vi tài liệu:** Retrospective plan ghi lại những gì đã thực hiện trong Phase 2 Hi-fi Design. Phase này chuyển low-fi wireframe (output Phase 1) thành Hi-fi mockup clickable theo design principles P-1 → P-6. **Mode: Snapshot** — không update sau khi phase đóng. Cap nguồn: BRD v2.0.0 Section 10.

---

## Mục lục (Table of Contents)

1. [Objective - Phase 2](#1-objective---phase-2)
2. [Day-by-Day Plan](#2-day-by-day-plan)
3. [Deliverables](#3-deliverables)
4. [Milestone target](#4-milestone-target)
5. [Appendix](#5-appendix)

---

## 1. Objective - Phase 2

Chuyển low-fi wireframe thành Hi-fi mockup clickable đáp ứng đầy đủ Design Principles trong PRD (P-1 Progressive Disclosure, P-2 Scaffolding, P-3 Cognitive Load, P-4 Mobile-First, P-5 Transparent Fallback, P-6 Production Resilience). Đạt **M3 — Hi-fi Prototype Ready for Build (10/05)**.

---

## 2. Day-by-Day Plan

> ⚠️ **Lưu ý:** Day-by-day dưới đây là **reconstruction** dựa trên BRD/old ROADMAP — không có ground truth chính xác từng ngày làm gì. Cần điều chỉnh nếu trí nhớ thực tế khác.

| Day | Ngày       | Hoạt động chính                                                                                                                                                                                                | Output                           |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| D-7 | 06/05 (T3) | Design system foundation: color tokens, typography, spacing scale, button/card/input/accordion components.                                                                                                     | Design system v0.1               |
| D-6 | 07/05 (T4) | Hi-fi luồng nhập liệu (P0): S-01 Home (3 CTA + Bottom Nav), S-02 Camera Capture (viewfinder + khung căn chỉnh), S-03 Image Preview & Crop, S-04 OCR Processing (skeleton).                                     | 4 hi-fi screens                  |
| D-5 | 08/05 (T5) | Hi-fi luồng giải (P0): S-05 Formula Preview & Edit (LaTeX rendered + raw editor), S-06 Solution Loading, S-07 Solution Detail (Progressive Disclosure: locked → reveal → answer), S-11 Manual LaTeX Input.     | 4 hi-fi screens                  |
| D-4 | 09/05 (T6) | Hi-fi luồng phụ (P1): S-08 History List (sắp xếp theo thời gian, swipe xoá), S-09 Bookmark List, S-12 Onboarding Overlay (one-time), S-13 Settings (VI/EN toggle), S-14 Problem Selector (multi-formula case). | 5 hi-fi screens                  |
| D-3 | 10/05 (T7) | Hi-fi error states (P0): S-10 — 2 biến thể (OCR Fail với 3 lối thoát, LLM Fail với 2 lối thoát). Prototype interactions, click-through verification.                                                           | S-10 + clickable prototype Figma |

---

## 3. Deliverables

### Luồng nhập liệu (P0)

- [x] S-01 Home / Landing — 3 CTA + Bottom Navigation
- [x] S-02 Camera Capture — viewfinder, khung căn chỉnh, nút chụp
- [x] S-03 Image Preview & Crop — crop, xoay, xác nhận
- [x] S-04 OCR Processing — skeleton loading, nút huỷ (X)

### Luồng lời giải (P0)

- [x] S-05 Formula Preview & Edit — LaTeX rendered + raw editor, preview real-time
- [x] S-06 Solution Loading — skeleton loading, nút huỷ (X)
- [x] S-07 Solution Detail — Progressive Disclosure: locked steps → "Xem bước tiếp theo" → đáp án
- [x] S-11 Manual LaTeX Input — nhập thủ công + preview real-time
- [x] S-10 Error State — 2 biến thể (OCR Fail 3 lối thoát, LLM Fail 2 lối thoát)

### Luồng phụ (P1)

- [x] S-08 History List — danh sách, sắp xếp theo thời gian, swipe xoá
- [x] S-09 Bookmark List — danh sách, empty state
- [x] S-12 Onboarding Overlay — one-time, giới thiệu sản phẩm
- [x] S-13 Settings — toggle ngôn ngữ VI/EN
- [x] S-14 Problem Selector — chọn bài khi OCR phát hiện nhiều công thức

### Design assets

- [x] Design system v1.0 (color, typography, spacing, components)
- [x] Clickable prototype Figma (toàn bộ luồng P0 + P1 connect được)

---

## 4. Milestone target

- **M3 — Hi-fi Prototype Ready for Build (10/05)** ✅

> Phase 2 kết thúc là **handoff point** sang Phase 2.5 Implementation — developer dùng Hi-fi prototype làm source of truth cho UI build, kèm SYSTEM_DESIGN làm source of truth cho backend/integration.

---

## 5. Appendix

### 5.1 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                                                                                |
| --------- | ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo retrospective plan cho Phase 2 Hi-fi Design (đã hoàn thành 10/05). Document day-by-day reconstruction, output, milestone                                                                                                                                                                                       |
| **1.1.0** | 10/05/2026 | Thanh Thinh Nguyen | Đồng bộ với `_TEMPLATE.md` v1.0.0 Snapshot mode: rename sections (Mục tiêu Phase 2 (đã đạt) → Objective - Phase 2; Day-by-Day Breakdown → Day-by-Day Plan; Deliverables hoàn thành → Deliverables; Milestone đạt được → Milestone target); thêm "Mode: Snapshot" tag vào Phạm vi; Mục lục → Mục lục (Table of Contents) |
