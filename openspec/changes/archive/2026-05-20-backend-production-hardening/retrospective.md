# Retrospective: backend-production-hardening

> Written: 2026-05-20 (after verify passed)
> Commit range: `de053a37..5bacf35`
> Worktree: `.claude/worktrees/backend-production-hardening` (branch `worktree-backend-production-hardening`)

---

## 0. Evidence

- **Commit range**: `de053a37..5bacf35` (6 commits)
- **Diff size**: +373 / -8 lines across 11 files
- **Tasks done**: 25/28 (`grep -cE '^\s*- \[x\]'` tasks.md → 25; 3 manual tasks deferred)
- **Active hours**: ~1 session (subagent-driven parallel execution)
- **Subagent dispatches**: 14 (implementer + spec reviewer + code quality reviewer × 4 tasks, + 1 fix subagent, + 1 final reviewer)
- **New external dependencies**: none (all stdlib: `re`, `os`, `time`, `collections`, `datetime`)
- **Bugs encountered post-merge**: 0
- **OpenSpec validate state at archive**: PASS (this change: valid; pre-existing spec errors in unrelated capabilities)
- **Test coverage signal**: 17 pytest tests, 0 failures (9 unit + 4 OCR endpoint + 4 solve endpoint)

Commit chain (時序):

```
de053a37 [base] docs: add OPSX sync command...
4a9a523  chore(server): set up test infrastructure for rate limiting
6f8b7b2  feat(server): add rate_limit module with burst window, daily count, latex sanitize
b5d8a04  feat(server): add rate limiting to /api/ocr endpoint
b0ff42c  feat(server): add rate limiting and latex sanitization to /api/solve
7ce35f6  chore(server): add rate limit env vars to .env.example
5bacf35  docs(server): clarify rate limit approximation and single-worker constraint
```

---

## 1. Wins

- **Zero new runtime dependencies**: All rate limiting logic implemented using Python stdlib (`collections.defaultdict`, `time.monotonic`, `re`). No Redis, no python-ratelimit, no third-party packages — Dockerfile unchanged, deploy risk minimized.

- **TDD discipline held across all tasks**: Each task followed RED → GREEN → REFACTOR exactly. 9 unit tests for `rate_limit.py`, 4 OCR endpoint tests, 4 solve endpoint tests — all written before the implementation they test. Subagent-driven-development enforced TDD independently per task.

- **Burst check short-circuits before DB call**: The check order (in-memory burst first, SQL daily second) was verified both by design and by a dedicated test (`test_solve_burst_check_runs_before_daily_check` asserts `mock_daily.assert_not_called()`). Each rate-limited burst request avoids a Supabase round-trip (~10-20ms saved per blocked request).

- **Sanitization flows through all downstream code paths**: `sanitize_latex()` result is used in `ainvoke`, `HistoryItem`, and `_persist` closure — not just in the LLM call. Verified by code review and spec review.

- **Single Supabase client per request**: The `client` created for daily count is reused in `_persist()` closure rather than creating a second connection. Clean optimization discovered during plan→implementation alignment.

- **HTTPException handler unlocked flat error format**: The plan's tests assumed `body["code"]` (flat), but FastAPI wraps HTTPException detail in `{"detail": {...}}` by default. The implementer correctly identified this gap and added a minimal custom handler in `main.py` (lines 48-52) that makes the API consistent and testable. This also fixes the existing error response format for all endpoints (not just new rate-limit errors).

- **Design decisions documented at call site**: D2 (OCR daily approximation) and the single-worker constraint are now documented as comments in the code (`ocr.py:60-61`, `rate_limit.py:10-11`). Future developers won't rediscover these trade-offs from scratch.

---

## 2. Misses

- **Log output not tested**: `logger.warning(...)` calls exist in `ocr.py` and `solve.py` for rate limit events, but no test captures or asserts them. The spec says "system SHALL emit a WARNING log entry" — this assertion is satisfied in production but not in the test suite. Follow-up: add `caplog` fixture tests in the next maintenance cycle.

  ```python
  # Example test (not yet added):
  def test_ocr_burst_log(client, caplog):
      with caplog.at_level(logging.WARNING, logger="app.routers.ocr"):
          with patch("app.rate_limit.check_burst", return_value=False):
              client.post("/api/ocr", ...)
      assert "type=burst" in caplog.text
      assert "endpoint=ocr" in caplog.text
  ```

- **Window-expiry scenario not covered by test**: The spec scenario "Request after window expires is allowed" has no test. Testing real time windows requires `freezegun` or mocking `monotonic()` — not included in this cycle. The sliding window cleanup logic is exercised indirectly by unit tests but the expiry path is untested.

- **tasks.md section §3 wording misleads**: Tasks 3.1-3.3 reference adding `count_daily_solves` to `supabase.py`. The implementation correctly placed it in `rate_limit.py` per plan.md, but the tasks.md checkboxes were marked complete with the supabase.py framing. Future readers may be confused. The tasks.md should have noted the plan.md deviation.

---

## 3. Surprises

- **FastAPI HTTPException wrapping was a hidden assumption**: The plan's test assertions used `body["code"]` (flat dict), implying a custom HTTPException handler. But neither plan.md nor tasks.md mentioned modifying `main.py`. The implementer discovered this gap during Task 3 execution and resolved it correctly. The plan was implicitly correct — FastAPI projects typically do have custom exception handlers — but the plan didn't make it explicit.

- **conftest.py imports rate_limit before it exists**: The plan creates `conftest.py` with `import app.rate_limit as rl` in Task 1, but `rate_limit.py` doesn't exist until Task 2. This required creating a minimal stub `_burst = defaultdict(list)` in Task 1 to satisfy the import. The plan didn't mention this dependency — it was resolved by the implementer with the right judgment call.

- **OCR daily limit is semantically an approximation, not a real limit**: The final code review caught that `DAILY_OCR_LIMIT` checks `history_items` (which only OCR write when solve also runs). A device doing pure OCR without solving is never daily-limited. This was an explicit design decision (D2) but the variable name `DAILY_OCR_LIMIT` overpromised. Adding a code comment clarified intent without changing behavior.

---

## 4. Process Notes

- **Subagent-driven-development overhead was worth it**: 14 subagent dispatches for 4 implementation tasks. Each task had 3 phases (implementer → spec reviewer → quality reviewer). The spec compliance review for Task 3 caught that the plan's OCR test was missing `get_supabase` mocking — this would have caused KeyError failures in the daily limit test. The final review caught the D2 semantic gap.

- **Two-phase review caught real issues**: Spec reviewer → quality reviewer order proved valuable. Spec reviewer focused on requirements completeness; quality reviewer focused on architecture, thread safety, and closure semantics. Different lenses found different issues.

- **verify.md produced the §7 gap analysis**: The deferred-dogfood table surfaced that log testing (7.3) was a real gap while sanitization testing (7.4) was already covered. Without this explicit mapping, the gap might have been dismissed as "just manual testing."
