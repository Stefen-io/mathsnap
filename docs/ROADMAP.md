# Roadmap

## MathSnap — AI-Powered Math Tutor

| Thông tin               | Chi tiết                                        |
| ----------------------- | ----------------------------------------------- |
| **Dự án**               | MathSnap                                        |
| **Phiên bản**           | 2.0.0                                           |
| **Ngày cập nhật**       | 10/05/2026                                      |
| **Tác giả**             | Thanh Thinh Nguyen                              |
| **Môn học**             | Thiết kế Giao diện Người dùng (UI Design)       |
| **Thời gian thực hiện** | 3 tuần (30/04/2026 – 21/05/2026)                |
| **Trạng thái**          | Active — Phase 2.5 bắt đầu 11/05                |
| **Tham chiếu**          | BRD v2.0.0 · PRD v2.0.0 · SYSTEM_DESIGN v2.0.0  |
| **Đối tượng**           | Tác giả đồ án (executor), giảng viên (reviewer) |

> **Phạm vi tài liệu:** ROADMAP trả lời câu hỏi **"WHEN"** ở cấp **chiến lược** theo khung **Now / Next / Later** — kèm risks, capacity high-level, MoSCoW cut rules. Chi tiết task-level day-by-day cho từng phase được tách sang `docs/plans/`. Tài liệu này không thay thế BRD (WHY), PRD (WHAT), hay SYSTEM_DESIGN (HOW). Khi có xung đột về mục tiêu hoặc phạm vi, **BRD và PRD là nguồn ưu tiên**; ROADMAP chỉ điều chỉnh thứ tự và lịch thực thi ở mức chiến lược.

---

## Mục lục

