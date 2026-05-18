# Cowork × Figma Make — Bootstrap Design Workflow

> Ghi chép cá nhân về **bootstrap design workflow** — khi làm dự án Figma Make mới, viết Figma prompt, set up DESIGN.md, kết nối Figma MCP.

---

## Bước 1 — Viết prompt cho Figma Make

Tạo một prompt mô tả giao diện bằng ngôn ngữ trực quan, cảm quan — không phải yêu cầu chức năng. Cấu trúc gồm:

- **Design Philosophy** — cảm giác tổng thể, tham chiếu sản phẩm thực ("gọn như Linear")
- **Design System** — mã hex (không dùng tên màu), font, spacing, và những thứ cần tránh
- **Screens** — layout, các thành phần chính, và các trạng thái (empty, loading, error) của từng màn hình
- **User Flow** — con đường điều hướng chính A → B → C
- **Technical Notes** — platform, stack, quy tắc animation

Dán prompt này vào Figma Make và chạy. Dùng **quy trình 3 vòng** để có kết quả tốt nhất:

| Vòng | Nội dung thêm vào cuối                                        | Mục tiêu              |
| ---- | ------------------------------------------------------------- | --------------------- |
| 1    | _"Wireframe only — no colors, focus on layout and hierarchy"_ | Kiểm tra cấu trúc     |
| 2    | _"Add navigation interactions and clickable states"_          | Kiểm tra luồng        |
| 3    | Prompt đầy đủ, không thêm gì                                  | Áp dụng visual đầy đủ |

Ví dụ:

````markdown
# MathSnap — Minimal EdTech, Depth over Simplicity

---

## Design Philosophy

MathSnap feels like a premium notebook app that happens to have AI inside — clean like Linear, structured like Notion, but with the mathematical depth of Brilliant. Every screen does one thing: no noise, no decoration for decoration's sake. The interface steps back so the math can step forward.

This is NOT Photomath — avoid flat, featureless UI. Every element should feel considered and slightly elevated, like a product a serious student would be proud to use.

---

## Design System

- **Primary:** `#10B981` (Emerald) — used for CTAs, active states, success indicators, and the Answer block accent
- **Primary light:** `#ECFDF5` (Emerald-50) — Answer block background, selected states
- **Background:** `#FFFFFF` with `#F9FAFB` (Gray-50) as page background
- **Surface:** `#FFFFFF` cards with `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` — cards float 1mm off the background
- **Text primary:** `#111827` (Gray-900)
- **Text secondary:** `#6B7280` (Gray-500)
- **Divider:** `#E5E7EB` (Gray-200)
- **Error:** `#EF4444` (Red-500)
- **Typography:** Inter throughout — no mixing fonts
  - H1: 24px / Bold
  - H2: 18px / SemiBold
  - Body: 16px / Regular (minimum on mobile)
  - Caption: 13px / Regular / Gray-500
  - Math formulas: KaTeX render, same size as surrounding text
- **Spacing:** 16px base unit. Generous padding inside cards (16px). 24px between sections.
- **Radius:** 12px for cards and buttons. 8px for small chips/tags. 0px for bottom navigation.
  - ⚠️ Buttons use `border-radius: 12px` — NOT pill shape (`border-radius: 9999px`). This is intentional.
- **Do NOT use:** dark mode, heavy drop shadows, gradient backgrounds, decorative illustrations, rounded-everything aesthetic, stock photos, Material Design patterns

---

## Primary User Flow

```
Home (thumb zone CTA)
  → Camera Screen (immersive, guide frame)
    → Crop & Preview (confirm composition)
      → OCR Result (verify formula, edit if needed)
        → [Giải bài này] → loading animation
          → Solution Screen (accordion, Bước 1 open)
            → user opens Bước 2, 3... → opens Đáp án
              → [Bookmark] or [Bài mới] → back to Home
```

---

## Screens

### 1. Home Screen

**Layout:** Single-focus screen. Center of gravity is a large primary button. Top is quiet. Bottom is navigation. The hero area has minimal copy — let the button speak.

**Elements:**

