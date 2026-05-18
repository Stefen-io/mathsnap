# Cowork × Figma Make — Incremental Design Workflow

> Ghi chép cá nhân về **iterative design workflow** — khi thêm hoặc sửa một screen trong project Figma Make đã có nhiều screen từ trước, với PRD chặt và codebase production tách biệt.
>
> File này **bổ sung** cho [`figma-make-bootstrap-design-workflow.md`](./figma-make-bootstrap-design-workflow.md):
>
> - File kia: bootstrap dự án mới — viết FIGMA_PROMPT.md, set up DESIGN.md, kết nối Figma MCP
> - File này: thêm 1 screen vào dự án đã có 8+ screens, codebase đã ship một phần

---

## Khi nào áp dụng workflow này

✅ **Phù hợp khi:**

- Project Figma Make đã tồn tại và có nhiều screen
- PRD đã chốt — có FR/AC/OQ làm anchor
- Có codebase production riêng (Next.js/khác) — Figma Make chỉ là design preview
- Cần thêm 1-2 screen mới hoặc sửa screen lớn
- Muốn audit trail rõ ràng về quyết định design

❌ **Không phù hợp khi:**

- Project hoàn toàn mới — dùng file bootstrap thay
- Sửa nhỏ kiểu "đổi màu nút", "sửa chữ" — overkill, sửa thẳng nhanh hơn
- Không có PRD/anchor rõ — workflow sẽ drift vì không có nguồn quyết định
- Một mình làm cả design + code, không cần handoff

---

## 3 vai trò trong workflow

| Vai trò | Trách nhiệm | Output |
|---|---|---|
| **Bạn (orchestrator)** | Quyết định product (single-select vs multi, vibe, scope), copy-paste relay giữa Claude và Figma Make | Các quyết định ghi lại trong override table |
| **Claude (architect + verifier + translator)** | Đọc PRD + codebase + Figma Make output, soạn prompt structured, verify code Figma Make tạo ra bằng cách đọc file | Prompt files + verification reports |
| **Figma Make (implementer)** | Tạo code theo prompt, không tự quyết định gì lớn | Code TSX + report describe what changed |

**Insight quan trọng:** không ai trong 3 vai trò chồng lấn vai trò khác. Bạn không phải đọc code, Claude không phải viết code production, Figma Make không phải đưa ra quyết định product. Đây là điều khiến workflow scale được cho nhiều screen.

---

## Quy trình tổng quan

```
0. Brand profile (làm 1 lần đầu, reuse vô hạn)
   ↓
1. Pre-flight prompt           [Claude → Figma Make]
   ↓
2. Pre-flight Q&A response     [Figma Make → bạn → Claude]
   ↓
3. Answers + override table    [Claude → Figma Make]
   ↓
4. Round 1 wireframe           [Figma Make]
   ↓
5. Verify Round 1              [Claude đọc code]
   ↓ (loop nếu phát hiện bug)
6. Round 2 interactions        [Figma Make]
   ↓
7. Verify Round 2              [Claude đọc code]
   ↓
8. Round 3 visual polish       [Figma Make]
   ↓
9. Verify Round 3              [Claude đọc code]
   ↓
10. Port sang production       [Claude]
   ↓
11. OpenSpec change            [Claude]
```

Mỗi mũi tên là 1 lần copy-paste của bạn. Tổng ~10-15 lần copy-paste cho 1 screen.

---

## Bước 0 — Brand profile (Step 0 quan trọng nhất)

Trước khi làm screen đầu tiên, **trích xuất brand profile** từ codebase production hoặc DESIGN.md sẵn có. Lưu thành `docs/figma-brand-profile.md`.

Nội dung tối thiểu:

```markdown
# Figma Brand Profile — [Tên project]

- Product name: ...
- Vibe: 3-5 từ + reference brand thật ("Linear-quiet, Notion-spacious")
- Primary color hex: #0d0d0d (CTA), #18E299 (brand accent)
- Pale brand: #d4fae8 (atmospheric)
- Deep brand: #0fa76e (text-on-pale)
- Typography: Geist Sans / Inter / ... + weights available
- Platform: mobile-first PWA / desktop / both
- Avoid: [3-4 negative instructions]
- Style references: Linear, Notion, Vercel, ...

## Recurring tokens
| Token | Value |
|---|---|
| Primary CTA | bg-[#0d0d0d] text-white rounded-full h-12 shadow-[exact] |
| Secondary | bg-white border border-black/5 ... |
| Card | rounded-[16px] border-black/5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] |
| Atmospheric gradient | bg-gradient-to-b from-[brand-pale]/40 via-white to-white |
| Micro-label | text-[12px] font-mono uppercase tracking-[0.6px] |
```

