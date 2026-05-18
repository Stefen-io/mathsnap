# Figma Make — S-11 Round 2: Bug Fix + Interactions

> **Sequence:** Round 1 ✅ wireframe verified (8/10 PASS, 1 functional bug + 1 interaction drift). Round 2 fixes both. Round 3 = visual polish only.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 2 — Fix S-10 error-state UI leak + add Manual.tsx interactions

Round 1 wireframe verified. 8/10 components correct. **1 functional bug found** that must be fixed before visual polish: in S-10 OCR Fail state, the LaTeX edit area + sticky bottom "Giải bài này" CTA still render below the error UI. User can click "Giải bài này" in error state → navigates to /solution with default placeholder latex. Flow is broken.

Do these tasks **in order**. Stop and report after each one if anything is unclear.

### Task 1 — CRITICAL: Hide LaTeX edit area + bottom CTA when in S-10 error state

**File:** `src/app/screens/OCR.tsx`

**Problem:** Currently when `error` is set, the formula card switches to error UI (lines 96-132 ✅). But:
- LaTeX edit area (lines 147-160) — condition `{!loading && (...)}` doesn't check `error`
- Sticky bottom (lines 163-184) — no conditional render at all

Both should be hidden when in error state because:
- Edit area is for tweaking the OCR result; in error state there's no result to tweak
- "Giải bài này" CTA in error state is meaningless and would navigate with stale default latex

**Fix 1a (line 147):** change condition to also exclude error state:

```tsx
{/* LaTeX Edit Area */}
{!loading && !error && (
  <div className="flex flex-col gap-3 shrink-0">
    {/* ...existing content... */}
  </div>
)}
```

**Fix 1b (lines 163-184):** wrap the sticky bottom div with `{!error && (...)}`:

```tsx
{/* Sticky Bottom Actions - hidden in error state */}
{!error && (
  <div className="absolute bottom-0 left-0 right-0 lg:w-full lg:max-w-[640px] lg:left-1/2 lg:-translate-x-1/2 p-6 lg:p-8 bg-white/90 backdrop-blur-md border-t border-black/5 flex flex-col gap-4 mt-auto z-20">
    {/* ...existing Chụp lại + Giải bài này buttons... */}
  </div>
)}
```

After this, error state shows ONLY: image thumbnail (top) + error card with message + 3 exits panel. Nothing else.

### Task 2 — Verify error → success transition cleans state correctly

**File:** `src/app/screens/OCR.tsx`, `handleRetry` function (lines 58-76)

When user clicks "Thử lại" and the retry succeeds (e.g., they manually flip `SHOULD_RETURN_FAIL=false` then click), the function should:
- Clear `error` state ✅ (already does at line 60: `setError(null)`)
- Set loading true while retrying ✅ (line 59)
- On success, set latex + renderedFormula ✅ (lines 72-73)

Currently working correctly. **Task 2 is verification only — no code change needed.** Confirm in your report that handleRetry does NOT leave stale `error` state when the retry succeeds.

### Task 3 — Manual.tsx submit button: use motion.button with whileTap

**File:** `src/app/screens/Manual.tsx`, lines 85-96

Currently uses plain `<button>` without press feedback. Match OCR.tsx primary CTA pattern (which uses `motion.button whileTap={{ scale: 0.98 }}`).

**Change:**

```tsx
import { motion } from "motion/react"; // add to existing imports at top

// In the JSX:
<motion.button
  whileTap={{ scale: 0.98 }}
  onClick={handleSubmit}
  disabled={isDisabled}
  className={`w-full h-[52px] rounded-full flex items-center justify-center gap-2 font-medium text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 ${
    isDisabled
      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
      : "bg-black text-white hover:opacity-90"
  }`}
>
  Xác nhận
  <span className="text-[20px]">[→]</span>
</motion.button>
```

Changes: `<button>` → `motion.button`, added `whileTap`, added focus-visible ring (matches OnboardingOverlay primary button pattern), added `transition-all duration-75` for smooth scale animation.

Note: when `disabled={true}` is set on motion.button, Framer Motion still applies whileTap. To prevent press animation on disabled state, the existing `cursor-not-allowed` is enough — user can still see button but tap won't fire onClick. If you want extra strict (no scale on disabled), wrap whileTap conditionally:

```tsx
whileTap={!isDisabled ? { scale: 0.98 } : undefined}
```

Use the conditional form.

### Task 4 — Manual.tsx Escape key handler

**File:** `src/app/screens/Manual.tsx`

Add Escape key handler that mirrors back button — navigate back to previous screen. Match the keyboard navigation pattern from OnboardingOverlay and ProblemSelector (Round 2 of S-14).

Add this `useEffect` alongside the existing auto-focus useEffect (around lines 12-16):

```tsx
// Escape key navigates back
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate(-1);
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [navigate]);
```

### Task 5 — End-to-end flow re-verification after Task 1

After Task 1 is done, re-trace the 6 scenarios from Round 1 + 1 new scenario for the bug fix:

1. ✅ Home → Manual → /ocr with state.latex → S-05 edit mode → Solution
2. ✅ Camera path → /ocr → /problem-selector (S-14, when SHOULD_RETURN_MULTIPLE=true)
3. ✅ Camera path → /ocr → S-10 error UI (when SHOULD_RETURN_FAIL=true)
4. ✅ S-10 → "Nhập thủ công" → /manual
5. ✅ S-10 → "Hủy" → /
6. ✅ S-10 → "Thử lại" → handleRetry → succeeds → S-05 edit mode (clean transition)
7. **NEW after Task 1:** S-10 error state shows ONLY error card + 3 exits panel. NO LaTeX edit area, NO sticky bottom CTA, NO "Giải bài này" button visible. Verify this in your report.

If any scenario doesn't work after Task 1, **stop and ask** — don't proceed to Round 3.

### What to NOT touch in this round

- ❌ Color tokens — keep `text-black`, `bg-gray-200`, etc. Round 3 swaps to exact hex.
- ❌ Real Lucide icons — keep `[<]`, `[→]`, `[!]` placeholders. Round 3 swaps to ChevronLeft / ArrowRight / AlertCircle.
- ❌ Atmospheric gradient on Manual.tsx — Round 3 adds `bg-gradient-to-b from-[#d4fae8]/40 via-white to-white`.
- ❌ S-10 error card red-50 styling — Round 3 swaps to `bg-[#fef2f2] border-[#fecaca]`.
- ❌ Schema, handlers, route registrations, mockOcrService logic — frozen.
- ❌ Any other files than OCR.tsx (Tasks 1, 2) and Manual.tsx (Tasks 3, 4).

### Report format after Round 2

Per-file with line references:

```
## OCR.tsx
- Modified line 147: condition !loading → !loading && !error
- Wrapped sticky bottom (lines 163-184): added !error guard
- Task 2 verification: handleRetry confirmed clean — quote relevant lines

## Manual.tsx
- Added import motion from motion/react (line X)
- Modified submit button (lines 85-96): button → motion.button with whileTap conditional
- Added focus-visible classes
- Added Escape key useEffect (lines X-Y)

## End-to-end trace
[7 scenarios with PASS/note]
```

Then **stop and wait** for my approval before proceeding to Round 3 visual polish.
