## Design Summary

Two distinct double-API-call bugs in a Next.js bilingual (vi/en) math tutoring app.
Both are caused by React effect re-firing, but the root cause and affected environment
differ for each page.

**Bug 1 — OCR page (production):**  
`lang` is in `runOcr`'s `useCallback` deps but is only used to build error strings,
not passed to `postOcr()`. `LanguageContext` initialises with `'vi'` then sets `'en'`
from localStorage after mount. This causes `runOcr` to get a new reference → the
triggering effect re-fires → second `POST /ocr`.

**Bug 2 — Solve page (dev/StrictMode only):**  
`useEffect([ocrLatex, deviceId])` has no cleanup. React StrictMode fires effects twice.
Without a cleanup to guard or abort, two concurrent `POST /solve` requests reach the
server simultaneously.

## Alternatives Considered

### Option A1 (Chosen): `langRef` — read lang inside async callbacks

- **Approach**: Add `const langRef = useRef(lang); langRef.current = lang` (synced each
  render). Remove `lang` from `useCallback` deps. Read `langRef.current` inside
  `.then()` / `.catch()` at resolution time.
- **Pros**: Error strings always in the correct language (reads the *settled* lang value
  after the async call resolves, not the pre-transition 'vi' value). No extra `useEffect`.
  Idiomatic pattern.
- **Cons**: Minimal — slightly less obvious than inline `lang` usage.

### Option A2 (Rejected): Delete `lang` from deps, accept stale closure

- **Approach**: Just remove `lang` from `useCallback` deps and leave the closure as-is.
- **Cons**: The captured `lang` is `'vi'` at call-time for `'en'` users. Error messages
  would display in the wrong language. Incorrect.

### Option B1 (Chosen): `solveStartedRef` guard — no cleanup

- **Approach**: `const solveStartedRef = useRef(false)`. In the effect, guard with
  `if (solveStartedRef.current) return; solveStartedRef.current = true` before
  `void runSolve()`. No cleanup function.
- **Pros**: Prevents the second request from starting entirely (1 server call total in
  dev). Ref resets on remount. Retry button bypasses the effect → unaffected.
- **Cons**: If deps `[ocrLatex, deviceId]` change legitimately mid-session (not expected
  in practice), the guard prevents re-run. Acceptable given the page's navigation model.

### Option B2 (Rejected): `cancelled` flag + inline async wrapper

- **Approach**: `let cancelled = false`; inline `runSolve` logic with
  `if (cancelled) return` guards after each await; `return () => { cancelled = true }`.
- **Cons**: Both requests still reach the server (StrictMode fires first, cleanup
  cancels state updates only). Requires inlining `runSolve` logic, duplicating code.
  More complex for no benefit over B1.

### Option B3 (Out of scope): AbortSignal through `postSolve`

- **Approach**: Add `AbortSignal` to `postSolve` and thread it through the effect.
- **Cons**: Larger change, touches `api.ts`. Deferred as a follow-on.

## Agreed Approach

**Fix A — OCR**: `langRef` pattern. Remove `lang` from `runOcr` deps. Read
`langRef.current` inside `.then()` / `.catch()` callbacks. Eliminates the production
double-call for `'en'` users with zero language-correctness regression.

**Fix B — Solve**: `solveStartedRef` guard. Prevents the second effect invocation
from firing in dev/StrictMode. No change to `runSolve` signature or `api.ts`.

## Key Decisions

- **Scope**: Only `ocr/page.tsx` and `solve/page.tsx`. No changes to `api.ts`, hooks,
  or contexts.
- **AbortSignal for `postSolve`**: Explicitly deferred to a follow-on change.
- **`langRef.current` read location**: Inside async callbacks (resolution time), not
  at the start of `runOcr` (call time). This ensures `'en'` users get correct
  error strings even though lang transitions after mount.
- **`solveStartedRef` no-cleanup**: Intentional. Cleanup would reset the ref,
  defeating the StrictMode guard. The ref resets naturally on component remount.

## Open Questions

None. Design is fully resolved.
