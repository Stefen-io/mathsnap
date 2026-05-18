# Figma Make — Round 2: Interactions, Animation & Layout Fixes

> **Sequence:** Round 1 wireframe ✅ verified (5/5 structural overrides passed). Now Round 2 adds interactions, animation, and 1 structural fix discovered during review. Color polish stays for Round 3.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 2 — Add Interactions, Animation, and Fix Layout Shift

Round 1 wireframe verified. 5/5 structural overrides passed (z-[60], localStorage key `mathsnap.onboarding.seen`, "Bỏ qua" sets flag, first-launch in Provider, overlay rendered in RootLayout). Architecture even better than my plan — putting `useEffect` in `OnboardingProvider` instead of RootLayout is cleaner.

Now do these tasks **in order**. Stop and report after each one if anything is unclear.

### Task 1 — Fix Step 3 layout shift (structural fix)

**File:** `src/app/components/OnboardingOverlay.tsx`, lines 87-94

**Problem:** When `isLastStep === true`, the entire `<button>Bỏ qua</button>` is removed from the DOM → the step counter "03 / 03" gets pulled toward the center → noticeable horizontal shift between Step 2 and Step 3.

**Fix:** Replace the `{!isLastStep && (...)}` conditional with a ternary that always renders an element of the same width/height. The placeholder must be `aria-hidden`, non-focusable, and exactly the same dimensions (`h-11`, similar horizontal footprint) as the Skip button so the counter stays pinned left without shifting.

```tsx
{!isLastStep ? (
  <button
    onClick={handleSkip}
    className="text-[14px] text-gray-500 font-medium hover:text-black transition-colors h-11 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 rounded-full"
  >
    Bỏ qua
  </button>
) : (
  <span aria-hidden="true" className="h-11 px-3 inline-block" style={{ minWidth: "70px" }} />
)}
```

### Task 2 — Add fade-in / fade-out animation (200ms ease-out, no slide)

**File:** `src/app/components/OnboardingOverlay.tsx`

**Problem:** Currently the overlay appears instantly on mount and vanishes instantly on `markSeen()`. The brief specified fade-only 200ms — calm, editorial, not app-promo.

**Fix:** Use `motion/react` (already in package.json — confirmed by `routes.tsx` lines 12, 61-72). Do NOT introduce another animation library.

Refactor the overlay so AnimatePresence handles mount/unmount instead of the `if (!isOpen) return null;` guard:

```tsx
import { AnimatePresence, motion } from "motion/react";

export function OnboardingOverlay() {
  const { isOpen, markSeen } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  // ... rest of state and handlers unchanged

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-white z-[60] flex flex-col items-center"
        >
          {/* ... existing top bar / step content / bottom block */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Critical:** Do NOT add `translate`, `slide`, `scale`, or `y:` animations. **Opacity only.** If you accidentally add slide animation, that breaks the editorial vibe.

### Task 3 — Crossfade between steps (when user taps "Tiếp tục")

**File:** `src/app/components/OnboardingOverlay.tsx`

Currently switching steps causes the heading/body/icon to swap instantly. Add a 150ms crossfade so step transitions feel intentional, not jarring.

Wrap the `<OnboardingStep ... />` render with AnimatePresence keyed by `currentStep`:

```tsx
<div className="flex-1 flex items-center justify-center w-full">
  <AnimatePresence mode="wait">
    <motion.div
      key={currentStep}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full flex justify-center"
    >
      <OnboardingStep
        iconPlaceholder={currentStepData.iconPlaceholder}
        heading={currentStepData.heading}
        body={currentStepData.body}
        customContent={currentStepData.customContent}
      />
    </motion.div>
  </AnimatePresence>
</div>
```

`mode="wait"` ensures the old step fades out before the new one fades in — same pattern as `routes.tsx:61`.

### Task 4 — Add active/focus states to primary button

**File:** `src/app/components/OnboardingOverlay.tsx`, line 113-118

Currently has `hover:opacity-90 transition-opacity` ✅ but no press feedback or focus ring. Add:

```tsx
<button
  onClick={handleNext}
  className="w-full h-12 bg-black text-white rounded-full font-medium text-[15px] shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
>
  {isLastStep ? "Bắt đầu" : "Tiếp tục"}
</button>
```

Note: replaced `transition-opacity` with `transition-all` so both opacity and scale transitions animate smoothly.

### Task 5 — Smooth pagination dot transitions

**File:** `src/app/components/PaginationDots.tsx`

Active dot should smoothly grow + shift color when switching steps, not pop instantly. Add `transition-all duration-200 ease-out` to whatever className the dot uses. Make sure both the size change (e.g. 6px → 8px) and any color/background change are within the same transition.

If your current implementation conditionally applies different sizes via `w-1.5 h-1.5` vs `w-2 h-2`, the transition won't work cleanly because Tailwind doesn't transition between width classes well. Use inline style for size if needed:

```tsx
<div
  style={{ width: isActive ? 8 : 6, height: isActive ? 8 : 6 }}
  className={`rounded-full transition-all duration-200 ease-out ${
    isActive ? "bg-black" : "bg-black/10"
  }`}
/>
```

### Task 6 — Keyboard navigation (a11y)

**File:** `src/app/components/OnboardingOverlay.tsx`

Add Escape key handler that dismisses the overlay (same as "Bỏ qua") on any step except the last. On the last step, Escape is a no-op (force user to choose "Bắt đầu").

```tsx
useEffect(() => {
  if (!isOpen) return;
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !isLastStep) {
      markSeen();
    }
  };
  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [isOpen, isLastStep, markSeen]);
```

Tab order should follow natural DOM (counter → Skip → primary button) — no `tabIndex` overrides needed.

### What to NOT touch in this round

- ❌ Color tokens — keep `text-gray-500`, `bg-black`, `text-black`, `text-gray-600` for now. Round 3 swaps to exact hex (`#0d0d0d` / `#666666` / `#888888` / `#18E299`).
- ❌ Lucide icons — keep placeholder text labels (`Camera`, `BookOpen`, `Bookmark`). Round 3 swaps to actual icons.
- ❌ Step 2 illustration polish — keep current grayscale wireframe rows. Round 3 adds mint accent on Row 1 + Lock/Sparkles icons.
- ❌ Typography — already correct sizing. Round 3 may refine tracking on Vietnamese text.
- ❌ Any new components or new files. Only edit the 3 files above.

### Report format after Round 2

Report changes per-file with line references:

```
## OnboardingOverlay.tsx
- Added: AnimatePresence + motion.div wrapper (lines X-Y)
- Modified: Skip button conditional → ternary with placeholder (lines X-Y)
- Added: AnimatePresence around OnboardingStep render (lines X-Y)
- Added: Escape key useEffect (lines X-Y)
- Modified: Primary button className (line X)

## PaginationDots.tsx
- Modified: dot className with transition-all (line X)

## (any other files touched)
```

Then **stop and wait** for my approval before proceeding to Round 3 polish.
