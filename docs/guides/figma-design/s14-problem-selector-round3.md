# Figma Make — S-14 Round 3: Visual Polish (Final)

> **Sequence:** Round 1 ✅ wireframe verified · Round 2 ✅ bug fix + interactions verified (5/5 passed) · **Round 3 = visual polish only**.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 3 — Apply Brand Tokens, Lucide Icons, Atmospheric Gradient

Round 1 + 2 are structurally + functionally complete. Now apply the final visual layer: exact brand hex codes, Lucide icons replacing text placeholders, and atmospheric gradient. **DO NOT change any structural code, animation timing, handler logic, schema, or component shape — pure visual swap.**

### Color token reference

| Purpose | Current (wireframe) | Replace with |
|---|---|---|
| Primary text (title, label, LaTeX preview text, back button) | `text-black` / `text-gray-600` | `text-[#0d0d0d]` |
| Secondary body (subtitle) | `text-gray-600` | `text-[#666666]` |
| Tertiary (badge text, chevron) | `text-gray-600` (badge) / `text-gray-500` (chevron) | `text-[#666666]` (badge) / `text-[#888888]` (chevron) |
| Surface bg (badge, LaTeX preview, card hover) | `bg-gray-100` / `bg-gray-50` / `hover:bg-gray-50` | `bg-[#fafafa]` / `hover:bg-[#fafafa]` |
| Card shadow | `shadow-sm` | `shadow-[0_2px_4px_rgba(0,0,0,0.03)]` (match Solution step cards exactly) |
| Outer container bg | `bg-white` | `bg-gradient-to-b from-[#d4fae8]/40 via-white to-white` (atmospheric gradient — match Home/OnboardingOverlay) |

### Task 1 — Replace text placeholder chevrons with Lucide icons

**File:** `src/app/screens/ProblemSelector.tsx`

**1a. Add Lucide imports** at the top:

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
```

**1b. Back button (line 48):** replace `<span className="text-xs font-mono">[&lt;]</span>` with `<ChevronLeft size={20} strokeWidth={2} />`. Final back button:

```tsx
<button
  onClick={() => navigate("/ocr")}
  className="absolute left-6 w-11 h-11 rounded-full hover:bg-[#fafafa] transition-colors flex items-center justify-center text-[#0d0d0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
>
  <ChevronLeft size={20} strokeWidth={2} />
