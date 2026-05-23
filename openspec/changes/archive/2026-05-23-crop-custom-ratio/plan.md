# Crop Custom Ratio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Custom" button to the crop ratio selector that transforms the row inline into W:H number inputs with a validated Apply button.

**Architecture:** Single-file edit. Three new state variables (`isCustom`, `customW`, `customH`) are added to `CropPage`. `handleAspectChange` gains `setIsCustom(false)` so any preset click exits custom mode. The ratio selector row conditionally renders preset buttons or W:H inputs — plain DOM swap, no animation.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, `react-easy-crop`

---

## Task 1: State, handlers, and validation

**Files:**
- Modify: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Add the three new state variables after the existing `aspect` state line**

  In `src/client/app/(main)/crop/page.tsx`, after line 22 (`const [aspect, setAspect] = useState<number>(4 / 3)`), add:

  ```tsx
  const [isCustom, setIsCustom] = useState(false)
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')
  ```

- [ ] **Step 2: Add `setIsCustom(false)` to `handleAspectChange`**

  Replace the existing `handleAspectChange` function:

  ```tsx
  function handleAspectChange(newAspect: number) {
    setAspect(newAspect)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setIsCustom(false)
  }
  ```

- [ ] **Step 3: Add `handleCustomApply` after `handleAspectChange`**

  ```tsx
  function handleCustomApply() {
    handleAspectChange(parseFloat(customW) / parseFloat(customH))
  }
  ```

- [ ] **Step 4: Derive `isApplyDisabled` before the early-return guard**

  Add this constant after `handleCustomApply` (before `if (!capturedBlob || !imageUrl) return null`):

  ```tsx
  const isApplyDisabled =
    isNaN(parseFloat(customW)) ||
    isNaN(parseFloat(customH)) ||
    parseFloat(customW) <= 0 ||
    parseFloat(customH) <= 0
  ```

  > Note: `isNaN` checks must come before `<= 0` — `parseFloat('')` returns `NaN`, and `NaN <= 0` is `false` in JS, which would incorrectly enable Apply on empty inputs.

- [ ] **Step 5: Type-check**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/client/app/\(main\)/crop/page.tsx
  git commit -m "feat(crop): add isCustom state and handleCustomApply handler"
  ```

---

## Task 2: UI — ratio selector row conditional render

**Files:**
- Modify: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Replace the ratio selector `<div>` contents with a conditional**

  Replace the entire ratio selector section (the `{/* Ratio selector */}` block) with:

  ```tsx
  {/* Ratio selector */}
  <div className="flex justify-center gap-2 py-3">
    {!isCustom ? (
      <>
        {RATIO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleAspectChange(preset.value)}
            className={[
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              aspect === preset.value
                ? 'border-[#18E299] text-[#18E299]'
                : 'border-white/20 text-white/60',
            ].join(' ')}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setIsCustom(true)}
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/60 transition-colors"
        >
          Custom
        </button>
      </>
    ) : (
      <>
        <input
          type="number"
          min="0.1"
          step="any"
          value={customW}
          onChange={(e) => setCustomW(e.target.value)}
          placeholder="W"
          className="w-14 rounded-full border border-white/20 bg-transparent py-1.5 text-center text-sm text-white"
        />
        <span className="flex items-center text-sm text-white/60">:</span>
        <input
          type="number"
          min="0.1"
          step="any"
          value={customH}
          onChange={(e) => setCustomH(e.target.value)}
          placeholder="H"
          className="w-14 rounded-full border border-white/20 bg-transparent py-1.5 text-center text-sm text-white"
        />
        <button
          onClick={handleCustomApply}
          disabled={isApplyDisabled}
          className="rounded-full bg-[#18E299] px-4 py-1.5 text-sm font-medium text-[#0d0d0d] transition-colors disabled:opacity-40"
        >
          ✓
        </button>
      </>
    )}
  </div>
  ```

- [ ] **Step 2: Type-check**

  ```bash
  cd src/client && pnpm typecheck
  ```

  Expected: no errors.

- [ ] **Step 3: Lint**

  ```bash
  cd src/client && pnpm lint
  ```

  Expected: no errors.

- [ ] **Step 4: Manual verification in browser**

  ```bash
  cd src/client && pnpm dev
  ```

  Open http://localhost:3000 and navigate through the camera → crop flow. Verify:

  1. Row shows four buttons: `4:3`, `16:9`, `1:1`, `Custom`
  2. Active preset is highlighted green; inactive presets are `text-white/60`
  3. Tap **Custom** → row swaps to `[W] : [H] [✓]`; row height unchanged
  4. Apply (✓) is disabled with empty inputs and with `W=0` or `H=0`
  5. Enter `W=3`, `H=2` → Apply enabled; tap Apply → cropper resets to 3:2, row reverts to preset view, no preset highlighted
  6. While in custom mode, tap `16:9` → custom inputs disappear, `16:9` highlighted, cropper updates

- [ ] **Step 5: Commit**

  ```bash
  git add src/client/app/\(main\)/crop/page.tsx
  git commit -m "feat(crop): add custom ratio inline input to selector row"
  ```
