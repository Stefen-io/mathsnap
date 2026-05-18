# Cowork × Skills — Software Development & Management

> Tài liệu tổng hợp toàn bộ kiến thức về các skills có sẵn trong Cowork Plugins,
> áp dụng vào quy trình phát triển và quản lý phần mềm.

---

## Mục lục

1. [Tổng quan các Skills theo nhóm](#1-tổng-quan-các-skills-theo-nhóm)
2. [Vòng đời phát triển phần mềm & Skills tương ứng](#2-vòng-đời-phát-triển-phần-mềm--skills-tương-ứng)
3. [Giai đoạn 1 — Lên kế hoạch & Định nghĩa sản phẩm](#3-giai-đoạn-1--lên-kế-hoạch--định-nghĩa-sản-phẩm)
4. [Giai đoạn 2 — Thiết kế UI/UX (Figma)](#4-giai-đoạn-2--thiết-kế-uiux-figma)
5. [Giai đoạn 3 — Kiến trúc & System Design](#5-giai-đoạn-3--kiến-trúc--system-design)
6. [Giai đoạn 4 — Development](#6-giai-đoạn-4--development)
7. [Giai đoạn 5 — Triển khai & Vận hành](#7-giai-đoạn-5--triển-khai--vận-hành)
8. [Giai đoạn 6 — Đo lường & Cải tiến](#8-giai-đoạn-6--đo-lường--cải-tiến)
9. [Giao tiếp hàng ngày](#9-giao-tiếp-hàng-ngày)
10. [Mối quan hệ PRD và Sprint](#10-mối-quan-hệ-prd-và-sprint)
11. [Workflow hoàn chỉnh theo sơ đồ](#11-workflow-hoàn-chỉnh-theo-sơ-đồ)
12. [Lời khuyên phát triển phần mềm](#12-lời-khuyên-phát-triển-phần-mềm)

---

## 1. Tổng quan các Skills theo nhóm

### 📋 Product Management

| Skill                                      | Mục đích                            |
| ------------------------------------------ | ----------------------------------- |
| `product-management:product-brainstorming` | Brainstorm ý tưởng, khám phá vấn đề |
| `product-management:write-spec`            | Viết PRD / Feature Spec             |
| `product-management:roadmap-update`        | Tạo & cập nhật roadmap              |
| `product-management:sprint-planning`       | Lên kế hoạch sprint                 |
| `product-management:metrics-review`        | Phân tích metrics sản phẩm          |
| `product-management:stakeholder-update`    | Báo cáo tiến độ cho leadership      |
| `product-management:competitive-brief`     | Phân tích cạnh tranh                |
| `product-management:synthesize-research`   | Tổng hợp nghiên cứu người dùng      |

### 🔧 Engineering

| Skill                           | Mục đích                           |
| ------------------------------- | ---------------------------------- |
| `engineering:system-design`     | Thiết kế hệ thống, API, data model |
| `engineering:architecture`      | Quyết định kiến trúc (ADR)         |
| `engineering:code-review`       | Review code trước khi merge        |
| `engineering:debug`             | Debug lỗi có cấu trúc              |
| `engineering:testing-strategy`  | Chiến lược và kế hoạch test        |
| `engineering:documentation`     | Viết tài liệu kỹ thuật             |
| `engineering:deploy-checklist`  | Checklist trước khi deploy         |
| `engineering:incident-response` | Xử lý sự cố production             |
| `engineering:tech-debt`         | Kiểm tra & ưu tiên nợ kỹ thuật     |
| `engineering:standup`           | Tạo báo cáo standup hàng ngày      |

### 🎨 Design

| Skill                         | Mục đích                           |
| ----------------------------- | ---------------------------------- |
| `design:design-critique`      | Feedback về usability, hierarchy   |
| `design:accessibility-review` | Kiểm tra chuẩn WCAG 2.1 AA         |
| `design:ux-copy`              | Viết microcopy, CTA, error message |
| `design:design-handoff`       | Tạo spec bàn giao cho developer    |
| `design:design-system`        | Audit & document design system     |
| `design:user-research`        | Lập kế hoạch nghiên cứu UX         |
| `design:research-synthesis`   | Tổng hợp kết quả nghiên cứu        |

### 📄 File & Tài liệu

| Skill                | Mục đích                        |
| -------------------- | ------------------------------- |
| `docx`               | Tạo/chỉnh sửa Word Document     |
| `pdf`                | Tạo/xử lý/trích xuất PDF        |
| `xlsx`               | Tạo/chỉnh sửa Excel Spreadsheet |
| `pptx`               | Tạo/chỉnh sửa PowerPoint        |
| `excalidraw-diagram` | Vẽ sơ đồ, flowchart, diagram    |

### ⚙️ Tự động hóa

| Skill           | Mục đích                          |
| --------------- | --------------------------------- |
| `schedule`      | Tạo tác vụ chạy tự động theo lịch |
| `skill-creator` | Tạo hoặc cải thiện skill mới      |

---

## 2. Vòng đời phát triển phần mềm & Skills tương ứng

```
💡 Ý tưởng
    │
    ▼
📋 Lên kế hoạch & Định nghĩa (PRD)
    │
    ▼
🎨 Thiết kế UI/UX (Figma)
    │
    ▼
🏗️ Kiến trúc & System Design
    │
    ▼
💻 Development (code, review, debug, test)
    │
    ▼
🚀 Deploy
    │
    ▼
🔥 Vận hành & Incident Response
    │
    ▼
📊 Đo lường & Cải tiến
    │
    ▼
🔄 Lặp lại với sprint tiếp theo
```

---

## 3. Giai đoạn 1 — Lên kế hoạch & Định nghĩa sản phẩm

### Bước 1.1 — `product-management:product-brainstorming`

**Khi nào dùng:** Khi ý tưởng còn mơ hồ, chưa rõ hướng đi.

**Tác dụng:** Đóng vai thinking partner — đặt câu hỏi phản biện, gợi ý góc nhìn mới, giúp làm rõ vấn đề trước khi đầu tư công sức.

**Ví dụ:**

> "Tôi muốn làm app giúp team quản lý bug tốt hơn. Brainstorm giúp tôi nhé."

---

### Bước 1.2 — `product-management:write-spec`

**Khi nào dùng:** Sau khi ý tưởng đã rõ, cần tài liệu hóa thành PRD/Feature Spec.

**Output gồm:** Mục tiêu, non-goals, user stories, success metrics, acceptance criteria.

> ⚠️ **Quan trọng:** Đây là tài liệu gốc mà toàn bộ team tham chiếu. Cần viết trước khi sprint bắt đầu.

**Ví dụ:**

> "Viết PRD cho tính năng Bug Tracker — cho phép dev tạo, assign và track bug theo sprint."

---

### Bước 1.3 — `product-management:roadmap-update`

**Khi nào dùng:** Khi có nhiều feature, cần sắp xếp thứ tự ưu tiên.

**Ví dụ:**

> "Tôi có 5 feature cho Q2, giúp tôi xếp vào roadmap Now/Next/Later."

---

### Bước 1.4 — `product-management:sprint-planning`

**Khi nào dùng:** Đầu mỗi sprint, sau khi đã có PRD.

**Tác dụng:** Lấy tasks từ backlog, phân bổ theo capacity team, xác định P0 vs stretch goals.

**Ví dụ:**

> "Sprint 2 tuần, team 4 dev, 1 người nghỉ phép 3 ngày. Backlog có 12 tasks. Giúp tôi lập kế hoạch."

---

## 4. Giai đoạn 2 — Thiết kế UI/UX (Figma)

### Có 2 trường hợp:

#### Trường hợp A — Tự thiết kế

```
[PRD] → [Design trên Figma] → [Critique] → [Handoff] → [Sprint]
```

#### Trường hợp B — Nhận Figma từ bên ngoài (client/agency)

```
[Nhận Figma] → [Critique] → [Accessibility Review] → [Handoff] → [Sprint]
```

> ⚠️ **Sai lầm phổ biến:** Nhận Figma xong code luôn — bỏ qua bước critique.
> Design từ bên ngoài thường thiếu edge cases, loading states, error states, responsive.
> Phát hiện sớm = sửa Figma rẻ hơn sửa code rất nhiều.

---

### Bước 2.1 — `design:design-critique`

**Khi nào dùng:** Ngay khi nhận Figma, trước khi dev bắt đầu.

**Ví dụ:**

> "Review màn hình checkout này — có vấn đề gì về usability, hierarchy, hay thiếu state nào không?"

---

### Bước 2.2 — `design:accessibility-review`

**Khi nào dùng:** Sau critique, kiểm tra chuẩn WCAG 2.1 AA.

**Kiểm tra:** Color contrast, keyboard navigation, touch target size, screen reader.

**Ví dụ:**

> "Audit accessibility cho màn hình login này."

---

### Bước 2.3 — `design:ux-copy`

**Khi nào dùng:** Khi Figma thiếu hoặc có text placeholder cần viết thực tế.

**Ví dụ:**

> "Button submit trong form này nên ghi gì? Viết thêm error message cho trường email."

---

### Bước 2.4 — `design:design-handoff`

**Khi nào dùng:** Design đã approve, cần tạo spec chi tiết cho developer.

**Output gồm:** Layout, spacing, design tokens, component props, interaction states, responsive breakpoints, animations.

**Ví dụ:**

> "Tạo handoff spec từ màn hình Bug List này cho dev implement."

---

### Bước 2.5 — `design:design-system` (khi cần)

**Khi nào dùng:** Khi nhận Figma từ nhiều nguồn khác nhau, cần kiểm tra tính nhất quán.

**Ví dụ:**

> "Kiểm tra các component trong file Figma này có nhất quán không — màu sắc, typography, spacing có bị hardcode không?"

---

## 5. Giai đoạn 3 — Kiến trúc & System Design

### Bước 3.1 — `engineering:system-design`

**Khi nào dùng:** Trước khi viết code, thiết kế tổng thể hệ thống.

**Ví dụ:**

> "Thiết kế hệ thống Bug Tracker: API design, data model, các service cần thiết, scalability."

---

### Bước 3.2 — `engineering:architecture`

**Khi nào dùng:** Khi phải quyết định giữa các công nghệ hoặc approach.

**Output:** Architecture Decision Record (ADR) — ghi lại lý do tại sao chọn X thay vì Y.

> 💡 **Giá trị lâu dài:** ADR rất có giá trị khi team member mới join hoặc khi cần review lại quyết định cũ.

**Ví dụ:**

> "Nên dùng PostgreSQL hay MongoDB cho Bug Tracker? Tạo ADR cho quyết định này."

---

## 6. Giai đoạn 4 — Development

### Bước 4.1 — `engineering:code-review`

**Khi nào dùng:** Trước khi merge mọi PR quan trọng vào main.

> ⚠️ **Đừng chỉ dùng khi có vấn đề.** Code review là lưới an toàn cuối cùng trước production.

**Ví dụ:**

> "Review PR này — kiểm tra security, performance, edge cases và error handling."

---

### Bước 4.2 — `engineering:debug`

**Khi nào dùng:** Gặp bug không rõ nguyên nhân.

**Quy trình:** Reproduce → Isolate → Diagnose → Fix

**Ví dụ:**

> "API trả về 500 ở production nhưng staging chạy ổn. Stack trace: [paste vào]. Giúp tôi debug."

---

### Bước 4.3 — `engineering:testing-strategy`

**Khi nào dùng:** Xây dựng test coverage cho feature mới.

**Ví dụ:**

> "Tôi cần test strategy cho module authentication — unit, integration, e2e cần gì?"

---

### Bước 4.4 — `engineering:documentation`

**Khi nào dùng:** Feature hoàn thành, cần tài liệu cho team và người dùng.

**Ví dụ:**

> "Viết API documentation cho Bug Tracker endpoints. Viết README cho repo."

---

## 7. Giai đoạn 5 — Triển khai & Vận hành

### Bước 5.1 — `engineering:deploy-checklist`

**Khi nào dùng:** Trước mỗi lần release lên production.

**Ví dụ:**

> "Tôi sắp deploy version 1.2 có DB migration và feature flags. Cần checklist gì?"

---

### Bước 5.2 — `engineering:incident-response`

**Khi nào dùng:** Khi có sự cố trên production.

**Tác dụng:** Triage severity → Communicate với stakeholders → Viết blameless postmortem.

**Ví dụ:**

> "Production API đang timeout 30% requests từ 10 phút trước. Giúp tôi triage và xử lý."

---

## 8. Giai đoạn 6 — Đo lường & Cải tiến

### Bước 6.1 — `product-management:metrics-review`

**Khi nào dùng:** Cuối sprint/tháng để review số liệu.

**Ví dụ:**

> "Bug resolution time tăng 40% tuần này. Phân tích nguyên nhân và đề xuất action."

---

### Bước 6.2 — `engineering:tech-debt`

**Khi nào dùng:** Khi codebase ngày càng khó maintain.

**Ví dụ:**

> "Đánh giá tech debt trong module này, ưu tiên cái nào refactor trước?"

---

### Bước 6.3 — `product-management:competitive-brief`

**Khi nào dùng:** Trước khi lên roadmap quý tiếp theo.

**Ví dụ:**

> "So sánh Bug Tracker của mình với Jira và Linear — mình đang thiếu gì?"

---

## 9. Giao tiếp hàng ngày

### `engineering:standup` — Dùng mỗi ngày

**Ví dụ:**

> "Hôm qua: fix bug #123, review PR #45. Hôm nay: implement search. Blocker: đang chờ API key từ team backend. Format thành standup update."

---

### `product-management:stakeholder-update` — Dùng cuối sprint/tháng

**Ví dụ:**

> "Viết báo cáo tiến độ sprint 3 cho ban lãnh đạo — không cần technical detail, chỉ cần business impact."

---

## 10. Mối quan hệ PRD và Sprint

### Hiểu đúng về PRD

**PRD** là tài liệu cho **cả dự án hoặc feature lớn**. Nó định nghĩa _cái gì_ cần làm và _tại sao_.

**Sprint** là đơn vị thời gian (1-2 tuần) để thực hiện **một phần nhỏ** của PRD.

➡️ **1 PRD = nhiều sprint**

### Ví dụ minh họa

```
PRD: Hệ thống Bug Tracker (toàn bộ dự án)
│
├── Sprint 1 (2 tuần): Auth + tạo/xem bug cơ bản
├── Sprint 2 (2 tuần): Assign bug, comment, filter/search
├── Sprint 3 (2 tuần): Dashboard, báo cáo, notification
└── Sprint 4 (2 tuần): Performance, polish, launch
```

### Vòng lặp đúng

```
[1 lần duy nhất]          [Lặp lại mỗi sprint]
──────────────────         ──────────────────────────────────────────
write-spec (PRD)    →      sprint-planning → standup (mỗi ngày)
                                  ↑              ↓
                           stakeholder-update ←──┘
                           (cuối mỗi sprint)
                                  │
                           sprint tiếp theo...
```

### Khi nào viết spec nhiều lần?

- **Feature quá lớn** → tách thành nhiều Mini-Spec cho từng module
- **Yêu cầu thay đổi giữa chừng** → cập nhật hoặc viết lại spec cho phần bị thay đổi

---

## 11. Workflow hoàn chỉnh theo sơ đồ

```
┌─────────────────────────────────────────────────────────────┐
│                    GIAI ĐOẠN 1: KẾ HOẠCH                    │
│  product-brainstorming → write-spec → roadmap → sprint-plan │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  GIAI ĐOẠN 2: THIẾT KẾ                      │
│  design-critique → accessibility-review → ux-copy           │
│                  → design-handoff                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                GIAI ĐOẠN 3: KIẾN TRÚC                       │
│          system-design → architecture (ADR)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               GIAI ĐOẠN 4: DEVELOPMENT                      │
│    code-review → debug → testing-strategy → documentation   │
│              (standup mỗi ngày trong giai đoạn này)         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                GIAI ĐOẠN 5: TRIỂN KHAI                      │
│           deploy-checklist → [launch] → incident-response   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              GIAI ĐOẠN 6: ĐO LƯỜNG & CẢI TIẾN               │
│        metrics-review → tech-debt → competitive-brief       │
│              → stakeholder-update → roadmap (lặp lại)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Lời khuyên phát triển phần mềm

### ✅ Nguyên tắc vàng

1. **Đừng bỏ qua Giai đoạn 1.** Nhiều dev nhảy thẳng vào code mà không có spec. Các skills ở giai đoạn 1 tốn ít thời gian nhất nhưng tiết kiệm nhiều nhất.

2. **Critique Figma trước khi code.** Dù nhận design từ nguồn nào, luôn chạy `design:critique` trước. Sửa Figma rẻ hơn sửa code nhiều lần.

3. **Dùng standup mỗi ngày.** Giúp bạn tự tổ chức tư duy trước khi chia sẻ với team.

4. **ADR là tài sản lâu dài.** Mỗi quyết định kiến trúc quan trọng đều nên có ADR. Người join sau sẽ cảm ơn bạn.

5. **Code review là bắt buộc, không phải tùy chọn.** Đây là lưới an toàn cuối cùng trước khi code đến tay người dùng.

### ⚠️ Những sai lầm phổ biến cần tránh

| Sai lầm                   | Hậu quả                                  | Cách phòng tránh                           |
| ------------------------- | ---------------------------------------- | ------------------------------------------ |
| Code không có spec        | Xây sai thứ, làm lại từ đầu              | Luôn dùng `write-spec` trước               |
| Nhận Figma → code luôn    | Bug UI, thiếu states, lãng phí thời gian | Dùng `design:critique` trước               |
| Không có ADR              | Team không biết tại sao chọn tech X      | Dùng `architecture` cho mọi quyết định lớn |
| Deploy không có checklist | Incident trên production                 | Luôn dùng `deploy-checklist` trước release |
| Không review metrics      | Không biết sản phẩm đang tốt hay xấu     | `metrics-review` cuối mỗi sprint           |

### 🎯 Bộ Skills tối thiểu cần biết

Nếu bạn chỉ bắt đầu với 5 skills, hãy chọn:

1. `product-management:write-spec` — Định nghĩa rõ trước khi làm
2. `product-management:sprint-planning` — Tổ chức công việc theo sprint
3. `engineering:code-review` — Kiểm tra chất lượng code
4. `engineering:standup` — Giao tiếp hàng ngày
5. `engineering:deploy-checklist` — An toàn khi release

---

_Tài liệu được tạo từ cuộc hội thoại hướng dẫn sử dụng Cowork Skills cho Software Development & Management._
