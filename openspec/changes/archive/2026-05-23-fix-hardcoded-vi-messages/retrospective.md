# Retrospective: fix-hardcoded-vi-messages

> Written: 2026-05-23 (after verify passed)
> Commit range: `cd144d4..aed94f6`
> Worktree: main checkout (worktree creation blocked — see §4)

---

## 0. Evidence

- **Commit range**: `cd144d4..aed94f6` (5 commits)
- **Diff size**: +35 / -18 lines across 9 files
- **Tasks done**: 17/17 (`grep -cE '^\s*- \[x\]' tasks.md` → 17)
- **Active hours**: ~1 session
- **Subagent dispatches**: 16 (3 per task × 5 tasks = 15 + 1 final review)
- **New external dependencies**: none
- **Bugs encountered post-merge**: none
- **OpenSpec validate state at archive**: verify.md written, no FAIL, retrospective pending archive
- **Test coverage signal**: server 22/22 passed; client 108/109 passed (1 pre-existing failure in `lib/api.test.ts:125`, unrelated to this change)

Commit chain (chronological):

```
cd144d4  fix(api): update OCR request timeout to configurable constant  ← base (pre-change)
cbdde53  fix(server): replace hardcoded Vietnamese rate-limit messages with English
3f25c8b  feat(i18n): add rateLimitBurst and rateLimitDaily translation keys
7132580  fix(ocr-page): map RATE_LIMITED errors to i18n keys instead of err.message passthrough
4b1af8d  fix(solve-page): map RATE_LIMITED errors to i18n keys instead of err.message passthrough
aed94f6  fix(api): replace Vietnamese OCR timeout message with English
```

---

## 1. Wins

- [evidence: cbdde53, 3f25c8b, 7132580, 4b1af8d] **Clean separation of concerns executed correctly.** Server messages became English debug artifacts; client i18n became the sole source of truth for user-visible strings. The `err.retryable` discriminator eliminated the need for any new API surface.
- [evidence: server 22/22, client 108/108 scoped tests] **Zero regressions.** Every targeted test file passed; no tests were broken by the change set.
- [evidence: 4b1af8d, TDD RED-GREEN cycle] **TDD enforced for the solve-page task.** Test updated first, confirmed failing, then implementation made it green. The protocol held cleanly for the task with the most behavior change.
- [evidence: `grep -n -P "[àáâ...]" solve.py ocr.py main.py` → no output] **Verification grep checks were unambiguous.** Vietnamese-character grep gave clean empty output on all server response files; the client grep confirmed Vietnamese appears only in `i18n.ts`, test files, and fixtures as expected.
- [evidence: 16 subagent dispatches, zero re-dispatches for blockers] **Subagent-driven-development ran without BLOCKED escalations.** All 5 implementer agents returned DONE on first dispatch; all spec and quality reviews resolved in at most one round-trip.

---

## 2. Misses

- 🟡 [painful | evidence: EnterWorktree error "Already in a worktree session"] **Worktree creation was blocked by stale harness session state.** The prior `/clear` had failed with "Path does not exist" for a `crop-custom-ratio` worktree. The harness retained an internal "in worktree session" flag even though the directory was gone and `git worktree list` showed only the main checkout. Worked in main checkout (master branch) as fallback, which carries the risk of polluting the working tree if a task went badly wrong.
- 🟡 [painful | evidence: code-quality review of Task 3] **Code quality reviewer produced a false-positive "CRITICAL" finding.** The reviewer flagged that the test "creates ApiError with English messages but expects Vietnamese strings in the DOM" as a test failure. In reality, the test was correct — the DOM text comes from `t[lang].rateLimitBurst` (i18n lookup, Vietnamese), not from `err.message`. The reviewer lacked the architectural context that i18n lookup overrides `err.message` for RATE_LIMITED. Required an empirical test run to disprove the finding before proceeding.
- 📌 [nit | evidence: tasks.md items 7.1, 7.2] **tasks.md had two phantom tasks that were no-ops.** "Update server tests to expect English messages" — the plan already noted server tests don't assert on message strings. These tasks cluttered the checklist but caused no real delay.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| Tasks 7.1, 7.2 (server test updates) | Verified as no-ops; marked done without code changes | Plan documented the caveat inline ("no changes needed there"); tasks.md was a mismatch — tasks were listed but were effectively documentation, not work |
| Worktree setup | Worked in main checkout instead of isolated worktree | Harness reported "Already in a worktree session" despite no active worktree; EnterWorktree tool rejected the call |
| Combined spec+quality review for Task 4 | Single reviewer agent dispatched for both roles | Task was simple enough that a single capable-model agent could assess both compliance and quality in one pass; separated for Tasks 1–3 |

---

## 4. Skill / workflow compliance

