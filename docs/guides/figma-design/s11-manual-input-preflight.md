# Figma Make — Pre-flight Prompt for S-11 Manual LaTeX Input

> **Purpose:** Run THIS prompt in Figma Make **before** the build prompts. Same workflow as S-12 and S-14. Surface uncertainties + cross-check the brief against existing code.
>
> **How to use:** Paste the entire block below into Figma Make → it returns structured Q&A → copy back to me → I patch + send Round 1 build prompt.

---

## Pre-flight: Context Check Before Building S-11 Manual LaTeX Input

You are going to build a new screen for MathSnap — the **S-11 Manual LaTeX Input** — a full-screen push route where users type LaTeX directly with real-time preview, then confirm to advance to the formula edit / solve flow. This pre-flight also bundles a **secondary deliverable: add S-10 OCR Fail error state to OCR.tsx with 3 exits**, because S-11 is the "Nhập thủ công" exit target from S-10. **DO NOT WRITE OR DESIGN ANYTHING YET.** Read the project, cross-check the brief, surface every unclear point.

### Step 1 — Read these files first (in order)

**Design system & global:**
1. `guidelines/DESIGN.md`
2. `src/styles/theme.css`
3. `src/styles/fonts.css`

**Routing & layout:**
4. `src/app/routes.tsx` — S-11 will become a new full-screen route, like `/camera`, `/crop`, `/ocr`, `/problem-selector`
5. `src/app/App.tsx`
6. `src/app/components/BottomNav.tsx` — to confirm S-11 is NOT a tab root, no bottom nav

**Existing flow context (most critical):**
7. `src/app/screens/Home.tsx` — entry point #1. Currently has a "Nhập công thức thủ công" button without an `onClick` handler (lines 44-46). Must wire this up.
8. `src/app/screens/OCR.tsx` — entry point #2 substrate. Currently has only `loading` + `success` states. Need to add an OCR Fail state here (S-10 in PRD) with 3 exits, one of which is "Nhập thủ công" → navigate to `/manual`.
9. `src/services/mockOcrService.ts` — needs a new toggle/path to return OCR-fail simulation so we can develop & demo the error state.
10. `src/app/screens/Solution.tsx` — downstream. After S-11 confirms, latex flows toward Solution. Understand the route-state pattern already in place.

**Reusable primitives:**
11. `src/app/components/ui/textarea.tsx` (if exists) — likely reusable for the LaTeX input field
12. `src/app/components/ui/button.tsx`

**Recently built (for consistency reference):**
13. `src/app/components/OnboardingOverlay.tsx` — Tailwind hex pattern, motion/react usage
14. `src/app/screens/ProblemSelector.tsx` — top-bar back button pattern, atmospheric gradient, focus rings

**Master prompt:**
15. `src/imports/FIGMA_PROMPT.md`

**Package.json:**
16. `package.json` — confirm motion/react, lucide-react versions; LaTeX rendering library still NOT installed (we use the `font-serif italic` mock pattern, same as OCR.tsx and Solution.tsx)

### Step 2 — Read the design intent below

**S-11 Manual LaTeX Input — purpose:** Fallback when user wants to type LaTeX directly (instead of OCR). Reached from: (a) S-01 Home "Nhập công thức thủ công" button, (b) S-10 OCR Fail "Nhập thủ công" exit. Per PRD FR-1c.

**Confirmed design decisions (from upstream user research):**

