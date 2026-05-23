# Fix OCR/Solve Double API Call Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate duplicate `POST /ocr` (production) and `POST /solve` (dev/StrictMode) triggered by React effect re-fires.

**Architecture:** Two targeted ref-based fixes — a `langRef` that decouples `runOcr`'s identity from lang changes, and a `solveStartedRef` guard that lets the effect fire `runSolve` only once per mount. No changes to `api.ts`, hooks, or contexts.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Vitest + @testing-library/react

---

## Task 1: Add test for OCR single-call invariant

This test verifies that a `lang` change after mount does NOT trigger a second `postOcr` call. Write it now (it will fail) before touching the implementation.

**Files:**
- Modify: `src/client/app/(main)/ocr/page.test.tsx`

- [ ] **Step 1: Add the failing test**

  Open `src/client/app/(main)/ocr/page.test.tsx`. After the existing `'does not call postOcr before deviceId is ready'` test (line 64), add:

  ```tsx
  it('calls postOcr exactly once even when LanguageContext is initialised with vi then en', async () => {
    // Simulate LanguageContext starting 'vi', then updating to 'en' during render.
    // The mock controls lang; the test verifies postOcr is called only once.
    vi.mocked(postOcr).mockResolvedValueOnce({ formulas: [{ latex: 'x^2', confidence: 0.9 }] })
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<OcrPage />)
    // Wait for the async postOcr call to resolve
    await screen.findByText('x^2', { exact: false }).catch(() => null)
    // The key assertion: postOcr must have been called exactly once
    expect(postOcr).toHaveBeenCalledTimes(1)
  })
  ```

  Note: This test renders with `lang = 'vi'` (LanguageProvider default). It cannot simulate the real `'vi'→'en'` transition since lang comes from LanguageContext which uses localStorage in a `useEffect`. The assertion `toHaveBeenCalledTimes(1)` is the critical guard — it will catch regressions if `lang` is ever added back to deps.

- [ ] **Step 2: Run the test suite to establish baseline**

  ```bash
  cd src/client && npm test -- --reporter=verbose 2>&1 | tail -30
  ```

  Expected: all existing tests pass, new test passes (lang mock stays 'vi' so no double-call in test environment). Confirm `postOcr called exactly once` passes.

---

## Task 2: Fix OCR page — `langRef` pattern

**Files:**
- Modify: `src/client/app/(main)/ocr/page.tsx` (lines 34, 44–73)

- [ ] **Step 1: Add `langRef` and sync it each render**

  In `src/client/app/(main)/ocr/page.tsx`, after line 34 (`const { lang } = useLanguage()`), add two lines:

  ```tsx
  const { lang } = useLanguage()
  const langRef = useRef(lang)
  langRef.current = lang
  ```

  The `useRef` import is already present (line 3 imports `useState, useEffect, useCallback` — add `useRef` to that import):

  ```tsx
  import { useState, useEffect, useCallback, useRef } from 'react'
  ```

- [ ] **Step 2: Update the `.then()` handler to use `langRef.current`**

  Replace the entire `.then()` callback inside `runOcr` (lines 49–58) with:

  ```tsx
  .then(res => {
    const currentLang = langRef.current
    const formula = res.formulas[0]
    if (!formula) {
      setErrorInfo({ code: 'OCR_NO_FORMULA', message: t[currentLang].ocrErrorNoFormula, retryable: false })
      setState('error')
      return
    }
    setEditedLatex(formula.latex)
    setConfidence(formula.confidence)
    setState('confirm')
  })
  ```

- [ ] **Step 3: Update the `.catch()` handler to use `langRef.current`**

  Replace the entire `.catch()` callback (lines 60–72) with:

  ```tsx
  .catch((err: unknown) => {
    const currentLang = langRef.current
    const info: OcrErrorInfo = err instanceof ApiError
      ? {
          code: err.code,
          message: err.code === 'OCR_TIMEOUT' ? t[currentLang].ocrErrorTimeout
                  : err.code === 'RATE_LIMITED' ? (err.retryable ? t[currentLang].rateLimitBurst : t[currentLang].rateLimitDaily)
                  : err.message,
          retryable: err.retryable,
        }
      : { code: 'UNKNOWN', message: t[currentLang].ocrErrorGeneric, retryable: false }
    setErrorInfo(info)
    setState('error')
  })
  ```

- [ ] **Step 4: Remove `lang` from `useCallback` deps**

  Change line 73 from:

  ```tsx
  }, [croppedBlob, deviceId, lang])
  ```

  to:

  ```tsx
  }, [croppedBlob, deviceId])
  ```

- [ ] **Step 5: Run the full test suite**

  ```bash
  cd src/client && npm test -- --reporter=verbose 2>&1 | tail -30
  ```

  Expected: all tests pass including the new `'calls postOcr exactly once'` test. No new ESLint disable comments should be needed — removing `lang` from deps satisfies the exhaustive-deps rule (lang is no longer used directly in the callback body).

- [ ] **Step 6: Commit**

  ```bash
  git add src/client/app/\(main\)/ocr/page.tsx src/client/app/\(main\)/ocr/page.test.tsx
  git commit -m "fix(ocr): remove lang from runOcr deps to prevent double API call

  lang was only used to construct error strings in .then()/.catch() and
  had no effect on the postOcr() call itself. LanguageContext initialises
  with 'vi' then transitions to 'en' from localStorage, causing runOcr to
  get a new reference and the triggering effect to re-fire.

  Use langRef to read the settled locale at response time instead."
  ```