- Header bar: `MathSnap` in Inter SemiBold 18px + gear icon (settings) right-aligned. White background, no border.
- Hero area (center): Short tagline "Chụp. Hiểu. Giải." in 28px Inter Bold Gray-900. Below it, a single line caption in Gray-500 14px. No illustration.
- **Primary CTA button:** "Chụp bài toán" — full-width (calc(100% - 32px)), height 56px, `#10B981` background, white Inter SemiBold text 16px, radius 12px. Position in the lower center, in the thumb zone (roughly 65% down the screen). Camera icon left of text.
- Secondary link: "Nhập công thức thủ công" — text-only, `#10B981`, 14px, centered below primary button.
- **Bottom navigation:** 4 tabs — Home (active), Lịch sử, Bookmark, Cài đặt. Fixed bottom. Height 64px. Active tab icon filled `#10B981`, label `#10B981` 11px. Inactive `#9CA3AF`. White background. Top border `#E5E7EB` hairline. Include safe-area padding for iPhone notch.

**States:**

- Loading: skeleton pulse on hero text (first paint before app is ready)
- Default: as described

---

### 2. Camera / Upload Screen

**Layout:** Immersive full-screen camera. UI chrome disappears — only the essential controls remain. Feels like a native camera app.

**Elements:**

- Camera viewfinder: full screen, `#000000` background while loading
- **Guide frame overlay:** A rounded rectangle (radius 8px) drawn in white with 2px stroke, centered, covering about 80% of screen width. Below it, helper text "Căn chỉnh bài toán vào khung" in white 13px with a soft text-shadow.
- **Shutter button** (bottom center): 72px circle, white fill, 4px `#10B981` ring around it. On press: scales down to 0.92, haptic.
- Gallery icon (bottom left): 44x44px touch area, rounded square with preview thumbnail of last photo
- Flash toggle (top right): icon button, white, 44x44px touch area
- Back arrow (top left): white chevron, 44x44px

**States:**

- Camera loading: dark screen with centered spinner in `#10B981`
- Permission denied: centered card with explanation text + "Mở Cài đặt" CTA

---

### 3. Crop & Preview Screen

**Layout:** Photo takes up 60% of screen height. Controls live below it in a white sheet.

**Elements:**

- Photo display: fills top portion with `#000000` letterbox padding
- **Crop overlay:** draggable corner handles in `#10B981`, grid lines in white 30% opacity
- Control row below photo: "Xoay" icon button (left) + spacer + "Chụp lại" text button (right, Gray-500)
- **"Tiếp tục →"** button: full-width, 56px, `#10B981`, same style as Home CTA. Sticky bottom inside the white sheet.

---

### 4. OCR Result & LaTeX Edit Screen

**Layout:** Two-panel feel. Top shows the source image (small). Below, the recognized formula takes center stage. A subtle confirmation prompt frames the user's decision.

**Elements:**

- Top: Original image thumbnail (80px height, full width, `object-fit: cover`, radius 8px)
- **Formula display card:** White card, 16px padding, radius 12px, shadow. Inside: the LaTeX formula rendered large and clear (24px equivalent). Below it in Gray-500 13px: "Kiểm tra công thức đã đúng chưa?"
- **LaTeX edit area:** Monospace font, 14px, `#F9FAFB` background, radius 8px, 12px padding. A live preview (rendered) updates 300ms after each keystroke.
- Edit label chip: "LaTeX" — `#F3F4F6` background, Gray-500 11px, radius 4px, above the edit area.
- **"Giải bài này →"** primary button — `#10B981`, full-width, 56px, sticky bottom
- "Chụp lại" text link above button, centered, Gray-500

**States:**

- OCR loading: skeleton pulse for the formula card (pulse from `#F9FAFB` to `#E5E7EB`)
- OCR error: replace formula card with a red-tinted card — "Không nhận diện được. Thử chụp lại hoặc nhập thủ công." Two buttons below.
- LaTeX invalid: yellow warning chip "Công thức có thể bị lỗi" above the edit area — non-blocking

---

### 5. Solution Screen (Core Screen)

**Layout:** This is the product. A scrollable feed of answer blocks. The math breathes — generous spacing, clear hierarchy, one thought per block. It should feel like a thoughtful tutor wrote this by hand, not a machine dumped an answer.

**Elements:**

- **Problem restatement bar:** Collapsible header at top. White background, 16px padding. Shows the original LaTeX rendered. A `#F3F4F6` chip "Đề bài" (13px) before the formula. Chevron-down to collapse. By default: expanded.

