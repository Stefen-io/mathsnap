# Retrospective: crop-ratio-selector

> Written: 2026-05-23 (after verify passed)
> Commit range: `0dec45a..6946bd5`
> Worktree: merged to master

---

## 0. Evidence

- **Commit range**: `0dec45a..6946bd5` (3 commits)
- **Diff size**: +32 / -1 lines across 1 file (`src/client/app/(main)/crop/page.tsx`)
- **Tasks done**: 8/8
- **Active hours**: ~1 (single session, worktree created and merged same day)
- **Subagent dispatches**: 7 (implementer ×2, spec-reviewer ×2, code-quality-reviewer ×2, final reviewer ×1)
- **New external dependencies**: none
- **Bugs encountered post-merge**: none (manual verification passed by user)
- **OpenSpec validate state at archive**: PASS
- **Test coverage signal**: n/a — no new tests; CLAUDE.md scopes vitest to `lib/` utilities only; no E2E at this stage

Commit chain:

```
0dec45a feat(client): enhance KaTeX rendering with display mode and CSS import  ← rebase base
d7d2813 feat(crop): add aspect state and handleAspectChange handler
cf37cf6 feat(crop): add ratio selector row with 4:3, 16:9, 1:1 presets
6946bd5 refactor(crop): move RATIO_PRESETS to module scope
```

---

## 1. Wins

- [d7d2813 + cf37cf6] Single-file change exactly matched the design decision D4 — no scope creep, no new imports, no new packages.
- [haiku model] Implementer subagents (haiku) handled both tasks without needing escalation to a more capable model — the plan was precise enough to drive mechanical execution at lowest cost.
- [6946bd5] Final code review (sonnet) caught the RATIO_PRESETS inside-component placement before merge — the module-scope fix was a clean 3-line commit that improved the implementation without revisiting spec or design.
- [spec-reviewer ×2] Both spec compliance reviews passed on first dispatch — no re-review loops needed. Plan-to-code fidelity was high.
- [design.md D2] The `handleAspectChange` reset pattern (aspect + crop + zoom) was explicitly documented in design.md, making implementation unambiguous.

---

## 2. Misses

- 📌 [nit | tasks.md 3.2] Manual verification could not be automated — the test file for crop page (`page.test.tsx`) had pre-existing TS errors (missing `ocrLatex`, `solveResult` on `CaptureState` mock) that blocked adding new tests. The verification step became a human gate. Not a blocker for this change, but the stale test file is a friction point for future crop-page changes.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| Tasks 1+2 (2 commits) | 3 commits total — extra `refactor(crop): move RATIO_PRESETS to module scope` | Final code reviewer (sonnet) flagged RATIO_PRESETS inside the component body as an Important issue (per-render allocation, idiomatic correctness). Added a fix commit rather than amending — clean audit trail. |
| Task 3.2 | Delayed to post-merge manual test | User preferred to merge to master first and test in the running app rather than testing in the worktree dev server. Same verification, different sequence. |

---

## 4. Skill / workflow compliance

| Skill                                            | Used |
|--------------------------------------------------|------|
| superpowers:brainstorming                        | ✓    |
| superpowers:writing-plans                        | ✓    |
| superpowers:using-git-worktrees                  | ✓    |
| superpowers:subagent-driven-development          | ✓    |
| (transitive) superpowers:test-driven-development | ✗    |
| (transitive) superpowers:requesting-code-review  | ✓    |
| superpowers:finishing-a-development-branch       | ✗    |

### Deliberately Skipped Skills

- **`superpowers:test-driven-development`**
  - **What was skipped**: The RED-GREEN-REFACTOR cycle — no failing test was written before the implementation code.
  - **Why this cycle**: `crop/page.test.tsx` already has 4 pre-existing TS2345 errors (CaptureState mock missing `ocrLatex`/`solveResult`) that prevent the test file from compiling. Writing a new failing test in a file that doesn't compile would not produce a meaningful RED state. The CLAUDE.md also explicitly scopes vitest to `lib/` utilities — UI component tests at this stage are not in scope. Both conditions were present before implementation began (visible in baseline typecheck output at session start).
  - **How to prevent recurrence**: `scope-judgment rule` — when a test file for the target component has pre-existing TS errors, the TDD skill should treat this as a "blocked test environment" edge case and fall back to typecheck-as-gate (which was used: Task 3.1). The skill's instruction could add a note: "If the target test file has pre-existing errors that prevent compilation, document the blocker in tasks.md and use typecheck + manual verification as the verification path."

- **`superpowers:finishing-a-development-branch`**
  - **What was skipped**: The PR creation and finishing workflow.
  - **Why this cycle**: The user invoked `/opsx:archive` directly after `/opsx:verify`, bypassing the finishing-a-development-branch step. The archive is being completed in this session; the PR will follow after archive.
  - **How to prevent recurrence**: `one-off — schema boundary case`. The opsx:apply instruction explicitly sequences: verify → retrospective → archive → finishing-a-development-branch. The user chose to run `/opsx:archive` before the PR step — this is a supported user-driven reordering, not a schema defect. The PR step will still be executed after archive.

---

## 5. Surprises

- Master had advanced 1 commit (`0dec45a`) after the worktree was created, requiring a rebase before merge. Not painful — `git rebase master` completed cleanly with no conflicts — but the worktree was 1 commit behind master at merge time. This is normal for any multi-session or interrupted cycle.
- `aspect === preset.value` float equality works correctly here (confirmed by final reviewer) because all aspect values flow through the same RATIO_PRESETS constant — no arithmetic is applied between write and read. The assumption that float equality was safe held.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Pre-existing test file errors block TDD for UI components** → **Promote to memory** (type: project)
  > **Why**: `crop/page.test.tsx` and `page.test.tsx` have TS errors from CaptureState/OnboardingState mock shape drift. These silently disable TDD for any crop or home page change until fixed.
  > **How to apply**: Before starting any task touching `app/(main)/crop/` or `app/(main)/page.tsx`, check if the corresponding test file compiles. If not, either fix the test mock or document the blocked TDD path in tasks.md.

- [ ] 📌 **Final code review (sonnet) catches idiom issues haiku misses** → **One-off** (record, no promote)
  > **Why**: RATIO_PRESETS module-scope issue was only caught by the sonnet final reviewer, not the haiku per-task quality reviewers. For small UI tasks this gap is acceptable — cost of using sonnet per task exceeds value.
  > **How to apply**: Keep current model allocation (haiku per task, sonnet final). No schema change needed.
