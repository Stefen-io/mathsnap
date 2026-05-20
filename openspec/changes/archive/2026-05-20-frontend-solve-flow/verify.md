## Verification Report: frontend-solve-flow

### Summary

| Dimension    | Status                                      |
|--------------|---------------------------------------------|
| Completeness | 36/44 tasks ✓ — 8 browser/E2E tasks remain |
| Correctness  | 13/13 requirements covered ✓               |
| Coherence    | Design followed — 1 deviation noted (D4)   |

---

## Issues

### CRITICAL — Must fix before archive

**C1: Browser verification tasks 7.4–7.10 incomplete**

Tasks 7.4–7.10 are unchecked in `tasks.md`. These require running `pnpm dev` and verifying behavior in a browser. Each is verifiable by the developer in a single dev session:

- 7.4 — `X-Device-ID` header present on `/api/ocr` and `/api/solve` (Network tab)
- 7.5 — LaTeX textarea live-updates KaTeX render on `/ocr` (S-05)
- 7.6 — Confidence < 0.6 shows amber badge; ≥ 0.6 hides it
- 7.7 — Step cards independently expandable on `/solve` (S-07)
- 7.8 — Answer step has green left border + large formula
- 7.9 — `/solve` has no BottomNav rendered
- 7.10 — "Bài mới" resets context and returns home

**Recommendation:** Run `pnpm dev` from `src/client/`, navigate through the flow with a mocked or real backend, and check each item. Mark `- [x]` as each passes.

---

**C2: Manual E2E on real mobile (task 7.11) incomplete — Hard Floor**

Task 7.11 is marked "Hard Floor — cannot skip" in `tasks.md`. The full camera → crop → OCR → edit → solve → solution flow has not been verified on a real mobile device.

**Recommendation:** Test on an actual iOS/Android device against a deployed or locally-proxied backend. Mark `[x]` only after this passes end-to-end.

---

### WARNING — Should fix

**W1: Answer formula spec says `text-[40px] font-serif italic`; implementation uses `style={{ fontSize: '2.5rem' }}`**

`solution-viewer/spec.md` specifies the answer formula rendered at `text-[40px] font-serif italic`. The implementation in `solve/page.tsx:73` uses `style={{ fontSize: '2.5rem' }}` wrapping `<KaTeXRenderer />`. At the 16px root, `2.5rem` equals `40px` exactly — size matches. The `font-serif italic` classes are not applied.

Note: KaTeX injects its own CSS that overrides Tailwind utility classes applied to the wrapper — `font-serif italic` would have no visible effect on the rendered math. The `style={{ fontSize }}` approach is correct because KaTeX inherits font-size via em cascade. The spec line was aspirational; the implementation is functionally correct.

**Recommendation:** Update `solution-viewer/spec.md` to read "rendered at `40px` font size via `style={{ fontSize: '2.5rem' }}`" to reflect actual KaTeX behavior. No code change needed.

---

### SUGGESTION — Nice to fix

**S1: design.md D4 describes `useState + useEffect` but implementation uses `useSyncExternalStore`**

`design.md` (Decision D4) states: "The hook initialises with `useState(null)` and sets the real ID in `useEffect`." The actual implementation in `hooks/useDeviceId.ts` uses `useSyncExternalStore(noopSubscribe, () => getDeviceId(), () => null)`. This is a superior pattern — it avoids the `react-hooks/set-state-in-effect` lint rule and is semantically correct — but it diverges from the documented design decision.

**Recommendation:** Update `design.md` D4 to document `useSyncExternalStore` as the implementation approach and explain why it was chosen over `useState + useEffect` (avoids lint rule, cleaner semantics for read-only external store).

---

**S2: No unit tests for `api.ts`**

`device-id.ts` has `device-id.test.ts` with 4 test cases covering all scenarios. `api.ts` has no companion test file. The `ApiError` construction scenarios (envelope parsing, `retryable` default, name property) and the `handleError` fallback path are not covered by automated tests.

**Recommendation:** Consider adding `lib/api.test.ts` for the pure logic in `handleError` (parsing body, fallback to UNKNOWN). Not required to unblock archive but improves spec scenario coverage.

---

## Correctness Detail

All 13 spec requirements verified against implementation:

| Spec | Requirement | File | Status |
|------|-------------|------|--------|
| device-id-client | `getDeviceId` reads/generates UUID v4 | `lib/device-id.ts:1` | ✅ |
| device-id-client | `useDeviceId` SSR-safe, null before hydration | `hooks/useDeviceId.ts:1` | ✅ |
| api-client | `ApiError` class with `code`, `retryable`, `name` | `lib/api.ts:5` | ✅ |
| api-client | `postOcr` multipart with `X-Device-ID` | `lib/api.ts:40` | ✅ |
| api-client | `postSolve` JSON body with `X-Device-ID` | `lib/api.ts:52` | ✅ |
| camera-intake-flow | `CaptureContext` holds all four state fields | `contexts/CaptureContext.tsx:6` | ✅ |
| camera-intake-flow | `reset()` clears all four to null | `contexts/CaptureContext.tsx:26` | ✅ |
| formula-preview-edit | OCR page calls `postOcr` on mount, loading skeleton | `app/(main)/ocr/page.tsx:35` | ✅ |
| formula-preview-edit | Thumbnail + live KaTeX + URL revoke | `app/(main)/ocr/page.tsx:26` | ✅ |
| formula-preview-edit | Amber badge when confidence < 0.6 | `app/(main)/ocr/page.tsx:108` | ✅ |
| formula-preview-edit | "Giải bài này" CTA with ArrowRight, disabled guard | `app/(main)/ocr/page.tsx:120` | ✅ |
| solution-viewer | `solve/page.tsx` flat route, guards `ocrLatex`, fires `postSolve` | `app/solve/page.tsx:89` | ✅ |
| solution-viewer | S-06 skeleton + animated label; S-07 accordion; answer styling; error state; bottom bar | `app/solve/page.tsx:31` | ✅ |

---

## Final Assessment

**2 critical issues** — both are browser/E2E verification tasks that require developer action (run `pnpm dev` + device test). No code defects found. All 13 spec requirements are implemented correctly.

**Fix before archiving:** Complete tasks 7.4–7.11 by running the dev server and testing on a real mobile device. Then re-run `/opsx:verify` to confirm all tasks are checked.
