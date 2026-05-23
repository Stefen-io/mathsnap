# Fix Hardcoded Vietnamese Messages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Vietnamese strings from server HTTP response bodies and client non-i18n source files, routing rate-limit error display through the existing i18n system.

**Architecture:** Server rate-limit error messages are replaced with English (they become debug/logging artifacts). The client adds `rateLimitBurst` and `rateLimitDaily` i18n keys, then maps `RATE_LIMITED` ApiErrors to those keys via `err.retryable` instead of passing `err.message` through to the UI.

**Tech Stack:** FastAPI + Python (server), Next.js + TypeScript + Vitest (client), pytest + uv (server tests)

---

## File Map

| File | Change |
|------|--------|
| `src/server/app/routers/solve.py` | Lines 41, 54 — replace VI strings with EN |
| `src/server/app/routers/ocr.py` | Lines 75, 90 — replace VI strings with EN |
| `src/server/app/main.py` | Lines 29, 71–72 — replace VI doc strings with EN |
| `src/client/lib/i18n.ts` | Add `rateLimitBurst` + `rateLimitDaily` to both `vi` and `en` |
| `src/client/lib/api.ts` | Line 55 — replace VI string with EN |
| `src/client/app/(main)/ocr/page.tsx` | Extend code-check to map `RATE_LIMITED` → i18n keys |
| `src/client/app/solve/page.tsx` | Add `localizedMessage` derivation for `RATE_LIMITED` |
| `src/client/app/solve/page.test.tsx` | Update assertion for `RATE_LIMITED` daily display text |
| `src/client/app/(main)/ocr/page.test.tsx` | Update `ApiError` constructor messages to English (cosmetic) |

**Server tests (`test_ocr_rate_limit.py`, `test_solve_rate_limit.py`) do not assert on message strings — no changes needed there.**

---

## Task 1: Server — Replace Vietnamese rate-limit messages

**Files:**
- Modify: `src/server/app/routers/solve.py:41,54`
- Modify: `src/server/app/routers/ocr.py:75,90`

- [ ] **Step 1: Update solve.py burst message (line 41)**

  In `src/server/app/routers/solve.py`, find this block (~line 38–44):
  ```python
  if not rate_limit.check_burst(str(device_id)):
      logger.warning("rate_limited device=%s... type=burst endpoint=solve", str(device_id)[:8])
      raise HTTPException(
          status_code=429,
          detail=ErrorResponse(
              code=RATE_LIMITED,
              message="Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.",
              retryable=True,
          ).model_dump(),
      )
  ```
  Change the `message` value to:
  ```python
              message="You are sending requests too fast. Please wait 1 minute.",
  ```

- [ ] **Step 2: Update solve.py daily message (line 54)**

  In the same file, find (~line 48–57):
  ```python
  if daily >= rate_limit.DAILY_SOLVE_LIMIT:
      logger.warning("rate_limited device=%s... type=daily endpoint=solve", str(device_id)[:8])
      raise HTTPException(
          status_code=429,
          detail=ErrorResponse(
              code=RATE_LIMITED,
              message="Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.",
              retryable=False,
          ).model_dump(),
      )
  ```
  Change the `message` value to:
  ```python
              message="You have reached today's limit. Please try again tomorrow.",
  ```

- [ ] **Step 3: Update ocr.py burst message (line 75)**

  In `src/server/app/routers/ocr.py`, find (~line 69–78):
  ```python
  if not rate_limit.check_burst(str(device_id)):
      logger.warning("rate_limited device=%s... type=burst endpoint=ocr", str(device_id)[:8])
      raise HTTPException(
          status_code=429,
          detail=ErrorResponse(
              code=RATE_LIMITED,
              message="Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.",
              retryable=True,
          ).model_dump(),
      )
  ```
  Change the `message` value to:
  ```python
              message="You are sending requests too fast. Please wait 1 minute.",
  ```

