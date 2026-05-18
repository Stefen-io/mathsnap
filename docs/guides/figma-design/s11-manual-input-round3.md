# Figma Make — S-11 Round 3: Visual Polish (Final)

> **Sequence:** Round 1 ✅ wireframe verified · Round 2 ✅ bug fix + interactions verified (5/5 passed) · **Round 3 = visual polish only**.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 3 — Apply Brand Tokens, Lucide Icons, Atmospheric Gradient, S-10 Red-50 Styling

Round 1 + 2 are structurally + functionally complete. Now apply final visual layer: exact brand hex codes, Lucide icons, atmospheric gradient on Manual.tsx, red-50 styling on S-10 OCR Fail card. **DO NOT change any structural code, animation timing, handler logic, schema, or component shape — pure visual swap.**

### Color token reference

| Purpose | Current (wireframe) | Replace with |
|---|---|---|
| Primary text (title, label, LaTeX preview, back button, heading) | `text-black` | `text-[#0d0d0d]` |
| Body / secondary | `text-gray-500` | `text-[#666666]` |
| Tertiary (placeholder, badge, "Hủy" text) | `text-gray-400` / `text-gray-500` | `text-[#888888]` |
| Surface bg (preview block, badge, button hover) | `bg-gray-50` / `hover:bg-gray-50` | `bg-[#fafafa]` / `hover:bg-[#fafafa]` |
| Primary CTA bg | `bg-black` | `bg-[#0d0d0d]` |
| Disabled state | `bg-gray-200 text-gray-400` | `bg-[#e5e5e5] text-[#888888]` |
| Textarea focus | `focus:border-black focus:ring-black` | `focus:border-[#18E299] focus:ring-[#18E299]` (mint, matches OCR.tsx) |
| S-10 error card | `bg-white border-black/10` | `bg-[#fef2f2] border-[#fecaca]` (red-50 surface, red-200 border) |

### Task 1 — Manual.tsx: Lucide imports + atmospheric gradient

**File:** `src/app/screens/Manual.tsx`

**1a. Add Lucide imports** at line 3:

```tsx
import { ChevronLeft, ArrowRight } from "lucide-react";
```

**1b. Outer container atmospheric gradient (line 44):**

```tsx
<div className="w-full h-[100dvh] flex flex-col font-sans overflow-hidden bg-gradient-to-b from-[#d4fae8]/40 via-white to-white">
```

Drop `bg-white`. Match Home.tsx and ProblemSelector.tsx pattern.

### Task 2 — Manual.tsx: top bar polish

**Line 49-54:** back button — replace placeholder + apply hex:

```tsx
<button
  onClick={() => navigate(-1)}
  className="absolute left-6 w-11 h-11 rounded-full hover:bg-[#fafafa] transition-colors flex items-center justify-center text-[#0d0d0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
>
  <ChevronLeft size={20} strokeWidth={2} />
</button>
```

Changes: `[<]` → `<ChevronLeft>`, `text-black` → `text-[#0d0d0d]`, `hover:bg-gray-50` → `hover:bg-[#fafafa]`.

**Line 57:** title color: `text-black` → `text-[#0d0d0d]`

```tsx
<h1 className="text-[18px] font-semibold text-[#0d0d0d] tracking-tight">
  Nhập công thức
</h1>
```

### Task 3 — Manual.tsx: sticky preview block polish

**Lines 64-74:**

```tsx
<div className="sticky top-16 z-10 mx-6 mt-6 mb-6">
  <div className="bg-[#fafafa] border border-black/5 rounded-[16px] p-6 min-h-[120px] flex items-center justify-center">
    {renderedFormula ? (
      <span className="font-serif italic text-[32px] text-[#0d0d0d] tracking-wider leading-none">
        {renderedFormula}
      </span>
    ) : (
      <span className="text-[14px] text-[#888888] text-center">
        Bắt đầu nhập để xem preview
      </span>
    )}
  </div>
</div>
```

Changes:
- Container `bg-gray-50` → `bg-[#fafafa]`
- LaTeX text `text-black` → `text-[#0d0d0d]`
- Empty placeholder `text-gray-400` → `text-[#888888]`

### Task 4 — Manual.tsx: textarea section polish

