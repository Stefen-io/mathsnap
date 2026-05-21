# Retrospective: history-bookmark

> Written: 2026-05-21 (after verify passed — PASS WITH WARNINGS)
> Commit range: `db3d12a..d31317f`
> Worktree: merged to master (`d31317f` merge commit)

---

## 0. Evidence

- **Commit range**: `db3d12a..d31317f` (33 commits total; 17 feature commits in worktree branch + merge commit; remaining are other master commits in the base range)
- **Diff size**: +3693 / -222 lines across 58 files
- **Tasks done**: 70/71 (`grep -cE '^\s*- \[x\]' tasks.md` → 70; 1 deferred: manual smoke test 11.5)
- **Active hours**: ~5 hours (single session)
- **Subagent dispatches**: ~40 (11 implementer + 11 spec-reviewer + 11 quality-reviewer, plus ~7 fix-cycle re-dispatches)
- **New external dependencies**: `@testing-library/jest-dom@^6.9.1` (MIT, dev-only)
- **Bugs encountered post-merge**: 0
- **OpenSpec validate state at archive**: history-bookmark change ✓ valid; 6 pre-existing global spec failures (non-blocking, pre-date this change)
- **Test coverage signal**: 88 vitest tests (45 suites), 20 pytest tests — all pass

Commit chain (feature branch, chronological):

```
db3d12a [base]
f93c8ba fix(server): make PATCH /history/{id}/bookmark idempotent with explicit bool
12d14fe fix(server): remove redundant pre-fetch in set_bookmark, clean up unused mock
0690719 feat(client): add history and bookmark API functions to api.ts
4ca85a8 fix(client): fix page=0 guard and add missing test assertions in api.ts
b087e39 feat(client): add Bookmarks tab to BottomNav (4 tabs)  [worktree fix-up]
d9b9cbd refactor(client): extract StepCard into shared component
1d6d9b7 feat(client): wire bookmark button on solve page with optimistic toggle
520acb7 test(client): add beforeEach clearAllMocks to solve bookmark test block
2dd51ae feat(client): add S-08 History List page with swipe-to-delete
29595cf fix(client): guard drag-click navigation, add bookmark toggle test in history page
21a73b8 feat(client): add S-09 Bookmarks page
818aa4b feat(client): add history item detail page /history/[id]
b6197ba feat(client): add S-11 Manual LaTeX Input page
9fe40df feat(client): add S-13 Settings page with bilingual toggle
ab4ba0f feat(client): add FR-1b file picker and Nhập LaTeX link to Home page
3ea0b05 chore(client): fix lint errors from test files and type inference
d31317f Merge branch 'worktree-feat+history-bookmark'
```

---

## 1. Wins

- [evidence: f93c8ba, 12d14fe] **Explicit-body PATCH /bookmark** replaced the non-idempotent toggle in a single, clean refactor. `set_bookmark` removes the pre-fetch; direct `update()` is both simpler and safer on retries.
- [evidence: 88 tests passing] **TDD discipline held across all 11 tasks.** Every page and utility was test-first: tests were written, run red, then made green. The spec-reviewer pass on each task caught regressions immediately (e.g., missing `toggleBookmark` test in task 6, missing `beforeEach` cleanup in task 5).
- [evidence: d9b9cbd] **`StepCard` extraction** was unplanned (not in original tasks) but the right call — both solve page and history detail now share one implementation, reducing future drift.
- [evidence: 1d6d9b7, 818aa4b] **Optimistic UI pattern** is consistent across all three bookmark toggle surfaces (solve page, history list inline, history detail). Reverts on error in all cases.
- [evidence: 0690719, 4ca85a8] **`page !== undefined` guard fix** was caught in spec review, not post-deploy. The original `if (opts?.page)` would silently skip page 0.
- [evidence: 3ea0b05] **ESLint test override** (`@typescript-eslint/no-explicit-any: off` for `*.test.tsx`) is a clean one-time fix rather than scattered `eslint-disable` comments.

---

## 2. Misses

- 🟡 [painful | evidence: 326fcbc on master, b087e39 in worktree] **Subagent committed BottomNav to `master` instead of the worktree.** The subagent lost track of CWD context. Required manual copy of files from master to the worktree and a redundant commit. The merge later resulted in a no-op (identical diffs), but the double-commit clutters history.

- 🟡 [painful | evidence: d31317f merge conflict] **Merge conflict on `solve/page.tsx` and `solve/page.test.tsx`** because master added error-dispatch UI (`errorCode` state) while the worktree added `historyItemId`/`isBookmarked` state. Both branches diverged from the same base point and modified the same state declarations. Resolution was straightforward but required careful reading to preserve all three states.

- 📌 [nit | evidence: 29595cf] **Swipe-to-delete fires card `onClick`** — motion drag completion triggered the card navigation click handler. This was not surfaced in the spec or design and required a `draggingId` ref guard. The pattern is non-obvious for first-time users of `motion/react` swipe.