- **Step Block (Collapsed):** White card, 16px padding, radius 12px, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`. Row layout: Step number chip (left) + step title (middle, Inter SemiBold 15px Gray-900) + chevron-right (right, Gray-400). Step chip: `#F3F4F6` background, "Bước 1" in Inter 12px SemiBold Gray-600. Tappable — entire row is the touch target (minimum 52px height).

- **Step Block (Expanded — Bước 1 open by default):** Same card header, but chevron rotates to chevron-down with 200ms ease animation. Below header, separated by a `#E5E7EB` divider hairline: explanation text in Inter Regular 15px Gray-900, line-height 1.6. If there's a formula: centered in a `#F9FAFB` block with 12px padding, radius 8px. Block slides down with 300ms ease-out animation.

- **Spacing between step cards:** 8px gap — compact but breathing.

- **Answer Block (last, collapsed by default):** Visually distinct from step blocks. Background `#ECFDF5` (Emerald-50). Left border: 3px solid `#10B981`. Chip says "Đáp án" in `#10B981` SemiBold instead of "Bước N". When expanded: answer value in 28px Inter Bold `#111827`, LaTeX formula below in 20px.

- **Action row (sticky bottom):** White background, `border-top: 1px solid #E5E7EB`. Two buttons: bookmark icon (outline→filled toggle, `#10B981` when active, 44x44px) + "Bài mới" button (outline style, `#10B981` border+text, full width minus bookmark button).

**States:**

- LLM loading: 3 skeleton step cards (pulse animation) + text "Đang phân tích bài toán..." in Gray-500 center-aligned below them, with a blinking cursor
- LLM error: single card with `#FEF2F2` background — error message + "Thử lại" button in `#EF4444`
- All steps expanded: normal, no special state

---

### 6. History Screen

**Layout:** A clean list. Cards that feel like a notebook. Secondary screen — less visual weight than Solution Screen.

**Elements:**

- Header: "Lịch sử" Inter Bold 22px, left-aligned, 16px padding
- **History card:** White, radius 12px, shadow. Inside: formula thumbnail (rendered, 3 lines max, then truncated with "...") at 14px, below it: date+time in Gray-500 12px. Bookmark icon at right — filled `#10B981` if bookmarked. Full card tappable.
- Swipe-left action on card: reveals `#EF4444` delete button with trash icon (iOS-native feel)
- Cards in a `gap: 8px` vertical list, 16px horizontal padding

**States:**

- Empty: centered area with a simple line-art icon (pencil on paper, not a blob illustration) + "Chưa có bài giải nào" Gray-500 + "Chụp bài toán đầu tiên →" `#10B981` text link

---

### 7. Bookmarks Screen

Identical layout to History. Header says "Bookmark". Empty state: "Chưa có bài nào được lưu" with a bookmark-outline icon.

---

### 8. Settings Screen

**Layout:** Simple list of settings. Grouped sections.

**Elements:**

- Section: "Ngôn ngữ" — row with label "Ngôn ngữ / Language" + toggle switch (Tiếng Việt ↔ English). Toggle in `#10B981` when active.
- Section: "Thông tin" — "Phiên bản 1.0.0" in Gray-500. "Liên hệ" text link.
- All rows: 52px height, 16px padding, `#E5E7EB` bottom divider

---

## Desktop Adaptation (1280px)

Apply the following layout changes when viewport width is 1280px or wider. Mobile layout (375px) remains unchanged. This is a responsive adaptation layer only.

### Global Layout Shell (all screens)

- Replace bottom navigation with a **LEFT SIDEBAR:**
  - Width: 240px, fixed height 100vh, white background, right border `1px #E5E7EB`
  - Top: MathSnap wordmark — Inter SemiBold 18px `#111827`, 24px padding
  - Nav items stacked vertically: Home · Lịch sử · Bookmark · Cài đặt
  - Each item: 44px height, 16px horizontal padding, Inter Regular 14px
  - Active state: `#ECFDF5` background, `#10B981` text + icon, left border `3px #10B981`
  - Inactive: `#6B7280` text + icon
  - Bottom of sidebar: app version caption `#9CA3AF` 12px
- Main content area: `calc(100vw - 240px)`, max-width 960px, centered within its area
- Page background: `#F9FAFB`

