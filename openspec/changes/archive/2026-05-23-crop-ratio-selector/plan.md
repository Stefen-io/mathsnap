# Crop Ratio Selector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 preset aspect ratio buttons (4:3, 16:9, 1:1) to the crop screen so users can choose how to crop their photo before submitting it for OCR.

**Architecture:** Single state variable (`aspect: number`) added to `CropPage`. A new selector row (between cropper and action buttons) renders 3 pill buttons; selecting one calls a handler that updates `aspect` and resets `crop`+`zoom` to avoid invalid post-switch positions. No new files, no new packages.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, react-easy-crop v5.5.7

---

### Task 1: Add aspect state and handler

**Files:**
- Modify: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Add `aspect` state after the existing `croppedAreaPixels` state**

Open `src/client/app/(main)/crop/page.tsx`. The current state block ends at line 15. Add one new state line:

```tsx
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
const [aspect, setAspect] = useState<number>(4 / 3)   // ← add this
```

- [ ] **Step 2: Add `handleAspectChange` after the `onCropComplete` callback**

`onCropComplete` is defined at line 30. Add the handler immediately after it (no `useCallback` needed — it only reads/sets state):

```tsx
const onCropComplete = useCallback((_: Area, pixels: Area) => {
  setCroppedAreaPixels(pixels)
}, [])

function handleAspectChange(newAspect: number) {
  setAspect(newAspect)
  setCrop({ x: 0, y: 0 })
  setZoom(1)
}
```

- [ ] **Step 3: Replace the hardcoded `aspect={4 / 3}` prop with the state variable**

In the `<Cropper>` JSX (currently line 56), change:

```tsx
aspect={4 / 3}
```

to:

```tsx
aspect={aspect}
```

- [ ] **Step 4: Run typecheck to confirm no errors**

```bash
cd src/client && pnpm typecheck
```

Expected: exits 0, no errors mentioning `crop/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/client/app/\(main\)/crop/page.tsx
git commit -m "feat(crop): add aspect state and handleAspectChange handler"
```

---

### Task 2: Add ratio selector UI row

**Files:**
- Modify: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Define the preset config array above the return statement**

Add this constant just before `if (!capturedBlob || !imageUrl) return null`:

```tsx
const RATIO_PRESETS = [
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '1:1', value: 1 },
] as const
```

- [ ] **Step 2: Insert the selector row between the cropper div and the action buttons div**

The current JSX structure is:

```tsx
<div className="flex h-dvh flex-col bg-black">
  {/* Crop area */}
  <div className="relative flex-1">
    <Cropper ... />
  </div>

  {/* Action buttons */}
  <div className="flex gap-3 px-6 py-6">
```

Add the selector row between those two divs:

```tsx
<div className="flex h-dvh flex-col bg-black">
  {/* Crop area */}
  <div className="relative flex-1">
    <Cropper ... />
  </div>

  {/* Ratio selector */}
  <div className="flex justify-center gap-2 py-3">
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
  </div>

  {/* Action buttons */}
  <div className="flex gap-3 px-6 py-6">
```

- [ ] **Step 3: Run typecheck**

```bash
cd src/client && pnpm typecheck
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/client/app/\(main\)/crop/page.tsx
git commit -m "feat(crop): add ratio selector row with 4:3, 16:9, 1:1 presets"
```

---

### Task 3: Manual verification

**Files:** (none changed — read-only verification)

- [ ] **Step 1: Start the dev server**

```bash
cd src/client && pnpm dev
```

Open http://localhost:3000 in a mobile-sized viewport (e.g. Chrome DevTools → iPhone 14 Pro, 393×852).

- [ ] **Step 2: Navigate to the crop screen**

Use the app's camera flow to capture or upload a photo. You should arrive at `/crop`.

Expected: three pill buttons `4:3 · 16:9 · 1:1` visible between the crop canvas and the Hủy/Xác nhận buttons. `4:3` is highlighted in brand green; the other two are muted white.

- [ ] **Step 3: Switch to 16:9**

Tap `16:9`.

Expected:
- `16:9` button turns brand green (#18E299), `4:3` becomes muted
- Crop box immediately resizes to 16:9 proportions
- Crop position resets to center (no leftover offset from the previous 4:3 position)
- Zoom resets to 1 (no leftover zoom)

- [ ] **Step 4: Switch to 1:1**

Tap `1:1`.

Expected:
- `1:1` button turns brand green, others muted
- Crop box resizes to square, position and zoom reset

- [ ] **Step 5: Confirm crop**

With any ratio selected, tap `Xác nhận`.

Expected: app navigates to `/ocr` and the OCR screen receives a correctly cropped image (not a black or empty blob).

- [ ] **Step 6: Final typecheck**

```bash
cd src/client && pnpm typecheck
```

Expected: exits 0.