**Tại sao Step 0 quan trọng:** screen thứ nhất không có brand profile thì Figma Make phải re-discover toàn bộ tokens trong pre-flight, tốn 1 round. Có brand profile, screen thứ hai trở đi reuse được luôn.

**Cảnh báo:** Brand profile **không phải DESIGN.md**. DESIGN.md là design system rules; brand profile là extracted, condensed actual tokens đang dùng trong codebase. Hai file khác nhau.

---

## Bước 1 — Pre-flight prompt

Đây là **pattern có ROI cao nhất** trong workflow. Pre-flight prompt là một prompt đặc biệt buộc Figma Make:

1. Đọc các file context cụ thể (DESIGN.md, theme.css, screens hiện có, components reuse được, package.json)
2. Đọc design intent ngắn gọn của screen mới
3. Trả về structured Q&A 8-9 sections
4. **DỪNG, KHÔNG BUILD GÌ** cho đến khi nhận confirmation

### Template pre-flight prompt

```markdown
## Pre-flight: Context Check Before Building [SCREEN-ID]

You are going to design [Screen description]. **DO NOT WRITE OR DESIGN ANYTHING YET.** 
Read the project, cross-check the brief against existing code, surface every unclear point.

### Step 1 — Read these files first (in order)

[List 10-16 files with paths. Group by category:
- Design system & global (DESIGN.md, theme.css, fonts.css)
- Routing & layout (routes.tsx, App.tsx)
- Existing flow context (the screens this new one connects to)
- Reusable primitives (relevant ui/* components)
- Recently built screens (for style consistency)]

### Step 2 — Read the design intent below

[Short bulleted spec: purpose, confirmed decisions, aesthetic direction, layout sketch, constraints]

### Step 3 — Return a structured pre-flight report using EXACTLY this format:

## A. Files I Read
[List actual files opened. If a file in Step 1 doesn't exist, say so.]

## B. Existing Conventions That Will Constrain [SCREEN]
[Tokens, patterns, library availability, routing pattern, z-index hierarchy, etc.
Quote line numbers when possible.]

## C. Open Questions I Need Answered Before Building
[Numbered, specific, 1-sentence-answerable questions]

## D. Assumptions I Will Make If You Don't Override
[Numbered. Be exhaustive — easier to override an explicit assumption]

## E. Conflicts Between Brief and Codebase
[Where brief contradicts existing code. If none, write "None."]

## F. Components I Plan to Reuse vs. Build New
**Reuse:** [list]
**Build new (justify each):** [list]

## G. Routing & State Integration Plan
[Specific paths, state mechanism, files to modify]

## H. Backend / Mock Service Plan (if applicable)
[If screen needs backend contract changes]

## I. What I Will NOT Do Until You Confirm
[Restate: no code, no edits until I reply]

### Step 4 — Wait

Do not proceed to wireframes. Wait for my reply.
```

### Pre-flight catches những gì (ví dụ thực tế)

Trong dự án MathSnap, pre-flight S-12 catch:

- Geist Mono **không có trong fonts.css** dù DESIGN.md spec nó (font drift)
- `theme.css --primary: #030213` ≠ DESIGN.md `#0d0d0d` (token mismatch)
- Existing Dialog primitive là centered modal, **không** full-screen như overlay cần
- z-index 50 đã bị BottomNav chiếm → overlay phải z-[60]

Pre-flight S-14 catch nặng hơn:

- KaTeX **không có** trong package.json — không thể "render LaTeX" như brief assume
- Service layer chưa tồn tại — OCR.tsx có inline mock hardcoded
- Solution.tsx breaking change risk — nó load mock riêng, sẽ vỡ nếu pass state vào

Mỗi cái nếu rơi vào Round 3 polish thì phải redo cả 3 round. Pre-flight save ~80% effort.

---

## Bước 2 — Đọc Q&A response

Figma Make trả về 9 sections (A-I). Quan trọng nhất là:

- **Section C** (Open Questions): câu hỏi cụ thể cần bạn trả lời
- **Section D** (Assumptions): defaults Figma Make sẽ dùng nếu không override
- **Section E** (Conflicts): nơi brief mâu thuẫn codebase

**Không nên skip sections này.** Mọi shortcut ở đây = bug ở Round 3.

---

## Bước 3 — Viết Answer + Override table

Đây là **artifact quan trọng nhất của workflow** — quyết định bảo lưu lâu dài.

Format:

