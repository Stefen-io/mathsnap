# Retrospective: frontend-solve-flow

> Written: 2026-05-20 (after verify passed)
> Commit range: `de053a3..473c428`
> Worktree: `.claude/worktrees/feat+frontend-solve-flow`

---

## 0. Evidence

- **Commit range**: `de053a3..473c428` (8 commits)
- **Diff size**: +613 / -1 lines across 11 files
- **Tasks done**: 36/44 (8 browser/E2E verification tasks pending — not blockable by automation)
- **Active hours**: ~1 session (single conversation context, no interruptions)
- **Subagent dispatches**: ~24+ (8 tasks × implementer + spec-reviewer + code-quality-reviewer; plus ~3–4 fix iterations)
- **New external dependencies**: `motion ^12.39.0` (MIT, Framer Motion v12)
- **Bugs encountered post-merge**: 1 — build failure (`CaptureProvider` missing from worktree; fixed in commit `473c428`)
- **OpenSpec validate state at archive**: not-run (no `openspec validate` command in project)
- **Test coverage signal**: 4/4 vitest tests pass (`lib/device-id.test.ts`); `lib/api.ts` has no unit tests

Commit chain (chronological):

```
de053a3  (base — pre-solve-flow)
89e87b3  feat: add motion package for accordion animations
8c43d40  feat(client): add getDeviceId utility with localStorage persistence
d6c4b71  feat(client): add useDeviceId hook (SSR-safe localStorage UUID)
fa59a07  feat(client): add postOcr/postSolve API wrappers with ApiError
a54b200  feat(client): extend CaptureContext with ocrLatex and solveResult
ada152e  feat(client): implement S-05 OCR formula preview with KaTeX live render
2303d0c  feat(client): add solve page with S-06 loading and S-07 accordion solution
473c428  fix(client): add CaptureProvider to root layout for solve-flow routes
```

---

## 1. Wins

- [evidence: `d6c4b71`] `useSyncExternalStore` pattern for `useDeviceId` is cleaner than `useState + useEffect` and passes the `react-hooks/set-state-in-effect` lint rule that fired immediately on the naive approach
- [evidence: `8c43d40`, `device-id.test.ts`] Clean layer separation (pure util → hook → API wrapper → UI) made the device-id layer independently unit-testable with 4 passing tests
- [evidence: `fa59a07`] `ApiError` class with `code + retryable` gives callers typed error discrimination without string-matching on `message`; the `handleError` fallback to `UNKNOWN` covers malformed error envelopes gracefully
- [evidence: `2303d0c`, `solve/page.tsx:58-86`] `AnimatePresence + motion.div height:"auto"` accordion with `overflow-hidden` on the wrapper worked first-pass; no JavaScript measurement required
- [evidence: `pnpm build` output] Production build passed after the single `CaptureProvider` fix — no cascading type errors or missing import issues across the 11 changed files

---

## 2. Misses

- 🟡 [painful | evidence: `473c428`] Worktree was created from `origin/master`, which predated the camera-flow merge (`b306fa5`). `app/(main)/layout.tsx`, `KaTeXRenderer.tsx`, `BottomNav`, and `NavSpacer` were all absent. The build only caught this at `pnpm build` — not during task implementation. Root cause: camera-flow changes had never been pushed to `origin`.

- 🟡 [painful | evidence: `d6c4b71`] Design.md D4 prescribed `useState(null) + useEffect` for `useDeviceId`. That implementation failed lint immediately (`react-hooks/set-state-in-effect` is real in eslint-plugin-react-hooks v5). Cost: one full implement-then-rewrite cycle. The plan was written against an assumption about the lint ruleset that was wrong.

- 🟡 [painful | evidence: `components/KaTeXRenderer.tsx`] `KaTeXRenderer.tsx` was missing from the worktree (same camera-flow absence as above). A standalone single-file version was recreated. Master has a two-file split (`KaTeXRenderer.tsx` + `KaTeXRendererImpl.tsx`); the worktree has a single-file implementation. This divergence needs resolution at merge time.