- [ ] **Step 4: Update ocr.py daily message (line 90)**

  In the same file, find (~line 84–93):
  ```python
  if daily >= rate_limit.DAILY_OCR_LIMIT:
      logger.warning("rate_limited device=%s... type=daily endpoint=ocr", str(device_id)[:8])
      raise HTTPException(
          status_code=429,
          detail=ErrorResponse(
              code=RATE_LIMITED,
              message="Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.",
              retryable=False,
          ).model_dump(),
      )
  ```
  Change the `message` value to:
  ```python
              message="You have reached today's limit. Please try again tomorrow.",
  ```

- [ ] **Step 5: Run server rate-limit tests**

  ```bash
  cd src/server && uv run pytest tests/test_ocr_rate_limit.py tests/test_solve_rate_limit.py -v
  ```
  Expected: all tests pass (they assert on `code` and `retryable`, not message strings).

- [ ] **Step 6: Fix OpenAPI doc strings in main.py**

  In `src/server/app/main.py`, find the `FastAPI(...)` call (~line 24–32):
  ```python
  app = FastAPI(
      lifespan=lifespan,
      title="MathSnap API",
      description=(
          "MathSnap — AI-powered math tutor. "
          "Nhận ảnh bài toán, trả về LaTeX (OCR) và lời giải từng bước (LLM)."
      ),
      version="1.0.0",
  )
  ```
  Replace the `description` with:
  ```python
      description=(
          "MathSnap — AI-powered math tutor. "
          "Receives a math problem image, returns LaTeX (OCR) and step-by-step solution (LLM)."
      ),
  ```

  Then find the `/health` endpoint description (~line 67–74):
  ```python
  @app.get(
      "/health",
      summary="Readiness check",
      description=(
          "Trả về `200 ok` khi pix2tex model đã load xong và sẵn sàng nhận request. "
          "Trả về `503 model loading` trong thời gian khởi động (~15-30s)."
      ),
      tags=["Infrastructure"],
  )
  ```
  Replace the `description` with:
  ```python
      description=(
          "Returns `200 ok` when the pix2tex model has loaded and is ready to accept requests. "
          "Returns `503 model loading` during startup (~15-30s)."
      ),
  ```

- [ ] **Step 7: Commit server changes**

  ```bash
  git add src/server/app/routers/solve.py src/server/app/routers/ocr.py src/server/app/main.py
  git commit -m "fix(server): replace hardcoded Vietnamese rate-limit messages with English"
  ```

---

## Task 2: Client — Add rate-limit i18n keys

**Files:**
- Modify: `src/client/lib/i18n.ts`

- [ ] **Step 1: Add keys to the `vi` object**

  In `src/client/lib/i18n.ts`, in the `vi` object, find the `// OCR` section and add two new keys after `ocrErrorGeneric` (or in a logical location, e.g. after the `// Solve` section near `solveErrorGeneric`). The cleanest place is a new comment block after `solveToastError`:

  After `solveToastError: 'Không thể tạo lời giải.',` add:
  ```typescript
    // Rate limiting
    rateLimitBurst: 'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.',
    rateLimitDaily: 'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.',
  ```

- [ ] **Step 2: Add keys to the `en` object**

  In the same file, in the `en` object, after `solveToastError: 'Unable to generate solution.',` add:
  ```typescript
    // Rate limiting
    rateLimitBurst: 'You are sending too fast. Please wait 1 minute.',
    rateLimitDaily: 'You have reached today\'s limit. Please try again tomorrow.',
  ```

- [ ] **Step 3: Run i18n key-parity test**

  ```bash
  cd src/client && npx vitest run lib/i18n.test.ts
  ```
  Expected: PASS — `Object.keys(t.en).sort()` equals `Object.keys(t.vi).sort()`.

  If TypeScript compilation is needed first:
  ```bash
  cd src/client && npx tsc --noEmit
  ```
  Expected: no errors (both `vi` and `en` have the same shape — `en: typeof vi` enforces this).

- [ ] **Step 4: Commit**

  ```bash
  git add src/client/lib/i18n.ts
  git commit -m "feat(i18n): add rateLimitBurst and rateLimitDaily translation keys"
  ```

---

## Task 3: Client — Map RATE_LIMITED in ocr/page.tsx

