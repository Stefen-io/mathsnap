# Figma Make — S-11 Pre-flight Answers + Round 1 Go-ahead

> **Use:** Paste the entire block below into Figma Make as the reply to its S-11 + S-10 pre-flight report.

---

## Round 1 — Reply to Pre-flight Report

Pre-flight excellent — caught real conflicts (OCR.tsx state.latex refactor, mockOcrService schema extension, color drift FIGMA_PROMPT vs codebase) plus 10 specific questions. Answers below. **Use these as the source of truth from this point on.**

### Answers to Section C — Open Questions

1. **OCR.tsx state.latex on mount:** **Option (a)** — skip `mockOcrService.detect()` entirely and go straight to S-05 edit mode with the latex pre-filled. Reason: Manual input means user already chose latex; no reason to re-detect. Don't waste 1500ms simulating OCR.

2. **Mock LaTeX helper location:** **Extract to shared `renderLatexMock(latex: string): string` in `mockOcrService.ts`.** Both OCR.tsx (handleLatexChange) and Manual.tsx (real-time preview) consume it. DRY.

3. **S-10 trigger condition:** **Both — toggle + field, layered.**
   - `SHOULD_RETURN_FAIL = true` toggle controls whether to populate
   - When true, response carries `error?: string` field with value e.g., `"OCR_FAIL"`
   - OCR.tsx checks `result.error` (presence) to render fail state — `error` field is the contract, toggle is the dev switch

4. **Empty-state preview message:** **"Bắt đầu nhập để xem preview"** in `text-[14px] text-[#888888] text-center`. Clear instruction, matches Vietnamese verbosity convention elsewhere.

5. **Textarea max-length:** **No hard limit (no `maxLength` attribute).** PRD doesn't specify; real LaTeX can be 200-300 chars easily. If exceeds reasonable length later, add character counter — defer.

6. **Re-entry behavior:** **Stateless — fresh textarea on each mount.** Match OnboardingOverlay pattern. No localStorage, no Context. User-friendly: each manual entry is intentional, don't accidentally auto-fill stale latex.

7. **Submit destination from S-11:** **`/ocr` with `state.latex`.** Per PRD FR-1c AC: "Then hệ thống chuyển sang S-05" — and S-05 is consolidated into OCR.tsx in Figma Make. User benefits from the OCR.tsx edit interface (LaTeX textarea + preview card) before solving. Don't skip directly to `/solution`.

8. **S-10 error surface styling:** **Red-50 (`bg-[#fef2f2] border border-[#fecaca]`).** FIGMA_PROMPT.md's "yellow warning chip" was for inline LaTeX validation (non-blocking edit-time warning), NOT OCR Fail. Different contexts. OCR Fail is a hard failure → red signal.

9. **S-10 "Thử lại" behavior:** **Calls `mockOcrService.detect()` again with same state.** No navigation back to /camera (that would lose context + force re-capture). In mock, retry just re-triggers `SHOULD_RETURN_FAIL` → still fails. Production will eventually hit a real retry endpoint with stored image ref.

10. **Sticky preview in S-11:** **YES — sticky `top-16 z-10` (below top-bar).** Brief specifically says sticky to keep preview visible while typing long formulas. Without sticky, preview scrolls off when textarea grows.

### Confirmations & Overrides for Section D — Assumptions

