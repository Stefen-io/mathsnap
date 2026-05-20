# Retrospective: frontend-camera-flow

> Written: 2026-05-20 (after verify passed)
> Commit range: `de053a3..b306fa5`
> Worktree: `.claude/worktrees/feat+frontend-camera-flow` (branch: `worktree-feat+frontend-camera-flow`)

---

## 0. Evidence

- **Commit range**: `de053a37..b306fa5` (12 commits)
- **Diff size**: +1090 / -21 lines across 27 files
- **Tasks done**: 37/37 (`grep -c '^- \[x\]' tasks.md` → 37)
- **Active hours**: ~3 hours (split across 2 sessions; tasks 1–7 in session 1, tasks 8–10 + reviews in session 2)
- **Subagent dispatches**: ~13 (session 2: Task 8 implementer + spec review + quality review + fix; Task 9 implementer + spec review + quality review; Task 10 verifier; layout fix; final code review; Explore search)
- **New external dependencies**: `react-easy-crop` v5.x (MIT), `@testing-library/react` v16.x (MIT), `@testing-library/user-event` v14.x (MIT)
- **Bugs encountered post-merge**: 0 (pre-merge at time of writing)
- **OpenSpec validate state at archive**: `change/frontend-camera-flow` PASS; 5 pre-existing main specs FAIL (unrelated)
- **Test coverage signal**: 31/31 Vitest tests pass (8 test files); 0 TypeScript errors; 0 lint errors

Commit chain (chronological):

```
de053a3 [base] docs: add OPSX sync command and openspec-sync-specs skill documentation
6ef6ee5 feat(client): add history types, solution fixtures, brand tokens, test deps
d3b969a feat(client): add CaptureContext with capturedBlob/croppedBlob state
dd1b870 feat(client): add useCamera hook with getUserMedia, capture, and flip
809be4b feat(client): add BottomNav with 3 tabs, hidden on capture flow routes
038d042 feat(client): add KaTeXRenderer lazy-load stub with katex.renderToString
6a9a6f4 feat(client): add main layout, Home screen (S-01) with 3 CTAs
b53dabc feat(client): add Camera screen (S-02) with getUserMedia viewfinder
fd67c64 feat(client): add getCroppedImg helper and Crop screen (S-03)
9980d61 fix(client): resolve lint issues in crop page and test
e5f9456 feat(client): add OCR loading skeleton (S-04), no API call
02bfdc1 fix(client): resolve final lint/typecheck issues for frontend-camera-flow
b306fa5 fix(client): use NavSpacer to prevent pb-16 leaking onto capture routes
```

---

## 1. Wins

- [evidence: all 12 commits] TDD discipline was maintained end-to-end: every component, hook, and screen has a co-located test. Reviewer subagents independently confirmed spec compliance before quality review — no cases where quality review ran on a spec-noncompliant implementation.

- [evidence: `fd67c64`, `9980d61`] The two-stage review cycle (spec then quality) caught real lint violations in Task 8 before they compounded: `react-hooks/set-state-in-effect` in `crop/page.tsx` and `react-hooks/rules-of-hooks` in the Cropper mock. Both were fixed cleanly in a follow-up commit rather than silently suppressed.

- [evidence: `b306fa5`, final code review output] The final whole-implementation code reviewer caught the `pb-16` layout leak that the per-task reviewers had not flagged. Without this final pass, the camera and crop screens would have had a visible 64px gap at the bottom on every mobile viewport.

- [evidence: `d3b969a`, `CaptureContext.test.tsx`] D2's Blob-in-context design (no sessionStorage, no URL params) was verified end-to-end: 5 CaptureContext tests confirm initial state, setters, reset, and the outside-provider throw — all without ever touching serialization.

- [evidence: `6ef6ee5`] The `types/history.ts` gap was a known pre-existing compile-time breakage (`fixtures/history.ts` already imported it). Resolving it as Task 1 unblocked typecheck for the entire session cleanly.

---

## 2. Misses

- 🟡 [painful | evidence: `fd67c64` → `9980d61`] The Crop screen test mock (`react-easy-crop`) called `onCropComplete` synchronously inside its arrow-function render body. This is a setState-during-render violation: `setCroppedAreaPixels` (called by `onCropComplete`) updated state mid-render, triggering an infinite re-render loop that hung the Vitest worker. The fix (deferring `onCropComplete` to a `useEffect` inside a named `MockCropper` function) was correct but required a second commit. The root cause: the plan's provided test code did not include the `useEffect` deferral, and the implementer subagent followed it literally.

- 🟡 [painful | evidence: `9980d61`] The `react-hooks/set-state-in-effect` rule fired on the conventional `useState + useEffect` pattern for `URL.createObjectURL` in `crop/page.tsx`. The implementation had to be refactored to `useMemo` (for URL derivation) + a separate cleanup `useEffect`. This is a non-obvious Next.js + ESLint interaction: the rule treats any `setState` call in a `useEffect` as a cascading-render hazard regardless of dependency gating.

- 📌 [nit | evidence: `globals.css:75–77`, all component files] Brand color tokens (`--color-brand`, `--color-brand-light`, `--color-brand-deep`) are defined in `:root` but all components hardcode `#18E299` / `#0fa76e` hex. The tokens are effectively dead. The plan's provided component code itself used hex literals — the spec scenario only required the token to be defined, not referenced. Carries forward to G4 as a design-system maturation item.

