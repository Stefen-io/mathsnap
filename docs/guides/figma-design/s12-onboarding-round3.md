# Figma Make — Round 3: Visual Polish (Final)

> **Sequence:** Round 1 ✅ wireframe verified · Round 2 ✅ interactions verified (6/6 passed) · **Round 3 = visual polish only**.
>
> **Use:** Paste the entire block below into Figma Make.

---

## Round 3 — Visual Polish: Apply Brand Tokens, Lucide Icons, Final Hierarchy

Round 1 + 2 are structurally complete and verified. Now apply the full visual layer: exact brand hex codes, Lucide icons replacing text placeholders, polished Step 2 illustration, and atmospheric gradient. **DO NOT change any structural code, animation timing, handler logic, or component shape — pure visual swap.**

### Color token reference (use these exact values — no Tailwind grayscale utilities)

| Purpose | Current (wireframe) | Replace with |
|---|---|---|
| Primary text / CTA bg / pagination active | `text-black` / `bg-black` | `text-[#0d0d0d]` / `bg-[#0d0d0d]` |
| Body secondary | `text-gray-600` | `text-[#666666]` |
| Tertiary / step counter / Skip | `text-gray-500` | `text-[#888888]` |
| Tertiary subdued (lock/sparkle icons) | `text-gray-400` | `text-[#aaaaaa]` |
| Brand mint (icon stroke) | — | `#18E299` |
| Pale mint (icon halo, Step 2 Row 1 bg) | — | `#d4fae8` |
| Deep mint (Step 2 Row 1 mono "01") | — | `#0fa76e` |
| Inactive pagination dot | `bg-black/10` | `bg-black/10` (keep — matches `rgba(0,0,0,0.1)` we agreed) |
| Skip hover | `hover:text-black` | `hover:text-[#0d0d0d]` |

### Task 1 — Replace icon placeholders with Lucide icons + halo

**File:** `src/app/components/OnboardingStep.tsx`

Currently lines 16-18 render a 64×64 gray placeholder square with text label. Replace with a 120×120 pale-mint halo containing the actual Lucide icon (mint stroke) at 48×48.

Change the prop name from `iconPlaceholder` to `Icon` (component reference, not string). The new prop type:

```tsx
import { ReactNode, ComponentType } from "react";
import { LucideProps } from "lucide-react";

interface OnboardingStepProps {
  Icon: ComponentType<LucideProps>;
  heading: string;
  body: string;
  customContent?: ReactNode;
}

export function OnboardingStep({ Icon, heading, body, customContent }: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-[480px] px-6">
      {/* Hero Block */}
      <div className="flex flex-col items-center text-center mb-12">
        {/* Icon halo */}
        <div className="w-[120px] h-[120px] rounded-full bg-[#d4fae8]/30 flex items-center justify-center mb-6">
          <Icon size={48} strokeWidth={1.5} className="text-[#18E299]" />
        </div>

        {/* Heading */}
        <h2 className="text-[36px] font-semibold text-[#0d0d0d] leading-tight tracking-[-0.72px] mb-4 max-w-[360px]">
          {heading}
        </h2>

        {/* Body */}
        <p className="text-[16px] text-[#666666] leading-[1.5] max-w-[320px]">
          {body}
        </p>
      </div>

      {customContent && (
        <div className="w-full max-w-[320px]">
          {customContent}
        </div>
      )}
    </div>
  );
}
```

### Task 2 — Pass actual Lucide icons from OnboardingOverlay

**File:** `src/app/components/OnboardingOverlay.tsx`

At the top, add Lucide imports:

```tsx
import { Camera, BookOpen, Bookmark, Lock, Sparkles } from "lucide-react";
```

In the `steps` array (currently lines 67-84), replace the `iconPlaceholder: "Camera"` strings with `Icon: Camera`/`Icon: BookOpen`/`Icon: Bookmark` component references:

```tsx
const steps = [
  {
    Icon: Camera,
    heading: "Chụp công thức, hệ thống đọc giúp bạn",
    body: "Hệ thống nhận dạng toán học tiên tiến giúp bạn quét công thức ngay lập tức.",
  },
  {
    Icon: BookOpen,
    heading: "Mở từng bước, hiểu từng phần",
    body: "Giải thích chi tiết từng bước một, giúp bạn nắm vững cách giải.",
    customContent: step2Illustration,
  },
  {
    Icon: Bookmark,
    heading: "Đánh dấu bài hay, ôn lại bất cứ lúc nào",
    body: "Lưu các bài giải quan trọng để ôn tập và xem lại khi cần.",
  },
];
```

And in the JSX (currently line 129-134), pass `Icon` instead of `iconPlaceholder`:

```tsx
<OnboardingStep
  Icon={currentStepData.Icon}
  heading={currentStepData.heading}
  body={currentStepData.body}
  customContent={currentStepData.customContent}
/>
```

### Task 3 — Polish Step 2 progressive disclosure illustration

**File:** `src/app/components/OnboardingOverlay.tsx`, currently lines 39-65

Replace the wireframe illustration with the polished version:
- **Row 1 (opened/active):** background `bg-[#d4fae8]` (pale mint), mono "01" in `text-[#0fa76e]` (deep mint), placeholder text bars in `bg-black/8`
- **Row 2 (locked):** outline only `border-black/10`, replace `<span>Lock icon</span>` with actual `<Lock size={14} className="text-[#aaaaaa]" />`, add a subtle placeholder bar to the right
- **Row 3 (future reveal):** outline only `border-black/10`, replace `<span>Sparkles icon</span>` with actual `<Sparkles size={14} className="text-[#aaaaaa]" />`, add a subtle placeholder bar to the right

