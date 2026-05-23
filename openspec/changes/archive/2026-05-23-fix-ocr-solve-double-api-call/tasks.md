## 1. OCR Page — Remove `lang` from `runOcr` deps

- [x] 1.1 Add `const langRef = useRef(lang)` and `langRef.current = lang` (inline sync, no extra effect) in `ocr/page.tsx`
- [x] 1.2 In `runOcr` `.then()` handler: replace all `lang` references with `const currentLang = langRef.current` read at the top of the callback
- [x] 1.3 In `runOcr` `.catch()` handler: replace all `lang` references with `const currentLang = langRef.current` read at the top of the callback
- [x] 1.4 Remove `lang` from the `useCallback` deps array (keep `croppedBlob` and `deviceId`)
- [x] 1.5 Verify `eslint-plugin-react-hooks` is satisfied (no new disable comments needed after removal)

## 2. Solve Page — Add `solveStartedRef` guard

- [x] 2.1 Add `const solveStartedRef = useRef(false)` in `solve/page.tsx`
- [x] 2.2 Inside the `useEffect`, after the `if (!deviceId) return` guard, add `if (solveStartedRef.current) return; solveStartedRef.current = true` before `void runSolve()`
- [x] 2.3 Confirm no cleanup function is added (intentional — a cleanup would reset the ref before StrictMode re-run)

## 3. Verification

- [x] 3.1 Run `vitest run` — all existing tests pass
- [ ] 3.2 In dev (`npm run dev`), open `/ocr` with `localStorage.setItem('mathsnap_language', 'en')` set: confirm DevTools Network shows exactly one `POST /ocr`
- [ ] 3.3 In dev, open `/solve`: confirm DevTools Network shows exactly one `POST /solve`
- [ ] 3.4 On OCR error state, confirm error message language matches the user's locale
- [ ] 3.5 On OCR error state, click Retry — confirm a single new `POST /ocr` fires
- [ ] 3.6 On Solve error state, click Retry — confirm a single new `POST /solve` fires