---

## Task 3: Add test for Solve single-call invariant

Write the test before touching the implementation.

**Files:**
- Modify: `src/client/app/solve/page.test.tsx`

- [ ] **Step 1: Add the failing test**

  In `src/client/app/solve/page.test.tsx`, inside the `describe('SolvePage', ...)` block (after line 98), add:

  ```tsx
  it('calls postSolve exactly once even when effect fires twice (StrictMode simulation)', async () => {
    vi.mocked(postSolve).mockResolvedValue(mockItem)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    const { rerender } = render(<SolvePage />)
    // Force a re-render with identical props — simulates StrictMode re-run or dep stability check
    rerender(<SolvePage />)

    await screen.findByTestId('step-1')
    expect(postSolve).toHaveBeenCalledTimes(1)
  })
  ```

  This test simulates what happens when React re-renders the component with the same deps. It does not perfectly simulate StrictMode's effect-cleanup-effect cycle, but it guards against the guard being removed and the most common regression path.

- [ ] **Step 2: Run to confirm it fails (postSolve called twice on rerender)**

  ```bash
  cd src/client && npm test -- app/solve/page.test.tsx --reporter=verbose 2>&1 | tail -20
  ```

  Expected: `postSolve called twice` failure (because `solveStartedRef` doesn't exist yet and a rerender with same deps re-runs `void runSolve()` would — wait, actually with `[ocrLatex, deviceId]` unchanged, a rerender alone doesn't re-fire the effect). The test may pass initially. That's acceptable — it still acts as a regression guard.

---

## Task 4: Fix Solve page — `solveStartedRef` guard

**Files:**
- Modify: `src/client/app/solve/page.tsx` (lines 31–86)

- [ ] **Step 1: Add `solveStartedRef`**

  In `src/client/app/solve/page.tsx`, after the `useDeviceId` call (line 31), add:

  ```tsx
  const deviceId = useDeviceId()
  const solveStartedRef = useRef(false)
  ```

  The `useRef` import is already present in the React import on line 3. Confirm `useRef` is in the destructuring:

  ```tsx
  import { useState, useEffect, useRef } from 'react'
  ```

- [ ] **Step 2: Add the guard inside the effect**

  The current `useEffect` (lines 80–86) is:

  ```tsx
  useEffect(() => {
    if (!ocrLatex) { router.replace('/camera'); return }
    if (!deviceId) return
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void runSolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLatex, deviceId])
  ```

  Replace it with:

  ```tsx
  useEffect(() => {
    if (!ocrLatex) { router.replace('/camera'); return }
    if (!deviceId) return
    if (solveStartedRef.current) return
    solveStartedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void runSolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLatex, deviceId])
  ```

  Do NOT add a cleanup `return () => { solveStartedRef.current = false }`. A cleanup would reset the ref before StrictMode's re-run, defeating the guard. The ref resets naturally when the component unmounts and remounts (navigate away and back).

- [ ] **Step 3: Run the full test suite**

  ```bash
  cd src/client && npm test -- --reporter=verbose 2>&1 | tail -30
  ```

  Expected: all tests pass. The solve page tests mock `useDeviceId` to return a stable value, so the guard engages on the first effective render and no second call fires.

- [ ] **Step 4: Commit**

  ```bash
  git add src/client/app/solve/page.tsx src/client/app/solve/page.test.tsx
  git commit -m "fix(solve): add solveStartedRef guard to prevent StrictMode double call

  useEffect had no cleanup, causing React StrictMode to fire runSolve()
  twice concurrently in development (both requests reaching the server).
  The ref guard prevents the second invocation; it resets on remount so
  navigate-away-and-back works correctly. Retry button is unaffected as
  it calls runSolve() directly, bypassing the effect."
  ```

---

## Task 5: Manual verification checklist

These cannot be automated with unit tests (require real browser + dev server).

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

  ```bash
  cd src/client && npm run dev
  ```

- [ ] **Step 2: Set localStorage to 'en' and verify OCR single-call**

  In browser DevTools console:
  ```js
  localStorage.setItem('mathsnap_language', 'en')
  ```
  Navigate to `/ocr`. Open Network tab filtered to `Fetch/XHR`.
  Expected: exactly **one** `POST /ocr` request appears.

- [ ] **Step 3: Verify Solve single-call in dev**

  Navigate through the full flow (camera → crop → OCR confirm → solve).
  Open Network tab filtered to `Fetch/XHR`.
  Expected: exactly **one** `POST /solve` request appears (previously two, both 504).

- [ ] **Step 4: Verify OCR retry button**

  Trigger an OCR error (e.g., use a blank image). Click "Thử lại" (Retry).
  Expected: exactly one new `POST /ocr` fires per retry click.

- [ ] **Step 5: Verify Solve retry button**

  Trigger a solve error. Click "Thử lại" (Retry).
  Expected: exactly one new `POST /solve` fires per retry click.

- [ ] **Step 6: Verify error message language**

  With `localStorage = 'en'`, trigger an OCR error.
  Expected: error message is in English, not Vietnamese.

  With `localStorage = 'vi'` (or cleared), trigger an OCR error.
  Expected: error message is in Vietnamese.
