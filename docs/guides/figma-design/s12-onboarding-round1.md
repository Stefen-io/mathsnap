# Figma Make — Pre-flight Answers + Go-ahead for Round 1

> **Use:** Paste the entire block below into Figma Make as the reply to its pre-flight report. It contains direct answers to every Open Question, confirm/override for each Assumption, resolution for each Conflict, and the green-light to proceed with Round 1 wireframe.

---

## Round 1 — Reply to Pre-flight Report

Thanks for the thorough audit — it caught real conflicts I would have hit later. Here are the answers. **Use these as the source of truth from this point on; they override anything in my original brief that conflicts.**

### Answers to Section C — Open Questions

1. **Step counter color:** `#888888` (match Settings.tsx mono header convention).
2. **"Bỏ qua" button style:** Text-only, no border, no background. `text-[14px] text-[#888888] font-medium`. Hover/press → `#0d0d0d` (darken — **do NOT** hover to mint; mint is reserved for positive completion accents, not exit actions). 44×44 hit target.
3. **Icon source:** Lucide icons — `Camera` (Step 1), `BookOpen` (Step 2 supplement), `Bookmark` (Step 3). Match existing screen convention.
4. **Pagination dots inactive color:** `rgba(0,0,0,0.1)` (matches existing border token, more harmonious than gray-200).
5. **Pagination dots active color:** **Solid `#0d0d0d`** — NOT mint. Reasoning: active dot = "you are here" navigation. Keep monochrome to avoid competing with the mint icon accent. Mint should appear in exactly one place per screen (the icon halo).
6. **Overlay z-index:** `z-[60]` — above BottomNav (z-50) and Dialog overlay (z-50).
7. **Step 2 "3 stacked pill rows" semantics:** Decorative, not interactive. But add subtle visual hierarchy:
   - Row 1 (top): filled `#d4fae8` background, mono micro-label "01" in `#0fa76e` on left, with 2 horizontal placeholder lines in `rgba(0,0,0,0.08)` representing "opened content"
   - Row 2 (middle): outlined only `border-black/10`, with a small `Lock` Lucide icon in `#aaaaaa` on the left
   - Row 3 (bottom): outlined only `border-black/10`, with a small `Sparkles` or `CheckCircle2` Lucide icon in `#aaaaaa` on the left, hinting at "answer revealed at the end"
   - All ~280px wide, 48px tall, 12px gap between rows, framed inside a `border-black/5 rounded-[16px] p-3` card
   - No clickable behavior, no real text content
8. **Backdrop:** Solid white `#ffffff`, no blur, no gradient. The overlay IS the screen on first launch — not a popup over Home.
9. **Settings entry placement:** Add row "Xem lại hướng dẫn" inside existing `Thông tin` section, **directly above** `Liên hệ hỗ trợ`. Same visual style as other rows in that section.
10. **localStorage key naming:** `mathsnap.onboarding.seen` (dot notation namespace, not snake_case). Value: string `"true"` after completion. This dot-notation establishes a convention for future flags (`mathsnap.feature.*`).

### Confirmations & Overrides for Section D — Assumptions

| # | Assumption | Decision |
|---|---|---|
| D1 | Near-black `#0d0d0d` (DESIGN.md), not `#030213` (theme.css) | ✅ **Confirm** |
| D2 | Step counter: Inter, 14px/500 weight, uppercase, `#888888` | ⚠️ **Override** → `text-[12px] font-mono font-semibold uppercase tracking-[0.6px] text-[#888888]` (match Settings.tsx exactly — 12px not 14px) |
| D3 | "Bỏ qua" hover → `#18E299` | ❌ **Override** → hover/press → `#0d0d0d` (see C2 reasoning) |
| D4 | Lucide icons (Camera, BookOpen, Bookmark) | ✅ **Confirm** |
| D5 | Pagination dots active = mint `#18E299` | ❌ **Override** → active = `#0d0d0d`, inactive = `rgba(0,0,0,0.1)` (see C4, C5) |
| D6 | Overlay z-[60] | ✅ **Confirm** |
| D7 | Step 2 illustration = decorative pills, no text | ⚠️ **Override** → see expanded spec in C7 (subtle hierarchy with mono label + lock + sparkle icons) |
| D8 | Solid white, no blur, no gradient | ✅ **Confirm** |
| D9 | Button 48px mobile / 56px desktop | ✅ **Confirm** |
| D10 | Heading 36px / 600 / -0.72px tracking | ✅ **Confirm** |
| D11 | Body 16px / 400 / 1.5 / `#333333` | ⚠️ **Override** → body color `#666666` (matches Home.tsx feature-card body — softer secondary). `#333333` reads too strong here. |
| D12 | Settings entry in `Thông tin` section above `Liên hệ hỗ trợ` | ✅ **Confirm** |
| D13 | localStorage key `mathsnap_onboarding_seen` | ❌ **Override** → `mathsnap.onboarding.seen` (see C10) |
| D14 | Slide-in 300ms ease-out / fade-out 200ms | ⚠️ **Override** → simpler: fade-in 200ms ease-out / fade-out 200ms ease-out only. **No slide.** Slide animations skew "app-promo"; we want "calm". |
| D15 | Mobile-first 375px, scale up for desktop | ✅ **Confirm** |
| D16 | "Xem lại" doesn't clear flag | ✅ **Confirm** |
| D17 | Only "Bắt đầu" sets flag, not "Bỏ qua" | ❌ **Override** → **"Bỏ qua" also sets flag.** Respect the user's active choice not to see onboarding again. If they skipped on purpose, badgering them next launch is hostile. |
| D18 | 44px min touch targets | ✅ **Confirm** |
| D19 | Container max-w-[480px] on desktop | ✅ **Confirm** (matches BottomNav width) |
| D20 | `pb-safe` for bottom button | ✅ **Confirm** + also `pt-safe` for top bar (notch awareness) |

