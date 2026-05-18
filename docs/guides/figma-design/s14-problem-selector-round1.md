# Figma Make — S-14 Pre-flight Answers + Round 1 Go-ahead

> **Use:** Paste the entire block below into Figma Make as the reply to its S-14 pre-flight report. Contains direct answers to every Open Question, confirm/override for each Assumption, resolution for each Conflict, and the green-light to proceed with Round 1 wireframe.

---

## Round 1 — Reply to S-14 Pre-flight Report

Pre-flight excellent — caught 3 real conflicts (no KaTeX, no service layer, Solution.tsx breaking change risk) plus 10 specific questions. Here are the answers. **Use these as the source of truth from this point on; they override anything in my original brief that conflicts.**

### Answers to Section C — Open Questions

1. **Back navigation target:** `/ocr` (re-run detection step). User can re-edit LaTeX or back-back to `/crop` if rescan needed. Don't skip directly to `/camera`.

2. **Data passing mechanism:** **React Router state via `navigate("/route", { state })`**. Simplest, doesn't require Context for one-time data flow. Pattern: OCR.tsx pushes `{ state: { formulas } }` → S-14 reads `useLocation().state.formulas` → S-14 pushes `{ state: { latex } }` to Solution.

3. **S-14 → Solution data pass:** Same mechanism (route state). Pass `{ latex: selected.latex }`. Don't pass full FormulaItem — Solution doesn't need the label, only the latex string.

4. **Multi-formula detection trigger:** **Code-level dev toggle inside `mockOcrService.ts`**: a `const SHOULD_RETURN_MULTIPLE = true;` constant at the top of the file. Easy to flip during dev/testing without touching UI. When real backend lands, this becomes server logic.

5. **Index badge format:** `"01 / 03"` (zero-padded, with spaces around `/`, mono font). Matches existing mono badge convention from Solution.tsx step badges.

6. **Auto-detected label source:** **Hardcoded labels per fixture in mock service.** Don't build a classifier from latex string patterns — labels come directly bundled with each FormulaItem in the mock fixtures. Future real backend will compute server-side. Cleaner separation: frontend just renders what it's given.

7. **Maximum formula count:** **No hard cap.** Mock returns 3, UI handles any number via vertical scroll. Don't add a "show more / show all" affordance — just scroll. If real OCR ever returns 20+, that's a UX issue we'll address with empirical data, not pre-optimize now.

8. **Atmospheric gradient:** **YES** — same `bg-gradient-to-b from-[#d4fae8]/40 via-white to-white` as Home/Onboarding. Editorial vibe consistency. S-14 sits in the main solve flow which inherits the brand canvas.

9. **Top bar back button style:** **Proper back chevron icon button** (`<ChevronLeft size={20} />` in 44×44 touch target with `hover:bg-black/5 rounded-full`). Don't use a text link like OCR's "Chụp lại" — that's a flow-restart action, not navigation back.

10. **Card tap animation:** **`motion.button` with `whileTap={{ scale: 0.98 }}`** for press feedback. Match the primary button pattern from OnboardingOverlay. Add `transition-all duration-75` for smooth opacity + scale.

### Confirmations & Overrides for Section D — Assumptions