```tsx
const step2Illustration = (
  <div className="border border-black/5 rounded-[16px] p-3 bg-white">
    <div className="flex flex-col gap-3">
      {/* Row 1: Opened */}
      <div className="h-12 bg-[#d4fae8] rounded-full px-4 flex items-center gap-3">
        <span className="text-xs font-mono font-semibold text-[#0fa76e]">01</span>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-1 bg-black/8 w-full rounded" />
          <div className="h-1 bg-black/8 w-3/4 rounded" />
        </div>
      </div>

      {/* Row 2: Locked */}
      <div className="h-12 border border-black/10 rounded-full px-4 flex items-center gap-3">
        <Lock size={14} className="text-[#aaaaaa]" strokeWidth={1.5} />
        <div className="flex-1 h-1 bg-black/5 w-3/4 rounded" />
      </div>

      {/* Row 3: Future reveal */}
      <div className="h-12 border border-black/10 rounded-full px-4 flex items-center gap-3">
        <Sparkles size={14} className="text-[#aaaaaa]" strokeWidth={1.5} />
        <div className="flex-1 h-1 bg-black/5 w-3/4 rounded" />
      </div>
    </div>
  </div>
);
```

### Task 4 — Apply exact hex on remaining text + button classes

**File:** `src/app/components/OnboardingOverlay.tsx`

- Line 101 (step counter): `text-gray-500` → `text-[#888888]`
- Line 109 (Skip button): `text-gray-500` → `text-[#888888]`, `hover:text-black` → `hover:text-[#0d0d0d]`
- Line 147 (primary button): `bg-black` → `bg-[#0d0d0d]`, `shadow-sm` → `shadow-[0px_1px_2px_rgba(0,0,0,0.06)]` (matches Home.tsx exactly)

### Task 5 — Atmospheric gradient at top of overlay

**File:** `src/app/components/OnboardingOverlay.tsx`, line 96 (the `motion.div` container)

Currently `bg-white`. Add a subtle mint atmospheric gradient at the top to match Home's hero — this signals "this is part of MathSnap, not a generic system dialog":

```tsx
className="fixed inset-0 z-[60] flex flex-col items-center bg-gradient-to-b from-[#d4fae8]/40 via-white to-white"
```

(Same gradient as Home.tsx line 9. Keep it subtle — `/40` opacity.)

### Task 6 — Polish PaginationDots active color

**File:** `src/app/components/PaginationDots.tsx`, line 16

Change `bg-black` to `bg-[#0d0d0d]` for the active dot. Inactive `bg-black/10` stays.

```tsx
className={`rounded-full transition-all duration-200 ease-out ${
  isActive ? "bg-[#0d0d0d]" : "bg-black/10"
}`}
```

### Task 7 — Polish Settings "Xem lại hướng dẫn" entry

**File:** `src/app/screens/Settings.tsx`

Verify the row added in Round 1 uses exact hex matching the rest of the `Thông tin` section:
- Row label color: `text-[#0d0d0d]` (or whatever the existing rows use — match exactly)
- Right chevron icon: `text-[#aaaaaa]`
- Hover/press states match other rows in the same section
- No utility classes like `text-gray-700` or `text-black` — use the same hex codes as adjacent rows

If existing rows in `Thông tin` section already use exact hex, just confirm the new "Xem lại hướng dẫn" row matches them. If inconsistent, fix all rows (small scope creep, but worth it for visual cohesion).

### What to NOT touch in this round

- ❌ Animation timing (200ms / 150ms / 75ms — already correct)
- ❌ Handler logic (`markSeen`, Escape, dot transitions — frozen)
- ❌ z-index, max-width, safe-area, touch target heights — frozen
- ❌ AnimatePresence patterns
- ❌ The OnboardingContext file — frozen (`mathsnap.onboarding.seen` is canonical)
- ❌ Component file structure (no new components, no renames except `iconPlaceholder` → `Icon`)

### Final report format

Per-file with line references:

```
## OnboardingStep.tsx
- Modified prop signature: iconPlaceholder (string) → Icon (ComponentType<LucideProps>)
- Replaced gray placeholder square with mint halo + Lucide icon (lines X-Y)
- Color hex: text-black → text-[#0d0d0d], text-gray-600 → text-[#666666]

## OnboardingOverlay.tsx
- Added imports: Camera, BookOpen, Bookmark, Lock, Sparkles from lucide-react
- Updated steps array: iconPlaceholder strings → Icon component refs
- Polished step2Illustration with mint Row 1 + Lock/Sparkles icons (lines X-Y)
- Color hex on counter, Skip, primary button (lines X, Y, Z)
- Atmospheric gradient on container (line X)

## PaginationDots.tsx
- Active dot: bg-black → bg-[#0d0d0d] (line X)

## Settings.tsx (if changes needed)
- Verified / fixed "Xem lại hướng dẫn" row hex matches adjacent rows
```

After Round 3 done, **stop and wait** for my approval. I'll verify the diff against the brief, then we ship the design and I move to OpenSpec change + implementation in the production codebase.
