# Figma Make — Pre-flight Prompt for S-14 Problem Selector

> **Purpose:** Run THIS prompt in Figma Make **before** the build prompts. Same workflow as S-12: surface uncertainties + cross-check the brief against existing codebase before any wireframe work.
>
> **How to use:** Paste the entire block below into Figma Make → it returns a structured Q&A → copy the response back to me → I patch + send Round 1 wireframe prompt.

---

## Pre-flight: Context Check Before Building S-14 Problem Selector

You are going to design a new screen for MathSnap — the **S-14 Problem Selector** — a full-screen push route shown when OCR detects multiple formulas in one image, letting the user pick which to solve. **DO NOT WRITE OR DESIGN ANYTHING YET.** Your first job is to read the existing project, cross-check the brief against what's already built, and surface every unclear point so I can resolve them before you start.

### Step 1 — Read these files first (in this order)

**Design system & global:**
1. `guidelines/DESIGN.md`
2. `src/styles/theme.css`
3. `src/styles/fonts.css`

**Routing & layout:**
4. `src/app/routes.tsx` — S-14 will become a new full-screen route, similar to `/camera` `/crop` `/ocr`
5. `src/app/App.tsx`
6. `src/app/components/BottomNav.tsx` — to confirm S-14 is NOT a tab root, no bottom nav

**Existing flow context (most critical):**
7. `src/app/screens/OCR.tsx` — current OCR screen + mock service + transition to Solution. S-14 will branch off from here when multi-formula detected.
8. `src/app/screens/Solution.tsx` — where S-14 ultimately leads. Understand what data shape it expects.
9. `src/app/screens/Crop.tsx` — entry point INTO OCR. Understand back-navigation pattern.
10. `src/app/screens/Home.tsx` — visual style reference (already polished)
11. `src/app/screens/Settings.tsx` — section layout reference

**Reusable primitives:**
12. `src/app/components/ui/card.tsx` — likely reusable for problem cards
13. `src/app/components/ui/button.tsx`

**Master prompt:**
14. `src/imports/FIGMA_PROMPT.md`

**Recently built (for consistency):**
15. `src/app/components/OnboardingOverlay.tsx` — your last work, study Tailwind hex pattern
16. `src/app/components/OnboardingStep.tsx` — same

### Step 2 — Read the design intent below

**Screen purpose:** When OCR detects ≥ 2 formulas in one image, instead of jumping directly to S-05 with the first formula, show a list so the user picks which problem to solve. After selection → push to S-05 with that formula.

**Confirmed design decisions (from upstream user research):**

1. **Selection model: Single-select, tap = pick + advance.** No checkboxes, no "Confirm" button. One tap on a card → navigate to /ocr success path → S-05 with chosen formula. Match PRD wording "chọn bài muốn giải" (singular).

2. **Card content density: LaTeX rendered + auto-detected label.** Each card shows:
   - Mono index badge top-left (e.g., "01 / 03")
   - Auto-detected label (e.g., "Phương trình bậc hai", "Tích phân xác định", "Đạo hàm")
   - Rendered LaTeX preview (KaTeX or similar — match what Solution.tsx already uses)
   - Subtle right chevron (lucide `ChevronRight`) suggesting tap action

3. **Backend contract: Extend `OcrResponse` with optional `formulas` field.** Schema upgrade — since cards need both latex and label, the field is a structured list, not plain strings:
   ```ts
   interface FormulaItem {
     latex: string;
     label: string; // e.g., "Phương trình bậc hai"
   }
   interface OcrResponse {
     latex: string;          // existing — single-formula path
     formulas?: FormulaItem[]; // new optional — multi-formula path
   }
   ```
   Frontend routing logic in OCR.tsx: if `formulas?.length > 1` → push to S-14, else use `latex` as before → S-05.

**Aesthetic direction:** Editorial, calm, mint-minimal — same vibe as S-01 Home and S-12 Onboarding (inherit from `figma-brand-profile.md` if it exists, else from `guidelines/DESIGN.md`). Brand mint `#18E299`, primary `#0d0d0d`, body `#666666`, tertiary `#888888`. Atmospheric gradient at top of screen. Cards reuse the existing card pattern (`border-black/5 rounded-[16px] shadow-[0px_2px_4px_rgba(0,0,0,0.03)]`).