| # | Assumption | Decision |
|---|---|---|
| D1 | Card: `bg-white rounded-[16px] border-black/5 shadow-[0_2px_4px_rgba(0,0,0,0.03)]` | ✅ Confirm — matches Solution step cards exactly |
| D2 | Card as `<button>`, full-width, hover `bg-[#fafafa]`, active `bg-black/5`, transition-colors | ✅ Confirm |
| D3 | Card padding `px-6 py-5`, ~64-80px height | ✅ Confirm |
| D4 | Gap-3 (12px) between cards | ✅ Confirm |
| D5 | Touch target ≥ 64px including padding | ✅ Confirm |
| D6 | Index badge: `bg-[#fafafa] border-black/5 text-[#666666] text-[12px] font-mono uppercase tracking-[0.6px] font-semibold px-2 py-1 rounded` | ✅ Confirm — match Solution step badges |
| D7 | Badge format `"01 / 03"` (zero-padded, spaced) | ✅ Confirm |
| D8 | Label: `text-[14px] font-medium text-[#333333]` | ⚠️ **Override** → `text-[16px] font-semibold text-[#0d0d0d] tracking-[-0.2px]`. Label is the primary identifier of the card; deserves stronger weight + exact primary hex. Match Home.tsx feature card title pattern. |
| D9 | LaTeX preview: `font-serif italic text-[20px] text-[#0d0d0d]` centered in `bg-[#fafafa] border-black/5 rounded-[12px] p-4 mt-3` | ✅ Confirm — match existing Solution serif italic mock pattern (no KaTeX) |
| D10 | Chevron: `<ChevronRight size={20} className="text-[#888888]" />` absolute top-right with 24px inset | ✅ Confirm |
| D11 | Top bar `h-16` | ✅ Confirm |
| D12 | Back button: chevron 44×44 in `hover:bg-black/5 rounded-full transition-colors` | ✅ Confirm |
| D13 | Title: `text-[18px] font-semibold text-[#0d0d0d] tracking-tight`, center | ✅ Confirm |
| D14 | Top bar: `sticky top-0 bg-white/80 backdrop-blur-md border-b border-black/5 z-10 px-6 pt-safe` | ⚠️ **Override** → drop `sticky`, drop `backdrop-blur-md`, drop `border-b`. Top bar renders flat inside the gradient (`bg-transparent`), no sticky behavior. The atmospheric gradient is the visual anchor; backdrop-blur fights with it. List scrolls under the top bar without freeze. Position: `relative px-6 pt-safe`. |
| D15 | Subtitle: `text-[15px] text-[#666666] text-center max-w-[400px] mx-auto` | ⚠️ **Override** → `text-[14px] text-[#666666] text-center max-w-[360px] mx-auto leading-[1.5]`. Tighter, doesn't compete with card labels. |
| D16 | List container: `px-6 pb-[48px]` | ✅ Confirm |
| D17 | `overflow-y-auto scrollbar-hide` | ✅ Confirm |
| D18 | Atmospheric gradient yes | ✅ Confirm |
| D19 | 3 mock fixtures with proposed formulas | ⚠️ **Refine** → keep 3 fixtures but tweak content to demonstrate variety (algebra, calculus, derivatives — different student domains): `{ latex: "x^2 + 5x + 6 = 0", label: "Phương trình bậc hai" }` · `{ latex: "\\int_{0}^{1} x^{2} \\, dx", label: "Tích phân xác định" }` · `{ latex: "\\frac{d}{dx}(\\sin x)", label: "Đạo hàm" }`. Use raw LaTeX in the data; render as Unicode-like serif italic in the card (mock pattern). |
| D20 | Hardcoded label classifier from latex pattern | ❌ **Override** → labels come bundled with the fixture, **not computed**. Mock service returns `{latex, label}` pairs as-is. No classifier logic in frontend. |
| D21 | Route path `/problem-selector` | ✅ Confirm |
| D22 | Route state via `navigate(path, { state })` | ✅ Confirm |
| D23 | S-14 reads via `useLocation().state` typed as `{ formulas: FormulaItem[] }` | ✅ Confirm. Add a guard: if `state.formulas` is missing/empty, navigate back to `/ocr` to avoid white screen on direct URL access. |
| D24 | S-14 → Solution: `navigate("/solution", { state: { latex } })` | ✅ Confirm — pass only `latex`, not the whole FormulaItem |
| D25 | Back nav goes to `/ocr` | ✅ Confirm |
| D26 | No localStorage/sessionStorage | ✅ Confirm |
| D27 | Selection not persisted across back-and-return | ✅ Confirm |
| D28 | Mobile-first 375px baseline | ✅ Confirm |
| D29 | Desktop `max-w-[640px] mx-auto` like OCR | ✅ Confirm |
| D30 | `pt-safe` top bar, no bottom safe-area needed | ✅ Confirm |

### Resolutions for Section E — Conflicts

- **E1 — LaTeX rendering expectation:** Resolution = **stay with the existing mock pattern**. My brief used "KaTeX or similar" loosely; Figma Make correctly identified that Solution.tsx renders LaTeX as plain `font-serif italic` text with Unicode-like characters, and that no KaTeX/MathJax is in `package.json`. **Do NOT install KaTeX** for S-14. The S-14 cards render LaTeX previews using the same `font-serif italic` mock as Solution.tsx. When backend integration ships later, real LaTeX rendering becomes a separate change (not blocking S-14).
  - **Implementation note:** since fixtures store raw LaTeX (e.g., `"\\int_{0}^{1} x^{2} \\, dx"`), the card needs to display a Unicode-like preview. Either:
    - (a) bundle a `mockRenderLatex(latex: string): string` helper that maps known patterns to Unicode (e.g., `\int_{0}^{1}` → `∫₀¹`), OR
    - (b) store both raw latex AND pre-rendered Unicode in the fixture, e.g., `{ latex: "...", label: "...", preview: "∫₀¹ x² dx" }`.
  - **Decision: option (b)** — explicit `preview` field in fixture. Cleaner, no parsing logic in mock, matches the "frontend just renders what it's given" principle from C6/D20. Update `FormulaItem` type accordingly:
    ```ts
    interface FormulaItem {
      latex: string;    // raw LaTeX (passed to Solution)
      label: string;    // category name
      preview: string;  // Unicode-rendered preview for card display
    }
    ```

- **E2 — Data flow / no service layer:** Resolution = **create `src/services/mockOcrService.ts`** with typed `FormulaItem` and `OcrResponse` interfaces. Refactor OCR.tsx to use it instead of inline state. This is in-scope for S-14 because the contract is the dependency. Don't introduce a `src/types/ocr.ts` file — colocate types with the service file (export them from there). When real backend lands later, swap the mock implementation while keeping the same exported types.

