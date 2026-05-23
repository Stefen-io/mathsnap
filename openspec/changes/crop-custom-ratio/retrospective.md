# Retrospective: crop-custom-ratio

> Written: 2026-05-23 (after verify passed)
> Commit range: `f396af3..02560f2` (implementation commits on worktree branch) + `d43ba55, 1950190` (on master)
> Worktree: `.claude/worktrees/crop-custom-ratio` (branch `worktree-crop-custom-ratio`)

---

## 0. Evidence

- **Commit range**: `f396af3..02560f2` (4 implementation commits on `worktree-crop-custom-ratio`; `d43ba55` and `1950190` on `master` directly)
- **Diff size**: +154 / -28 lines across 2 files (`page.tsx`, `page.test.tsx`)
- **Tasks done**: 9/9 (`grep -cE '^\s*- \[x\]' tasks.md` → 9)
- **Active hours**: ~1.5h (single continuous session)
- **Subagent dispatches**: ~10 (2 implementers + 5 reviewers per task + 1 final reviewer)
- **New external dependencies**: none
- **Bugs encountered post-merge**: none
- **OpenSpec validate state at archive**: `crop-custom-ratio` change = valid ✓; `crop-ratio-selector` canonical spec = valid ✓; 6 pre-existing canonical specs invalid (not related to this change)
- **Test coverage signal**: 108 Vitest tests passing (101 pre-existing + 7 new custom ratio tests)

Commit chain (chronological across both master and worktree branch):

```
f396af3  chore(openspec): archive crop-ratio-selector change and sync spec  [base]
d43ba55  feat(crop): add isCustom state and handleCustomApply handler       [master — Task 1]
1ba5b13  feat(crop): add custom ratio inline input to selector row          [worktree — Task 2]
dd5dad2  refactor(crop): extract parseFloat locals and add aria-labels      [worktree — quality fix]
02560f2  test(crop): add custom ratio tests and fix CaptureState mock       [worktree — tests + UX fix]
1950190  docs(crop): add verify.md and mark all tasks complete              [master]
```

---

## 1. Wins

- [02560f2] 7 new tests cover all spec scenarios: selector visible, Custom mode entry, Apply disabled/enabled, Apply → preset view revert, re-entry clears inputs.
- [d43ba55, 1ba5b13] Entire feature landed in a single file (`page.tsx`) as designed. Zero cross-file coordination required.
- [dd5dad2] Two-stage subagent review caught missing `aria-label`s and `parseFloat` duplication before commit — issues addressed without user intervention.
- [02560f2] Fixed the UX gap (custom inputs not cleared on re-entry) discovered during final review, with a test to guard it.
- [d43ba55] `isNaN` ordering in `isApplyDisabled` is correct — plan.md flagged the JS gotcha explicitly and implementer honored it.

---

## 2. Misses

- 🟡 [d43ba55] **Task 1 commit landed on `master` instead of the worktree branch.** The implementer subagent was given the worktree path but navigated to the main checkout (`/home/administrator/workspace/projects/mathsnap/`) and committed there. Required `git rebase master` on the worktree branch to recover. No work was lost, but the branch isolation was compromised for Task 1.
- 🟡 **`EnterWorktree` default `fresh` mode created worktree from `origin/master`**, which was behind local `master` by 5 crop-related commits. The worktree started without `RATIO_PRESETS`, `aspect` state, or `handleAspectChange`. This was invisible until the Task 1 subagent committed to master and the worktree read the wrong version of the file.
- 📌 **Spec scenario "User taps a preset while in custom mode"** cannot be directly tested. The inline swap design hides preset buttons when `isCustom=true`, making the scenario untriggerable from the UI. The `setIsCustom(false)` guard in `handleAspectChange` satisfies the spec's intent programmatically. The spec was written before the design locked in the conditional swap.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|---|---|---|
| Task 2 Step 4: Manual browser verification | Not performed as a live browser check | Automated tests cover all 6 manual assertions; no browser was available in the agent session |
| Quality review findings | Two additional fixes beyond plan scope: `parseFloat` DRY + `aria-label`s | Spec reviewers caught gaps not in the original plan; addressed in `dd5dad2` |
| `handleCustomApply` UX: input reset | `setCustomW('')`/`setCustomH('')` added on Custom button click | Final reviewer identified stale-value UX issue; addressed in `02560f2` |

---

## 4. Skill / workflow compliance

