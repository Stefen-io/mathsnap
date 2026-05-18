# Figma Make — Pre-flight Prompt for S-12 Onboarding

> **Purpose:** Run THIS prompt in Figma Make **before** the build prompt (`s12-onboarding.md`). It forces Figma Make to surface uncertainties and conflicts against the existing codebase, so we resolve gaps once instead of fixing them across 3 build rounds.
>
> **How to use:** Paste the entire block below into Figma Make. It will respond with a structured Q&A. Copy that response back to me; I'll patch the brief, then we run the actual 3-round build.

---

## Pre-flight: Context Check Before Building S-12 Onboarding

You are going to design a new screen for MathSnap — the **S-12 Onboarding Overlay** — but **DO NOT WRITE OR DESIGN ANYTHING YET**. Your first job is to read the existing project, cross-check the brief I will give you against what's already built, and surface every unclear point so I can resolve them before you start.

### Step 1 — Read these files first (in this order)

1. `guidelines/DESIGN.md`
2. `guidelines/Guidelines.md`
3. `src/styles/theme.css`
4. `src/styles/fonts.css`
5. `src/app/routes.tsx`
6. `src/app/App.tsx`
7. `src/app/screens/Home.tsx`
8. `src/app/screens/Settings.tsx`
9. `src/app/components/BottomNav.tsx`
10. `src/imports/FIGMA_PROMPT.md` (the original master prompt that built this file — important for matching tone and structure)

### Step 2 — Read the design brief below (S-12 spec)

**Screen:** S-12 Onboarding Overlay — a one-time 3-step welcome shown above S-01 Home on first launch, dismissable via "Bỏ qua" or completed via "Tiếp tục"/"Bắt đầu". Re-entry from Settings ("Xem lại hướng dẫn").

**Aesthetic direction:** Editorial, typography-forward, calm. Each step is a full-screen overlay with: top bar (step counter top-left, "Bỏ qua" top-right), a centered hero block (small line-art icon + 36px Semibold heading + 16px body), bottom block (3 pagination dots + primary pill button). Brand mint `#18E299` accent, primary `#0d0d0d`, white background. No marketing energy, no stock illustrations, no Material elevation drama.

**3 steps content:**
- Step 1 — "Chụp công thức, hệ thống đọc giúp bạn" (camera viewfinder icon)
- Step 2 — "Mở từng bước, hiểu từng phần" (3 stacked pill rows showing Progressive Disclosure)
- Step 3 — "Đánh dấu bài hay, ôn lại bất cứ lúc nào" (bookmark icon, **no Skip button** on this final step)

**Constraints:** mobile-first 375px baseline, light mode only, i18n-ready strings, safe-area aware, no animation libraries, z-index 50, no external images.

### Step 3 — Return a structured pre-flight report

Respond using **exactly** this Markdown structure. Be specific — quote file paths, token names, line numbers when possible.

```
## A. Files I Read
[List each file you actually opened. If a file in Step 1 doesn't exist, say so.]

## B. Existing Conventions That Will Constrain S-12
[List the rules/tokens/patterns from the codebase that the new screen MUST follow. E.g.:
- Color tokens used (exact var names from theme.css)
- Font family registered in fonts.css (exact name + available weights)
- Routing pattern in routes.tsx (how new screens are registered)
- Existing overlay/dialog/sheet pattern (which shadcn primitive is used elsewhere — Dialog? Sheet? Drawer?)
- Bottom-nav z-index and how to layer above it
- Existing localStorage/state patterns for "first time" flags]

## C. Open Questions I Need Answered Before Building
[Numbered. Each question must be specific and answerable in 1 sentence. Bad: "What should the colors be?" Good: "Should the step counter use --color-muted-foreground (#888888) or --color-text-tertiary (#aaaaaa)?"]

## D. Assumptions I Will Make If You Don't Override
[Numbered. List every default you'll fall back to. Be exhaustive — easier to override an explicit assumption than to discover it after Round 3.]

## E. Conflicts Between the Brief and the Codebase
[Where my brief contradicts existing patterns. E.g.:
- Brief says X but codebase already does Y
- Brief specifies hex but theme.css uses oklch
- Brief mentions a component that doesn't exist
If no conflicts, write "None."]

## F. Components I Plan to Reuse vs. Build New
**Reuse from `src/app/components/ui/`:** [list]
**Build new (must justify each):** [list with 1-line justification]

## G. Routing & State Integration Plan
[How will the overlay be triggered on first launch? Where will the "hasSeenOnboarding" flag live? How will the Settings "Xem lại hướng dẫn" entry re-open it without resetting the flag? Reference the actual files you'll modify.]

## H. What I Will NOT Do Until You Confirm
[Restate: I will not write any TSX, modify any file, or run any build until you reply to my open questions.]
```

### Step 4 — Wait

After returning the pre-flight report, **stop**. Do not proceed to wireframes, do not write code, do not modify any file. Wait for my reply with:
- Answers to your Open Questions
- Confirmations or overrides of your Assumptions
- Resolutions for any Conflicts

Only after I send my answers will I follow up with the **Round 1 wireframe build prompt**.

---

**Why this matters (for your decision-making):** I want to catch token mismatches, naming-convention drift, and structural surprises *once* — not three times across three rounds of polish. A 5-minute pre-flight saves a full re-build.