**Line 80 (LaTeX badge):** `bg-gray-50 text-gray-500` → `bg-[#fafafa] text-[#666666]`:

```tsx
<span className="bg-[#fafafa] border border-black/5 text-[#666666] font-mono text-[12px] uppercase tracking-[0.6px] font-semibold px-2 py-1 rounded">
  LaTeX
</span>
```

**Line 84-91 (textarea):** swap text color + mint focus ring:

```tsx
<textarea
  ref={textareaRef}
  value={latex}
  onChange={handleLatexChange}
  autoFocus
  className="w-full h-[200px] bg-white border border-black/10 rounded-[16px] p-4 text-[14px] font-mono text-[#0d0d0d] focus:outline-none focus:border-[#18E299] focus:ring-1 focus:ring-[#18E299] transition-all resize-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
  placeholder="Nhập công thức LaTeX..."
/>
```

Changes: `text-black` → `text-[#0d0d0d]`, `focus:border-black` → `focus:border-[#18E299]`, `focus:ring-black` → `focus:ring-[#18E299]`. Mint focus ring matches OCR.tsx textarea convention exactly.

### Task 5 — Manual.tsx: submit button polish

**Lines 97-109:** swap colors + replace `[→]` with `<ArrowRight>`:

```tsx
<motion.button
  whileTap={!isDisabled ? { scale: 0.98 } : undefined}
  onClick={handleSubmit}
  disabled={isDisabled}
  className={`w-full h-[52px] rounded-full flex items-center justify-center gap-2 font-medium text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 ${
    isDisabled
      ? "bg-[#e5e5e5] text-[#888888] cursor-not-allowed"
      : "bg-[#0d0d0d] text-white hover:opacity-90"
  }`}
>
  Xác nhận
  <ArrowRight size={20} strokeWidth={2} />
</motion.button>
```

Changes:
- `bg-black` → `bg-[#0d0d0d]`
- Disabled: `bg-gray-200 text-gray-400` → `bg-[#e5e5e5] text-[#888888]`
- `[→]` placeholder → `<ArrowRight size={20} strokeWidth={2} />`

### Task 6 — OCR.tsx: S-10 imports

**File:** `src/app/screens/OCR.tsx`, line 3

Add `AlertCircle` to existing Lucide import:

```tsx
import { ArrowRight, AlertCircle } from "lucide-react";
```

### Task 7 — OCR.tsx: S-10 error card polish

**Lines 99-109 (error card):**

```tsx
{/* S-10 OCR Fail Error Card */}
<div className="bg-[#fef2f2] border border-[#fecaca] rounded-[16px] p-8 shadow-[0_2px_4px_rgba(0,0,0,0.03)] text-center">
  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
    <AlertCircle size={32} strokeWidth={1.5} className="text-[#dc2626]" />
  </div>
  <h3 className="text-[16px] font-semibold text-[#0d0d0d] mb-2">
    Không nhận diện được công thức.
  </h3>
  <p className="text-[14px] text-[#666666]">
    Thử chụp lại với góc rõ hơn, hoặc nhập thủ công.
  </p>
</div>
```

Changes:
- Card bg `bg-white border-black/10` → `bg-[#fef2f2] border-[#fecaca]` (red-50 surface, red-200 border per pre-flight spec)
- Icon placeholder `[!]` → `<AlertCircle size={32} strokeWidth={1.5} className="text-[#dc2626]" />` (red-600 stroke for clear error signal)
- Heading `text-black` → `text-[#0d0d0d]`
- Helper `text-gray-500` → `text-[#666666]`

### Task 8 — OCR.tsx: S-10 three exits panel polish

**Lines 112-131 (3 exits panel):**

```tsx
{/* S-10 Three Exits */}
<div className="bg-white rounded-[16px] p-6 border border-black/5 flex flex-col gap-3">
  <button
    onClick={handleRetry}
    className="w-full h-12 bg-[#0d0d0d] text-white rounded-full font-medium text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:opacity-90 transition-opacity"
  >
    Thử lại
  </button>
  <button
    onClick={() => navigate("/manual")}
    className="w-full h-12 bg-white border border-black/5 rounded-full font-medium text-[15px] text-[#0d0d0d] hover:bg-[#fafafa] transition-colors"
  >
    Nhập thủ công
  </button>
  <button
    onClick={() => navigate("/")}
    className="text-[#888888] hover:text-[#0d0d0d] text-[15px] h-11 font-medium transition-colors"
  >
    Hủy
  </button>
</div>
```

