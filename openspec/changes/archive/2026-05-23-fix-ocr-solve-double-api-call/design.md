## Context

Next.js bilingual (vi/en) app. Two pages fire their backend API twice on mount.

**OCR page** (`src/client/app/(main)/ocr/page.tsx`):  
`runOcr` is a `useCallback` with `[croppedBlob, deviceId, lang]` as deps. `lang` is only used inside `.then()` / `.catch()` to build error strings — it is not passed to `postOcr()`. `LanguageContext` initialises `lang = 'vi'` then transitions to `'en'` after mount if `localStorage = 'en'`. This causes `runOcr` to get a new reference, and the effect `[croppedBlob, deviceId, runOcr]` re-fires, issuing a second `POST /ocr`. Affects all users with `localStorage = 'en'` in production.

**Solve page** (`src/client/app/solve/page.tsx`):  
`useEffect([ocrLatex, deviceId])` calls `void runSolve()` with no cleanup function. Next.js ≥ 13.4 defaults `reactStrictMode: true`. StrictMode fires effects twice (run → cleanup → run); without a cleanup, the first async call is not cancelled before the second starts. Both `POST /solve` requests reach the server simultaneously. Dev-only; production is unaffected.

## Goals / Non-Goals

**Goals:**
- Eliminate the second `POST /ocr` for `'en'`-locale users in production
- Eliminate concurrent duplicate `POST /solve` in dev/StrictMode
- Ensure OCR error strings are always in the user's actual locale
- Preserve retry-button behaviour on both pages

**Non-Goals:**
- Adding `AbortSignal` to `postSolve` / `api.ts` (separate follow-on change)
- Changing `LanguageContext` initialisation strategy
- Modifying `useDeviceId` or any hooks/contexts
- Any backend changes

## Decisions

**Decision 1 — `langRef` for OCR, not "just delete `lang` from deps"**  
Simply removing `lang` from deps without a ref would capture the pre-transition `'vi'`
value in the closure at call-time. By the time `.then()` / `.catch()` resolves, the
user's true locale (`'en'`) is settled in `langRef.current`. Reading `langRef.current`
inside the callbacks (not upfront) guarantees correct error strings regardless of when
`lang` settles.

**Decision 2 — `solveStartedRef` guard over `cancelled` flag**  
The `cancelled` flag approach (run → cleanup sets flag → re-run but skip state updates)
still sends two requests to the server. The `solveStartedRef` guard prevents the second
invocation entirely — zero second request. It resets naturally on remount (remount
re-initialises `useRef(false)`), so navigate-away-and-back works correctly. No cleanup
function is defined for the guard, which is intentional: a cleanup would reset the ref
before StrictMode's re-run, defeating the guard.

**Decision 3 — No changes to `api.ts`**  
`postSolve` has no `AbortSignal`. The `solveStartedRef` approach makes this irrelevant
for this change: the second request never starts. Adding `AbortSignal` to `postSolve`
is a valid follow-on improvement but is out of scope here.

## Risks / Trade-offs

**[Risk] `lang` read at resolution time could theoretically race a mid-session lang change**  
→ Mitigation: `lang` changes only on explicit user action (settings screen). OCR requests
complete in seconds. The window for a race is effectively zero in practice.

**[Risk] `solveStartedRef` guard blocks legitimate re-invocation if deps change mid-session**  
→ Mitigation: `ocrLatex` is set once before navigating to `/solve` and does not change.
`deviceId` transitions from `null` to a stable UUID during hydration; after that it is
constant. No legitimate mid-session dep change is expected. On the rare case of a full
remount, the ref resets.

**[Trade-off] In dev/StrictMode, the first `POST /solve` still reaches the server**  
The guard prevents the second invocation, so only call #1 is made. This is correct and
desired — the first call succeeds and its state updates apply.
