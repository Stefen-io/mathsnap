# Retrospective: fix-ocr-solve-double-api-call

> Written: 2026-05-23 (after verify passed)
> Commit range: `7867078..bf49f62`
> Worktree: `.claude/worktrees/fix-ocr-solve-double-api-call` (branch `worktree-fix-ocr-solve-double-api-call`)

---

## 0. Evidence

- **Commit range**: `7867078..bf49f62` (2 commits)
- **Diff size (fix-specific files only)**: +69 / -21 lines across 4 files
  - `ocr/page.tsx`: +41 / -15 (langRef pattern + useRef import)
  - `ocr/page.test.tsx`: +27 / -2 (useLanguage mock + regression test)
  - `solve/page.tsx`: +6 / -1 (solveStartedRef guard + useRef import)
  - `solve/page.test.tsx`: +16 / 0 (useLanguage mock + regression test)
- **Tasks done**: 9/14 (`- [x]` rows; 3.2–3.6 are browser-only and remain pending)
- **Active hours**: ~3h (single session)
- **Subagent dispatches**: ~12 (1 implementer + 2 reviewers per task × 4 tasks, plus fix agents)
- **New external dependencies**: none
- **Bugs encountered post-merge**: 1 — i18n regression in solve/page.tsx caught during verify (see §2, §5)
- **OpenSpec validate state at archive**: PASS WITH WARNINGS (3.2–3.6 browser steps unchecked)
- **Test coverage signal**: 103/103 vitest tests passing; 2 new regression tests added

Commit chain:

```
7867078 chore(openspec): archive fix-hardcoded-vi-messages and sync delta specs  ← base
693b118 fix(ocr): remove lang from runOcr deps to prevent double API call
bf49f62 fix(solve): add solveStartedRef guard to prevent StrictMode double call
```

---

## 1. Wins

- [693b118] The `langRef` pattern is surgical — 4-line change that decouples `lang` from `runOcr`'s identity without touching error string logic or any other code path.
- [693b118, bf49f62] Both fixes were pure additions with no feature-level side effects: retry buttons, navigation, and history remain untouched.
- [693b118] The OCR regression test correctly exercises the bug: `mockReturnValueOnce('vi') + mockReturnValueOnce('en') + rerender` actually reproduces the dep-change scenario, so removing the fix would cause the test to fail.
- [verify.md] The verify phase caught the i18n regression before any PR was opened — verify serves its purpose.
- [spec/solution-viewer/spec.md] The solve spec explicitly named "exactly once per component mount including StrictMode" — made implementation intent unambiguous.

---

## 2. Misses

- 🔴 [blocking | bf49f62] `solve/page.tsx` was delivered with i18n support removed — `useLanguage`, `t[lang]`, and localized error strings all missing. The worktree was branched from a pre-history-bookmark commit and the implementation built on top of an already-regressed file. Caught at verify; fixed by restoring master's version and re-applying the guard.
- 🟡 [painful | 693b118] The OCR commit added `LanguageContext.tsx` (+41 lines) and `lib/i18n.ts` (+184 lines) as "new" files — these existed on master but were missing from the worktree's base. This inflated the commit diff and was misleading. The root cause is the same branch-base issue as the 🔴 miss above.
- 🟡 [painful | code quality review] The code quality reviewer for Task 2 (OCR fix) checked the wrong file path (main repo vs worktree), causing a false "file not found" report. Required a manual path verification before continuing.
- 📌 [nit | Task 2 implementer] The langRef test initially used `mockReturnValue` (persistent) instead of `mockReturnValueOnce` (scoped), leaking `lang='en'` into subsequent tests and causing 3 failures. Caught by the next run; fixed with a one-line change.

---

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| Task 5 (manual verification) | Marked 3.1 done; 3.2–3.6 remain `[ ]` | Browser testing requires a running dev server; not feasible in CI/agentic context |
| solve/page.tsx guard | Required restore from master before applying guard | Worktree branched from pre-i18n commit; implementer built on wrong base |
| Solve test file | Required adding `vi.mock('@/contexts/LanguageContext', ...)` | Restoring master's solve/page.tsx introduced `useLanguage()` call which the existing test didn't mock |

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
| superpowers:finishing-a-development-branch       | ✓    |

All skills used as designed. No skipped skills.

---

## 5. Surprises

- The worktree base was not current master — it was branched before the `history-bookmark` feature merge, so solve/page.tsx was missing i18n improvements already on master. The `chore: restore master files` commit in the worktree history should have been a signal but wasn't checked before implementation began.
- The `vi.clearAllMocks()` / `mockReturnValue` interaction: `clearAllMocks` does NOT clear `mockReturnValue` (persistent default) — only `resetAllMocks` does. This asymmetry caused a test pollution bug that would have been invisible without running the full suite.
- The code quality reviewer for the OCR test reached out to the main repo path instead of the worktree path. Subagents don't inherit CWD from the controller; all paths must be absolute and explicit in their prompts.

---

## 6. Promote candidates → long-term learning

- [ ] 🔴 **Verify worktree base matches current master before implementation starts** → **Promote to memory** (type: feedback)
  > **Why**: solve/page.tsx was missing i18n support because the worktree was branched from a stale base. Implementation proceeded on top of an already-regressed file, requiring a restore-and-re-apply cycle caught only at verify.
  > **How to apply**: Before dispatching any implementer subagent in a worktree session, run `git log origin/master..HEAD` and `git diff origin/master -- <key files>` to confirm the worktree base is current. If files are missing or different from master, restore them in a separate "base-sync" commit before writing any fix code.

- [ ] 🟡 **Subagent path prompts must use absolute worktree paths — never assume CWD** → **Promote to memory** (type: feedback)
  > **Why**: The code quality reviewer for Task 2 checked the main repo path instead of the worktree path, producing a false "file not found" verdict. Required a manual verification loop.
  > **How to apply**: In all subagent prompts, include the full absolute path: `/home/.../worktrees/<name>/src/client/...`. Never use relative paths or short descriptions. Add a "paths to read" section at the top of every implementer/reviewer prompt.

- [ ] 🟡 **`mockReturnValue` leaks across tests; always prefer `mockReturnValueOnce`** → **Promote to memory** (type: feedback)
  > **Why**: `vi.clearAllMocks()` clears call counts but NOT the persistent default set by `mockReturnValue`. Caused 3 test failures when `lang='en'` leaked from the regression test into subsequent tests expecting Vietnamese strings.
  > **How to apply**: In test code, default to `mockReturnValueOnce` for all per-test setup. Use `mockReturnValue` only when the mock must persist across all tests in the file (typically in module-level `vi.mock(...)` factory).

- [ ] 📌 **Verify phase is the right time to diff worktree vs master on all changed files** → **Promote to memory** (type: feedback)
  > **Why**: The i18n regression would have been caught earlier if the verify step included a `git diff origin/master -- <file>` sanity check for unexpected removals.
  > **How to apply**: In the verify phase, for each modified source file, run `git diff origin/master -- <file>` and flag any removed imports or hardcoded strings that were previously i18n keys. This catches "scope creep in reverse" (accidental feature removal).