**Files:**
- Modify: `src/client/app/(main)/ocr/page.tsx:60-63`
- Modify: `src/client/app/(main)/ocr/page.test.tsx:78,93` (update mock message strings to English)

The page already maps `OCR_TIMEOUT` via code check. Extend this to also handle `RATE_LIMITED`.

- [ ] **Step 1: Update the catch block in ocr/page.tsx**

  Find lines ~60–64:
  ```typescript
      .catch((err: unknown) => {
        const info: OcrErrorInfo = err instanceof ApiError
          ? { code: err.code, message: err.code === 'OCR_TIMEOUT' ? t[lang].ocrErrorTimeout : err.message, retryable: err.retryable }
          : { code: 'UNKNOWN', message: t[lang].ocrErrorGeneric, retryable: false }
        setErrorInfo(info)
  ```
  Replace with:
  ```typescript
      .catch((err: unknown) => {
        const info: OcrErrorInfo = err instanceof ApiError
          ? {
              code: err.code,
              message: err.code === 'OCR_TIMEOUT' ? t[lang].ocrErrorTimeout
                      : err.code === 'RATE_LIMITED' ? (err.retryable ? t[lang].rateLimitBurst : t[lang].rateLimitDaily)
                      : err.message,
              retryable: err.retryable,
            }
          : { code: 'UNKNOWN', message: t[lang].ocrErrorGeneric, retryable: false }
        setErrorInfo(info)
  ```

- [ ] **Step 2: Run OCR page tests to confirm they pass**

  ```bash
  cd src/client && npx vitest run app/\(main\)/ocr/page.test.tsx
  ```
  Expected: ALL PASS.

  Reason: The test at line 86 asserts `'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.'` — which matches `t.vi.rateLimitBurst` exactly. The test at line 101 asserts `'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.'` — which matches `t.vi.rateLimitDaily` exactly. No assertion text changes needed.

- [ ] **Step 3: Update mock ApiError messages in ocr/page.test.tsx to English (cosmetic)**

  The ApiError constructor in tests still passes Vietnamese strings (the mocked "server response"). Since the client no longer uses `err.message` for RATE_LIMITED display, these don't affect test outcomes. Update them to English for consistency with the new server behavior.

  In `src/client/app/(main)/ocr/page.test.tsx`:
  - Line 78: change `'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.'` → `'You are sending requests too fast. Please wait 1 minute.'`
  - Line 93: change `'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.'` → `'You have reached today\'s limit. Please try again tomorrow.'`

