# Phase 1 — Definition Plan

## MathSnap

| Thông tin         | Chi tiết                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| **Dự án**         | MathSnap                                                                          |
| **Phiên bản**     | 1.1.0                                                                             |
| **Ngày cập nhật** | 10/05/2026                                                                        |
| **Tác giả**       | Thanh Thinh Nguyen                                                                |
| **Phase**         | 1 — Definition                                                                    |
| **Thời gian**     | 02/05 – 05/05/2026 (4 ngày)                                                       |
| **Trạng thái**    | ✅ Done                                                                           |
| **Tham chiếu**    | ROADMAP v2.0.0 · BRD v2.0.0 · PRD v2.0.0 (sản phẩm của phase này, ban đầu v1.0.0) |
| **Đối tượng**     | Tác giả đồ án (executor), giảng viên (reviewer)                                   |

> **Phạm vi tài liệu:** Retrospective plan ghi lại những gì đã thực hiện trong Phase 1 Definition. Phase này chuyển business requirements (BRD) thành product requirements (PRD): persona, user stories, flows, IA, screens, FR/NFR. **Mode: Snapshot** — không update sau khi phase đóng. Cap nguồn: BRD v2.0.0 Section 10.

---

## Mục lục (Table of Contents)

1. [Objective - Phase 1](#1-objective---phase-1)
2. [Day-by-Day Plan](#2-day-by-day-plan)
3. [Deliverables](#3-deliverables)
4. [Milestone target](#4-milestone-target)
5. [Appendix](#5-appendix)

---

## 1. Objective - Phase 1

Chuyển business requirements thành product requirements: build persona, user stories, flows, information architecture, screens, FR/NFR với acceptance criteria. Đạt **M2 — PRD & Wireframe Approved (05/05)**.

---

## 2. Day-by-Day Plan

| Day  | Ngày       | Hoạt động chính                                                                                                                                      | Output                              |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| D-11 | 02/05 (T6) | Build 2 User Personas: Minh Khôi (học sinh THPT, primary) và Thanh Vy (sinh viên năm 1-2, secondary). Viết 16 User Stories chia 5 nhóm A-E.          | Personas, US-A1 → US-E3             |
| D-10 | 03/05 (T7) | Thiết kế 5 User Flows: Happy path camera, Upload, Manual LaTeX, History/Bookmark, Error.                                                             | Flow 1 → Flow 5 (Mermaid diagrams)  |
| D-9  | 04/05 (CN) | Build Information Architecture: 14 màn hình S-01 → S-14. Navigation Structure 4 tab (Bottom nav mobile, Sidebar desktop). Low-fi wireframe luồng P0. | IA diagram, low-fi wireframe        |
| D-8  | 05/05 (T2) | Viết FR-1 → FR-5 P0 với Acceptance Criteria; FR-6 → FR-8 P1; NFR-1 → NFR-5. Resolve OQ-1 → OQ-6. PRD finalize + approval.                            | **PRD v1.0.0 Approved** + Wireframe |

---

## 3. Deliverables

- [x] 2 User Personas (Minh Khôi, Thanh Vy)
- [x] 16 User Stories chia 5 nhóm:
  - Nhóm A — Nhập liệu bài toán (US-A1 → US-A4)
  - Nhóm B — Xác nhận công thức sau OCR (US-B1 → US-B3)
  - Nhóm C — Khám phá lời giải từng bước (US-C1 → US-C4)
  - Nhóm D — Lưu lịch sử & Bookmark (US-D1 → US-D3)
  - Nhóm E — Xử lý lỗi & Fallback (US-E1 → US-E3)
- [x] 5 User Flows (Camera happy path, Upload, Manual, History/Bookmark, Error)
- [x] Information Architecture với 14 screens (S-01 → S-14)
- [x] Navigation Structure (Bottom nav mobile, Sidebar desktop)
- [x] Low-fi wireframe luồng P0
- [x] FR-1 → FR-5 (P0) với Acceptance Criteria đầy đủ
- [x] FR-6 → FR-8 (P1)
- [x] NFR-1 → NFR-5 với ngưỡng cụ thể
- [x] Resolve OQ-1 → OQ-6
- [x] Design Principles P-1 → P-5
- [x] **PRD v1.0.0** — sau này upgrade lên **v2.0.0** khi mở rộng scope sang MVP production-ready (thêm G-5, FR-9/10/11, NFR-6/7, P-6, OQ-7/8 — xem changelog PRD)

---

## 4. Milestone target

- **M2 — PRD & Low-fi Wireframe Approved (05/05)** ✅

---

## 5. Appendix

### 5.1 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                                                                                |
| --------- | ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo retrospective plan cho Phase 1 Definition (đã hoàn thành 05/05). Document day-by-day, output, milestone                                                                                                                                                                                                        |
| **1.1.0** | 10/05/2026 | Thanh Thinh Nguyen | Đồng bộ với `_TEMPLATE.md` v1.0.0 Snapshot mode: rename sections (Mục tiêu Phase 1 (đã đạt) → Objective - Phase 1; Day-by-Day Breakdown → Day-by-Day Plan; Deliverables hoàn thành → Deliverables; Milestone đạt được → Milestone target); thêm "Mode: Snapshot" tag vào Phạm vi; Mục lục → Mục lục (Table of Contents) |