**Layout sketch:**
- Top bar: Back chevron (left) + screen title "Chọn bài muốn giải" + step indicator if any
- Brief subtitle: "Hệ thống phát hiện {N} bài toán. Chọn bài bạn muốn giải." (count interpolated)
- Vertical list of cards, gap 12px, full-width with 24px gutter
- Each card: index badge + label + LaTeX render + chevron, tappable as a single button
- No primary CTA at bottom (selection model = tap card directly)
- No empty state needed (only shown when formulas.length > 1)

**Constraints:** mobile-first 375px baseline, light mode, i18n-ready strings, safe-area aware, no animation libraries beyond `motion/react` (already in package.json).

### Step 3 — Return a structured pre-flight report

Respond using **exactly** this Markdown structure. Be specific — quote file paths, token names, line numbers when possible.

```
## A. Files I Read
[List each file you actually opened. If a file in Step 1 doesn't exist, say so.]

## B. Existing Conventions That Will Constrain S-14
[List the rules/tokens/patterns from the codebase that the new screen MUST follow. E.g.:
- How OCR.tsx currently transitions to Solution (route push? state pass? navigate state object?)
- What data shape does Solution.tsx expect on entry?
- Existing card primitive usage in this codebase
- Existing route registration pattern in routes.tsx
- LaTeX rendering library already in use (KaTeX? MathJax? Plain SVG?) — quote from package.json or Solution.tsx
- Back navigation pattern in full-screen pushes (Camera/Crop/OCR all share a pattern?)
- Mint accent placement rules (icon halos? row backgrounds? when to use #d4fae8 vs #18E299?)
- BottomNav z-index, top-bar height conventions]

## C. Open Questions I Need Answered Before Building
[Numbered, specific, 1-sentence-answerable. Examples:
- "Should back from S-14 go to /ocr (re-runs detection) or /crop (rescan) or / (cancel)?"
- "If user selects then comes back via browser back, should the selection be remembered?"
- "What's the maximum number of formulas the screen handles before scroll? PRD doesn't specify."
- "Auto-detected labels: is there an existing classifier in MockOCRService, or do I mock fixed labels per fixture?"
- "Should the index badge format be '01/03' or '1/3' or 'Bài 1' or '#1'?"]

## D. Assumptions I Will Make If You Don't Override
[Numbered. Be exhaustive — easier to override an explicit assumption than to discover it after Round 3. Cover:
- Card visual specs (height, padding, gap, hover, press)
- Index badge format and color
- Label typography
- LaTeX render size
- Chevron size + color
- Top bar height + back button style
- Subtitle styling
- Mock fixture data (how many formulas, which labels)
- localStorage / sessionStorage usage (none expected)
- Route param naming]

## E. Conflicts Between Brief and Codebase
[Where the brief contradicts existing patterns. If none, write "None."]

## F. Components I Plan to Reuse vs. Build New
**Reuse from existing:** [list]
**Build new (must justify each):** [list with 1-line justification]

## G. Routing & State Integration Plan
[Specifics:
- Route path (e.g., `/problem-selector`)
- How OCR.tsx will detect multi-formula and push to S-14
- How S-14 receives the formulas list (route state? URL param? Context?)
- How S-14 passes selected formula to S-05
- Back navigation target
- Files you'll modify or create]

## H. Backend / Mock Service Plan
[How will MockOCRService be extended:
- File location of the mock
- Schema change exact code
- How to trigger multi-formula response (e.g., always for testing? based on image hash?)
- Sample fixture data you'd add (latex + label pairs)]

## I. What I Will NOT Do Until You Confirm
[Restate: I will not write any TSX, modify any file, or run any build until you reply to my open questions.]
```

### Step 4 — Wait

After returning the pre-flight report, **stop**. Do not proceed to wireframes, do not write code, do not modify any file. Wait for my reply with answers, override confirmations, and conflict resolutions. Only then will I send the Round 1 wireframe build prompt.

---

**Why this matters:** S-14 is more complex than S-12 — it's a real route, it has backend contract changes, and it lives mid-flow (depends on OCR upstream + Solution downstream). Cheap pre-flight saves expensive rebuild.