- [ ] **Step 4: Run OCR page tests again to confirm still passing**

  ```bash
  cd src/client && npx vitest run app/\(main\)/ocr/page.test.tsx
  ```
  Expected: ALL PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/client/app/\(main\)/ocr/page.tsx src/client/app/\(main\)/ocr/page.test.tsx
  git commit -m "fix(ocr-page): map RATE_LIMITED errors to i18n keys instead of err.message passthrough"
  ```

---

## Task 4: Client — Map RATE_LIMITED in solve/page.tsx

**Files:**
- Modify: `src/client/app/solve/page.tsx:63-72`
- Modify: `src/client/app/solve/page.test.tsx:130,135`

- [ ] **Step 1: Update the failing test first (TDD)**

  In `src/client/app/solve/page.test.tsx`, find the RATE_LIMITED test (~line 128–138):
  ```typescript
  it('shows no button for RATE_LIMITED daily (retryable=false)', async () => {
    vi.mocked(postSolve).mockRejectedValue(
      new ApiError('RATE_LIMITED', 'Bạn đã dùng hết lượt hôm nay.', false)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nhập bài toán khác' })).toBeNull()
  })
  ```
  Replace with:
  ```typescript
  it('shows no button for RATE_LIMITED daily (retryable=false)', async () => {
    vi.mocked(postSolve).mockRejectedValue(
      new ApiError('RATE_LIMITED', 'You have reached today\'s limit. Please try again tomorrow.', false)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nhập bài toán khác' })).toBeNull()
  })
  ```

- [ ] **Step 2: Run solve page tests to confirm the updated test now fails**

  ```bash
  cd src/client && npx vitest run app/solve/page.test.tsx
  ```
  Expected: the `RATE_LIMITED daily` test FAILS (cannot find text `'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.'` because the page still uses `err.message`).

- [ ] **Step 3: Update the catch block in solve/page.tsx**

  Find the `catch (err)` block in `runSolve()` (~lines 63–73):
  ```typescript
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      const info: ErrorInfo = err instanceof ApiError
        ? { message: err.message, retryable: err.retryable }
        : { message: t[lang].solveErrorGeneric, retryable: true }
      setErrorCode(code)
      setError(info)
      setPageState('error')
      toast.error(err instanceof ApiError ? err.message : t[lang].solveToastError)
    }
  ```
  Replace with:
  ```typescript
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      const localizedMessage: string = err instanceof ApiError
        ? (err.code === 'RATE_LIMITED'
            ? (err.retryable ? t[lang].rateLimitBurst : t[lang].rateLimitDaily)
            : err.message)
        : t[lang].solveErrorGeneric
      setErrorCode(code)
      setError({
        message: localizedMessage,
        retryable: err instanceof ApiError ? err.retryable : true,
      })
      setPageState('error')
      toast.error(err instanceof ApiError ? localizedMessage : t[lang].solveToastError)
    }
  ```

- [ ] **Step 4: Run solve page tests to confirm all pass**

  ```bash
  cd src/client && npx vitest run app/solve/page.test.tsx
  ```
  Expected: ALL PASS, including the updated `RATE_LIMITED daily` test.

- [ ] **Step 5: Commit**

  ```bash
  git add src/client/app/solve/page.tsx src/client/app/solve/page.test.tsx
  git commit -m "fix(solve-page): map RATE_LIMITED errors to i18n keys instead of err.message passthrough"
  ```

---

## Task 5: Client — Fix Vietnamese string in api.ts

**Files:**
- Modify: `src/client/lib/api.ts:55`

- [ ] **Step 1: Replace the Vietnamese string**

  In `src/client/lib/api.ts`, find (~line 53–56):
  ```typescript
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError('OCR_TIMEOUT', 'Nhận dạng quá lâu, vui lòng thử lại hoặc nhập thủ công.', true)
      }
  ```
  Replace with:
  ```typescript
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ApiError('OCR_TIMEOUT', 'OCR timed out. Please try again or enter manually.', true)
      }
  ```

  Note: This string is never displayed — `ocr/page.tsx` checks `err.code === 'OCR_TIMEOUT'` and substitutes `t[lang].ocrErrorTimeout`. This is a consistency fix only.

- [ ] **Step 2: Commit**

  ```bash
  git add src/client/lib/api.ts
  git commit -m "fix(api): replace Vietnamese OCR timeout message with English"
  ```

---

## Task 6: Final Verification

- [ ] **Step 1: Run all server tests**

  ```bash
  cd src/server && uv run pytest -v
  ```
  Expected: ALL PASS.

- [ ] **Step 2: Run all client tests**

  ```bash
  cd src/client && npx vitest run
  ```
  Expected: ALL PASS, including `lib/i18n.test.ts` (key parity) and all page tests.

- [ ] **Step 3: Grep — verify no Vietnamese in server response files**

  ```bash
  grep -n -P "[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]" \
    src/server/app/routers/solve.py src/server/app/routers/ocr.py src/server/app/main.py
  ```
  Expected: no output (no Vietnamese characters in those files).

- [ ] **Step 4: Grep — verify no Vietnamese in client source files outside i18n.ts**

  ```bash
  grep -rn -P "[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]" \
    src/client/lib/api.ts src/client/app/solve/page.tsx src/client/app/\(main\)/ocr/page.tsx
  ```
  Expected: no output.

  Also verify only i18n.ts and test fixtures contain Vietnamese (expected):
  ```bash
  grep -rln -P "[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]" \
    src/client --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
  ```
  Expected: only `lib/i18n.ts`, `lib/i18n.test.ts`, test files, and fixture files — no production source files outside i18n.ts.