| Skill | Used |
|-------|------|
| superpowers:brainstorming | ✓ (prior cycle — brainstorm.md already existed at apply time) |
| superpowers:writing-plans | ✓ (prior cycle — plan.md already existed at apply time) |
| superpowers:using-git-worktrees | ✗ (attempted; harness blocked — see Deliberately Skipped Skills) |
| superpowers:subagent-driven-development | ✓ |
| (transitive) superpowers:test-driven-development | ✓ (Task 4 solve page: RED-GREEN cycle executed) |
| (transitive) superpowers:requesting-code-review | ✓ (spec + quality reviewer per task; combined for Tasks 4–5) |
| superpowers:finishing-a-development-branch | pending (after archive) |

> **Default expectation**: all ✓. Any ✗ must be explained below.

### Deliberately Skipped Skills

- **`superpowers:using-git-worktrees`**
  - **What was skipped**: Full skill — no isolated worktree created; implementation ran in the main checkout on `master`.
  - **Why this cycle**: `EnterWorktree` returned `tool_use_error: "Already in a worktree session"` at the point of invocation. `git worktree list` showed only the main checkout and `git rev-parse --git-dir == git rev-parse --git-common-dir` (not in a linked worktree). The harness retained internal "in worktree session" state from the prior `/clear` command, which had itself failed with "Path does not exist" for `.claude/worktrees/crop-custom-ratio`. The harness state and the filesystem were inconsistent — the tool correctly refused to nest worktrees, but the stale state couldn't be cleared without a session reset.
  - **How to prevent recurrence**: `scope-judgment rule` — when `EnterWorktree` is rejected with "Already in a worktree session" but `git worktree list` shows only the main checkout, surface the conflict to the user immediately rather than silently falling back to the main checkout. The user should confirm they want to work in place, or restart the session to clear the harness state. A one-line note in the `/clear` error output ("if you see this, harness worktree session may be stale — restart to clear") would catch this sooner.

---

## 5. Surprises

- **Server tests don't assert on message strings at all.** The design.md risk ("Tests in `test_ocr_rate_limit.py` / `test_solve_rate_limit.py` may assert Vietnamese message strings") turned out to be a non-issue. Both test files assert only on `body["code"]` and HTTP status code, not on `body["message"]`. The mitigation (update test expectations) was budgeted but never needed. The plan's inline note was accurate; the tasks.md items were redundant scaffolding.
- **Code quality reviewer's i18n blindspot.** The reviewer evaluated the OCR test as having a "critical" mismatch between what the ApiError mock holds (English) and what the DOM shows (Vietnamese), not realizing the DOM text comes from the i18n catalog lookup rather than `err.message`. This revealed that code quality reviewers need architectural context about the i18n override pattern to evaluate RATE_LIMITED error handling correctly.
- **`const en: typeof vi` vs `satisfies Record<Lang, Record<string, string>>`** (verify.md S1). The language-ui spec was written expecting a `satisfies` constraint, but the pre-existing codebase used `typeof vi`. The functional requirement (key parity) is met either way; the TypeScript idiom mismatch is cosmetic but spec-literal.

---

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Brief code-reviewers on the i18n override pattern before dispatching** → **Promote to memory** (type: feedback)
  > **Why**: The Task 3 code quality reviewer declared a "CRITICAL" failure because it lacked the architectural context that `t[lang].rateLimitBurst` overrides `err.message` for RATE_LIMITED codes. The empirical test run was required to disprove the finding, adding a round-trip.
  > **How to apply**: When dispatching a code-review subagent for code that involves the `err.code → t[lang].*` mapping pattern in MathSnap, include a one-sentence architectural note: "RATE_LIMITED errors route through `t[lang]` i18n keys — `err.message` is intentionally ignored for this code path; test DOM assertions check i18n values, not mock message strings."

- [ ] 🟡 **Stale harness worktree session state surfaces as EnterWorktree rejection** → **Promote to memory** (type: feedback)
  > **Why**: After a failed `/clear` that referenced a non-existent worktree path, the harness retained "in worktree session" state. `EnterWorktree` correctly refused to nest, but there was no path to clear the stale state mid-session. Working in the main checkout on `master` was the only viable option.
  > **How to apply**: When `EnterWorktree` returns "Already in a worktree session" but `git worktree list` shows only the main checkout, pause and surface the conflict to the user before falling back to in-place work. Do not silently proceed on `master`.

- [ ] 📌 **tasks.md phantom tasks add noise when plan contradicts them** → **One-off** (record only, no promote)
  > **Why**: Tasks 7.1 and 7.2 were no-ops — the plan documented this inline, but the tasks.md still listed them as work items. They caused no real delay (quick grep to confirm), so this doesn't generalize into a schema rule.