| # | Assumption | Decision |
|---|---|---|
| D1 | Route path `/manual` | ✅ Confirm |
| D2 | Top bar `h-16`, back button `w-11 h-11` with `focus-visible:ring-2 ring-black/20` | ✅ Confirm — match ProblemSelector exactly |
| D3 | Textarea fixed `h-[200px]` resize-none | ✅ Confirm — taller than OCR.tsx (120px) is right because manual input is from-scratch typing, often longer than OCR-edit |
| D4 | Preview block sticky `top-16`, `bg-[#fafafa] border-black/5 rounded-[16px] p-6`, `min-h-[120px]` | ✅ Confirm |
| D5 | Empty-state placeholder text | ✅ Confirm — see C4 |
| D6 | Mock render mappings list | ✅ Confirm — keep proposed regex list. Add one more: `\\cdot` → `·` (common in vector products) |
| D7 | Submit `navigate("/ocr", { state: { latex } })` | ✅ Confirm — see C7 |
| D8 | `bg-[#0d0d0d]` pill, disabled `bg-[#e5e5e5] text-[#888888]` | ✅ Confirm |
| D9 | `latex.trim().length === 0` for disabled | ✅ Confirm — trim to handle whitespace-only input |
| D10 | Container `max-w-[640px] mx-auto` | ✅ Confirm |
| D11 | Atmospheric gradient yes | ✅ Confirm |
| D12 | Stateless re-entry | ✅ Confirm — see C6 |
| D13 | `SHOULD_RETURN_FAIL` toggle, default false | ✅ Confirm |
| D14 | Add `error?: string` field to OcrResponse | ✅ Confirm |
| D15 | S-10 card red-50 styling | ✅ Confirm — see C8 |
| D16 | S-10 "Thử lại" calls detect() again | ✅ Confirm — see C9 |
| D17 | S-10 layout 3 exits stacked `flex flex-col gap-3` | ✅ Confirm |
| D18 | S-11 layout specifics (top-bar relative, preview sticky, textarea regular flow, sticky bottom CTA) | ✅ Confirm |
| D19 | `autoFocus` attribute on textarea | ✅ Confirm |

### Resolutions for Section E — Conflicts

- **E1 — OCR.tsx state.latex refactor:** Resolution = exactly as you proposed. **One critical syntax fix:** `useLocation()` is a React hook — must be called at component top level, NOT inside `useEffect`. Your proposed snippet has `const location = useLocation();` inside the useEffect callback, which violates Rules of Hooks. Correct pattern:
  ```tsx
  // At top of OCR component, BEFORE useEffect:
  const location = useLocation();
  
  useEffect(() => {
    const incomingLatex = (location.state as { latex?: string } | null)?.latex;
    
    if (incomingLatex) {
      setLatex(incomingLatex);
      setRenderedFormula(renderLatexMock(incomingLatex));
      setLoading(false);
    } else {
      loadOcrResult();
    }
  }, [location.state, navigate]);
  ```
  Note `location.state` in dep array (not just `navigate`), and type assertion for safety.