</button>
```

Note: also swapped `hover:bg-black/5` → `hover:bg-[#fafafa]` (consistent with card hover token), and `text-gray-600` → `text-[#0d0d0d]` (back button is primary nav, deserves stronger color).

**1c. Card chevron placeholder (lines 95-98):** replace text `[>]` with Lucide `ChevronRight`:

```tsx
{/* Chevron - absolute positioned top-right */}
<div className="absolute top-6 right-6 text-[#888888]">
  <ChevronRight size={20} strokeWidth={2} />
</div>
```

### Task 2 — Apply atmospheric gradient on outer container

**File:** `src/app/screens/ProblemSelector.tsx`, line 39 (outermost div)

Currently: `className="w-full h-[100dvh] bg-white flex flex-col font-sans overflow-hidden"`

Replace with:

```tsx
<div className="w-full h-[100dvh] flex flex-col font-sans overflow-hidden bg-gradient-to-b from-[#d4fae8]/40 via-white to-white">
```

Drop `bg-white` (replaced by gradient). Match the pattern from Home.tsx and OnboardingOverlay.

### Task 3 — Apply exact hex on title, subtitle

**File:** `src/app/screens/ProblemSelector.tsx`

- **Line 52** (title): `text-black` → `text-[#0d0d0d]`
- **Line 59** (subtitle): `text-gray-600` → `text-[#666666]`

### Task 4 — Apply exact hex on card content + bg tokens

**File:** `src/app/screens/ProblemSelector.tsx`

**4a. Card button (line 74):** swap surface tokens:
- `shadow-sm` → `shadow-[0_2px_4px_rgba(0,0,0,0.03)]`
- `hover:bg-gray-50` → `hover:bg-[#fafafa]`
- `active:bg-black/5` → keep (works fine in both grayscale and final palette)

Final className:

```tsx
className="w-full bg-white rounded-[16px] border border-black/5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] px-6 py-5 hover:bg-[#fafafa] active:bg-black/5 active:scale-[0.98] transition-all duration-75 text-left relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
```

**4b. Index badge (line 78):**
- `bg-gray-100` → `bg-[#fafafa]`
- `text-gray-600` → `text-[#666666]`

Final:

```tsx
<span className="bg-[#fafafa] border border-black/5 text-[#666666] text-[12px] font-mono uppercase tracking-[0.6px] font-semibold px-2 py-1 rounded inline-block">
  {badgeText}
</span>
```

**4c. Label (line 84):** `text-black` → `text-[#0d0d0d]`

```tsx
<h3 className="text-[16px] font-semibold text-[#0d0d0d] tracking-[-0.2px] mb-3">
  {formula.label}
</h3>
```

**4d. LaTeX preview container (line 89):** `bg-gray-50` → `bg-[#fafafa]`

```tsx
<div className="bg-[#fafafa] border border-black/5 rounded-[12px] p-4 flex items-center justify-center">
```

**4e. LaTeX preview text (line 90):** `text-black` → `text-[#0d0d0d]`

```tsx
<span className="font-serif italic text-[20px] text-[#0d0d0d]">
  {formula.preview}
</span>
```

### Task 5 — Verify no other files touched

**Confirm in your final report** that NO changes were made to:
- `mockOcrService.ts` (frozen)
- `OCR.tsx` (frozen — Round 2 fix already in place)
- `Solution.tsx` (frozen — preview passthrough already working)
- `routes.tsx` (frozen)
- `App.tsx` (frozen)

Round 3 is a single-file change scoped to `ProblemSelector.tsx`.

### What to NOT touch in this round

- ❌ Animation timing (`active:scale-[0.98] transition-all duration-75` — already correct)
- ❌ Handler logic (`handleSelect`, Escape useEffect, direct-URL guard — frozen)
- ❌ Schema (`FormulaItem`, `OcrResponse` — frozen)
- ❌ Component structure (no new components, no renames)
- ❌ Route registration
- ❌ z-index, max-width, safe-area, touch target heights — frozen
- ❌ Step counter format (`01 / 03` zero-padded — frozen)
- ❌ Spacing tokens (px-6 py-5, gap-3, mb-3 — frozen)
- ❌ Lucide icon sizes (`size={20}` matches existing OnboardingOverlay icon size convention)

### Final report format

Per-file with line references:

```
## ProblemSelector.tsx
- Line 1: Added imports — ChevronLeft, ChevronRight from lucide-react
- Line 39 (outer div): Added atmospheric gradient bg
- Line 46 (back button): Replaced [<] with ChevronLeft, swapped text-gray-600 → text-[#0d0d0d], hover:bg-black/5 → hover:bg-[#fafafa]
- Line 52 (title): text-black → text-[#0d0d0d]
- Line 59 (subtitle): text-gray-600 → text-[#666666]
- Line 74 (card className): shadow-sm → shadow-[0_2px_4px_rgba(0,0,0,0.03)], hover:bg-gray-50 → hover:bg-[#fafafa]
- Line 78 (index badge): bg-gray-100 → bg-[#fafafa], text-gray-600 → text-[#666666]
- Line 84 (label): text-black → text-[#0d0d0d]
- Line 89 (LaTeX preview container): bg-gray-50 → bg-[#fafafa]
- Line 90 (LaTeX preview text): text-black → text-[#0d0d0d]
- Lines 95-98 (chevron placeholder): Replaced [>] with ChevronRight, kept text-[#888888]

## Other files
- No changes
```

After Round 3 done, **stop and wait** for my approval. I'll verify the final diff against the brief, then we close S-14 design phase. Both S-12 and S-14 will then be ready for the production port (Vite/react-router → Next.js App Router) + OpenSpec changes.