Changes:
- "Thử lại" button: `bg-black` → `bg-[#0d0d0d]`
- "Nhập thủ công" button: add `text-[#0d0d0d]` (was inheriting), `hover:bg-gray-50` → `hover:bg-[#fafafa]`
- "Hủy" button: `text-gray-500` → `text-[#888888]`, `hover:text-black` → `hover:text-[#0d0d0d]`

### Task 9 — Verify other files frozen

**Confirm in your final report** that NO changes were made to:
- `mockOcrService.ts` (frozen — schema, toggles, helper all stable)
- `Home.tsx` (frozen — onClick wire from Round 1 stays)
- `routes.tsx` (frozen — Manual route registered)
- `Solution.tsx` (frozen — fallback pattern still works)
- `ProblemSelector.tsx` (frozen — S-14 still works)

Round 3 should touch ONLY `Manual.tsx` and `OCR.tsx`.

### What to NOT touch in this round

- ❌ Animation timing (whileTap scale 0.98, transition-all duration-75 — already correct)
- ❌ Handler logic (handleSubmit, handleLatexChange, handleRetry, Escape useEffect — frozen)
- ❌ Schema (`OcrResponse`, `FormulaItem` — frozen)
- ❌ Component structure (no new components, no renames)
- ❌ Route registration
- ❌ z-index, max-width, safe-area, touch target heights — frozen
- ❌ Auto-focus useRef logic — frozen
- ❌ Toggles `SHOULD_RETURN_FAIL` and `SHOULD_RETURN_MULTIPLE` — frozen at current values
- ❌ Spacing tokens (mx-6, mb-6, gap-3 — frozen)

### Final report format

Per-file with line references:

```
## Manual.tsx
- Line 3: Added imports — ChevronLeft, ArrowRight from lucide-react
- Line 44 (outer div): Added atmospheric gradient bg
- Line 49-54 (back button): Replaced [<] with ChevronLeft, swapped text-black → text-[#0d0d0d], hover:bg-gray-50 → hover:bg-[#fafafa]
- Line 57 (title): text-black → text-[#0d0d0d]
- Line 64 (preview container): bg-gray-50 → bg-[#fafafa]
- Line 66 (preview text): text-black → text-[#0d0d0d]
- Line 70 (empty state placeholder): text-gray-400 → text-[#888888]
- Line 80 (LaTeX badge): bg-gray-50 text-gray-500 → bg-[#fafafa] text-[#666666]
- Line 84-91 (textarea): text-black → text-[#0d0d0d], focus:border-black → focus:border-[#18E299], focus:ring-black → focus:ring-[#18E299]
- Line 97-109 (submit button): bg-black → bg-[#0d0d0d], disabled bg-gray-200 text-gray-400 → bg-[#e5e5e5] text-[#888888], [→] → ArrowRight icon

## OCR.tsx
- Line 3: Added AlertCircle to lucide imports
- Line 99 (error card): bg-white border-black/10 → bg-[#fef2f2] border-[#fecaca]
- Line 101 (error icon): [!] placeholder → <AlertCircle size={32} strokeWidth={1.5} className="text-[#dc2626]" />
- Line 103 (error heading): text-black → text-[#0d0d0d]
- Line 106 (helper text): text-gray-500 → text-[#666666]
- Line 115 (Thử lại button): bg-black → bg-[#0d0d0d]
- Line 121 (Nhập thủ công button): added text-[#0d0d0d], hover:bg-gray-50 → hover:bg-[#fafafa]
- Line 127 (Hủy button): text-gray-500 → text-[#888888], hover:text-black → hover:text-[#0d0d0d]

## Other files
- No changes (frozen as expected)
```

After Round 3 done, **stop and wait** for my approval. I'll verify the final diff against the brief, then we close S-11 + S-10 design phase. **All 3 screens (S-11, S-12, S-14) plus the S-10 error state will then be ready** for the production port (Vite/react-router → Next.js App Router) + OpenSpec changes.