- 📌 [nit | evidence: `design.md` D7, `globals.css:74`] `design.md` D7 specifies `--radius: 9999px` to enable pill shapes via the CSS token. The implementation kept `--radius: 0.625rem` and used `rounded-full` directly on each button. Functionally equivalent; documented as D7 drift in verify.md. Non-blocking but a silent deviation from the written design decision.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|---|---|---|
| 8.1 (`crop/page.test.tsx`) | Cropper mock changed: (a) arrow function → named `MockCropper`; (b) `onCropComplete` moved from render body to `useEffect` | Anonymous arrow function violated `rules-of-hooks`; synchronous call caused setState-during-render infinite loop |
| 8.2 (`crop/page.tsx`) | `imageUrl` derivation changed from `useState + useEffect` to `useMemo + cleanup useEffect` | `react-hooks/set-state-in-effect` lint rule blocked clean `pnpm lint` |
| (unplanned) `NavSpacer.tsx` | New component added; `pb-16` removed from `(main)/layout.tsx` `<main>` | Final code reviewer flagged 64px gap on capture routes; `pb-16` was unconditional in the plan-provided layout code |

---

## 4. Skill / workflow compliance

| Skill | Used |
|---|---|
| superpowers:brainstorming | ✓ |
| superpowers:writing-plans | ✓ |
| superpowers:using-git-worktrees | ✓ |
| superpowers:subagent-driven-development | ✓ |
| (transitive) superpowers:test-driven-development | ✓ |
| (transitive) superpowers:requesting-code-review | ✓ |
| superpowers:finishing-a-development-branch | ✗ |

> **Default expectation**: all ✓. One ✗ below.

### Deliberately Skipped Skills

- **`superpowers:finishing-a-development-branch`**
  - **What was skipped**: The entire skill — branch has not been merged or PR opened yet.
  - **Why this cycle**: The schema instruction explicitly sequences: apply → verify → retrospective → archive → then `finishing-a-development-branch`. This retrospective is being written before archive. The skill is listed in §4 for completeness tracking but its execution window hasn't opened yet — it runs after `/opsx:archive`.
  - **How to prevent recurrence**: `one-off — schema boundary case`. The schema's own instruction (in the `apply` instruction block) states finishing-a-development-branch is the last step, after archive. The ✗ is structural/timing, not a skip of intent. No schema or skill change needed; the sequencing is correct.

---

## 5. Surprises

- **React Testing Library + synchronous state-setter calls in mock render bodies silently hang the Vitest worker.** The failure mode is not an assertion error or a thrown exception — it's an infinite render loop that times out with a worker-killed message. This is easy to introduce when providing mock code in a plan, since the plan author may not anticipate RTL's strict React render-cycle rules.

- **`react-hooks/set-state-in-effect` targets `setState` calls even in legitimately correct `useEffect` patterns.** The `URL.createObjectURL` + `setImageUrl` pattern in a dependency-gated effect is semantically safe but syntactically flagged. The correct fix (`useMemo`) is less intuitive than adding an `eslint-disable` comment.

- **The per-task quality reviewers did not flag the `pb-16` unconditional padding.** Each reviewer was scoped to its task's diff; the layout issue required cross-task understanding (layout padding + BottomNav conditional rendering + camera/crop `h-dvh` sizing). This is a structural blind spot of per-task review — the final whole-implementation review was necessary to catch it.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **When plan code uses React test mocks that call state-setting callbacks, defer the call to `useEffect` inside a named component** → **Promote to memory** (type: feedback)
  > **Why**: Synchronous `onCropComplete` in the Crop mock caused an infinite re-render loop that hung the Vitest worker with no assertion error — hard to diagnose. The fix (named `MockCropper` + `useEffect` deferral) is non-obvious from the symptom.
  > **How to apply**: Whenever writing or reviewing a React test mock that calls a prop-function during render (e.g. `onCropComplete`, `onChange`, `onSubmit` called inside the mock body), check that it's deferred to `useEffect(() => { ... }, [callback])` and that the mock is a named function, not an anonymous arrow.

- [ ] 🟡 **`useState + useEffect` for derived values that trigger re-renders → use `useMemo` instead** → **Promote to memory** (type: feedback)
  > **Why**: The `react-hooks/set-state-in-effect` ESLint rule blocks `setState` calls inside `useEffect` even when dependency-gated. The idiomatic pattern for deriving a side-effect-free value (like `URL.createObjectURL`) is `useMemo`, not `useState + useEffect`. Learned through the `crop/page.tsx` refactor.
  > **How to apply**: When a `useEffect` body's primary purpose is to compute a new value and store it with `setState` (not to trigger a side-effect like a fetch or subscription), prefer `useMemo`. Keep a separate `useEffect` only for cleanup (`revokeObjectURL`).

- [ ] 📌 **Final whole-implementation code review catches cross-task issues that per-task reviews miss** → **Promote to memory** (type: feedback)
  > **Why**: The `pb-16` layout defect required understanding the interaction of layout padding + BottomNav conditional rendering + full-viewport child pages — knowledge spanning 3 separate task commits. Per-task reviewers, scoped to their own diff, could not see this.
  > **How to apply**: Always dispatch the final whole-implementation reviewer after all tasks are done, even when all per-task reviews passed. Do not skip this step on the assumption that per-task reviews are sufficient.

- [ ] 📌 **Define brand color tokens AND reference them in components from day 1** → **One-off** (design-system maturation; no generalization beyond MathSnap)
  > **Why**: G3 defined `--color-brand` in CSS but all components hardcode `#18E299`. A theme change now requires touching every file. The spec only required the token to exist, not be used — so the plan used hex literals throughout.
  > **How to apply**: In the next change that introduces new CSS design tokens, update the plan code snippets to use `var(--color-brand)` rather than raw hex. Scope: MathSnap-specific, not a general rule.
