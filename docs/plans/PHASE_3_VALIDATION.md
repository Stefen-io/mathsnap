# Phase 3 — Validation Plan

## MathSnap

| Thông tin         | Chi tiết                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **Dự án**         | MathSnap                                                                        |
| **Phiên bản**     | 2.0.0                                                                           |
| **Ngày cập nhật** | 10/05/2026                                                                      |
| **Tác giả**       | Thanh Thinh Nguyen                                                              |
| **Phase**         | 3 — Validation                                                                  |
| **Thời gian**     | 19/05 – 20/05/2026 (2 ngày)                                                     |
| **Trạng thái**    | Planning — bắt đầu 19/05                                                        |
| **Tham chiếu**    | ROADMAP v2.0.0 (cluster LATER) · BRD v2.0.0 · PRD v2.0.0 · SYSTEM_DESIGN v2.0.0 |
| **Đối tượng**     | Tác giả đồ án (executor)                                                        |

> **Phạm vi tài liệu:** Plan chi tiết cho 2 ngày Phase 3 Validation (D9 + D10). Cap nguồn: cluster **LATER** trong [ROADMAP.md](../ROADMAP.md). **Mode: Planning** — promote sang Living khi phase D9 đến (sáng 19/05). Khi conflict về scope/objective → ROADMAP/BRD/PRD ưu tiên.

---

## Mục lục (Table of Contents)

1. [Objective - Phase 3](#1-objective---phase-3)
2. [Day-by-Day Plan](#2-day-by-day-plan)
3. [Deliverables target](#3-deliverables-target)
4. [Milestone target](#4-milestone-target)
5. [Risks](#5-risks)
6. [Appendix](#6-appendix)

---

## 1. Objective - Phase 3

Validate web app MVP deploy thật với người dùng mục tiêu — không phải Figma prototype:

- ≥ 3 user mục tiêu hoàn thành luồng cốt lõi end-to-end mà không cần hướng dẫn
- Không có lỗi P0 còn mở sau vòng test
- Đạt **M5 — Validation Complete (20/05)**

---

## 2. Day-by-Day Plan

| Day | Ngày       | Focus            | Tasks (preview)                                                                      | Ước lượng |
| --- | ---------- | ---------------- | ------------------------------------------------------------------------------------ | --------- |
| D9  | 19/05 (T2) | Validation Day 1 | Test protocol setup, 3-4 user test sessions, compile observations, triage P0/P1/P2   | ~6h       |
| D10 | 20/05 (T3) | Validation Day 2 | Fix tất cả P0 issues, fix P1 nếu thời gian, re-deploy + smoke test, viết Test Report | ~6h       |

> Chi tiết task-level từng ngày sẽ được mở rộng khi promote sang Living mode (sáng 19/05).

---

## 3. Deliverables target

- [ ] Test protocol document (tasks list, observation form, recording consent)
- [ ] Raw observation notes từ ≥ 3 user sessions
- [ ] Issue triage list (P0/P1/P2 categorization)
- [ ] Tất cả P0 issues fixed và verified
- [ ] Test Report (1-2 trang: protocol, findings, fixes, residual issues)

---

## 4. Milestone target

- **M5 — Validation Complete (20/05)** — pass criteria: Test report finalized, không còn P0 open

---

## 5. Risks

| ID   | Risk                                                     | Khả năng | Tác động | Mitigation                                                                                               |
| ---- | -------------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
| R-V1 | Recruit không đủ 3 user mục tiêu                         | TB       | Cao      | Recruit từ D7 (Phase 2.5); có backup tier (bạn bè đang học); chấp nhận 2 user nếu thực sự không tìm thêm |
| R-V2 | Phát hiện P0 quá nhiều, không đủ thời gian fix           | Thấp     | Cao      | Time-box fix ở 3h D10; nếu vượt → escalate sang D11 (cắt slide presentation)                             |
| R-V3 | Web app down trong session test (cold start, infra fail) | Thấp     | Cao      | UptimeRobot monitor active từ D8; có backup test plan với prototype Figma làm fallback                   |

---

## 6. Appendix

### 6.1 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo Phase 3 Validation Plan: extract Section 4.1 và 4.2 từ ROADMAP v1.0.0 nguyên xi                                                                                                                                                                                                                                                                                                         |
| **2.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Refactor sang Planning mode chuẩn theo `_TEMPLATE.md` v1.0.0: rename Section 1 (Objective); thêm Section 2 Phase Goal (thay vì Sprint Goals do chỉ 2 ngày); gộp Section 2+3 (D9+D10) thành Section 3 Day-by-Day Plan (1 table); thêm Section 4 Deliverables target, Section 5 Milestone target, Section 6 Risks (R-V1, R-V2, R-V3); renumber Appendix 4→7. Sẽ promote sang Living khi sáng 19/05 |
