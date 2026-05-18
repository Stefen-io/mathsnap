# Phase 2.5 — Implementation Plan

## MathSnap

| Thông tin         | Chi tiết                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| **Dự án**         | MathSnap                                                                       |
| **Phiên bản**     | 2.0.0                                                                          |
| **Ngày cập nhật** | 10/05/2026                                                                     |
| **Tác giả**       | Thanh Thinh Nguyen                                                             |
| **Phase**         | 2.5 — Implementation                                                           |
| **Thời gian**     | 11/05 – 18/05/2026 (8 ngày)                                                    |
| **Trạng thái**    | 🟢 Active — Day 1/8, Sprint 1                                                  |
| **Tham chiếu**    | ROADMAP v2.0.0 (cluster NEXT) · BRD v2.0.0 · PRD v2.0.0 · SYSTEM_DESIGN v2.0.0 |
| **Đối tượng**     | Tác giả đồ án (executor) + AI agent (mỗi phiên làm việc)                       |

> **Phạm vi tài liệu:** Operating manual cho Phase 2.5 đang active. **Mode: Living** — Status Banner update mỗi cuối session. Tasks checkbox được tick khi done. Session notes append vào từng D-X tương ứng. Cap nguồn: cluster **NEXT** trong [ROADMAP.md](../ROADMAP.md). Khi conflict về scope/objective → ROADMAP/BRD/PRD ưu tiên.

---

## Status Banner

> **Cập nhật mỗi cuối session.** Đây là source of truth cho AI agent biết hôm nay làm gì.

| Field                  | Value                            |
| ---------------------- | -------------------------------- |
| **Today**              | D1 (11/05, CN)                   |
| **Current Sprint**     | Sprint 1 (D1-D4, 11/05–14/05)    |
| **Phase progress**     | 0/59 tasks done (0%)             |
| **Today progress**     | 0/8 tasks                        |
| **Last session**       | 2026-05-10 (promotion to Living) |
| **Active blockers**    | 0                                |
| **Cut triggers fired** | none                             |
| **Next milestone**     | M4 — Web App Deployed (18/05)    |

---

## Mục lục (Table of Contents)

