# Figma Make — S-14 Round 2: Bug Fix + Interactions

> **Sequence:** Round 1 ✅ wireframe verified (5/6 PASS, 1 functional bug discovered). Round 2 fixes the bug + adds interaction polish. Round 3 = visual polish only.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 2 — Fix preview-passthrough bug + add card interactions

Round 1 wireframe verified. 5/6 components correct. **1 functional bug found** in Round 1 that must be fixed before any visual polish: Solution.tsx hardcodes the rendered formula regardless of which formula the user picked in S-14 → end-to-end flow looks broken. Fix that first, then add interaction polish.

Do these tasks **in order**. Stop and report after each one if anything is unclear.

### Task 1 — CRITICAL: Pipe `preview` through OCR/ProblemSelector → Solution

**Problem:** In Round 1, the `preview` field exists in `FormulaItem` but only `latex` flows through route state. Solution.tsx falls back to a hardcoded `"∫₀¹ x² dx"` for `displayRendered` regardless of which formula was selected. Picking "Phương trình bậc hai" still renders `∫₀¹ x² dx` in Solution. Flow is functionally broken.

**Fix:** Pipe `preview` alongside `latex` through every navigation that ends at Solution.

**1a. `src/services/mockOcrService.ts`** — single-formula response also carries a `preview`.

```ts
} else {
  // Single formula (existing flow)
  return {
    latex: "\\int_{0}^{1} x^{2} dx",
    // Note: single-formula path doesn't have a separate `preview` field on
    // OcrResponse, so we'll render this inline in OCR.tsx using the existing
    // mockRender logic. Don't change OcrResponse interface — keep it simple.
  };
}
```

**Decision:** keep `OcrResponse` interface unchanged (don't add `preview` at the top level). The single-formula path uses the existing inline render logic in OCR.tsx (the `if (singleLatex.includes("int"))` branch). Multi-formula path uses the per-FormulaItem `preview` field that already exists.

**1b. `src/app/screens/OCR.tsx`** — when navigating to Solution from single-formula path (line 107), pass both `latex` and the currently rendered `preview` so Solution can display the correct formula:

```tsx
<motion.button
  whileTap={{ scale: 0.98 }}
  onClick={() => navigate("/solution", { state: { latex, preview: renderedFormula } })}
  ...
>
```

**1c. `src/app/screens/ProblemSelector.tsx`** — `handleSelect` passes both `latex` and `preview` from the FormulaItem:

```tsx
const handleSelect = (formula: FormulaItem) => {
  navigate("/solution", { state: { latex: formula.latex, preview: formula.preview } });
};
```

**1d. `src/app/screens/Solution.tsx`** — read both fields from state, with fallback:

```tsx
const state = (location.state as { latex?: string; preview?: string } | null) || {};
const incomingLatex = state.latex;
const incomingPreview = state.preview;

const displayLatex = incomingLatex ?? "\\int_{0}^{1} x^{2} dx";
const displayRendered = incomingPreview ?? "∫₀¹ x² dx"; // fallback to legacy mock
```

Now `displayRendered` reflects the user's actual selection. Test: pick "Phương trình bậc hai" → Solution shows `x² + 5x + 6 = 0`. Pick "Đạo hàm" → Solution shows `d/dx(sin x)`. Direct nav to `/solution` (no state) → fallback to `∫₀¹ x² dx`.

### Task 2 — Card press feedback

**File:** `src/app/screens/ProblemSelector.tsx`, the `<button>` rendering each card (lines 60-88).

Currently the card has `hover:bg-gray-50 active:bg-black/5 transition-colors`. Add scale-down press feedback to match the OnboardingOverlay primary button pattern (Tailwind-only, no `motion.button` — saves JS per card when there are many):

Add to existing className: `active:scale-[0.98] transition-all duration-75`

**Important:** combine with existing `transition-colors` → either change to `transition-all` or use multiple transition utilities. Final className:

```tsx
className="w-full bg-white rounded-[16px] border border-black/5 shadow-sm px-6 py-5 hover:bg-gray-50 active:bg-black/5 active:scale-[0.98] transition-all duration-75 text-left relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
```

Also adds focus-visible ring for keyboard navigation (matches OnboardingOverlay Skip button pattern).

### Task 3 — Back button focus ring

**File:** `src/app/screens/ProblemSelector.tsx`, top-bar back button (lines 33-38).

Current: `className="absolute left-6 w-11 h-11 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center text-gray-600"`

Add focus ring:

```tsx
className="absolute left-6 w-11 h-11 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2"
```

### Task 4 — Keyboard navigation for cards

**File:** `src/app/screens/ProblemSelector.tsx`

Cards are already `<button>` so Enter/Space activation works natively. Add Escape key to navigate back, matching the back button:

```tsx
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate("/ocr");
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [navigate]);
```

Add this useEffect alongside the existing direct-URL guard useEffect (around lines 11-15).

### Task 5 — Verify end-to-end flow works after Task 1

After Task 1 is done, manually trace the flow once and confirm in your report:

1. `/ocr` triggers `mockOcrService.detect()` → returns 3-formula response
2. OCR.tsx detects `formulas.length > 1` → navigates to `/problem-selector` with `state.formulas`
3. ProblemSelector renders 3 cards
4. User taps card 2 (Tích phân) → navigates to `/solution` with `state.latex = "\\int_{0}^{1} x^{2} \\, dx"` and `state.preview = "∫₀¹ x² dx"`
5. Solution reads state, sets `displayRendered = "∫₀¹ x² dx"`, renders correctly in mobile bar (line 73) and desktop panel (line 101)

If you find anything off in this trace, **stop and ask** before continuing to Round 3.

### What to NOT touch in this round

- ❌ Color tokens (still wireframe gray — Round 3 will swap to exact hex `#0d0d0d` / `#666666` / `#888888` / mint accents)
- ❌ Real Lucide icons (still placeholder `[<]` `[>]` text — Round 3 swaps to `ChevronLeft` / `ChevronRight`)
- ❌ Atmospheric gradient (Round 3)
- ❌ Card shadow precise tokens (currently `shadow-sm` — Round 3 swaps to `shadow-[0_2px_4px_rgba(0,0,0,0.03)]`)
- ❌ Animation libraries beyond what's already in `motion/react`
- ❌ Schema changes to `OcrResponse` interface (kept unchanged per Task 1a decision)
- ❌ Any other files than the 4 listed in Task 1 + ProblemSelector.tsx in Tasks 2-4

### Report format after Round 2

Per-file with line references:

```
## mockOcrService.ts
- (no changes if Task 1a kept interface unchanged)

## OCR.tsx
- Modified line X: navigate state passes preview alongside latex

## ProblemSelector.tsx
- Modified handleSelect (line X) to pass preview
- Modified card className (line X) — added active:scale + focus-visible
- Modified back button className (line X) — added focus-visible
- Added Escape key useEffect (lines X-Y)

## Solution.tsx
- Modified state destructure (lines X-Y) — read incomingPreview alongside incomingLatex
- Modified displayRendered (line X) — uses incomingPreview with fallback
```

Then **stop and wait** for my approval before proceeding to Round 3 visual polish.