- 📌 [nit | evidence: `solution-viewer/spec.md`, `solve/page.tsx:73`] Spec said answer formula renders at `text-[40px] font-serif italic`. KaTeX overrides class-based font styling — `font-serif italic` has no visible effect on math output; only `style={{ fontSize }}` cascades through KaTeX's em-based sizing. Code reviewer caught this. The spec was aspirational and wrong about KaTeX behavior.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| 2.3 — `useDeviceId` with `useState + useEffect` | Implemented as `useSyncExternalStore(noopSubscribe, getDeviceId, () => null)` | `react-hooks/set-state-in-effect` lint rule fires on `useEffect`-based state mutation; `useSyncExternalStore` is the correct React 19 pattern for reading an external read-only store with an SSR snapshot |
| (unplanned) Root layout `CaptureProvider` | Added `CaptureProvider` to `app/layout.tsx` | `app/(main)/layout.tsx` absent from worktree due to camera-flow branch not being on `origin`. Root layout wrap is semantically equivalent and merge-safe — `(main)/layout.tsx` on master will form the inner provider; inner wins for `(main)` routes |
| (unplanned) Recreate `KaTeXRenderer.tsx` | Created standalone single-file version in worktree | Component absent from worktree for same reason as `(main)/layout.tsx`; single-file version is functionally identical and will be superseded at merge |

---

## 4. Skill / workflow compliance

| Skill                                            | Used |
|--------------------------------------------------|------|
| superpowers:brainstorming                        | ✓    |
| superpowers:writing-plans                        | ✓    |
| superpowers:using-git-worktrees                  | ✓    |
| superpowers:subagent-driven-development          | ✓    |
| (transitive) superpowers:test-driven-development | ✓    |
| (transitive) superpowers:requesting-code-review  | ✓    |
| superpowers:finishing-a-development-branch       | pending — intentionally deferred until after `opsx:archive` |

> `finishing-a-development-branch` is the final step in the schema sequence (after retrospective + archive). It is not yet done at retro-writing time by design — this is not a skip.

### Deliberately Skipped Skills

> (none — full compliance except the pending finishing step above)

---

## 5. Surprises

- **`origin/master` was behind local `master`**: The camera-flow merge (`b306fa5`) had never been pushed to `origin`. Worktree creation from `origin/master` silently produced a workspace missing several committed files. Expected the two to be in sync.

- **`react-hooks/set-state-in-effect` is real**: This rule exists in eslint-plugin-react-hooks v5 (the React 19 era package). Prior assumption was it didn't exist. It fires on any `setState` call inside a `useEffect` body.

- **KaTeX class-based font styling is a no-op**: Wrapping `<KaTeXRenderer />` in a `<span className="font-serif italic text-[40px]">` has no effect — KaTeX injects its own CSS that overrides Tailwind utility classes on wrapper elements. Only `style={{ fontSize }}` cascades into KaTeX output via em inheritance. This is not documented prominently in the KaTeX docs and tripped up both the spec author and the first code draft.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Push origin before creating worktrees** → **Promote to memory** (type: feedback)
  > **Why**: Worktree branched from `origin/master` which lacked camera-flow merge; 3 files were absent from the workspace, causing an unplanned build fix commit and recreating KaTeXRenderer from scratch.
  > **How to apply**: Before any `opsx:apply` step that creates a worktree, verify `git status origin/master..master` (or equivalent) shows no unmerged local commits. If any exist, push `master` to `origin` first.

- [ ] 🟡 **`useDeviceId` pattern: use `useSyncExternalStore` for SSR-safe external store reads** → **Promote to memory** (type: feedback)
  > **Why**: `useState(null) + useEffect` triggers `react-hooks/set-state-in-effect` in eslint-plugin-react-hooks v5; the correct pattern is `useSyncExternalStore(noopSubscribe, clientSnapshot, serverSnapshot)`.
  > **How to apply**: Whenever writing a hook that reads from `localStorage` or any client-only store and needs an SSR-safe null initial state, use `useSyncExternalStore` — not `useEffect`.

- [ ] 🟡 **KaTeX ignores wrapper Tailwind font classes; use `style={{ fontSize }}` for size** → **Promote to memory** (type: feedback)
  > **Why**: `text-[40px] font-serif italic` on a wrapper has no effect on KaTeX-rendered output; KaTeX overrides class-based font styling. Code reviewer caught this after the initial draft. The spec itself had the wrong guidance.
  > **How to apply**: When sizing or styling KaTeX math output, always use inline `style={{ fontSize }}` on the wrapper and do not use Tailwind font-family/style classes — they will be silently ignored.

- [ ] 📌 **Spec aspirational styling for KaTeX renders should flag KaTeX override behavior** → **One-off** (record only, not promoted)
  > **Why**: Does not generalize beyond KaTeX — the override behavior is KaTeX-specific and already captured in the memory candidate above. Adding a spec-writing rule for one rendering library is over-engineering.