1. [Objective - Phase 2.5](#1-objective---phase-25)
2. [Sprint Goals](#2-sprint-goals)
3. [Day-by-Day Plan](#3-day-by-day-plan)
4. [Sprint 1 — D1 → D4 (11/05 – 14/05)](#4-sprint-1--d1--d4-1105--1405)
5. [Sprint 2 — D5 → D8 (15/05 – 18/05)](#5-sprint-2--d5--d8-1505--1805)
6. [Blockers Log _(live)_](#6-blockers-log-live-append-only)
7. [Cut Decisions Log _(live)_](#7-cut-decisions-log-live-append-only-khi-trigger-fires)
8. [Risks](#8-risks)
9. [Cut Plan Triggers — Task-level _(rules, static)_](#9-cut-plan-triggers--task-level-rules-static)
10. [Appendix](#10-appendix)

---

## 1. Objective - Phase 2.5

Triển khai web app MVP **production-ready** end-to-end:

- Toàn bộ FR P0 (FR-1 → FR-5, FR-9, FR-10, FR-11) hoạt động trên public URL với OCR + LLM tích hợp **thật** (không mock)
- FR P1 (FR-6, FR-7, FR-8) hoàn thành nếu không trượt cut-line D3
- Pass Lighthouse audit theo target G-3 (Mobile Usability ≥ 90) và G-5 (Performance + Best Practices + Accessibility ≥ 80)
- Đạt **M4 — Web App Deployed (18/05)**

---

## 2. Sprint Goals

Phase 2.5 chia thành 2 mini-sprint, mỗi sprint 4 ngày, mỗi sprint có goal cụ thể để đo tiến độ giữa chừng.

### Sprint 1 (D1-D4, 11/05 – 14/05)

> **Goal:** Backend production-grade hoạt động end-to-end + Frontend Camera flow chạy được trong browser

**Pass criteria cuối Sprint 1 (EOD D4):**

- [ ] Public URL frontend mở được, gọi được backend
- [ ] Backend xử lý hết 6 endpoint với data thật (verify bằng Postman)
- [ ] Rate limit (daily + burst) chặn được khi quá ngưỡng
- [ ] Frontend chụp được ảnh, crop được, hiện skeleton loading khi gọi API
- [ ] deviceId được tạo và lưu trong localStorage

**Risk nếu trượt Sprint 1:** kích hoạt Cut Plan Trigger 1 (Section 9.1) ngay cuối D3 hoặc D4.

### Sprint 2 (D5-D8, 15/05 – 18/05)

> **Goal:** Hit M4 — Web App Deployed với happy path E2E hoạt động và Lighthouse pass

**Pass criteria cuối Sprint 2 (EOD D8):**

- [ ] Happy path end-to-end chạy trên mobile thật (chụp ảnh → ra lời giải đầy đủ với Progressive Disclosure)
- [ ] Tất cả screen S-01 → S-14 functional (hoặc subset đã cắt theo trigger)
- [ ] Error states phân biệt rõ (OCR Fail, LLM Fail, Rate Limited daily/burst)
- [ ] Lighthouse Performance + Best Practices + Accessibility ≥ 80; Mobile Usability ≥ 90
- [ ] Security review pass: API key không xuất hiện trong frontend bundle
- [ ] UptimeRobot ping hoạt động, container không cold start

**M4 ✅ điều kiện:** tất cả pass criteria trên + tag release v1.0-mvp + README.md updated.

---

## 3. Day-by-Day Plan

| Day | Ngày     | Sprint | Focus               | Status     | Cumulative FR đạt được           | Checkpoint |
| --- | -------- | ------ | ------------------- | ---------- | -------------------------------- | ---------- |
| D1  | 11/05 CN | S1     | Foundation          | ✅ Done    | FR-9 baseline                    | —          |
| D2  | 12/05 T2 | S1     | Backend core        | ⏳ Pending | FR-2, FR-4, FR-11 (backend)      | —          |
| D3  | 13/05 T3 | S1     | Backend hardening   | ⏳ Pending | FR-10, FR-11 đầy đủ              | ⚠️ **R-9** |
| D4  | 14/05 T4 | S1     | Frontend Camera     | ⏳ Pending | FR-1a, FR-1d                     | S1 Goal    |
| D5  | 15/05 T5 | S2     | Frontend Solve flow | ⏳ Pending | FR-3, FR-5 — **Happy path E2E**  | ⚠️ Floor   |
| D6  | 16/05 T6 | S2     | P1 features         | ⏳ Pending | FR-6, FR-7, FR-8, FR-1b, FR-1c   | —          |
| D7  | 17/05 T7 | S2     | Error & Polish      | ⏳ Pending | FR-11 đầy đủ + edge cases        | —          |
| D8  | 18/05 CN | S2     | Audit & Deploy      | ⏳ Pending | Lighthouse pass, security review | **M4 ✅**  |

> **Status legend:** ⏳ Pending · 🔄 In Progress (X/Y) · ✅ Done · ❌ Cut

---

## 4. Sprint 1 — D1 → D4 (11/05 – 14/05)

### 4.1 D1 — 11/05 (CN) — Foundation (~6h)

**Mục tiêu:** Empty app deploy được lên public URL; CI/CD pipeline xác nhận hoạt động.

**Tasks:**

- [x] Init Next.js 16 (App Router) + Shadcn/ui + Tailwind + KaTeX dependency — 30m (NFR-1, FR-9)
- [x] Init FastAPI + cài đặt requirements.txt theo SYSTEM_DESIGN 2.2 — 30m (FR-9)
- [x] Apply Supabase schema DDL (history_items table + index) — 30m (FR-11)
- [x] Setup CORS middleware FastAPI (`ALLOWED_ORIGINS` comma-separated) — 30m (NFR-7)
- [x] Setup `/health` endpoint (503→200 readiness guard) — 30m (OQ-7)
- [x] Deploy frontend lên Vercel (push to main) — 1h (FR-9)
- [x] Deploy backend lên Railway, verify pix2tex load OK — 1h30 (FR-9, R-10)
- [x] Verify end-to-end: Vercel URL → fetch Railway `/health` thành công — 30m (FR-9)
- [ ] Transcribe Pydantic models từ SD 3.6 vào `src/server/app/models.py` + TS types từ SD 3.7 vào `src/client/types.ts` — 45m (FR-11, contract lock cho parallel work)
- [ ] Tạo `src/client/fixtures/` với sample data matching contracts (Solution, HistoryItem[], SolutionStep[]) — 30m (FE parallel enabler)

**DoD D1:**

- [x] Public URL của frontend mở được
- [x] Backend `/health` response 200 từ frontend (CORS pass)
- [ ] Contracts transcribed + fixtures created — FE có thể bắt đầu render mà không cần BE

**Session notes:**

- _[2026-05-10]_ File promoted to Living mode. Tasks D1 ready for tomorrow morning.
- _[2026-05-12]_ Change #1 `scaffold-frontend-and-deploy`: archived. KaTeX@0.16.45 added, `vercel.json` created, deployed tại https://mathsnap-xi.vercel.app (HTTP 200 verified). Root directory set qua Vercel dashboard (không phải `rootDirectory` key trong vercel.json). `ALLOWED_ORIGINS = https://mathsnap-xi.vercel.app` sẵn sàng cho Change #3.
- _[2026-05-12]_ Change #2 `scaffold-backend-and-deploy`: archived. FastAPI scaffold với `src/server/app/main.py` (app package structure), `requirements.txt` + `albumentations<2.0.0` pin (pix2tex 0.1.2 compat fix), `Dockerfile` (python:3.11-slim, layer-cached pip, shell-form CMD cho `$PORT`). CORS dùng `ALLOWED_ORIGINS` comma-separated. Swagger UI enabled tại `/docs`. Deployed tại https://mathsnap-xi.up.railway.app — `/health` HTTP 200 verified, CORS pass từ Vercel (GET + OPTIONS preflight). Backend Railway URL sẵn sàng cho Change #3.

### 4.2 D2 — 12/05 (T2) — Backend Core (~6h)

**Mục tiêu:** API `/ocr` và `/solve` chạy được với data thật, persist Supabase.

**Tasks:**

- [ ] Implement Pydantic schemas (Solution, SolutionStep, HistoryItem) — 30m (SYSTEM_DESIGN 3.6)
- [ ] Implement `POST /api/ocr` với pix2tex.predict() — 1h (FR-2)
- [ ] Implement LCEL chain (ChatPromptTemplate + ChatOpenAI + structured output) — 1h (FR-4, SD 7.3)
- [ ] Implement `POST /api/solve` với LCEL invoke + Supabase INSERT — 1h30 (FR-4, FR-11)
- [ ] Implement `GET /api/history?page=&limit=&bookmarked=` + scope theo deviceId — 45m (FR-6, FR-11)
- [ ] Implement `GET /api/history/{id}` + `DELETE /api/history/{id}` — 30m (FR-6, FR-11)
- [ ] Implement `PATCH /api/history/{id}/bookmark` — 30m (FR-7)
- [ ] Test toàn bộ endpoint bằng Postman / curl — 30m

**DoD D2:**

- [ ] Tất cả 6 endpoint trả response đúng schema khi test bằng Postman với data thật

**Session notes:**

- _(empty)_

### 4.3 D3 — 13/05 (T3) — Backend Hardening (~6h)

**Mục tiêu:** Backend đạt trạng thái production-grade (rate limit, error handling, security).

**Tasks:**

- [ ] Implement deviceId validation (UUID v4 check) + 400 INVALID_DEVICE_ID — 30m (SYSTEM_DESIGN 4)
- [ ] Implement daily limit check (SQL count từ history_items) — 1h (FR-10, SD 9.2)
- [ ] Implement burst limit (in-memory sliding window 5/phút) — 1h (FR-10, SD 9.2.1)
- [ ] Apply rate limit cho cả `/api/ocr` và `/api/solve` — 30m (FR-10, SD 9.1)
- [ ] Implement error response schema cho tất cả 10 error codes (SD 4.8) — 1h30 (FR-11 error UX)
- [ ] Implement LaTeX sanitization + max_length validation — 30m (NFR-7, SD 11.2)
- [ ] Implement file MIME type check bằng python-magic — 30m (NFR-7, SD 11.2)
- [ ] Setup logging (Railway log stream) cho debug — 30m (SD 12.5)

**DoD D3:**

- [ ] Tất cả error case hoạt động đúng (test bằng Postman với input invalid)
- [ ] Rate limit chặn được ở 21st request/day
- [ ] Burst limit chặn được ở 6th request/phút

> ⚠️ **Hard checkpoint:** Cuối ngày 13/05 (~22h) — nếu D2 + D3 chưa xong **80% backend tasks**, kích hoạt [Cut Plan Trigger 1](#91-trigger-1--cuối-d3-1305-backend-chưa-đạt-80) ngay lập tức.

**Session notes:**

- _(empty)_

### 4.4 D4 — 14/05 (T4) — Frontend Foundation (~6h)

**Mục tiêu:** Camera flow hoạt động được trong browser với data thật. **Sprint 1 Pass Criteria** verify EOD.

**Tasks:**

- [ ] Setup component library (button, card, input, accordion) — 1h (NFR-2 Accessibility)
- [ ] Implement S-01 Home với 3 CTA + Bottom Nav — 1h (PRD 5.3)
- [ ] Implement S-02 Camera với getUserMedia + canvas capture — 1h30 (FR-1a)
- [ ] Implement S-03 Image Preview & Crop với react-easy-crop — 1h30 (FR-1d)
- [ ] Implement S-04 OCR Loading skeleton — 30m (NFR-1)
- [ ] KaTeX integration component có lazy load — 30m (NFR-1, SD 10.1)

**DoD D4 = Sprint 1 Goal:**

- [ ] Mở app trên mobile, chụp được ảnh, crop được, hiện skeleton loading
- [ ] Backend pass tất cả Postman test
- [ ] Sprint 1 pass criteria (Section 2) tất cả ✅

**Session notes:**

- _(empty)_

---

## 5. Sprint 2 — D5 → D8 (15/05 – 18/05)

### 5.1 D5 — 15/05 (T5) — Frontend Solve Flow (~6h)

**Mục tiêu:** Happy path end-to-end hoạt động — chụp ảnh → ra lời giải có Progressive Disclosure.

**Tasks:**

- [ ] Implement S-05 Formula Preview & Edit với KaTeX render real-time — 1h (FR-3)
- [ ] Connect frontend → POST /api/ocr (multipart upload) — 45m (FR-2 integration)
- [ ] Implement S-06 Solution Loading skeleton — 30m (NFR-1)
- [ ] Connect frontend → POST /api/solve — 45m (FR-4 integration)
- [ ] Implement S-07 Solution Detail với Progressive Disclosure (locked/open/answer) — 2h (FR-5)
- [ ] Implement deviceId management trong localStorage + send X-Device-ID header — 30m (FR-11)
- [ ] Manual E2E test: chụp ảnh thật → xem lời giải đầy đủ — 30m (DoD)

**DoD D5 (Hard Floor):**

- [ ] Happy path chạy end-to-end trên mobile

> Đây là **tối thiểu** để demo M6 — nếu không đạt được vào cuối D5, không thể có MVP. Kích hoạt Cut Plan Trigger 2 (Section 9.2) nếu chưa pass.

**Session notes:**

- _(empty)_

### 5.2 D6 — 16/05 (T6) — P1 Features (~6h)

**Mục tiêu:** Hoàn thành các tính năng Should-have.

**Tasks:**

- [ ] Implement S-08 History List với GET /api/history — 1h (FR-6)
- [ ] Implement swipe-to-delete trên S-08 — 30m (FR-6)
- [ ] Implement S-09 Bookmark List (filter từ History) — 45m (FR-7)
- [ ] Implement bookmark toggle trên S-07 — 30m (FR-7)
- [ ] Implement S-13 Settings + language toggle (next-intl) — 1h (FR-8)
- [ ] Implement S-11 Manual LaTeX Input — 1h (FR-1c)
- [ ] Implement S-01 Upload từ thư viện (file picker) — 30m (FR-1b)
- [ ] Bilingual prompt cho LLM (inject language vào system prompt) — 30m (FR-8, SD 7.1)

**DoD D6:**

- [ ] Tất cả P0 + P1 features functional

**Session notes:**

- _(empty)_

### 5.3 D7 — 17/05 (T7) — Error & Polish (~6h)

**Mục tiêu:** Mọi edge case và error state có UX tốt; chuẩn bị recruit user test.

**Tasks:**

- [ ] Implement S-10 Error State — 3 variant (OCR Fail, LLM Fail, Rate Limited) — 1h30 (FR-11)
- [ ] Implement message phân biệt daily-limit vs burst-limit (SD 8.5) — 30m (FR-10)
- [ ] Implement S-12 Onboarding overlay (one-time) — 1h (OQ-3 PRD)
- [ ] Implement S-14 Problem Selector (multi-formula case) — 1h (OQ-4 PRD)
- [ ] Mobile responsive QA — verify trên iOS Safari + Android Chrome — 1h (NFR-3)
- [ ] Recruit ≥ 3 user cho Validation D9-D10 — 1h (Validation prep)

**DoD D7:**

- [ ] Mọi screen S-01 → S-14 functional
- [ ] User test confirmed (≥ 3 user)

**Session notes:**

- _(empty)_

### 5.4 D8 — 18/05 (CN) — Audit & Final Deploy (~6h)

**Mục tiêu:** Hit M4 — Web App Deployed với Lighthouse pass. **Sprint 2 Pass Criteria** verify EOD.

**Tasks:**

- [ ] Lighthouse audit lần 1 trên public URL — ghi nhận điểm — 30m (SD 10.4)
- [ ] Optimize: code split, lazy load KaTeX, image optimization — 1h30 (NFR-1, SD 10.1)
- [ ] Lighthouse audit lần 2 — verify Performance/Best Practices/Accessibility ≥ 80 — 30m (G-5)
- [ ] Security review: verify API key không xuất hiện trong frontend bundle — 30m (NFR-7, R-11)
- [ ] Verify UptimeRobot ping hoạt động, container không cold start — 30m (OQ-7)
- [ ] Final smoke test happy path + 3 error scenarios — 1h (DoD)
- [ ] Tag release v1.0-mvp trên git — 15m
- [ ] Cập nhật README.md với public URL + screenshot — 45m (M6 deliverable)

**DoD D8 = M4 — Web App Deployed:**

- [ ] Public URL stable
- [ ] Lighthouse pass (Performance/Best Practices/Accessibility ≥ 80, Mobile Usability ≥ 90)
- [ ] Sprint 2 pass criteria (Section 2) tất cả ✅
- [ ] Sẵn sàng cho usability test

**Session notes:**

- _(empty)_

---

## 6. Blockers Log _(live, append-only)_

| Ngày phát hiện              | Blocker | Severity | Owner | Status | Resolved |
| --------------------------- | ------- | -------- | ----- | ------ | -------- |
| _(empty — chưa có blocker)_ |         |          |       |        |          |

---

## 7. Cut Decisions Log _(live, append-only khi trigger fires)_

| Ngày                              | Trigger fired | Quyết định | Tasks bị cắt | Tiết kiệm |
| --------------------------------- | ------------- | ---------- | ------------ | --------- |
| _(empty — chưa có trigger fired)_ |               |            |              |           |

---

## 8. Risks

Subset của Risk Register tổng (xem [ROADMAP Section 3](../ROADMAP.md#3-risks--dependencies)). Các risk dưới đây có khả năng phát sinh hoặc cần monitor trong Phase 2.5.

| ID   | Risk                                | Khả năng | Tác động | Trigger phát hiện   | Mitigation tại Phase 2.5                                             |
| ---- | ----------------------------------- | -------- | -------- | ------------------- | -------------------------------------------------------------------- |
| R-9  | Không kịp implement trong 8 ngày    | Cao      | Cao      | EOD D3 (13/05)      | Checkpoint cứng D3; kích hoạt Cut Plan Trigger 1 nếu trượt 80%       |
| R-10 | Infra cost vượt ngân sách           | TB       | TB       | Daily billing alert | OpenAI alert $5 setup từ NOW; rate limit BR-14                       |
| R-11 | API key OCR/LLM bị lộ trên frontend | Cao      | Cao      | Build inspection D8 | Backend proxy đã spec SD 1.4 + 11.1; verify trong D8 security review |
| R-1  | OCR sai trên công thức phức tạp     | Cao      | TB       | D5 manual test      | BR-3: cho user sửa LaTeX trước solve; hướng dẫn chụp trong S-12      |

---

## 9. Cut Plan Triggers — Task-level _(rules, static)_

Cut plan kích hoạt theo trigger thời gian, không chờ approval. Self-execute để bảo vệ DoD tối thiểu. Strategic rules: xem [ROADMAP Section 5](../ROADMAP.md#5-moscow-cut-plan).

### 9.1 Trigger 1 — Cuối D3 (13/05) backend chưa đạt 80%

**Cắt P1 ngay lập tức:**

| FR    | Tên                            | Tasks bị cắt                                                   | Tiết kiệm |
| ----- | ------------------------------ | -------------------------------------------------------------- | --------- |
| FR-6  | History List (S-08)            | D6 task "Implement S-08 History List" + "swipe-to-delete"      | ~1.5h     |
| FR-7  | Bookmark (S-09)                | D6 task "Implement S-09 Bookmark List" + "bookmark toggle"     | ~1.5h     |
| FR-8  | Bilingual (next-intl + prompt) | D6 task "S-13 Settings + language toggle" + "Bilingual prompt" | ~1.5h     |
| FR-1c | Manual LaTeX Input (S-11)      | D6 task "Implement S-11 Manual LaTeX Input"                    | ~1h       |
|       | **Tổng tiết kiệm**             | —                                                              | **~5.5h** |

**Tiết kiệm thêm ở backend:** Bỏ FR-6/FR-7 đồng nghĩa **bỏ luôn** `GET/DELETE/PATCH /api/history*` khỏi backend D2 → tiết kiệm thêm ~1h.

### 9.2 Trigger 2 — Cuối D5 (15/05) frontend chưa có Happy Path E2E

**Cắt thêm để bảo vệ M4:**

| Hạng mục                               | Task bị cắt                      | Lý do cắt                                     |
| -------------------------------------- | -------------------------------- | --------------------------------------------- |
| S-12 Onboarding (chỉ dùng tooltip)     | D7 task "Implement S-12"         | Không phải core; user vẫn dùng được app       |
| S-14 Problem Selector                  | D7 task "Implement S-14"         | Edge case multi-formula — chỉ xử lý 1 formula |
| FR-1d Crop & Rotate                    | D4 task "S-03 + react-easy-crop" | Gửi full image; chấp nhận accuracy giảm       |
| Bilingual cho LLM (chỉ giữ tiếng Việt) | D6 task "Bilingual prompt"       | Reduce prompt complexity                      |

### 9.3 Hard Floor — KHÔNG ĐƯỢC CẮT

Đây là tối thiểu để pass DoD và demo M6:

**Functional Requirements:**

- FR-1a (Camera) **hoặc** FR-1b (Upload) — cần ít nhất 1 input method
- FR-2 (OCR), FR-3 (Confirm), FR-4 (Solve), FR-5 (Progressive Disclosure)
- FR-9 (Deploy), FR-10 (Rate Limit), FR-11 (Persist)

**Screens:**

- S-01, S-03, S-05, S-06, S-07, S-10

Nếu cắt vào hard floor → MVP không demo được → fail DoD → fail môn.

---

## 10. Appendix

### 10.1 Tổng giờ Phase 2.5

| Sprint   | Days   | Tổng giờ ước lượng |
| -------- | ------ | ------------------ |
| Sprint 1 | D1-D4  | ~24h               |
| Sprint 2 | D5-D8  | ~24h               |
| **Tổng** | 8 ngày | **~48h**           |

### 10.2 Phân bổ workstream

| Workstream                   | Giờ ước lượng | %   |
| ---------------------------- | ------------- | --- |
| Backend (D1-D3)              | ~18h          | 38% |
| Frontend (D4-D7)             | ~24h          | 50% |
| Polish + Deploy + Audit (D8) | ~6h           | 12% |

### 10.3 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo Phase 2.5 Implementation Plan: extract Section 3 từ ROADMAP v1.0.0; bổ sung Sprint Goals (Sprint 1 D1-D4, Sprint 2 D5-D8) với pass criteria cụ thể; tách Cut Plan Triggers task-level; thêm bảng phân bổ workstream và risks active trong phase                                                                                                                                                                                                                                                                                                                                                                 |
| **2.0.0** | 10/05/2026 | Thanh Thinh Nguyen | **Promoted from Planning to Living mode** theo `_TEMPLATE.md` v1.0.0. Thêm Status Banner (unnumbered, trước Mục lục) với Today/Sprint/progress/blockers/cut triggers/next milestone + Top 3 hôm nay; convert all task tables → checkboxes trong D1-D8 với DoD checkboxes; thêm Session notes block dưới mỗi D-X; thêm Blockers Log (Section 6) + Cut Decisions Log (Section 7) empty initial; renumber Risks 6→8, Cut Plan Triggers 7→9, Appendix 8→10; rename sections theo convention (Mục tiêu → Objective, Tổng quan Day-by-Day → Day-by-Day Plan); update Trạng thái header Pending → 🟢 Active. Bump 1.0.0 → 2.0.0 |