- **E2 — mockOcrService schema extension:** Resolution = exactly as you proposed. Add `error?: string` to OcrResponse, add `SHOULD_RETURN_FAIL` toggle, `renderLatexMock` helper as exported function. Default `SHOULD_RETURN_FAIL = false`, default `SHOULD_RETURN_MULTIPLE` = whatever you currently have (don't flip it as part of S-11 work — keep S-14 behavior intact).

- **E3 — FormulaItem schema:** No conflict — Manual flow passes plain `{ latex: string }` (not FormulaItem). FormulaItem stays multi-formula specific. ✅

- **E4 — Color drift FIGMA_PROMPT vs codebase:** Codebase is source of truth. Use mint `#18E299` everywhere. FIGMA_PROMPT.md's emerald `#10B981` is documentation drift — don't propagate. ✅

- **E5 — No routing conflict:** S-11 `/manual` registers as sibling of `/camera`/`/ocr`/`/problem-selector`. ✅

### Refinements to Section F — Reuse vs Build

Your plan is correct. One small refinement:

**Reuse (in addition to your list):**
- `useRef<HTMLTextAreaElement>` for autofocus fallback (in case `autoFocus` attribute doesn't fire reliably in some browsers — useEffect + ref.current.focus() as backup)

**Build new (confirmed):**
- `src/app/screens/Manual.tsx` ✅
- S-10 error state INSIDE OCR.tsx ✅ (not separate file)

**Do NOT create:**
- ❌ Separate `/ocr-fail` route
- ❌ `OcrError.tsx` component file  
- ❌ Wrapper for button/textarea (keep inline)

### Refinements to Section G — Routing & State

Your plan is solid. The only fix is the `useLocation` placement (see E1 above). Otherwise:

- ✅ Route registration line in routes.tsx
- ✅ Manual.tsx submit → `navigate("/ocr", { state: { latex: latex.trim() } })`
- ✅ Home.tsx onClick wire-up
- ✅ S-10 trigger via `result.error` field check
- ✅ S-10 "Nhập thủ công" exit → `navigate("/manual")`
- ✅ S-10 "Hủy" exit → `navigate("/")`

**Files modified (final list):**
- `src/app/routes.tsx` (add 1 route)
- `src/app/screens/Home.tsx` (add onClick to existing button + import useNavigate if not already)
- `src/app/screens/OCR.tsx` (refactor useEffect for state.latex, add error state UI, import renderLatexMock from mockOcrService)
- `src/services/mockOcrService.ts` (extend schema, add toggle, add renderLatexMock export)

**Files created:**
- `src/app/screens/Manual.tsx`

### Refinements to Section H — Mock Service

Your plan is correct. One clarification on toggle precedence:

**When both toggles are true** (`SHOULD_RETURN_FAIL=true` AND `SHOULD_RETURN_MULTIPLE=true`), the **fail check takes precedence** (your proposed code already does this — checks fail first). Document this explicitly in the file:

```ts
const SHOULD_RETURN_FAIL = false;     // takes precedence over SHOULD_RETURN_MULTIPLE
const SHOULD_RETURN_MULTIPLE = false; // ignored if SHOULD_RETURN_FAIL is true
```

Add brief inline comment explaining the precedence so a future dev doesn't accidentally enable both expecting different behavior.

**Sample renderLatexMock final signature:**

```ts
export function renderLatexMock(latex: string): string {
  if (!latex || latex.trim().length === 0) return ""; // empty input → empty preview
  
  let result = latex;
  // Common LaTeX → Unicode replacements
  if (result.includes("\\int")) return "∫₀¹ x² dx"; // simplified for mock
  if (result.includes("\\sqrt")) return "√x";
  result = result.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, "$1/$2");
  result = result.replace(/\^(\d)/g, (_, n) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(n)] || `^${n}`);
  result = result.replace(/_(\d)/g, (_, n) => "₀₁₂₃₄₅₆₇₈₉"[Number(n)] || `_${n}`);
  result = result.replace(/\\sum/g, "∑");
  result = result.replace(/\\pi/g, "π");
  result = result.replace(/\\infty/g, "∞");
  result = result.replace(/\\cdot/g, "·"); // added per D6
  return result;
}
```

Note `Number(n)` cast — string indexing on Unicode subscripts/superscripts needs numeric index, not string.

---

## Green-light: Proceed with Round 1 — Wireframe Only

You may now begin **Round 1**. Constraints:

- **Wireframe only.** Black/white/grays. No mint, no atmospheric gradient yet.
- **Focus on:** layout structure, top-bar back button, sticky preview block, textarea with auto-focus, sticky bottom "Xác nhận" CTA, S-10 error UI inside OCR.tsx with 3 stacked exits, OCR.tsx state.latex refactor (with `useLocation` at top level), mockOcrService schema extension + `renderLatexMock` helper, Home.tsx onClick wire-up, route registration.
- **Use placeholder shapes** for chevrons (`[<]` text), AlertCircle icon (`[!]` text). Round 3 swaps to Lucide icons.
- **Trace this end-to-end at the end of Round 1** and report:
  1. Click Home "Nhập công thức thủ công" → `/manual` ✓ Manual.tsx renders with empty textarea, auto-focused
  2. Type `\int_0^1 x^2 dx` → preview re-renders to `∫₀¹ x² dx` (or similar via renderLatexMock)
  3. Click "Xác nhận" → `/ocr?state.latex=...` → OCR.tsx skips detection, shows latex in textarea + preview
  4. Click "Giải bài này" → `/solution` with state → Solution displays correctly
  5. Toggle `SHOULD_RETURN_FAIL=true` → /camera → /crop → /ocr → S-10 error UI shows with 3 exits
  6. From S-10, click "Nhập thủ công" → /manual → can type and submit normally

After Round 1 done, report changes per-file with line numbers (same format as S-12/S-14 rounds). Then **stop and wait** for my approval before Round 2.

If during Round 1 you spot a new conflict or question, **stop and ask** — same protocol as pre-flight.