- **E3 — Solution.tsx breaking change:** Resolution = **refactor Solution.tsx with backward-compatible fallback**:
  ```tsx
  const location = useLocation();
  const incomingLatex = (location.state as { latex?: string } | null)?.latex;
  const displayLatex = incomingLatex ?? "\\int_{0}^{1} x^{2} dx"; // fallback to existing mock
  ```
  This way: existing direct navigation `/ocr → /solution` still works (falls back to mock), and the new path `S-14 → /solution` passes selected latex via state. No visible break for users in single-formula path.

### Refinements to Section F — Reuse vs. Build

Your plan is good. Confirmations + 1 refinement:

**Reuse (confirmed):**
- Lucide icons: `ChevronLeft`, `ChevronRight` ✅
- `motion/react`: `motion.button` with `whileTap` ✅
- `clsx` for conditional className ✅
- Font patterns: `font-mono` for badges, `font-serif italic` for LaTeX preview ✅
- Exact Tailwind class strings from OnboardingOverlay top bar + Solution step cards + OCR primary button ✅

**Don't reuse shadcn Card / shadcn Button** ✅ — correct call. Custom inline styling matches existing screens.

**Build new (confirmed):**
- `src/app/screens/ProblemSelector.tsx` ✅
- `src/services/mockOcrService.ts` ✅ (this includes the type definitions; do NOT create a separate `src/types/ocr.ts`)
- ❌ **No** standalone `src/types/ocr.ts` — types live in the service file as exported interfaces

### Refinements to Section G — Routing & State Plan

Your plan is solid. Two refinements:

1. **Add direct-URL guard in ProblemSelector:** if user navigates directly to `/problem-selector` via URL (refresh, deep link, browser bookmark), `location.state` will be null → screen would crash. Add a `useEffect` that checks for `formulas` and navigates back to `/ocr` if missing:
   ```tsx
   useEffect(() => {
     if (!formulas || formulas.length === 0) {
       navigate("/ocr", { replace: true });
     }
   }, [formulas, navigate]);
   ```
   Replace mode prevents back-button loop.

2. **OCR.tsx refactor scope is in-scope for S-14**, not a separate change. The current inline mock at lines 13-16 must be replaced with `mockOcrService.detect()` because that's how S-14 gets triggered. Bundle this refactor into Round 1 wireframe.

### Refinements to Section H — Mock Service

Your plan is excellent. Two clarifications:

1. **Schema includes `preview` field** (per E1 resolution above):
   ```ts
   export interface FormulaItem {
     latex: string;
     label: string;
     preview: string;  // Unicode-rendered for card display
   }
   ```

2. **Sample fixture data (final)**:
   ```ts
   formulas: [
     {
       latex: "x^2 + 5x + 6 = 0",
       label: "Phương trình bậc hai",
       preview: "x² + 5x + 6 = 0",
     },
     {
       latex: "\\int_{0}^{1} x^{2} \\, dx",
       label: "Tích phân xác định",
       preview: "∫₀¹ x² dx",
     },
     {
       latex: "\\frac{d}{dx}(\\sin x)",
       label: "Đạo hàm",
       preview: "d/dx(sin x)",
     },
   ]
   ```

3. **Toggle behavior**: when `SHOULD_RETURN_MULTIPLE = false`, return the existing single-formula response (preserve current OCR behavior). When `true`, return the multi response. Default `true` during S-14 dev so we always exercise the new path:
   ```ts
   const SHOULD_RETURN_MULTIPLE = true;
   ```

---

## Green-light: Proceed with Round 1 — Wireframe Only

You may now begin **Round 1**. Constraints for this round:

- **Wireframe only.** No colors except black/white/grays. No mint accent yet, no atmospheric gradient yet (defer to Round 3).
- **Focus on:** layout structure, top-bar back button + title, subtitle, list of cards with index badge + label + LaTeX preview + chevron, scroll behavior, OCR.tsx refactor to use mockOcrService, multi-formula detection branching, navigation flow OCR → S-14 → Solution.
- **Mock service:** create `src/services/mockOcrService.ts` with the schema above and toggle `SHOULD_RETURN_MULTIPLE = true`. Render the 3 fixture formulas in the wireframe.
- **Use placeholder shapes** for chevrons (gray squares with text labels like `[<]` for back, `[>]` for card chevron). Do NOT render the final Lucide icons yet — Round 3 swaps them in.
- **No code beyond what Round 1 needs.** Don't pre-implement focus rings, animations, or polish.

After Round 1, **stop and wait**. Report changes per-file with line numbers (same format as S-12 rounds). I'll review the wireframe + verify the layout rhythm + the OCR refactor + the route flow before approving Round 2.

If during Round 1 you spot a new conflict or a question I missed, **stop and ask** — same protocol as the pre-flight.
