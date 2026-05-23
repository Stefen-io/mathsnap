# Retrospective: bilingual-ui

**Written:** 2026-05-23 (hot context — implementation just completed and smoke-tested)

---

## §0 Evidence

| Metric | Value |
|---|---|
| Commits (feature range) | 17 commits (`198afd2`…`cfbd733`) |
| Diff size | +1 425 / −168 lines across 31 files |
| Tasks completed | 20/20 (includes smoke test confirmed by user) |
| New external dependencies | 0 |
| Post-merge bugs found during smoke test | 2 |
| verify.md decision | PASS WITH WARNINGS (W1 `satisfies` style, W2 manual test pending at write time) |
| Test signal | 102 passed, 0 failed; 77-key parity test in `lib/i18n.test.ts` |
| Commit chain | `198afd2` foundation → `52dd423`…`6fefde3` page-by-page → `f5e8b30` test fix → `8125eaf` review fixes → `cfbd733` smoke-test fix |

---

## §1 Wins

- **Zero external dependencies.** The entire feature — context, catalog, key-parity enforcement — uses only TypeScript and React. No i18n library added to the bundle.

- **`const en: typeof vi` key-parity guard worked exactly as intended.** Running `pnpm typecheck` with a missing key produces an immediate compile error; the runtime test in `i18n.test.ts` adds a second defence. No key mismatch shipped.

- **SSR-safe hydration pattern was correct from the start.** `useState<Lang>('vi')` + `useEffect` localStorage read follows the existing `OnboardingContext` precedent. No hydration warnings, no flash of wrong language visible during testing.

- **`solve/page.tsx` LLM API constraint was respected.** The `localStorage.getItem('mathsnap_language')` read inside `runSolve()` was explicitly preserved (`cfbd733` for the type-cast fix still keeps the localStorage read). The LLM API call was never at risk.

- **Global Vitest mock in `vitest.setup.ts` was the right call.** Adding `vi.mock('@/contexts/LanguageContext')` once prevented 60+ test failures without requiring every test file to wrap renders in a `LanguageProvider`. The settings test local override handled the localStorage-stateful case cleanly.

---

## §2 Misses

- 🟡 **BottomNav Bookmarks label was hardcoded in the task spec itself.** Task 2.1 explicitly said `'Bookmark stays as-is'`. This was wrong — the nav should read "Bookmarks" in English. The code review subagent caught it, but the original plan contained the bug. **Root cause:** during spec/plan authoring, the Bookmarks nav entry was assumed to be a proper noun / icon label that needed no translation.

- 🟡 **StepCard `'Đáp án'` / `` `Bước ${step.index}` `` missed entirely.** `StepCard` was not listed in the plan's file map. It renders on the two most-important screens (solve + history detail) and both strings are user-facing. Caught by the code review subagent — but it should have been caught in plan authoring. **Root cause:** plan enumerated _pages_ but not shared components that render non-trivial UI strings.

- 🟡 **`OCR_TIMEOUT` message hardcoded in `lib/api.ts` not `ocr/page.tsx`.** The plan assumed all hardcoded strings were in JSX/component files. One error message was constructed in the API client (`lib/api.ts:55`) where there is no React context. Caught during manual smoke test (not by automated checks). **Root cause:** grep for Vietnamese string literals was not run during planning; audit was done by reading component files only.

- 📌 **`satisfies` constraint specified in spec but `const en: typeof vi` was implemented.** Both enforce the same compile-time guarantee; the choice is purely stylistic. Noted in verify.md as W1. No user impact.

---

## §3 Plan Deviations

| Task | Original scope | Actual scope | Why |
|---|---|---|---|
| Task 2 (BottomNav) | `'Bookmark'` hardcoded per spec | Added `navBookmarks` key, wired to `t[lang].navBookmarks` | Code review found the hardcoded string was wrong in EN |
| (Not in plan) | `StepCard` not listed | Added `lang` prop + `stepAnswer`/`stepLabel` keys | Code review identified it as the most user-visible gap |
| (Not in plan) | `OCR_TIMEOUT` in `lib/api.ts` | Added `ocrErrorTimeout` key, override in catch handler in `ocr/page.tsx` | Smoke test found the Vietnamese string at runtime |
| Task 12 solve | `as 'vi' | 'en'` cast | Replaced with `stored === 'en' ? 'en' : 'vi'` validation guard | Minor correctness improvement suggested by reviewer |

---

## §4 Skill / Workflow Compliance

| Skill | Used? |
|---|---|
| `superpowers:using-git-worktrees` | ✓ |
| `superpowers:subagent-driven-development` | ✓ |
| `superpowers:test-driven-development` (transitive) | ✓ |
| `superpowers:requesting-code-review` (transitive) | ✓ — spec + quality review dispatched per task |
| Final code reviewer subagent | ✓ — caught BottomNav + StepCard misses |
| `superpowers:finishing-a-development-branch` | Pending (retrospective → archive → PR in progress) |

### Deliberately Skipped Skills

None.

---

## §5 Surprises

- **`lib/api.ts` contained a user-visible string.** All previous assumptions placed UI text in component files. The `postOcr` abort timeout constructs an `ApiError` with a hardcoded Vietnamese message. This pattern (API client producing UI-facing text) is a potential source of future missed translations. No other instance was found in the current codebase, but it should be checked for any new API call that has client-side timeout handling.

- **Tests didn't catch the BottomNav and StepCard misses.** 102 tests passed while those two strings were wrong. The BottomNav test doesn't assert on the Bookmarks label text; no test renders `StepCard` with a real `lang` assertion. Automated tests are not a substitute for a component-level translation audit.

- **`react-hooks/set-state-in-effect` eslint-disable comment is a no-op.** The rule name doesn't exist in `eslint-plugin-react-hooks`. The comment was written because the linter output mentioned something that looked like this rule, but `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` are the real rule names. The comment is harmless but confusing.

---

## §6 Promote Candidates

- [ ] 🟡 **Shared components with user-visible strings must be in the file map**
  > **Why**: `StepCard` was absent from the plan's file map. Both `'Đáp án'` and `` `Bước N` `` rendered on the two primary content screens but were caught only by the code reviewer, not during planning.
  > **How to apply**: When auditing a bilingual/i18n change, grep `src/client/components/` for string literals before finalising the file map. Any component rendering non-trivial UI text must be in scope.
  → **Promote to** memory (project feedback)

- [ ] 🟡 **API clients can contain user-visible strings — audit `lib/api.ts` during i18n changes**
  > **Why**: `lib/api.ts:55` hardcoded a Vietnamese error message in an `ApiError` constructor. The standard component-file audit missed it; only the manual smoke test caught it.
  > **How to apply**: For any i18n feature, grep `src/client/lib/` for string literals alongside component files. Override API-originated messages in the component catch handler using `err.code` as the switch key.
  → **Promote to** memory (project feedback)

- [ ] 📌 **Plan spec constraint `'Bookmark stays as-is'` was wrong — nav labels need translation too**
  > **Why**: The plan explicitly said to leave the Bookmarks nav label hardcoded. This produced a visible bug in EN mode.
  > **How to apply**: Nav labels are UI strings like any other. When writing i18n task specs, do not exempt any visible text label without a concrete reason (e.g., it's a proper noun or icon-only). Default is: if a user reads it, it must be translated.
  → **Promote to** memory (project feedback)