- 📌 [nit | evidence: vitest.setup.ts + package.json] **`@testing-library/jest-dom` was absent** from dev dependencies. `toBeDisabled()` threw at runtime in the manual page test. Required a mid-cycle `pnpm add` and `vitest.setup.ts` import.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| Not in original plan | Added **Task 4: Extract StepCard** as a full task | History detail page needed `StepCard`; solve page had it inline. Extraction was required for code sharing, not planned upfront. |
| 2.2 (api.test.ts) | Added `deleteHistoryItem` `X-Device-ID` header assertion and `toggleBookmark(false)` direction test after spec-review flagged gaps | Spec reviewer correctly identified missing test coverage for delete header and unbookmark direction |
| 4.6 (inline bookmark toggle) | Added `draggingId` ref guard (29595cf) after swipe-fires-click bug surfaced during review | `motion/react` drag end propagates to outer `onClick` by default; guard was not in the original task spec |
| 7 (solve page bookmark) | Added `localStorage.getItem('mathsnap_language')` before `postSolve` call (not in task 7 spec, belonged there semantically) | Settings page (task 10) introduced the language concept; solve page needed to read it to send the right `language` parameter |
| 11.5 (manual smoke) | Deferred — marked `- [ ]` not `- [x]` | Manual dev server verification requires a live backend. All assertions have automated equivalents (see verify.md §7). |

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
| superpowers:finishing-a-development-branch | ✓ |

All skills used — no deliberately skipped skills this cycle.

### Deliberately Skipped Skills

_(None — all rows are ✓)_

---

## 5. Surprises

- **`motion/react` swipe fires outer `onClick`.** Assumed drag gestures and click events were independent. They're not: drag-end bubbles to the ancestor click handler unless guarded. Required a `useRef<string | null>` tracking `draggingId` and a `setTimeout` reset to prevent navigation on swipe-complete.

- **Subagent CWD confusion.** Expected subagents to inherit the worktree CWD. Instead, a subagent used the main repo root for its `git add`/`git commit`, committing BottomNav changes directly to `master` branch `326fcbc`. Subagents must be given the explicit worktree path and should verify their git working directory before committing.

- **`errorCode` state conflict on merge.** The feature branch was created at `db3d12a`. By the time the worktree was merged, master had added an `errorCode` state variable to `solve/page.tsx` for the error-dispatch UI feature. Both branches modified the same line, causing a conflict. Could have been avoided by rebasing the feature branch onto a more recent master before merge, but was resolved cleanly.

- **TypeScript literal type inference for `language` field.** `{ language: 'vi' }` in test mock objects was inferred as `string` not `'vi' | 'en'`. Required `language: 'vi' as const` in all mock objects. This is an expected TypeScript behavior but not always obvious when writing rapid test scaffolding.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Subagents must verify their git CWD before any `git add`/`git commit`** → **Promote to memory** (type: feedback)
  > **Why**: Task 3 subagent committed BottomNav changes to `master` branch (`326fcbc`) instead of the worktree at `.claude/worktrees/feat+history-bookmark`. Required manual workaround and left a duplicate commit in history.
  > **How to apply**: When dispatching subagent implementers in subagent-driven-development, include explicit instruction: "Run `git rev-parse --show-toplevel` and `git branch --show-current` before any commit. Expected path: `<worktree-path>`. If not in worktree, STOP and do not commit."

- [ ] 🟡 **`motion/react` swipe needs a `draggingId` ref guard to prevent swipe-complete from firing card `onClick`** → **Promote to project CLAUDE.md** (add under Coding Conventions)
  > **Why**: Swipe gesture completion fires the ancestor click handler by default in `motion/react`. This caused unintended navigation on drag-complete. Fix requires a `useRef<string | null>` to track active drag ID, set in `onDragStart`, cleared via `setTimeout` in `onDragEnd`, with `onClick` guard.
  > **How to apply**: Any time a draggable `motion.div` wraps a clickable card in this codebase, apply the `draggingId` ref guard pattern from `history/page.tsx:~60-80`.

- [ ] 📌 **Add `@testing-library/jest-dom` to the standard Vitest setup** → **One-off** (already fixed in `vitest.setup.ts`; not needed elsewhere)
  > **Why**: `toBeDisabled()` and similar DOM matchers are not available in Vitest by default. Adding `import '@testing-library/jest-dom'` to `vitest.setup.ts` enables them globally; this was already done in this cycle.
  > **How to apply**: Already in place — the fix is committed. Only relevant if project is reset or cloned fresh without dev deps.

- [ ] 📌 **Use `language: 'vi' as const` (not `language: 'vi'`) in TypeScript test mock objects for `HistoryItem`** → **One-off** (pattern is in place; TypeScript inference behavior)
  > **Why**: TypeScript widens `'vi'` to `string` in object literals unless `as const` is applied, causing type errors when the object is assigned to `HistoryItem` which expects `'vi' | 'en'`.
  > **How to apply**: Whenever creating a mock `HistoryItem` or similar discriminated-union objects in test files, always use `as const` on string literal fields that map to union types.