```markdown
## Reply to Pre-flight Report

### Answers to Section C — Open Questions

1. [Câu hỏi]: [Trả lời 1 câu cụ thể, có lý do nếu cần]
2. ...

### Confirmations & Overrides for Section D — Assumptions

| # | Assumption | Decision |
|---|---|---|
| D1 | [Original] | ✅ Confirm — [lý do nếu non-trivial] |
| D2 | [Original] | ⚠️ Override → [new value]. [Reasoning ngắn] |
| D3 | [Original] | ❌ Override → [opposite]. [Why] |

### Resolutions for Section E — Conflicts

- **E1 — [Tên conflict]:** Resolution = [...]
  - Implementation note: [if specific code change needed]

### Refinements to Section F/G/H

[Confirm hoặc adjust plan]

---

## Green-light: Proceed with Round 1
```

### Quy tắc viết override

- **Confirm thẳng** nếu assumption đúng — không cần lý do
- **Override** dùng khi cần đổi — phải có lý do ngắn (1 câu)
- **Trace ngược về PRD** khi có thể — `(per FR-X.Y)` hoặc `(per OQ-N)`
- **Đừng cãi** chỉ để cãi — Figma Make assume default tốt, override chỉ khi thật sự sai

### Các loại override hay gặp

- **Color drift:** `text-gray-500` (Tailwind utility) → `text-[#888888]` (exact hex từ brand)
- **Animation drift:** "slide-in" → "fade-only" (giữ vibe calm)
- **Convention mismatch:** `mathsnap_onboarding_seen` (snake_case) → `mathsnap.onboarding.seen` (dot notation namespace)
- **Pattern mismatch:** "Skip hover → mint" → "Skip hover → primary text" (mint reserved cho positive actions)

---

## Bước 4-9 — 3-Round Build với verify lặp lại

### Round 1 — Wireframe

**Constraint:** grayscale only, placeholder icons (`[<]` `[>]` text), no animation, no gradient, no exact hex.

**Mục tiêu:** validate **structure** + **logic** + **routing** + **state management**. Color/visual để Round 3 lo.

**Constraint cuối prompt:**

```
### What to NOT touch in this round
- ❌ Colors except black/white/grays
- ❌ Real Lucide icons (text placeholders only)
- ❌ Atmospheric gradient
- ❌ Exact shadow tokens
- ❌ Animation libraries beyond what's in the brief
```

### Round 2 — Interactions

**Constraint:** thêm `motion/react` (hoặc tương tự), focus rings, press feedback (`active:scale-[0.98]`), keyboard navigation (Escape, Tab order), backend mock extension nếu cần.

**Mục tiêu:** flow hoạt động end-to-end, mọi state transition đúng.

**Bonus task khi cần:** nếu Round 1 verify phát hiện bug structural, **bundle fix vào Round 2 Task 0** với label "CRITICAL". Không defer sang Round 3.

### Round 3 — Visual polish

**Constraint:** chỉ swap utility class sang exact hex, replace placeholder icons bằng Lucide thật, add atmospheric gradient, exact shadow tokens.

**Mục tiêu:** không touch structure, không touch handler logic, không touch animation. Pure cosmetic swap.

**Color token table chuẩn cuối prompt Round 3:**

```markdown
| Purpose | Current (wireframe) | Replace with |
|---|---|---|
| Primary text | text-black | text-[#0d0d0d] |
| Body | text-gray-600 | text-[#666666] |
| Tertiary | text-gray-500 | text-[#888888] |
| Surface | bg-gray-100 / bg-gray-50 | bg-[#fafafa] |
| Card shadow | shadow-sm | shadow-[0_2px_4px_rgba(0,0,0,0.03)] |
| Outer container | bg-white | bg-gradient-to-b from-[brand-pale]/40 via-white to-white |
```

---

## Bước 5/7/9 — Verify-by-reading (cốt lõi)

**Vấn đề:** Figma Make report mô tả **ý định**, không mô tả **kết quả thật**. Có thể:

- Code có bug functional mà report bỏ qua
- Color/spacing drift mà report claim "đã apply"
- Override quan trọng bị silently revert về default

**Giải pháp:** sau mỗi round, **đọc thực tế từng file** đã thay đổi. Không tin report.

### Setup local mirror