### Screen-by-screen desktop layout

**1. Home Screen**

- Remove bottom navigation (replaced by sidebar)
- Center hero content vertically and horizontally in main area
- Max-width of CTA button: 480px, centered (not full-width)
- Tagline: increase to 36px
- Add generous top padding (80px) to push content to visual center

**2. Camera / Upload Screen**

- Replace camera viewfinder with a large file upload drop zone:
  - Size: 560×360px, centered in main area
  - Dashed border `2px #E5E7EB`, radius 16px, `#F9FAFB` background
  - Center icon: upload icon (Lucide), 40px, `#9CA3AF`
  - Primary text: "Kéo thả ảnh vào đây" — Inter SemiBold 18px `#111827`
  - Secondary: "hoặc" Gray-500 + "Chọn từ máy tính" outline button `#10B981`
- Shutter button, flash toggle, guide frame overlay: **hidden on desktop**

**3. Crop & Preview Screen**

- Two-column layout:
  - Left (55%): image preview with crop overlay
  - Right (45%): controls panel — white card, shadow, 24px padding
    - "Xoay" and "Chụp lại" at top of panel
    - "Tiếp tục →" primary button at bottom of panel (not sticky)

**4. OCR Result & LaTeX Edit Screen**

- Single centered column, max-width 640px
- Image thumbnail: 120px height (taller than mobile)
- Formula card and LaTeX edit area: same structure, more breathing room

**5. Solution Screen**

- **TWO-COLUMN layout:**
  - Left panel (38%): fixed position, white card, shadow, 24px padding
    - Original image thumbnail (full panel width)
    - Problem restatement: LaTeX rendered below image, "Đề bài" chip above
    - Bookmark + "Bài mới" action buttons at bottom of panel
  - Right panel (62%): scrollable, step cards list
    - Same accordion cards as mobile
    - 16px gap between cards (vs 8px on mobile)
    - Bước 1 open by default
  - Left panel stays **fixed** while right panel scrolls

**6. History Screen**

- Header "Lịch sử" same style, 24px top padding
- Card grid: **2 columns**, gap 16px (not single-column list)
- Swipe-left delete → replaced by hover state revealing trash icon button (right side of card)

**7. Bookmarks Screen**

- Identical to History desktop layout

**8. Settings Screen**

- Max-width 560px, centered in main area
- Same list structure as mobile

### Typography scale-up on desktop

| Element                | Mobile | Desktop |
| ---------------------- | ------ | ------- |
| Tagline                | 28px   | 36px    |
| Body                   | 16px   | 16px    |
| Caption                | 13px   | 13px    |
| Step title (accordion) | 15px   | 16px    |

### Spacing scale-up on desktop

| Token                   | Mobile | Desktop |
| ----------------------- | ------ | ------- |
| Section spacing         | 24px   | 32px    |
| Card padding            | 16px   | 24px    |
| Page horizontal padding | 16px   | 40px    |

---

## Technical Notes

- **Platform:** Mobile-first web. Design at 375px width. Show tablet (768px) adaptation for Solution Screen if possible — 2-column layout with problem on left, steps on right.
- **Stack:** React + Tailwind CSS (mirrors actual tech stack: Next.js + TailwindCSS)
- **Math rendering:** Show formula blocks with a subtle `#F9FAFB` background block to indicate they are rendered math, not plain text
- **Animation:** Accordion expand 300ms ease-out. Button press scale(0.97). Page transition: slide from right (forward), slide from left (back). Nothing bouncy or elastic — this is a serious tool.
- **Iconography:** Use Lucide icons (line-weight, minimal, consistent with the Minimal & Clean vibe)
- **No illustrations:** Prefer typographic empty states over blob/character illustrations

---

## Known Implementation Issues

Real issues encountered when using Figma Make — recorded to avoid repeating them.

### [FIXED] Mobile content invisible — height chain broken

**Symptom:** Mobile screen only shows the bottom navigation; all main content is missing.

**Root cause:** When Figma Make generates a responsive layout, the root container uses `display: block` on mobile (only `lg:flex`). The main content wrapper is missing `h-full`, breaking the height chain from the root `h-[100dvh]` down to the `motion.div` using `absolute inset-0`. Result: the containing block has `height: 0`, so `absolute inset-0` has nothing to fill.