1. [Status Overview — Tóm tắt trạng thái](#1-status-overview)
2. [Roadmap — Now / Next / Later](#2-roadmap--now--next--later)
3. [Risks & Dependencies](#3-risks--dependencies)
4. [Capacity Plan](#4-capacity-plan)
5. [MoSCoW Cut Plan](#5-moscow-cut-plan)
6. [Appendix](#6-appendix)

> **Daily standup template:** [`STANDUP_TEMPLATE.md`](./STANDUP_TEMPLATE.md)

---

## 1. Status Overview

### 1.1 Trạng thái

| Chỉ số         | Giá trị                                                              |
| -------------- | -------------------------------------------------------------------- |
| Timeline total | 30/04 – 21/05 (3 tuần, 22 ngày)                                      |
| Used           | 11/22 ngày (50%)                                                     |
| Remaining      | 11 ngày                                                              |
| Milestones     | 3/6 (M1 BRD, M2 PRD, M3 Hi-fi Prototype)                             |
| Documents      | 3/3 ✅ (BRD v2.0.0, PRD v2.0.0, SYSTEM_DESIGN v2.0.0)                |
| Implementation | 0% - bắt đầu vào ngày mai 11/05                                      |
| Status         | **On Track** — front-loaded, áp lực dồn vào 11 ngày tới              |
| Risk profile   | **Cao** — R-9 (BRD): production-ready trong 8 ngày solo dev rất chặt |

### 1.2 Milestones

| ID  | Tên                                  | Ngày  | Status      |
| --- | ------------------------------------ | ----- | ----------- |
| M1  | BRD Approved                         | 01/05 | ✅ Done     |
| M2  | PRD & Low-fi Wireframe Approved      | 05/05 | ✅ Done     |
| M3  | Hi-fi Prototype Ready for Build      | 10/05 | ✅ Done     |
| M4  | Web App Deployed (production public) | 18/05 | In Progress |
| M5  | Usability Validation Complete        | 20/05 | Not Started |
| M6  | Final Delivery                       | 21/05 | Not Started |

---

## 2. Roadmap — Now / Next / Later

### 2.1 🟢 NOW — Hôm nay 10/05 (Pre-Implementation Setup)

| Task                                                               | Status      | Target    | Rationale                                          |
| ------------------------------------------------------------------ | ----------- | --------- | -------------------------------------------------- |
| Provision Vercel account + project                                 | ✅ Done     | EOD 10/05 | Frontend deploy target (FR-9)                      |
| Provision Railway account + chọn plan ≥ 1GB RAM                    | ✅ Done     | EOD 10/05 | Backend deploy target, đủ RAM cho pix2tex (~870MB) |
| Provision Supabase project + apply DDL từ SYSTEM_DESIGN 3.5        | ✅ Done     | EOD 10/05 | Database ready cho FR-11                           |
| Setup OpenAI API key + billing alert ở $5                          | Not Started | EOD 10/05 | LLM access (FR-4); mitigate R-10                   |
| UptimeRobot account (free) cho keep-alive ping                     | Not Started | EOD 10/05 | Cold start mitigation (SYSTEM_DESIGN 12.4, OQ-7)   |
| Tạo `.env.example` với đủ env vars (xem SYSTEM_DESIGN 11.1)        | Not Started | EOD 10/05 | Onboarding cho dev, mitigate R-11                  |
| Repo skeleton: 2 folder `src/client` + `src/server` + `.gitignore` | Not Started | EOD 10/05 | Tránh mất 2h setup vào ngày mai                    |

**Mục tiêu cuối ngày 10/05:** Sáng mai 11/05 commit đầu tiên có thể là code thật.

### 2.2 🟡 NEXT — Phase 2.5 Implementation (11/05 – 18/05, 8 ngày)

Xem chi tiết tại [Section 3](#3-phase-25--day-by-day-implementation).

| Tuần | Ngày trong tuần     | Focus                                        |
| ---- | ------------------- | -------------------------------------------- |
| W1   | CN-T2-T3 (11-13/05) | Backend: foundation → core API → hardening   |
| W2   | T4-T5 (14-15/05)    | Frontend: foundation → happy path end-to-end |
| W2   | T6-T7-CN (16-18/05) | P1 features → polish & deploy → audit        |

### 2.3 🔵 LATER — Validation & Delivery (19/05 – 21/05, 3 ngày)

Xem chi tiết tại [Section 4](#4-phase-3--4--validation-và-delivery).

| Ngày  | Phase         | Output                                    |
| ----- | ------------- | ----------------------------------------- |
| 19/05 | Validation D1 | ≥ 3 user test sessions, raw issue list    |
| 20/05 | Validation D2 | Fix P0/P1 issues, test report → **M5 ✅** |
| 21/05 | Delivery      | Final QA + slide + nộp bài → **M6 ✅**    |

---

## 3. Risks & Dependencies

### 3.1 Critical Risks (đang theo dõi)

| ID   | Risk                                | Khả năng | Tác động | Trigger phát hiện   | Mitigation                                                                   |
| ---- | ----------------------------------- | -------- | -------- | ------------------- | ---------------------------------------------------------------------------- |
| R-9  | Không kịp implement trong 8 ngày    | Cao      | Cao      | EOD D3 (13/05)      | Kích hoạt Cut Plan; chuẩn bị starter template từ NOW                         |
| R-10 | Infra cost vượt ngân sách           | TB       | TB       | Daily billing alert | OpenAI alert $5; Railway/Supabase free tier; rate limit chặt                 |
| R-11 | API key OCR/LLM bị lộ trên frontend | Cao      | Cao      | Build inspection D8 | Backend proxy (SD 1.4 + 11.1); verify ở D8 trong security review             |
| R-7  | Progressive Disclosure gây khó chịu | Thấp     | Cao      | D9 user test        | Có nút "Xem tất cả" làm escape hatch (FR-5 AC); chấp nhận tradeoff           |
| R-1  | OCR sai trên công thức phức tạp     | Cao      | TB       | D5 manual test      | BR-3: cho user sửa LaTeX trước khi solve; hướng dẫn chụp rõ trong onboarding |
| R-2  | LLM trả lời sai/không logic         | TB       | Cao      | D9 user test        | Disclaimer trong onboarding; structured output để kiểm soát format           |

### 3.2 Hard Dependencies

| Dependency                                   | Cần có trước | Owner | Trạng thái  | Risk nếu chậm                             |
| -------------------------------------------- | ------------ | ----- | ----------- | ----------------------------------------- |
| Vercel + Railway + Supabase + OpenAI account | D1 sáng      | Bạn   | Not Started | D1 không deploy được, ăn vào D2           |
| pix2tex model load trên Railway 1GB          | D2 trưa      | Bạn   | Not Started | Phải nâng plan hoặc switch hosting        |
| Backend API stable                           | D4 sáng      | Bạn   | Not Started | Block frontend integration ở D5           |
| ≥ 3 user test recruited                      | D9 sáng      | Bạn   | Not Started | Validation không đủ user → không pass DoD |

### 3.3 Soft Dependencies

- Hi-fi prototype Figma (M3 done) → tham chiếu khi code component (D4-D7)
- SYSTEM_DESIGN Section 4 (API Contracts) → spec exact cho frontend-backend integration
- LangChain + OpenAI version pinning (SYSTEM_DESIGN 2.2) → tránh breaking change

---

## 4. Capacity Plan

### 4.1 Tổng capacity còn lại

| Period                   | Ngày   | Giờ/ngày | Tổng giờ |
| ------------------------ | ------ | -------- | -------- |
| NOW (10/05 prep)         | 1      | ~4h      | 4h       |
| Phase 2.5 Implementation | 8      | ~6h      | 48h      |
| Phase 3 Validation       | 2      | ~6h      | 12h      |
| Phase 4 Delivery         | 1      | ~4h      | 4h       |
| **Tổng còn lại**         | **12** | —        | **~68h** |

### 4.2 Reality Check

- 6h/ngày liên tục trong 11 ngày (kể cả cuối tuần) là cường độ rất cao.
- Không có buffer cho ốm, sự kiện cá nhân, debug khó.
- Mỗi 1h trượt hôm nay = 1h mất cho tasks ở D-cuối.
- BRD R-6: cảnh báo "Không kịp scope trong 3 tuần" — đây là risk live, không phải hypothetical.
- Mô hình **70% feature / 20% tech debt / 10% buffer** không áp dụng vì 100% là feature work, buffer = 0.

---

## 5. MoSCoW Cut Plan

Cut plan kích hoạt theo trigger thời gian, không chờ user/giảng viên approve. Self-execute để bảo vệ DoD tối thiểu.

### 5.1 Strategic Triggers

| Trigger | Khi nào                                        | Hành động cao cấp                                                                               | Task-level detail                                                                                                                           |
| ------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **T1**  | EOD D3 (13/05) backend chưa đạt 80%            | Cắt P1: FR-6 (History), FR-7 (Bookmark), FR-8 (Bilingual), FR-1c (Manual LaTeX). Tiết kiệm ~6h. | [`PHASE_2.5_IMPLEMENTATION.md` Section 7.1](./plans/PHASE_2.5_IMPLEMENTATION.md#71-trigger-1--cuối-d3-1305-backend-chưa-đạt-80)             |
| **T2**  | EOD D5 (15/05) frontend chưa có Happy Path E2E | Cắt S-12 (Onboarding), S-14 (Problem Selector), FR-1d (Crop), Bilingual prompt.                 | [`PHASE_2.5_IMPLEMENTATION.md` Section 7.2](./plans/PHASE_2.5_IMPLEMENTATION.md#72-trigger-2--cuối-d5-1505-frontend-chưa-có-happy-path-e2e) |
| **T3**  | EOD D7 (17/05) chưa có audit pass              | Validation: 2 user thay vì 3. Delivery: slide rút gọn 3 thay vì 5-7.                            | (áp dụng tại Phase 3 + Phase 4)                                                                                                             |

### 5.2 Hard Floor — KHÔNG ĐƯỢC CẮT

Đây là tối thiểu để pass DoD và demo M6:

**Functional Requirements:**

- FR-1a (Camera) **hoặc** FR-1b (Upload) — cần ít nhất 1 input method
- FR-2 (OCR), FR-3 (Confirm), FR-4 (Solve), FR-5 (Progressive Disclosure)
- FR-9 (Deploy), FR-10 (Rate Limit), FR-11 (Persist)

**Screens:**

- S-01, S-03, S-05, S-06, S-07, S-10

Nếu cắt vào hard floor → MVP không demo được → fail DoD → fail môn.

---

## 6. Appendix

### 6.1 Thuật ngữ

| Thuật ngữ      | Giải thích                                                                             |
| -------------- | -------------------------------------------------------------------------------------- |
| **DoD**        | Definition of Done — tiêu chí hoàn thành (xem PRD Section 8)                           |
| **MoSCoW**     | Must / Should / Could / Won't — framework ưu tiên (xem BRD Section 6, PRD Section 6.1) |
| **P0/P1/P2**   | Priority levels: P0 = Must, P1 = Should, P2 = Could                                    |
| **R-X**        | Risk ID trong BRD Section 8                                                            |
| **FR-X**       | Functional Requirement ID trong PRD Section 6.1                                        |
| **NFR-X**      | Non-Functional Requirement ID trong PRD Section 6.2                                    |
| **G-X**        | Goal ID trong PRD Section 2.1                                                          |
| **OQ-X**       | Open Question ID trong PRD Section 11                                                  |
| **M-X**        | Milestone ID trong BRD Section 10 và PRD Section 10                                    |
| **D-X**        | Day ID trong ROADMAP này (D1 = 11/05, D11 = 21/05)                                     |
| **S-XX**       | Screen ID trong PRD Section 5.3                                                        |
| **Hard Floor** | Tập tính năng tối thiểu không được cắt — bảo vệ DoD                                    |
| **Trigger**    | Điều kiện thời gian kích hoạt Cut Plan tự động                                         |
| **Checkpoint** | Mốc đánh giá tiến độ giữa Phase, có hành động cụ thể nếu trượt                         |

### 6.2 Tài liệu tham chiếu

| Tài liệu                                       | Mục đích                                                        | Trạng thái |
| ---------------------------------------------- | --------------------------------------------------------------- | ---------- |
| **BRD v2.0.0**                                 | WHY — mục tiêu kinh doanh, phạm vi, ràng buộc, risks            | Approved   |
| **PRD v2.0.0**                                 | WHAT — yêu cầu sản phẩm, FR/NFR, screens, design principles     | Approved   |
| **SYSTEM_DESIGN v2.0.0**                       | HOW — kiến trúc, API contract, data model, security, rate limit | Approved   |
| **ROADMAP v2.0.0**                             | WHEN strategic — Now/Next/Later, risks, capacity, cut rules     | Active     |
| [`STANDUP_TEMPLATE.md`](./STANDUP_TEMPLATE.md) | Template self-tracking standup hằng ngày                        | Active     |

### 6.3 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                              |
| --------- | ---------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo ROADMAP cho 11 ngày còn lại của project: NOW (prep 10/05) + Phase 2.5 day-by-day (D1-D8, 11-18/05) + Validation (D9-D10) + Delivery (D11). Kèm Risk register, Capacity plan, MoSCoW Cut Plan với 3 trigger, Hard Floor để bảo vệ DoD, Daily Standup template |
| **2.0.0** | 10/05/2026 | Thanh Thinh Nguyen | **Restructure** — tách phần task-level sang `docs/plans/`. Tách Daily Standup Template sang standalone `docs/STANDUP_TEMPLATE.md`                                                                                                                                     |

### 6.4 Methodology — Roadmap ↔ Sprint Plan

> **Lưu trữ tham khảo** về cách hai khái niệm liên quan, để tránh confuse khi review hoặc handoff cho người mới.

Sprint plan trả lời câu hỏi _"trong 1-2 tuần tới, team sẽ làm chính xác task gì để move feature trong cụm 'Now' tiến triển?"_ — tập trung vào "Now" trong Now / Next / Later của roadmap.

**Workflow điển hình (product cycle bình thường):**

1. PM build/update roadmap (Now/Next/Later) → quyết định _what & why_.
2. Khi 1 feature từ Next chuyển sang Now → team vào sprint planning meeting.
3. Sprint planning: lấy feature đó ra, break thành stories, estimate capacity, set sprint goal.
4. Sprint chạy 1-2 tuần → retrospective → có thể inform lại roadmap nếu cần điều chỉnh.

---

> **Ghi chú:** ROADMAP là **execution plan**, không phải product spec. Khi có conflict với BRD/PRD/SYSTEM_DESIGN về mục tiêu, phạm vi, hoặc kiến trúc — các tài liệu kia ưu tiên. ROADMAP chỉ điều chỉnh **thứ tự thực thi và lịch ngày**. Mọi thay đổi scope phải back-sync về BRD trước khi update ROADMAP.