Yêu cầu bạn (user) **export Figma Make project** sang local filesystem (e.g., `D:\Development\<project>\sample\figma-project\`). Cách làm:

1. Download zip từ Figma Make
2. Giải nén vào folder cố định
3. Sau mỗi round, **copy lại** folder để Claude `Read` được file thật

Đây là **workaround quan trọng nhất** vì Figma MCP hiện không hỗ trợ đọc trực tiếp source code Make files. Không có local mirror = không verify được = self-validation untrustworthy.

### Verification report format

Sau khi đọc code, viết bảng:

```markdown
| # | Task/Override | Verdict | Bằng chứng |
|---|---|---|---|
| 1 | [Item] | ✅ PASS | [file:line — exact code/class string] |
| 2 | [Item] | ⚠️ PARTIAL | [chỗ nào đã fix, chỗ nào chưa] |
| 3 | [Item] | ❌ FAIL | [code không match override, fix expected ở Round X] |
```

### Ví dụ bug catch được nhờ verify-by-reading

S-14 Round 1:

> Solution.tsx line 18:
> ```tsx
> const displayRendered = incomingLatex ? "∫₀¹ x² dx" : "∫₀¹ x² dx";
> ```
> Ternary always returns same string → user pick formula nào cũng hiện cùng 1 thứ. **Functional bug**, không phải visual.

Nếu tin report ("Round 1 wireframe complete"), bug này lọt sang Round 3 polish, sang OpenSpec, sang production. Debug khó gấp 5 lần.

---

## Cấu trúc artifacts để traceability

```
docs/
├── figma-brand-profile.md                    (Step 0, reuse mọi screen)
├── figma-prompts/
│   ├── s12-onboarding-preflight.md           (Bước 1)
│   ├── s12-onboarding-preflight-answers.md   (Bước 3)
│   ├── s12-onboarding.md                     (Build brief reference)
│   ├── s12-onboarding-round2.md              (Bước 6 prompt + verify report)
│   ├── s12-onboarding-round3.md              (Bước 8 prompt + verify report)
│   ├── s14-problem-selector-preflight.md
│   ├── s14-problem-selector-preflight-answers.md
│   ├── s14-problem-selector-round2.md
│   └── s14-problem-selector-round3.md
└── ROADMAP.md / PRD.md / phase2-*.md
```

**Side effect tốt:** 6 tháng sau ai vào đọc cũng hiểu **vì sao** screen được thiết kế thế này, **vì sao** chọn override D17, **vì sao** schema thêm `formulas` thay vì `formula`. Tốt hơn rất nhiều so với git commit messages.

---

## Bước 10-11 — Port sang production + OpenSpec change

**Quan trọng:** nếu codebase production khác stack với Figma Make (vd: production Next.js, Figma Make dùng Vite + react-router), code Figma Make tạo ra là **prototype throw-away**, không phải production.

### Mapping Vite/react-router → Next.js App Router

| Vite (Figma Make) | Next.js (production) |
|---|---|
| `src/app/screens/Foo.tsx` | `src/client/app/foo/page.tsx` |
| `src/app/routes.tsx` (centralized) | File-system routing |
| `<Outlet />` | `{children}` trong layout.tsx |
| `<NavLink to="/x">` | `<Link href="/x">` từ next/link |
| `navigate("/x", { state: {...} })` | Context provider (không có direct equivalent) |
| `useLocation().state.foo` | `useContext(FlowContext).foo` |
| Không cần `'use client'` | Add `'use client'` nếu component dùng useState/useEffect/event handler |

### State passing không có equivalent direct

React-router pass state qua `navigate(path, { state })`. Next.js App Router **không có** API tương đương. Lựa chọn:

- **Context** (cleanest cho transient flow state) — refresh wipe state, match react-router behavior
- **URL params** — leak structure, length limit, encoding pitfalls
- **sessionStorage** — persist qua refresh (sai semantics)

→ Dùng Context. Pattern: tạo `FlowContext` với `setFoo`/`useFoo`, mount Provider trong root `app/layout.tsx`, các page consume hook.

### OpenSpec change

Sau khi port xong (hoặc trước khi port — tùy convention), viết OpenSpec change theo format dự án (đọc `openspec/changes/archive/*` recent để học format). Bake các quyết định D# vào proposal section. Bake các bug catch trong verify thành tasks.

---

## Friction & pitfalls thực tế

### 1. MCP limits với Figma Make files

- `get_screenshot` không support Make files
- `get_design_context` trả về resource_link URIs nhưng không fetch được content trực tiếp
- `use_figma` (Plugin API) chỉ dành cho design files, không cho Make files

→ **Mitigation:** local sample mirror (đã nói ở Bước 5).

### 2. Copy-paste theater

Mỗi round là 4 thao tác copy-paste của bạn. 6 round/screen × 4 = 24 thao tác/screen. Rất dễ:

- Paste nhầm prompt cũ thay vì response mới
- Quên copy phần cuối
- Format markdown bị strip khi paste

→ **Mitigation:** chấp nhận cost này, hoặc xây MCP integration trực tiếp Figma Make ↔ Claude (tương lai).

### 3. Codebase split

Figma Make Vite ≠ production Next.js. Verify trong sample/ là verify prototype, không phải verify production. Implementation port là 1 unit of work nữa.

→ **Mitigation:** chấp nhận. Nếu Figma Make có template Next.js trong tương lai, tiết kiệm 30-40% effort.

### 4. Tasks bị wipe khi MCP reconnect

Nếu MCP server disconnect/reconnect, task list có thể bị reset. Mất tiến độ tracking.

→ **Mitigation:** lưu tiến độ vào prompt files trong `docs/figma-prompts/` (tự nhiên qua workflow). Tasks chỉ là tracking ngắn hạn.

### 5. Color drift Round 1

Figma Make Round 1 có thể dùng Tailwind grayscale utilities (`text-gray-500`) thay vì exact hex. Đây là **expected** — Round 3 sẽ swap. Đừng panic.

→ **Mitigation:** trong Round 3 prompt, có table mapping rõ "before → after" để Figma Make swap.

### 6. Self-validation untrustworthy

Figma Make report check-marks tasks done nhưng có thể bug functional vẫn lọt. Đặc biệt: hardcoded values, missing prop wiring, fallback logic sai.

→ **Mitigation:** verify-by-reading mỗi round (Bước 5/7/9), không tin report.

### 7. Pre-flight quá ngắn

Nếu pre-flight không liệt kê đủ files cần đọc, Figma Make sẽ guess hoặc dùng cache outdated từ rounds trước. Conflict E# section sẽ thiếu.

→ **Mitigation:** liệt kê 10-16 files trong Step 1 — nhiều hơn cần một chút còn hơn thiếu.

---

## Insight tổng

### Pre-flight là pattern đáng giá nhất

Hầu hết LLM coding agents nhảy thẳng vào action. Pre-flight ép surfacing uncertainty trước build. Không cần custom tool gì, chỉ cần discipline trong prompt. ROI rất cao.

### Verify-by-reading là discipline không thể thiếu

Trust report → drift accumulate qua rounds → bug ở production. Read code → catch bug ngay round phát hiện → fix gọn ở round sau.

### 3-actor role split scale được

Bạn quyết định product, Claude verify + translate, Figma Make implement. Mỗi vai trò chuyên 1 việc. Không ai chồng lấn. Pattern này áp dụng được cho nhiều screen, nhiều dev sau này.

### Workflow KHÔNG thay thế việc viết code production

Workflow tốt cho **design + architecture phase** — phase quyết định what + how high-level. Khi sang implementation thật trong production codebase, viết code thẳng (hoặc agent tự edit) thường nhanh hơn.

### Cái workflow này đặc biệt giỏi: **rapid design iteration với traceability**

2 ngày, 2 màn hình, 8 round design — nếu làm tay (Figma desktop + write code) chắc 1 tuần. Nếu làm với agent thuần (LLM tự code) chắc miss nhiều decision. Workflow này nằm giữa: nhanh hơn manual, controlled hơn agent thuần.

### PRD chặt là điều kiện tiên quyết

Mọi override D# trace ngược về FR/AC/OQ trong PRD. Không có PRD chặt = workflow drift = mất giá trị. Nếu PRD lỏng, đầu tư siết PRD trước khi chạy workflow.

---

## Tóm tắt nhanh

```
Step 0:  figma-brand-profile.md (làm 1 lần đầu)
Step 1:  Pre-flight prompt → Figma Make
Step 2:  Pre-flight Q&A → Claude
Step 3:  Answer + override table → Figma Make
Step 4:  Round 1 wireframe ← Figma Make
Step 5:  Verify (đọc code thật, table format)
Step 6:  Round 2 interactions ← Figma Make (bundle bug fix nếu có)
Step 7:  Verify
Step 8:  Round 3 visual polish ← Figma Make
Step 9:  Verify final
Step 10: Port sang production codebase (mapping Vite → Next.js nếu cần)
Step 11: OpenSpec change theo convention dự án
```

**Tỷ lệ thời gian dự kiến cho 1 screen:**

- Pre-flight + answers: 15-20%
- 3 rounds + verify: 50-60%
- Port + OpenSpec: 25-30%

Tổng thời gian thực tế (MathSnap S-14): ~3 giờ design + verify, ~30-45 phút port (chưa làm).
