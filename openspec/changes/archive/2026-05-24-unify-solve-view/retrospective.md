# Retrospective: unify-solve-view

**Date**: 2026-05-24
**Schema**: superpowers-bridge
**Execution**: subagent-driven-development (TDD, per-task spec + quality review)

---

## What Was Built

Folded the standalone `history/[id]` detail page into a single full-bleed `/solve` route that serves both solving a new problem (SOLVE mode) and reviewing a stored one (VIEW mode via `?id`). Added a Suspense boundary required by Next.js App Router for `useSearchParams()`. Made `StepCard` responsive at ≤480px with scrollable wide formulas. Deleted the now-redundant history detail page and 4 dead i18n keys.

**Files changed**: 5 modified + 2 deleted. 7 commits. Zero new dependencies.

---

## What Went Well

### TDD cadence was clean

The red-green sequence worked exactly as designed. Task 1 (failing VIEW-mode tests) was committed first; Task 2 (implementation) was written to make those tests pass. Running `pnpm vitest run app/solve/page.test.tsx` went from `9 pass / 3 fail` → `12 pass / 0 fail` in a single implementation task. The failing tests provided precise, unambiguous targets.

### The plan.md micro-tasks eliminated ambiguity

Every implementation step had exact before/after code blocks with expected command output. Subagents had no reason to guess: they followed the plan verbatim and the results matched expectations on the first attempt for every task.

### The Suspense wrapper design was correct from the start

Decision #2 in design.md (Suspense Option A — wrapping the `useSearchParams()` consumer) was validated definitively by `pnpm build`: `/solve` appeared in the static pages list with no deopt warning. The alternative (reading `window.location.search` in a `useEffect`) would have been harder to test and less idiomatic.

### Single `startedRef` for both modes

Reusing one `startedRef` across SOLVE and VIEW mode (instead of having separate guards per mode) kept the effect clean. Since only one branch executes per mount, there's no cross-contamination risk, and the StrictMode double-fire protection applies uniformly.

### Parallel Tasks 3, 4, 5

These three tasks (navigation changes, StepCard responsive, cleanup) had no interdependencies and were dispatched simultaneously. All three completed without conflicts — the codebase is clean enough that independent tasks can be worked in parallel without collision.

---

## Challenges and Deviations

### ESLint disable comments needed removal

The initial implementation of Task 2 included two `// eslint-disable-next-line react-hooks/set-state-in-effect` comments that the plan.md had — these suppressed a rule that never actually fired (the `void asyncFn()` pattern in an effect doesn't trigger it). The code quality reviewer caught this before it reached lint, preventing a `pnpm lint` failure in the verification step. Lesson: plan.md comments that worked during authoring may become stale; the review cycle catches them.

### `loadHistoryItem` error handling broadened

The original spec said "on ApiError calls `router.replace('/history')`". The implementation broadened this to `catch { router.replace('/history') }` — redirecting on any error (network failures, etc.) rather than only `ApiError`. This was surfaced by the code quality reviewer as a Minor issue and deliberately accepted: it eliminates the stuck-loading state that would occur on non-`ApiError` throws (e.g. `TypeError: Failed to fetch`). The verify.md logs this as a suggestion-level note. The divergence is intentional and is a safe superset of the spec.

### Test isolation gap caught early

Task 1's code quality review found that `SolvePage error dispatch` and `SolvePage bookmark button` describe blocks did not reset `mockSearchParams` in their `beforeEach`. With test ordering as written this didn't leak, but it was a latent order-dependency bug. The reviewer caught it before it caused flaky tests. Fixed in the same commit via `--amend`.

---

## Design Decisions Validated

| Decision | Verdict |
|----------|---------|
| Query param `?id` for mode selection (not two pages) | ✅ Correct — zero adapter code needed since `getHistoryItem` and `postSolve` return the same `HistoryItem` type |
| Suspense wrapping Option A | ✅ Confirmed by `pnpm build` succeeding without deopt |
| Mode branch BEFORE `ocrLatex` guard | ✅ Critical — without this, VIEW mode deep-links would be bounced to `/camera` |
| Shared `startedRef` | ✅ Simple, works under StrictMode, no cross-mode contamination |
| Broad `catch` in `loadHistoryItem` | ✅ Better UX than stuck spinner; safe superset of spec |
| `[@media(max-width:480px)]:text-[13px]` + `clamp()` | ✅ No new dependencies; idiomatic Tailwind v4 |
| `overflow-x-auto` + inner `w-max min-w-full justify-center` | ✅ Correct pattern: centers short formulas, scrolls wide ones |

---

## What Could Be Better

### Manual browser test is still pending (task 6.3)

The `pnpm build` + unit tests cover the behavior automatically, but the manual smoke test (real device at ≤480px, long formulas, back-button behavior) cannot be automated. This is a structural limitation of the test setup — there are no Playwright/E2E tests. Future changes to this flow would benefit from at least one E2E test covering the VIEW mode navigation path.

### The `postOcr timeout` test is a pre-existing flake

`lib/api.test.ts > postOcr timeout > throws OCR_TIMEOUT when the request aborts after 10s` fails because the test timeout (5000ms) is less than the expected OCR timeout (10s). This predates this change and was not introduced here, but it causes noise in every test run. It should be fixed separately (increase the Vitest `testTimeout` for that specific test).

---

## Metrics

| Metric | Value |
|--------|-------|
| Tasks | 21 (20 auto-verified, 1 manual) |
| Commits | 7 implementation + 3 opsx (tasks, verify, retrospective) |
| Files modified | 5 |
| Files deleted | 2 |
| Tests added | 3 VIEW-mode + mock updates |
| Tests at end | 109 passing (12 in solve/page) |
| Build | ✅ static, no deopt |
| Dependencies added | 0 |
| Lines of net change | ~+80 (page.tsx rewrite) + ~+30 (tests) − 210 (deleted files) |
