# Phase 4 — Delivery Plan

## MathSnap

| Thông tin         | Chi tiết                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **Dự án**         | MathSnap                                                                        |
| **Phiên bản**     | 2.0.0                                                                           |
| **Ngày cập nhật** | 10/05/2026                                                                      |
| **Tác giả**       | Thanh Thinh Nguyen                                                              |
| **Phase**         | 4 — Delivery                                                                    |
| **Thời gian**     | 21/05/2026 (1 ngày)                                                             |
| **Trạng thái**    | Planning — bắt đầu 21/05                                                        |
| **Tham chiếu**    | ROADMAP v2.0.0 (cluster LATER) · BRD v2.0.0 · PRD v2.0.0 · SYSTEM_DESIGN v2.0.0 |
| **Đối tượng**     | Tác giả đồ án (executor)                                                        |

> **Phạm vi tài liệu:** Plan chi tiết cho 1 ngày Phase 4 Delivery (D11). Cap nguồn: cluster **LATER** trong [ROADMAP.md](../ROADMAP.md). **Mode: Planning** — promote sang Living khi phase D11 đến (sáng 21/05). Khi conflict về scope/objective → ROADMAP/BRD/PRD ưu tiên.

---

## Mục lục (Table of Contents)

1. [Objective - Phase 4](#1-objective---phase-4)
2. [Day-by-Day Plan](#2-day-by-day-plan)
3. [Deliverables target](#3-deliverables-target)
4. [Milestone target](#4-milestone-target)
5. [Risks](#5-risks)
6. [Appendix](#6-appendix)

---

## 1. Objective - Phase 4

Hoàn thiện và nộp toàn bộ deliverable đồ án:

- 4 deliverable: BRD + PRD + SYSTEM_DESIGN + Working Web App URL
- Slide presentation sẵn sàng trình bày
- Đạt **M6 — Final Delivery (21/05)**

---

## 2. Day-by-Day Plan

| Day | Ngày       | Focus          | Tasks (preview)                                                                                            | Ước lượng |
| --- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| D11 | 21/05 (T4) | Final Delivery | Final QA mobile+desktop, verify 4 deliverable, làm slide 5-7, submit, backup repo+DB                       | ~4h       |

> Chi tiết task-level sẽ được mở rộng khi promote sang Living mode (sáng 21/05).

---

## 3. Deliverables target

- [ ] BRD v2.0.0 (final)
- [ ] PRD v2.0.0 (final)
- [ ] SYSTEM_DESIGN v2.0.0 (final)
- [ ] Working Web App accessible at public URL (đã pass M4)
- [ ] Slide presentation 5-7 slides (vấn đề, giải pháp, demo, learnings, Q&A buffer)
- [ ] Submit confirmation theo yêu cầu môn học
- [ ] Backup: git repo tag + Supabase DB snapshot

---

## 4. Milestone target

- **M6 — Final Delivery (21/05)** — pass criteria: Đã nộp tất cả deliverable, sẵn sàng trình bày

---

## 5. Risks

| ID    | Risk                                                          | Khả năng | Tác động | Mitigation                                                                                  |
| ----- | ------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------- |
| R-D1  | Carryover từ Phase 3 ăn vào D11, không đủ thời gian làm slide | TB       | Cao      | Ưu tiên submit (deliverable bắt buộc) trước slide; slide có thể giảm xuống 3 slide nếu cần |
| R-D2  | Web app down vào ngày trình bày                               | Thấp     | Cao      | Chuẩn bị video demo backup; export prototype Figma làm fallback nếu live demo fail         |

---

## 6. Appendix

### 6.1 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                         |
| --------- | ---------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo Phase 4 Delivery Plan: extract Section 4.3 từ ROADMAP v1.0.0 nguyên xi                                                                                                                                                                                  |
| **2.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Refactor sang Planning mode chuẩn theo `_TEMPLATE.md` v1.0.0: rename Section 1 (Objective); gộp Section 2 (D11) thành Section 2 Day-by-Day Plan (1 row table); thêm Section 3 Deliverables target, Section 4 Milestone target, Section 5 Risks (R-D1, R-D2); skip Sprint Goals do chỉ 1 ngày; renumber Appendix 3→6. Sẽ promote sang Living khi sáng 21/05 |