### Resolutions for Section E — Conflicts

- **E1 — Near-black mismatch:** Use `#0d0d0d` (hardcoded, matching existing Home/Settings). Treat `theme.css --primary: #030213` as shadcn default that the project has chosen NOT to use in shipped screens. Don't introduce `--primary` token usage in S-12.
- **E2 — Geist Mono unavailable:** Use Tailwind's `font-mono` utility (system monospace fallback) — same convention as Settings.tsx line 22. Do NOT import Geist Mono into fonts.css for this change; that's out of scope.
- **E3 — Dialog primitive doesn't fit:** Build a custom `OnboardingOverlay.tsx`. Do NOT modify the existing Radix Dialog. Custom component is the right call (your F.1 justification is correct).
- **E4 — Z-index collision:** `z-[60]` for the overlay container. Confirmed.

### Refinements to Section F — Reuse vs. Build

Your plan is good. One refinement:

**Reuse (in addition to Lucide icons):**
- The primary button's exact Tailwind class string from Home.tsx line 38 (`bg-[#0d0d0d] text-white rounded-full ... shadow-[0px_1px_2px_rgba(0,0,0,0.06)]`) — copy verbatim, do NOT redefine. This keeps the CTA visually identical to Home.

**Build new (confirmed):**
- `src/app/components/OnboardingOverlay.tsx` ✅
- `src/app/components/OnboardingStep.tsx` ✅
- `src/app/components/PaginationDots.tsx` ✅ — but keep this trivial (3 divs, conditional className). Don't over-engineer.

### Refinements to Section G — Routing & State Plan

Your revised plan with Context is correct. Two refinements:

1. **Hook over raw context:** Wrap the context in a custom hook `useOnboarding()` that exposes `{ isOpen, open, close, markSeen }`. Components shouldn't touch `localStorage` directly — the hook owns that.
2. **First-launch trigger lives in RootLayout, not Home:** Move the `useEffect` that checks `localStorage.getItem('mathsnap.onboarding.seen')` from Home.tsx into RootLayout (routes.tsx line ~20). Reasoning: if a future deep-link lands a first-time user on `/history` or `/settings` directly, they should still see onboarding. Home shouldn't be the gatekeeper.

**Confirmed file changes:**
- **Create:** `src/app/components/OnboardingOverlay.tsx`
- **Create:** `src/app/components/OnboardingStep.tsx`
- **Create:** `src/app/components/PaginationDots.tsx`
- **Create:** `src/app/contexts/OnboardingContext.tsx` (with `useOnboarding` hook exported alongside)
- **Modify:** `src/app/App.tsx` — wrap RouterProvider with `<OnboardingProvider>`
- **Modify:** `src/app/routes.tsx` — render `<OnboardingOverlay />` inside RootLayout, add the first-launch `useEffect` here
- **Modify:** `src/app/screens/Settings.tsx` — add "Xem lại hướng dẫn" row in `Thông tin` section above `Liên hệ hỗ trợ`
- **Do NOT modify:** `src/app/screens/Home.tsx` — onboarding gating moves to RootLayout

---

## Green-light: Proceed with Round 1 — Wireframe Only

You may now begin **Round 1**. Constraints for this round:

- **Wireframe only.** No colors except black/white/grays. No mint accent yet.
- **Focus on:** layout structure, information hierarchy, the 3-step rhythm, top-bar Skip placement, button placement, pagination dot positioning.
- **Use placeholder shapes** for icons (just gray squares with labels like "icon: Camera"). Do NOT render the final Lucide icons yet.
- **All 3 steps + the Settings "Xem lại hướng dẫn" entry** rendered side-by-side so I can validate the rhythm.
- **No code yet** beyond the bare minimum needed to render the wireframe — placeholder strings are fine.

After Round 1, stop and wait for my approval. Then we proceed to Round 2 (interactions) and Round 3 (visual polish — apply mint, Lucide icons, final typography).

If anything I've answered is still unclear or you spot a new conflict during Round 1, **stop and ask** — same protocol as the pre-flight.