1. **Layout: Preview top (sticky) + textarea below.** Match the existing OCR.tsx visual pattern — formula card stays at top, edit area below. As user types, preview re-renders live. Sticky preview keeps result visible while typing long formulas (won't be hidden by keyboard).

2. **Auto-focus textarea on mount.** Per PRD AC: "Then ô nhập liệu ở trạng thái rỗng và bàn phím được kích hoạt tự động." Use `autoFocus` attribute or `useRef + .focus()` in useEffect.

3. **Real-time preview rendering.** Same `font-serif italic text-[#0d0d0d]` mock pattern as OCR.tsx (no KaTeX). Apply minimal mock rendering helper (e.g., `\\int` → `∫`, `\\frac{a}{b}` → simple stacked notation, `^2` → superscript) — keep it pragmatic, not full LaTeX parser.

4. **Submit "Xác nhận" disabled when textarea empty.** Per PRD AC. When non-empty + valid syntax → navigate to next screen with the latex.

5. **Submit destination: `/ocr` with state.latex (single-formula path).** Reuse the existing route-state pattern that ProblemSelector → Solution already uses. OCR.tsx already supports backward-compatible state reading. We need OCR.tsx to ALSO recognize: if `location.state.latex` is set on mount, skip detection and go straight to S-05 mode (formula preview & edit) with that latex pre-filled. This avoids creating a new `/preview` route.

6. **Bundled work: S-10 OCR Fail state in OCR.tsx with 3 exits.** Per PRD S-10 spec — OCR Fail variant has 3 exits: "Thử lại" (re-runs detection), "Nhập thủ công" (navigates to `/manual`), "Hủy" (back to `/`). Trigger: when `mockOcrService.detect()` returns empty/error response. Add a dev toggle `SHOULD_RETURN_FAIL = false` (default false; flip to test the error UI).

**Aesthetic direction:** Editorial, calm, mint-minimal — same vibe as Home, OnboardingOverlay, ProblemSelector. Brand mint `#18E299`, primary `#0d0d0d`, body `#666666`, tertiary `#888888`. Atmospheric gradient at top of S-11 screen. Reuse top-bar pattern from ProblemSelector (back chevron + centered title, `relative px-6 pt-safe h-16`, no sticky/no border).

**Layout sketch S-11:**
- Top bar: Back chevron (left) + "Nhập công thức" title (center)
- Preview block (sticky just below top bar): empty state placeholder when textarea empty ("Bắt đầu nhập để xem preview"), or rendered LaTeX when not empty. Use `bg-[#fafafa] border border-black/5 rounded-[16px] p-6` — matches OCR.tsx formula display card.
- Textarea below preview: `bg-white border border-black/10 rounded-[16px] p-4 font-mono text-[14px] text-[#0d0d0d]`, height ~200px, focus ring mint `#18E299`. Match OCR.tsx textarea exactly (lines 87-91).
- Sticky bottom: Single primary "Xác nhận" CTA, disabled when empty. Match OCR.tsx primary button styling (lines 105-116).
- No secondary CTA (no "Quay lại" — back chevron handles that).

**Layout sketch S-10 OCR Fail (within OCR.tsx):**
- Replace the success state (loading=false branch) with an error variant when detection fails
- Top: same source image thumbnail (line 52-58)
- Center: error card — `bg-[#fef2f2] border border-[#fecaca] rounded-[16px] p-8` (red-50 surface like PRD spec hints), with a Lucide `AlertCircle` icon mint-grayed out, message "Không nhận diện được công thức.", helper "Thử chụp lại với góc rõ hơn, hoặc nhập thủ công."
- 3 exits stacked vertically with 12px gap inside `bg-white` action panel (similar bottom-sheet feel):
  1. **Thử lại** — primary CTA `bg-[#0d0d0d] text-white rounded-full h-12 shadow-[0_1px_2px_rgba(0,0,0,0.06)]` — calls `mockOcrService.detect()` again
  2. **Nhập thủ công** — secondary `bg-white border border-black/5 rounded-full h-12` — `navigate("/manual")`
  3. **Hủy** — text-only `text-[#666666] hover:text-[#0d0d0d] text-[15px] h-11` — `navigate("/")`

**Constraints:** mobile-first 375px baseline, light mode, i18n-ready strings, safe-area aware, no animation libraries beyond `motion/react`.

### Step 3 — Return a structured pre-flight report

Respond using **exactly** this Markdown structure. Be specific — quote file paths, token names, line numbers when possible.

```
## A. Files I Read
[List each file you actually opened. If a file in Step 1 doesn't exist, say so.]

## B. Existing Conventions That Will Constrain S-11 + S-10
[List rules/tokens/patterns from the codebase. E.g.:
- Existing textarea pattern in OCR.tsx (lines 87-91) — quote exact className
- Existing primary button pattern (OCR.tsx lines 105-116, OnboardingOverlay similar) — quote className
- Top-bar back button pattern (ProblemSelector lines 44-50) — quote
- Atmospheric gradient pattern — quote
- Mock LaTeX render helper (OCR.tsx handleLatexChange, lines 38-46) — quote logic
- Route registration pattern in routes.tsx (lines 92-114) — quote
- Route state passthrough pattern (ProblemSelector handleSelect line 29-31) — quote
- Z-index hierarchy (BottomNav 50, Onboarding 60, OCR sticky 20, Solution row 30)
- focus ring styling (OnboardingOverlay primary button, ProblemSelector card)]

## C. Open Questions I Need Answered Before Building
[Numbered, specific, 1-sentence-answerable. Examples:
- "When OCR.tsx receives state.latex on mount, should it set the textarea to that latex AND skip mockOcrService.detect()? Or run detect() anyway and overwrite if state.latex exists?"
- "Mock LaTeX render helper: should it live in OCR.tsx (current) or be extracted to mockOcrService.ts (shared with S-11)?"
- "S-10 trigger condition: when mockOcrService.detect() returns empty latex, when SHOULD_RETURN_FAIL toggle is true, or based on a 5-second timeout?"
- "Empty-state preview message: 'Bắt đầu nhập để xem preview' or 'Preview sẽ xuất hiện ở đây' or skip the empty-state placeholder entirely (just blank space)?"
- "Should textarea have a max-length limit? (PRD doesn't specify)"
- "Re-entry behavior: if user types something, then back-navigates and returns, should the textarea preserve content? (Match Onboarding's stateless behavior — fresh on each entry)"]

## D. Assumptions I Will Make If You Don't Override
[Numbered. Cover:
- Route path: `/manual`
- Top-bar height h-16, back button 44×44 with focus ring
- Textarea height (200px? 240px?), height auto-grow vs fixed
- Preview block dimensions, padding
- Empty-state placeholder text + styling
- Mock LaTeX render mappings (which patterns map to which Unicode)
- Submit action: navigate("/ocr", { state: { latex } })
- "Xác nhận" button: same bg-[#0d0d0d] pill, disabled state styling (bg-[#e5e5e5] text-[#888888])
- Disabled-when-empty logic: trim() check or just length check
- Container max-w-[640px] mx-auto on desktop (match OCR.tsx)
- Atmospheric gradient yes
- Re-entry: textarea is fresh on each mount (no preservation)
- S-10 trigger: SHOULD_RETURN_FAIL toggle (analog of SHOULD_RETURN_MULTIPLE)
- S-10 fixture: empty latex + a flag in OcrResponse (e.g., add `error?: string` field)
- S-10 layout exact dimensions]

## E. Conflicts Between Brief and Codebase
[Where the brief contradicts existing patterns. If none, write "None."
Specifically check:
- Does OCR.tsx already handle state.latex on mount? If not, this is a refactor.
- Does mockOcrService have a way to return error/empty? Likely needs schema extension.
- Does the existing FormulaItem schema accommodate manual input flow, or is it only for multi-formula?]

## F. Components I Plan to Reuse vs. Build New
**Reuse:** [list]
**Build new (justify each):** [list — likely just `Manual.tsx`. The S-10 error state is INSIDE OCR.tsx, not a separate file.]

## G. Routing & State Integration Plan
[Specifics:
- Route registration line in routes.tsx
- How Manual.tsx pushes to /ocr with state.latex
- How OCR.tsx detects state.latex on mount and skips detection
- How S-10 within OCR.tsx triggers (toggle? dev flag?)
- How S-10 "Nhập thủ công" exit pushes to /manual
- Files modified, files created]

## H. Backend / Mock Service Plan
[How will mockOcrService be extended:
- Schema change: add optional `error?: string` to OcrResponse?
- Add SHOULD_RETURN_FAIL dev toggle
- Default value (false to keep S-14 multi-formula path active for testing)
- How to switch between toggles for dev]

## I. What I Will NOT Do Until You Confirm
[Restate: no code, no edits until I reply]
```

### Step 4 — Wait

After returning the pre-flight report, **stop**. Do not proceed to wireframes. Wait for my reply with answers, override confirmations, and conflict resolutions.

---

**Why this matters:** S-11 looks simple but bundles a real OCR.tsx refactor (state.latex handling) + a brand new S-10 error UI with 3 exits + mock service schema extension. That's 3 cross-cutting concerns in one round. Cheap pre-flight catches the routing logic + mock toggle decisions BEFORE wireframe — saves a rebuild round.
