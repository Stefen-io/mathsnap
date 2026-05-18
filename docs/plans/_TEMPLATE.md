# Phase Plan Template

## MathSnap

| Thông tin         | Chi tiết                                                        |
| ----------------- | --------------------------------------------------------------- |
| **Dự án**         | MathSnap                                                        |
| **Phiên bản**     | 1.0.0                                                           |
| **Ngày cập nhật** | 10/05/2026                                                      |
| **Tác giả**       | Thanh Thinh Nguyen                                              |
| **Loại tài liệu** | Template chuẩn cho mọi `docs/plans/PHASE_X_*.md`                |
| **Tham chiếu**    | ROADMAP v2.0.0                                                  |
| **Đối tượng**     | Tác giả đồ án + AI agent (Claude Code) trong các phiên làm việc |

> **Phạm vi tài liệu:** Định nghĩa **3 mode template** cho phase plan files: Planning (chưa bắt đầu), Living (đang active, cần tracking liên session), Snapshot (đã hoàn thành). Khi tạo phase plan mới, chọn mode phù hợp với trạng thái phase, copy structure, replace placeholder. Khi phase chuyển trạng thái, áp transition rules.
>
> **Workflow context:** Mỗi phiên làm việc với AI agent, agent đọc ROADMAP + PHASE_X file để tiếp tục công việc dang dở. Living mode được thiết kế riêng cho usecase này.

---

## Mục lục (Table of Contents)