**Fix (1 line in `RootLayout` at `src/app/routes.tsx`):**

```tsx
// Before
<div className="w-full lg:flex-1 flex justify-center relative overflow-hidden">

// After
<div className="w-full h-full lg:flex-1 flex justify-center relative overflow-hidden">
```

**Diagnostic principle:** When mobile content disappears but `fixed` elements (bottom nav) are still visible → suspect a broken height chain, not `margin-left` or `overflow`.

---

### [WATCH] CTA button radius rendered as pill shape

**Symptom:** The "Chụp bài toán" button renders as fully rounded (`border-radius: 9999px`) instead of `12px`.

**Fix:** Check the Tailwind class — use `rounded-xl` (12px), not `rounded-full` (9999px).

---

## Figma Make Instructions

### How to run — 3 rounds for best results

| Round       | Append to end of prompt                                                                               | Goal                                    |
| ----------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Round 1** | _"Wireframe only — no colors, no images, focus on layout and information hierarchy of all 8 screens"_ | Validate structure before polish        |
| **Round 2** | _"Add navigation interactions, accordion expand/collapse, and clickable states for all buttons"_      | Validate interactions                   |
| **Round 3** | _(Full prompt, nothing added)_                                                                        | Full color + typography + visual polish |

Each round takes ~10–15 minutes. The Solution Screen accordion is the most complex — validate it in Round 1 first.

### When things break — debug workflow

If Figma Make fixes something incorrectly twice in a row, use this prompt to force it to report before touching anything:

> _"Before making any changes, find and paste the EXACT code (file path + full component JSX) for [component to fix]. Do NOT fix anything yet. Wait for my confirmation before proceeding."_
````

---

## Bước 2 — Lấy DESIGN.md từ getdesign.md

