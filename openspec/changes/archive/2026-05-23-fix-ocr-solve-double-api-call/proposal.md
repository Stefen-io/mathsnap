## Why

The OCR and Solve pages each fire their backend API twice on mount. For `/ocr`, this is a production bug: users with `localStorage = 'en'` trigger a second `POST /ocr` every time the page loads, wasting server resources and rate-limit quota. For `/solve`, two concurrent `POST /solve` requests race in dev/StrictMode, producing 504 timeouts that mislead developers into thinking the solver is broken. Fixing now avoids accumulating rate-limit debt as the user base grows and removes a confusing dev experience that slows iteration.

## What Changes

**OCR page — `runOcr` callback deps**
- From: `lang` included in `useCallback` deps; `runOcr` gets a new reference when `LanguageContext` transitions from `'vi'` to `'en'`, causing the triggering effect to re-fire.
- To: `lang` removed from deps; `lang` is read via `langRef.current` inside `.then()` / `.catch()` at resolution time.
- Reason: `lang` is only used for error string construction, not for the `postOcr()` call itself. It should not influence callback identity.
- Impact: Non-breaking. Error strings remain correct; retry button unaffected.

**Solve page — effect cleanup**
- From: `useEffect([ocrLatex, deviceId])` has no cleanup; React StrictMode fires the effect twice with no guard.
- To: A `solveStartedRef` guard prevents the effect from invoking `runSolve()` more than once per mount.
- Reason: Eliminates the concurrent duplicate request in dev without touching `api.ts` or `runSolve`'s signature.
- Impact: Non-breaking. Dev-only improvement. Retry button bypasses the effect and is unaffected.

## Capabilities

### New Capabilities

None. This is a pure bugfix; no new user-facing capabilities are introduced.

### Modified Capabilities

None. Existing spec-level requirements for OCR and Solve pages are unchanged — the fix restores correct single-call behaviour that was always the intent.

## Impact

- `src/client/app/(main)/ocr/page.tsx` — add `langRef`, update `useCallback` deps and callback body
- `src/client/app/solve/page.tsx` — add `solveStartedRef`, update `useEffect` body
- No changes to `api.ts`, hooks, contexts, or backend