1. [3 Mode Overview](#1-3-mode-overview)
2. [Mode 1 — Planning Template](#2-mode-1--planning-template)
3. [Mode 2 — Living Template (active phase)](#3-mode-2--living-template-active-phase)
4. [Mode 3 — Snapshot Template](#4-mode-3--snapshot-template)
5. [Transition Rules](#5-transition-rules)
6. [Placeholder Convention](#6-placeholder-convention)
7. [How to Use This Template](#7-how-to-use-this-template)
8. [Appendix](#8-appendix)

---

## 1. 3 Mode Overview

| Mode         | Phase status            | Mục đích                                                                                         | File property                            | Ví dụ trong workspace                                                |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------- |
| **Planning** | Pending (chưa bắt đầu)  | Có sẵn plan, ready để promote khi phase start                                                    | Static document                          | `PHASE_3_VALIDATION.md`, `PHASE_4_DELIVERY.md` (sau khi refactor)    |
| **Living**   | 🟢 Active (đang chạy)   | Operating manual cho mỗi session AI: state visible, checkboxes, session notes, blockers/cuts log | **Living document** — update mỗi session | `PHASE_2.5_IMPLEMENTATION.md` (sau khi promote)                      |
| **Snapshot** | ✅ Done (đã hoàn thành) | Audit trail, retrospective                                                                       | Static document, không update            | `PHASE_0_DISCOVERY.md`, `PHASE_1_DEFINITION.md`, `PHASE_2_DESIGN.md` |

### Quy ước trạng thái

| Phase status | Giá trị "Trạng thái"                         |
| ------------ | -------------------------------------------- |
| Pending      | `Planning — bắt đầu {{Date}}`                |
| Active       | `🟢 Active — Day {{X}}/{{N}}, Sprint {{Y}}`  |
| Done         | `✅ Done`                                    |
| Cancelled    | `❌ Cancelled — {{Date}}, lý do: {{reason}}` |

---

## 2. Mode 1 — Planning Template

**Khi dùng:** Phase chưa bắt đầu, đang chờ. File này là plan tĩnh, sẽ promote sang Living khi phase D1 đến.

### Cấu trúc

```markdown
# Phase {{N}} — {{Name}} Plan

## {{Project Name}}

| Thông tin         | Chi tiết                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| **Dự án**         | {{Project Name}}                                                             |
| **Phiên bản**     | 1.0.0                                                                        |
| **Ngày cập nhật** | {{DD/MM/YYYY}}                                                               |
| **Tác giả**       | {{Author}}                                                                   |
| **Phase**         | {{N}} — {{Name}}                                                             |
| **Thời gian**     | {{DD/MM}} – {{DD/MM/YYYY}} ({{X}} ngày)                                      |
| **Trạng thái**    | Planning — bắt đầu {{StartDate}}                                             |
| **Tham chiếu**    | ROADMAP v{{X}}.{{Y}}.{{Z}} · BRD v{{X}}.{{Y}}.{{Z}} · PRD v{{X}}.{{Y}}.{{Z}} |
| **Đối tượng**     | {{Target Audience}}                                                          |

> **Phạm vi:** Plan chi tiết cho {{X}} ngày Phase {{N}} {{Name}}. Cap nguồn: ROADMAP cluster {{NOW/NEXT/LATER}}. **Mode: Planning** — promote sang Living khi phase D1 đến.

## Mục lục (Table of Contents)

1. Objective - Phase {{N}}
2. Day-by-Day Plan
3. Deliverables target
4. Milestone target
5. Risks
6. Appendix

## 1. Objective - Phase {{N}}

[Statement ngắn 1-2 câu về outcome chính. Đạt **M{{ID}} — {{Name}} ({{Date}})**.]

## 2. Day-by-Day Plan

| Day    | Ngày      | Focus   | Tasks (preview) | Ước lượng |
| ------ | --------- | ------- | --------------- | --------- |
| D{{X}} | {{DD/MM}} | [focus] | [task summary]  | ~6h       |

## 3. Deliverables target

- [ ] Item 1
- [ ] Item 2

## 4. Milestone target

- **M{{ID}} — {{Name}} ({{Date}})**

## 5. Risks

| ID  | Risk | Khả năng | Tác động | Mitigation |
| --- | ---- | -------- | -------- | ---------- |
| R-X | ...  | ...      | ...      | ...        |

## 6. Appendix

### 6.1 Lịch sử sửa đổi

| Phiên bản | Ngày     | Tác giả    | Nội dung          |
| --------- | -------- | ---------- | ----------------- |
| **1.0.0** | {{Date}} | {{Author}} | Khởi tạo Planning |
```

---

## 3. Mode 2 — Living Template (active phase)

**Khi dùng:** Phase đang chạy. AI agent đọc file này mỗi session để biết state hiện tại và tiếp tục công việc.

**Đặc điểm cốt lõi:**

- **Status Banner** — đập vào mắt đầu tiên, AI đọc 30s là biết phải làm gì.
- **Tasks là checkbox** (`- [ ]` / `- [x]`) — tick xong khi done.
- **Session notes append-only** dưới từng D-X — agent ghi lại đã làm gì cuối session.
- **Blockers Log + Cut Decisions Log** — append-only, audit trail trong cùng file.

### Cấu trúc

```markdown
# Phase {{N}} — {{Name}} Plan

## {{Project Name}}

| Thông tin         | Chi tiết                                                                     |
| ----------------- | ---------------------------------------------------------------------------- |
| **Dự án**         | {{Project Name}}                                                             |
| **Phiên bản**     | {{X}}.{{Y}}.{{Z}}                                                            |
| **Ngày cập nhật** | {{DD/MM/YYYY}}                                                               |
| **Tác giả**       | {{Author}}                                                                   |
| **Phase**         | {{N}} — {{Name}}                                                             |
| **Thời gian**     | {{DD/MM}} – {{DD/MM/YYYY}} ({{X}} ngày)                                      |
| **Trạng thái**    | 🟢 Active — Day {{X}}/{{N}}, Sprint {{Y}}                                    |
| **Tham chiếu**    | ROADMAP v{{X}}.{{Y}}.{{Z}} · BRD v{{X}}.{{Y}}.{{Z}} · PRD v{{X}}.{{Y}}.{{Z}} |
| **Đối tượng**     | {{Target Audience}}                                                          |

> **Phạm vi:** Operating manual cho Phase {{N}} đang active. **Mode: Living** — Status Banner update mỗi cuối session. Tasks checkbox được tick khi done. Session notes append vào từng D-X tương ứng.

## Status Banner _(đọc trước tiên — auto-updated)_

> **Cập nhật mỗi cuối session.** Đây là source of truth cho AI agent biết hôm nay làm gì.

| Field                  | Value                                |
| ---------------------- | ------------------------------------ |
| **Today**              | D{{X}} ({{DD/MM}}, {{Tx}})           |
| **Current Sprint**     | Sprint {{Y}} ({{D-range}})           |
| **Phase progress**     | {{Z}}/{{N}} tasks done ({{Z%}})      |
| **Today progress**     | {{Done}}/{{Total today}} tasks       |
| **Last session**       | {{YYYY-MM-DD HH:MM}}                 |
| **Active blockers**    | {{count}} (xem Section 7)            |
| **Cut triggers fired** | {{none / T1 on D-X}} (xem Section 8) |
| **Next milestone**     | M{{ID}} — {{Name}} ({{Date}})        |

**Top 3 hôm nay (P0 trước):**

1. [ ] Task A
2. [ ] Task B
3. [ ] Task C

---

## Mục lục (Table of Contents)

1. Objective - Phase {{N}}
2. Sprint Goals
3. Day-by-Day Plan
4. Sprint 1 — D{{X}} → D{{Y}}
5. Sprint 2 — D{{Z}} → D{{N}}
6. Blockers Log _(live)_
7. Cut Decisions Log _(live)_
8. Risks
9. Cut Plan Triggers — Task-level _(rules, static)_
10. Appendix

---

## 1. Objective - Phase {{N}}

[Statement]

## 2. Sprint Goals

### Sprint 1 (D{{X}}-D{{Y}})

> **Goal:** [statement]
> **Pass criteria cuối Sprint 1:**

- [ ] [criterion 1]
- [ ] [criterion 2]

### Sprint 2 (D{{Z}}-D{{N}})

> **Goal:** [statement]
> **Pass criteria cuối Sprint 2:**

- [ ] [criterion 1]

## 3. Day-by-Day Plan

| Day      | Ngày      | Sprint | Focus   | Status               | Cumulative FR |
| -------- | --------- | ------ | ------- | -------------------- | ------------- |
| D{{X}}   | {{DD/MM}} | S1     | [focus] | ✅ Done              | FR-X          |
| D{{X+1}} | {{DD/MM}} | S1     | [focus] | 🔄 In Progress (3/8) | FR-Y          |
| D{{X+2}} | {{DD/MM}} | S1     | [focus] | ⏳ Pending           | —             |

## 4. Sprint 1 — D{{X}} → D{{Y}}

### 4.1 D{{X}} — {{DD/MM}} ({{Tx}}) — [Focus] (~6h)

**Mục tiêu:** [statement]

**Tasks:**

- [ ] Task A — 30m (FR-X, NFR-Y)
- [ ] Task B — 1h (FR-Z)
- [x] Task C — 30m (đã làm trước)

**DoD D{{X}}:**

- [ ] Public URL của frontend mở được
- [ ] Backend `/health` response 200

**Session notes:**

- _[YYYY-MM-DD HH:MM]_ Bắt đầu task A. pix2tex load chậm (30m thay vì 10m).
- _[YYYY-MM-DD HH:MM]_ Done task A và B. Task C đã làm trước. Carryover: nothing.

### 4.2 D{{X+1}} — {{DD/MM}} ({{Tx+1}}) — [Focus] (~6h)

[Cùng cấu trúc]

## 5. Sprint 2 — D{{Z}} → D{{N}}

[Cùng cấu trúc Sprint 1]

---

## 6. Blockers Log _(live, append-only)_

| Ngày phát hiện | Blocker                   | Severity | Owner | Status         | Resolved |
| -------------- | ------------------------- | -------- | ----- | -------------- | -------- |
| YYYY-MM-DD     | OpenAI API key chưa setup | High     | Bạn   | 🔄 In Progress | —        |

## 7. Cut Decisions Log _(live, append-only khi trigger fires)_

| Ngày       | Trigger fired | Quyết định                     | Tasks bị cắt            | Tiết kiệm |
| ---------- | ------------- | ------------------------------ | ----------------------- | --------- |
| YYYY-MM-DD | T1 (cuối D3)  | Cắt P1 do backend chưa đạt 80% | FR-6, FR-7, FR-8, FR-1c | ~6h       |

## 8. Risks

| ID  | Risk | Khả năng | Tác động | Mitigation |
| --- | ---- | -------- | -------- | ---------- |
| R-X | ...  | ...      | ...      | ...        |

## 9. Cut Plan Triggers — Task-level _(rules, static)_

[Static rules — không thay đổi qua session]

### 9.1 Trigger 1 — Khi nào kích hoạt

[rule]

### 9.2 Hard Floor — KHÔNG ĐƯỢC CẮT

[rule]

## 10. Appendix

### 10.1 Tổng giờ Phase {{N}}

### 10.2 Phân bổ workstream

### 10.3 Lịch sử sửa đổi

| Phiên bản | Ngày     | Tác giả               | Nội dung                              |
| --------- | -------- | --------------------- | ------------------------------------- |
| 1.0.0     | {{Date}} | {{Author}}            | Promoted from Planning to Living mode |
| 1.1.0     | {{Date}} | {{Author or Session}} | Session note D{{X}}: [summary]        |
```

---

## 4. Mode 3 — Snapshot Template

**Khi dùng:** Phase đã hoàn thành. File trở thành audit trail, không update nữa.

### Cấu trúc

```markdown
# Phase {{N}} — {{Name}} Plan

## {{Project Name}}

| Thông tin         | Chi tiết                                            |
| ----------------- | --------------------------------------------------- |
| **Dự án**         | {{Project Name}}                                    |
| **Phiên bản**     | {{X}}.{{Y}}.{{Z}}                                   |
| **Ngày cập nhật** | {{DD/MM/YYYY}}                                      |
| **Tác giả**       | {{Author}}                                          |
| **Phase**         | {{N}} — {{Name}}                                    |
| **Thời gian**     | {{DD/MM}} – {{DD/MM/YYYY}} ({{X}} ngày)             |
| **Trạng thái**    | ✅ Done                                             |
| **Tham chiếu**    | ROADMAP v{{X}}.{{Y}}.{{Z}} · BRD v{{X}}.{{Y}}.{{Z}} |
| **Đối tượng**     | {{Target Audience}}                                 |

> **Phạm vi:** Retrospective plan ghi lại những gì đã thực hiện. **Mode: Snapshot** — không update sau khi phase đóng.

## Mục lục (Table of Contents)

1. Objective - Phase {{N}}
2. Day-by-Day Plan
3. Deliverables
4. Milestone target
5. Appendix

## 1. Objective - Phase {{N}}

[Statement, kèm "Đạt M{{ID}} ({{Date}})"]

## 2. Day-by-Day Plan

| Day    | Ngày               | Hoạt động chính | Output   |
| ------ | ------------------ | --------------- | -------- |
| D{{X}} | {{DD/MM}} ({{Tx}}) | [activities]    | [output] |

## 3. Deliverables

- ✅ Item 1
- ✅ Item 2

## 4. Milestone target

- **M{{ID}} — {{Name}} ({{Date}})** ✅

## 5. Appendix

### 5.1 Tổng giờ thực tế _(optional, nếu nhớ)_

- Sprint 1: ~Xh thực tế (vs ~Yh estimate)
- Notable variance: [if any]

### 5.2 Lịch sử sửa đổi
```

---

## 5. Transition Rules

### 5.1 Khi nào transition

| From     | To        | Trigger                                    | Thực hiện bởi                   |
| -------- | --------- | ------------------------------------------ | ------------------------------- |
| Planning | Living    | Sáng D1 của phase (trước session đầu tiên) | Bạn (manual)                    |
| Living   | Snapshot  | Cuối D-cuối, sau khi hit milestone phase   | Bạn (manual, sau retrospective) |
| Planning | Cancelled | Phase bị huỷ scope                         | Bạn (rare)                      |

### 5.2 Planning → Living — Steps

1. Cập nhật `Trạng thái` trong header: `Planning — ...` → `🟢 Active — Day 1/{{N}}, Sprint 1`
2. **Thêm Status Banner** ở đầu (sau Phạm vi tài liệu, trước Mục lục (Table of Contents) cũ).
3. **Convert task tables → checkboxes** trong từng day section.
4. **Thêm Session notes** trong từng day (block placeholder).
5. **Thêm Section Blockers Log + Cut Decisions Log** (empty initially).
6. **Tách Sprint 1 / Sprint 2** thành section riêng nếu chưa có.
7. **Tách Cut Plan Triggers** thành section riêng nếu chưa có.
8. Bump version (vd. 1.0.0 → 2.0.0 vì breaking structural change).
9. Add changelog entry: "Promoted from Planning to Living".

### 5.3 Living → Snapshot — Steps

1. Cập nhật `Trạng thái`: `🟢 Active — ...` → `✅ Done`
2. **Xoá Status Banner** (không còn ý nghĩa khi phase done).
3. **Convert checkbox tasks → table format** (gom thành 1 table per day hoặc 1 table tổng quan).
4. **Archive Session notes** vào Day-by-Day Breakdown table (cột "Hoạt động chính" / "Output").
5. **Freeze Blockers Log + Cut Decisions Log** (giữ làm historical record).
6. **Đơn giản hoá** theo Snapshot template.
7. **Move Risks active + Cut Plan rules** vào Appendix (lessons learned).
8. **Optional:** Thêm "Tổng giờ thực tế" vào Appendix nếu có data.
9. Bump version (vd. 2.X.X → 3.0.0).
10. Add changelog: "Demoted from Living to Snapshot — phase complete on {{Date}}".

---

## 6. Placeholder Convention

| Placeholder        | Ý nghĩa                  | Ví dụ                                       |
| ------------------ | ------------------------ | ------------------------------------------- |
| `{{Project Name}}` | Project name             | `MathSnap`                                  |
| `{{N}}`            | Phase number             | `0`, `1`, `2`, `2.5`, `3`, `4`              |
| `{{Name}}`         | Phase name               | `Discovery`, `Implementation`, `Validation` |
| `{{X}}`            | Generic số ngày / thứ tự | `8` (ngày), `1` (Sprint 1)                  |
| `{{DD/MM}}`        | Ngày ngắn                | `11/05`                                     |
| `{{DD/MM/YYYY}}`   | Ngày đầy đủ              | `11/05/2026`                                |
| `{{Tx}}`           | Thứ trong tuần           | `T2`, `T3`, `CN`                            |
| `{{Date}}`         | Bất kỳ ngày tham chiếu   | `01/05/2026`                                |
| `{{X.Y.Z}}`        | Version SemVer           | `2.0.0`                                     |
| `{{Author}}`       | Người update             | `Thanh Thinh Nguyen`                        |
| `{{cluster}}`      | ROADMAP cluster          | `NOW`, `NEXT`, `LATER`                      |
| `{{none}}`         | Default empty value      | Hiển thị nguyên chữ "none"                  |

**Quy tắc:** mọi `{{...}}` phải replace trước khi commit file. Nếu placeholder không áp dụng (vd. Sprint 2 không có), xoá hẳn block đó thay vì để placeholder.

---

## 7. How to Use This Template

### 7.1 Khởi tạo phase plan mới

1. Copy structure Mode 1 — Planning Template.
2. Tạo file `docs/plans/PHASE_{{N}}_{{NAME}}.md` (snake_case uppercase, vd. `PHASE_5_LAUNCH.md`).
3. Replace all `{{placeholders}}`.
4. Update `docs/ROADMAP.md` Section 6.2 thêm row mới.
5. Commit.

### 7.2 Chuyển đổi phase từ Planning → Living

Khi sáng D1 của phase đến (vd. sáng 19/05 cho Phase 3):

1. Áp transition steps Section 5.2 vào file.
2. Update `docs/ROADMAP.md` Section 6.2 đổi status `Pending` → `Active`.
3. Commit với message rõ: `chore(plans): promote Phase X to Living mode`.

### 7.3 Cập nhật Living phase trong session AI

**Đầu mỗi session:**

- Đọc Status Banner.
- Đọc 3 task hôm nay.
- Đọc Blockers Log nếu có active.

**Cuối mỗi session:**

- Tick checkbox cho task đã done.
- Append session note vào day section.
- Update Status Banner: progress %, last session timestamp.
- Nếu có blocker mới → append vào Blockers Log.
- Nếu trigger Cut Plan → append vào Cut Decisions Log + cắt task tương ứng.

### 7.4 Chuyển đổi phase từ Living → Snapshot

Cuối D-cuối của phase, sau khi hit milestone:

1. Áp transition steps Section 5.3 vào file.
2. Update `docs/ROADMAP.md` Section 6.2 đổi status `Active` → `✅ Done`.
3. Commit: `chore(plans): demote Phase X to Snapshot mode — phase complete`.

---

## 8. Appendix

### 8.1 Lý do chọn phương án

(Decision log — short)

- **Multi-session AI workflow:** mỗi session AI đọc PHASE_X làm operating manual → cần Living mode có state visible.
- **3 mode tách biệt** thay vì 1 template fits all: tôn trọng bản chất khác nhau giữa "đã làm" (Snapshot), "đang làm" (Living), "sẽ làm" (Planning) mà không over-engineer các phase đơn giản.
- **Defaults được chọn:**
  - Status Banner (sau header table) — flow tự nhiên: meta → state → details.
  - Session notes granular dưới từng D-X — preserve context per-day.
  - Blockers + Cut Decisions tách 2 logs riêng — khác urgency, khác audience.
  - STANDUP_TEMPLATE giữ tách (không embed) — reusable across phases.

### 8.2 Lịch sử sửa đổi

| Phiên bản | Ngày       | Tác giả            | Nội dung                                                                                                                              |
| --------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **1.0.0** | 10/05/2026 | Thanh Thinh Nguyen | Khởi tạo template chuẩn cho `docs/plans/`. Định nghĩa 3 mode (Planning, Living, Snapshot) + Transition Rules + Placeholder Convention |