Truy cập **[getdesign.md](https://getdesign.md/)** và chọn design system phù hợp với định hướng visual của dự án (ví dụ: lấy cảm hứng từ Mintlify, Linear, v.v.).

Sao chép toàn bộ nội dung và lưu thành file `DESIGN.md`.

File này chứa design system đầy đủ: bảng màu với mã hex, thang typography, spacing, component styling, và hướng dẫn prompt cho AI.

---

## Bước 3 — Đặt DESIGN.md vào thư mục guidelines của Figma Make

Trong Figma Make, mỗi file có thư mục `guidelines/`. Mở thư mục đó. Bên trong đã có sẵn `Guidelines.md` — đây là điểm vào mà Figma Make đọc đầu tiên.

Đặt `DESIGN.md` vào cùng thư mục, cùng cấp với `Guidelines.md`:

```
guidelines/
├── Guidelines.md
└── DESIGN.md
```

---

## Bước 4 — Tham chiếu DESIGN.md từ Guidelines.md

Mở `Guidelines.md` và thêm dòng này:

```markdown
Follow @DESIGN.md for all design guidance.
```

Dòng này báo cho Figma Make biết cần đọc `DESIGN.md` khi đưa ra quyết định thiết kế. Nếu không có dòng này, Figma Make sẽ không tự động đọc file đó.

---

## Bước 5 — Yêu cầu Figma Make áp dụng guidelines

Yêu cầu Figma Make cập nhật UI hiện tại theo design system:

> _"Redesign this to follow the guidelines in Guidelines.md"_

Hoặc, nếu muốn kiểm soát chi tiết hơn, chia nhỏ theo từng khía cạnh:

1. _"Apply the color palette from Guidelines.md"_
2. _"Update typography to match Guidelines.md"_
3. _"Fix spacing and layout according to Guidelines.md"_

Chia nhỏ cho kết quả nhất quán hơn — Figma Make thường bỏ sót chi tiết khi một prompt yêu cầu quá nhiều thay đổi cùng lúc.

---

## Bước 6 — Chuyển sang Figma Design

Khi design đã được duyệt trong Figma Make, sao chép thủ công từng page sang Figma Design. Hiện chưa có cách export tự động toàn bộ.

**Cấu trúc page đề xuất trong Figma Design:**

```
Page 1 — Cover
Page 2 — Design System     ← colors, fonts, component tokens
Page 3 — Mobile Screens    ← paste from Figma Make here
Page 4 — Desktop Screens   ← paste from Figma Make here
Page 5 — Flows             ← (optional) prototype connections
```

**Đặt tên frame rõ ràng** — Claude đọc tên frame để hiểu ngữ cảnh:

```
Home / Mobile
Solution / Mobile
Home / Desktop
Solution / Desktop
```

- Dùng `[Màn hình] / [Platform]` làm định dạng cơ bản — nhất quán và dễ đoán
- Thêm variant trạng thái khi cần: `Solution / Mobile / Loading`, `OCR / Mobile / Error`
- Khớp tên màn hình với tên route trong code (ví dụ: `History` không phải `Lịch sử`) — giúp Claude map design sang đúng file component
- Không dùng tên tự động (`Frame 1`, `Group 3`) — Claude không có ngữ cảnh để làm việc
- Tên layer bên trong frame cũng quan trọng: đặt tên cho các phần tử chính (`CTA Button`, `Step Card`, `Bottom Nav`) để Claude tham chiếu chính xác khi generate code

---

## Bước 7 — Tạo prototype trong Figma Design

Prototype được xây dựng bằng cách kết nối các frame với interactions.

**Cách tạo một kết nối:**

1. Chọn một phần tử (nút, icon, v.v.)
2. Chuyển sang tab **Prototype** trong panel phải
3. Kéo mũi tên xanh từ phần tử đến frame đích
4. Chọn trigger (`On Click`) và animation (`Push`, `Slide`, `Smart Animate`)

**Luồng chính cho MathSnap:**

```
Home → Camera → Crop → OCR → Solution
  ↑                               ↓
  ←←←←←←←← Bài mới ←←←←←←←←←←←←←←←←
```

**Các loại animation:**

| Animation         | Hành vi                                       | Dùng khi                     |
| ----------------- | --------------------------------------------- | ---------------------------- |
| **Instant**       | Chuyển ngay, không hiệu ứng                   | Hiếm dùng                    |
| **Dissolve**      | Fade in/out giữa các frame                    | Overlay, modal               |
| **Smart Animate** | Phát hiện layer trùng tên, animate giữa chúng | Phần tử chung giữa các frame |
| **Move in**       | Frame mới trượt vào, frame cũ đứng yên        | —                            |
| **Move out**      | Frame cũ trượt ra, frame mới đứng yên         | —                            |
| **Push**          | Frame mới đẩy frame cũ ra ngoài               | Điều hướng tiến/lùi          |
| **Slide in**      | Frame mới trượt vào trên frame cũ             | Bottom sheets, drawers       |
| **Slide out**     | Frame cũ trượt ra, hé lộ frame mới phía dưới  | Đóng bottom sheets           |

**Đề xuất cho MathSnap:**

- **Push → Left** — tất cả điều hướng tiến (Home → Camera → Crop → OCR → Solution)
- **Push → Right** — điều hướng lùi
- **Instant** hoặc **Dissolve** — chuyển tab/sidebar (Home, Lịch sử, Bookmark, Cài đặt) — chuyển tab không có phân cấp nên Push hay Slide sẽ trông không tự nhiên
- **Slide in → Up** — bottom sheets hoặc modal
- **Dissolve** — chuyển loading state

**Smart Animate** — nếu hai frame có phần tử trùng tên, Figma tự động tạo transition mượt mà giữa chúng mà không cần cấu hình thêm.

---

## Bước 8 — Kết nối Figma MCP với Claude

Khi design đã có trên Figma Design (hoặc Figma Make), Claude có thể đọc trực tiếp qua Figma MCP.

- Figma MCP dùng Figma API để đọc file
- Trỏ Claude đến frame cụ thể để generate hoặc cập nhật code
- Khi design thay đổi, Claude đọc lại Figma và cập nhật code theo

---

## Tóm tắt nhanh

```
Viết FIGMA_PROMPT.md
  → Chạy trong Figma Make (3 vòng: wireframe → interactions → polish)
  → Lấy DESIGN.md từ getdesign.md
  → Đặt DESIGN.md vào thư mục guidelines/
  → Thêm "Follow @DESIGN.md for all design guidance." vào Guidelines.md
  → Yêu cầu Figma Make áp dụng guidelines
  → (Tùy chọn) Hoàn thiện design trong Figma Design
  → Kết nối Figma MCP + Claude → generate code
```