| Skill | Used |
|---|---|
| superpowers:brainstorming | ✓ (prior session — `brainstorm.md` artifact exists) |
| superpowers:writing-plans | ✓ (prior session — `plan.md` artifact exists) |
| superpowers:using-git-worktrees | ✓ (EnterWorktree invoked; worktree created at `.claude/worktrees/crop-custom-ratio`) |
| superpowers:subagent-driven-development | ✓ (invoked; implementer + 2-stage review per task; final full-implementation review) |
| (transitive) superpowers:test-driven-development | ✗ (see below) |
| (transitive) superpowers:requesting-code-review | ✓ (spec compliance + code quality reviewers dispatched per task) |
| superpowers:finishing-a-development-branch | ✗ (not yet — proceeding to archive then PR) |

### Deliberately Skipped Skills

- **`superpowers:test-driven-development`** (transitive via subagent-driven-development)
  - **What was skipped**: The RED-GREEN-REFACTOR discipline. Tests were not written before implementation code; they were written in a separate commit (`02560f2`) after all implementation commits were done.
  - **Why this cycle**: `plan.md` Tasks 1 and 2 did not include "write failing test first" as explicit steps — they followed the pattern `implement → typecheck → lint → commit`. The implementer subagents received the plan steps literally and followed them. The plan's own structure bypassed TDD by not including a red-test step before each implementation step. Trigger: `plan.md` Task 1 Step 1 reads "Add the three new state variables..." (implementation first, no preceding test step).
  - **How to prevent recurrence**: `scope-judgment rule` — when a plan's task steps don't include a failing-test step before implementation, the controller should add one before dispatching the implementer subagent ("Step 0: write a failing test for [behavior]"). Alternatively, `schema fix`: add a note to `superpowers-bridge` plan instructions to front-load a test step for each task.

- **`superpowers:finishing-a-development-branch`**
  - **What was skipped**: Not yet invoked — this is the next step in the cycle, deferred to after archive completes.
  - **Why this cycle**: The schema's instruction sequence is: all tasks → verify → retrospective → archive → finishing-a-development-branch. The skill has not been skipped; it is queued.
  - **How to prevent recurrence**: N/A — not a skip, just ordering.

---

## 5. Surprises

- **`EnterWorktree` with default `fresh` mode branches from `origin/master`**, not local `master`. When local master has unpushed commits (5 prior crop commits in this case), the worktree starts without them. This is documented behavior but was not anticipated. The implementer subagent then committed to the main checkout instead of the worktree, compounding the issue.
- **Spec scenario "User taps a preset while in custom mode"**: assumed presets would remain visible alongside custom inputs (e.g., as a persistent footer row). The final design swaps them out entirely, making the scenario impossible to trigger from the UI. The spec was drafted before the design decision was locked.
- **`CaptureState` mock in `page.test.tsx` was already stale** — the prior change added `ocrLatex`, `solveResult`, `setOcrLatex`, `setSolveResult` to the interface but the test mocks were not updated. This caused pre-existing TypeScript errors that looked like new noise during typecheck. Fixed in `02560f2` as part of test cleanup.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Subagent implementers commit to main checkout when given an ambiguous working directory** → **Promote to memory** (type: feedback)
  > **Why**: Task 1 subagent received `Work from: /home/administrator/workspace/projects/mathsnap/.claude/worktrees/crop-custom-ratio` but found the main checkout path in the file read output and committed there. The worktree path must be the ONLY path mentioned for git operations.
  > **How to apply**: When dispatching implementer subagents via subagent-driven-development, always include an explicit "IMPORTANT: For all git operations, `cd` to `<worktree-path>` first. Do not use the main repo path." Do not rely on subagents inferring the worktree from context.

- [ ] 🟡 **`EnterWorktree` `fresh` mode is wrong when local master has unpushed commits** → **Promote to memory** (type: feedback)
  > **Why**: `fresh` branches from `origin/master`. When the feature being extended has commits on local master not yet pushed, the worktree starts without those commits. Caused the worktree to read an older version of `page.tsx` that lacked the prior crop ratio selector implementation.
  > **How to apply**: Before invoking `EnterWorktree`, check `git log --oneline origin/master..master`. If any commits are ahead, either push first or document that the worktree will be behind and plan to rebase immediately after creation.

- [ ] 📌 **Write a failing test step before each implementation step in plan.md** → **One-off** (this cycle's plan was already written without it)
  > **Why**: The plan omitted RED step, so subagents followed implementation-first. The spec-compliance reviewer caught gaps instead, but at higher cost (extra review loop).
  > **How to apply**: When writing plans for UI tasks, include "Step 0: write a failing test for [specific assertion]" before each implementation step. This is a writing-plans discipline, not a schema gap.
