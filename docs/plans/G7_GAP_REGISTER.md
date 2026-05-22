# G7 Gap Register — 2026-05-22

Measurement-only. No fixes applied. Input artifact for `/opsx:propose G7 audit-and-release`.

---

## Chiều 1: Specs vs Codebase

### 1A. FR Status

| FR | Name | Spec says | Codebase reality | Gap? |
|---|---|---|---|---|
| FR-1a | Camera input | getUserMedia, capture → crop | useCamera.ts:18 getUserMedia; camera/page.tsx:10-16 live `<video>`+shutter+flip → /crop | **Partial** — capture works; no unsupported-API guard & no permission-denied fallback (useCamera.ts:22 silently retries, no catch surfacing fallback UI) |
| FR-1b | Upload from library | file picker → crop | page.tsx:54-60 hidden `<input type=file accept=image/*>`; page.tsx:18-27 2MB guard → router.push('/crop') | **None (Full)** — minor: no toast for wrong-type beyond accept attr |
| FR-1c | Manual LaTeX | text + KaTeX preview + confirm | manual/page.tsx textarea + real-time KaTeX (:55), disabled-when-empty (:28) → /solve | **None (Full)** |
| FR-1d | Crop & rotate | react-easy-crop, 90° rotate | crop/page.tsx:5 real react-easy-crop; pan+zoom :56-62 | **Partial** — crop works; rotate missing (no rotation state, no rotate button) |
| FR-2 | OCR | POST /api/ocr, 10s timeout | ocr/page.tsx:45 postOcr; backend routers/ocr.py:21; skeleton :77-91 | **Partial** — flow works; no 10s timeout (no AbortController in lib/api.ts, no server async guard); no explicit "Nhập thủ công" fallback from error |
| FR-3 | Confirm formula | render + editable LaTeX + live preview | ocr/page.tsx:115-162 KaTeX render + editable textarea :139 → live re-render | **None (Full)** |
| FR-4 | Solve | POST /api/solve + LCEL | solve/page.tsx:50 postSolve; LCEL services/solver.py:17-32; structured steps | **None (Full)** |
| FR-5 | Progressive Disclosure | 3-state per step + "Xem tất cả" | solve/page.tsx:31 only step 1 open; StepCard.tsx:13-78 open/answer visual | **Partial** — locked/open/answer works; "Xem tất cả" missing; history detail regression: history/[id]/page.tsx:22 opens only step 1 (AC-6 wants all-open from history) |
| FR-6 | History | GET /api/history, swipe-delete, empty | history/page.tsx:30 getHistory; swipe-delete :111-121; empty :67-79 | **None (Full)** |
| FR-7 | Bookmark | PATCH .../bookmark, toggle | lib/api.ts:101; optimistic toggle solve/page.tsx:143-163; backend history.py:65-82 | **None (Full)** — see 1C note: server returns full item vs SD's minimal `{isBookmarked}` |
| FR-8 | Bilingual | i18n + toggle + LLM inject | toggle→localStorage settings/page.tsx:8-17; LLM inject solver.py:13 via solve.py:64 | **Partial** — LLM injection + toggle work; UI i18n missing (no next-intl, all labels hardcoded Vietnamese; AC-2 wants instant UI swap) |
| FR-9 | Deploy | public URL, vercel.json + Dockerfile | vercel.json + Dockerfile present; PHASE_2.5:144 notes live Vercel+Railway URLs | **None (Full)** |
| FR-10 | Rate limit | daily 20 + burst 5/min | rate_limit.py:13-15,22-45; applied OCR :48-71 + solve :35-57 | **None (Full)** |
| FR-11 | Persist | Supabase INSERT + deviceId scope | device-id.ts:1-10 UUID; background INSERT solve.py:104-124; reads scoped history.py:16-25 | **None (Full)** |

**Summary: 8/14 Full | 6 Partial | 0 Missing** (Partial: FR-1a, FR-1d, FR-2, FR-5, FR-8)

**M4 blockers (from Hard Floor, PHASE_2.5 §9.3):**
- FR-5 history-detail regression (history/[id]/page.tsx:22) — Hard Floor screen S-07 opens only step 1 from History/Bookmark path, violating AC-6.
- FR-2 no client OCR timeout — slow OCR hangs past 10s, never transitions to S-10.
- FR-1a camera fallback missing — mitigated by FR-1b (upload) satisfying "≥1 input method."
- FR-8 UI i18n — P1, non-blocking for Hard Floor.

---

### 1B. NFR Status

NFRs enumerated from PRD §6.2: NFR-1 Performance, NFR-2 Accessibility, NFR-3 Responsive, NFR-4 API/Privacy, NFR-5 Browser/Camera, NFR-6 Deploy/Availability, NFR-7 Security.

| NFR | Spec | Evidence | Verdict |
|---|---|---|---|
| NFR-1 | OCR ≤10s, LLM ≤15s, FCP ≤1.5s | LLM: solver.py:28 `ChatOpenAI(timeout=14)`. OCR: no timeout (client lib/api.ts no AbortController, server ocr.py:88 no async guard). FCP: not enforced in code | **PARTIAL** — LLM 14s server-side ok; OCR has no timeout at all; FCP needs Lighthouse |
| NFR-2 | WCAG 2.1 AA | aria present camera/page.tsx:39,47, OnboardingOverlay.tsx:64-66, BottomNav.tsx:29; Home CTAs lack aria-label page.tsx:37-68; touch targets mostly h-12/48px | **PARTIAL** — partial aria; full audit not static-verifiable |
| NFR-3 | Mobile-first 320–767; desktop ≥1024 sidebar | (main)/layout.tsx:7 max-w-[480px]; viewport auto via Next.js; desktop sidebar (PRD §5.2) not built — bottom nav on all sizes | **PARTIAL** — mobile solid; desktop layout gap (cosmetic) |
| NFR-4 | rate limit + deviceId + no image persist | rate_limit.py; device-id.ts UUID; ocr.py:76,88 in-memory PIL, never written | **PASS** |
| NFR-5 | Camera fallback unsupported/denied | useCamera.ts:14-28 swallows errors, no "unavailable" state; Home "Chụp ảnh" page.tsx:37-44 always visible | **FAIL** — neither hide-on-unsupported nor permission-denied guidance implemented |
| NFR-6 | 24/7, cold start ≤3s, free tier | Vercel+Railway live (PHASE_2.5:144); Dockerfile+vercel.json; UptimeRobot D8 pending (PHASE_2.5:303) | **PARTIAL** — deployed; warmup/cold-start not verifiable statically |
| NFR-7 | Keys never in frontend | .env.example client only `NEXT_PUBLIC_API_URL`; secrets server-only; api.ts no key refs | **PASS** |

---

### 1C. API Contract Delta

All 7 endpoints present and matching SD §4.2–4.7:

- `POST /api/ocr` ✅ multipart, MIME+2MB guard (ocr.py:27,38-46) — but hardcodes `confidence=1.0` (ocr.py:111); pix2tex's real confidence is never read/returned.
- `POST /api/solve` ✅ LCEL `ainvoke` (solve.py:63), background Supabase INSERT (solve.py:124→supabase.py:35), camelCase via `model_dump(by_alias=True)`.
- `GET /api/history` ✅ pagination page/limit(le=50)/bookmarked (history.py:17-21), device-scoped (supabase.py:48).
- `GET /api/history/{id}` ✅ exists, device-scoped, leak-safe 404 (history.py:28,37-43).
- `DELETE /api/history/{id}` ✅ 204, dual-filter id+device (history.py:47, supabase.py:84-89).
- `PATCH /api/history/{id}/bookmark` ✅ explicit value (not implicit toggle), correct — but returns full `HistoryItem` vs SD §4.7 minimal `{isBookmarked}` (richer than spec; client consumes it as HistoryItem).
- `GET /health` ✅ 200/503 readiness guard on `ocr_model` (main.py:67-78).

**Error codes:** 10/10 implemented. All defined in errors.py:3-12: `INVALID_IMAGE`, `INVALID_DEVICE_ID`, `INVALID_REQUEST`, `OCR_NO_FORMULA`, `HISTORY_NOT_FOUND`, `RATE_LIMITED`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `LLM_CONTENT_POLICY`, `INTERNAL_ERROR`.

**Caveat:** `INTERNAL_ERROR` is imported in ocr.py:9 but never raised there — OCR router has no catch-all except, so unexpected OCR exceptions escape as unstructured 500s.

---

### 1D. Data Contract

**camelCase transform:** PASS. The two models needing snake→camel both carry `alias_generator=to_camel`: `SolutionStep` (solution.py:6), `HistoryItem` (history.py:13). Routers serialize with `model_dump(by_alias=True, mode="json")`. Models without it (`OcrResponse`, `ErrorResponse`, `HistoryListResponse`, `BookmarkRequest`) have only single-word fields → no transform needed; `BookmarkRequest` uses explicit `Field(alias="isBookmarked")`.

**TS types match:** PASS. Both SD §3.7 types exist (types/history.ts:1-7,9-17). All field pairs verified PASS: `isAnswer↔is_answer`, `solutionSteps↔solution_steps`, `createdAt↔created_at`, `deviceId↔device_id`, `isBookmarked↔is_bookmarked`. No missing types, no field-name mismatches.

---

### 1E. Rate Limiting

- 2-layer implemented: YES. Daily SQL COUNT (rate_limit.py:33-45), in-memory burst sliding window 60s (rate_limit.py:22-30, `_burst` dict :18).
- Both endpoints: YES. OCR (ocr.py:48,62) and solve (solve.py:35,47), burst-then-daily order.
- Distinguishable daily vs burst: YES. Same code `RATE_LIMITED` (per SD §4.8) but differentiated by `retryable` (burst=true / daily=false) + distinct Vietnamese messages (ocr.py:53-56,68-71; solve.py:41-43,53-56).

---

## Chiều 2: Figma vs Codebase

### 2A. Screen Coverage

| Screen | Production file | Coverage |
|---|---|---|
| S-01 Home | (main)/page.tsx | Partial — CTAs present; marketing hero/gradient/feature-cards dropped; prod adds real file picker |
| S-02 Camera | (main)/camera/page.tsx | Partial — real getUserMedia vs Figma mock; flash/viewfinder framing/desktop drop-zone absent |
| S-03 Crop | (main)/crop/page.tsx | Partial — real react-easy-crop; rotate/instructional copy/desktop panel absent |
| S-04 OCR Loading | (main)/ocr/page.tsx | Full |
| S-05 Formula Preview | (main)/ocr/page.tsx | Full — folded into confirm state (matches Figma); prod renders real KaTeX |
| S-06 Solution Loading | app/solve/page.tsx | Full |
| S-07 Solution Detail | app/solve/page.tsx | Partial — accordion + bookmark + actions present; dedicated green answer block & desktop 2-col absent |
| S-08 History | (main)/history/page.tsx | Full — desktop grid variant not reproduced (mobile-only) |
| S-09 Bookmarks | (main)/bookmarks/page.tsx | Full — desktop grid variant not reproduced |
| S-10 Error State | inline in ocr/solve | Partial — Figma's red AlertCircle card + 3 exits → prod plain text + 1 button; but prod logic exceeds (retryable, content-policy) |
| S-11 Manual LaTeX | (main)/manual/page.tsx | Full — near 1:1, real KaTeX |
| S-12 Onboarding | components/OnboardingOverlay.tsx | Partial — 3 steps/dots/skip present; gradient bg, motion crossfade, Escape-dismiss, step icons differ |
| S-13 Settings | (main)/settings/page.tsx | Partial — toggle + info match; "Xem lại hướng dẫn" is a dead button (settings/page.tsx:62); label "Language" vs "Ngôn ngữ" |
| S-14 Problem Selector | — | **CUT** — confirmed; ocr/page.tsx:47 takes formulas[0] only, no route |

**Summary (14 rows): 6 Full | 7 Partial | 0 Missing | 1 Cut**

---

### 2B. Component Delta

| Figma component | Production | Gap |
|---|---|---|
| BottomNav | BottomNav.tsx | Minor — prod solid bg-white (no backdrop-blur), no pb-safe, no z-index; hides on capture routes (prod-only); "Trang chủ" vs "Home" |
| OnboardingOverlay | OnboardingOverlay.tsx | Moderate — no gradient/motion/Escape; adds role=dialog/aria; hook API differs |
| OnboardingStep | OnboardingStep.tsx | Moderate — contract differs: Figma `{Icon,...,customContent}` vs prod `{title,description,illustration}` |
| PaginationDots | PaginationDots.tsx | Minor — no active/inactive size animation |
| KaTeXRenderer | KaTeXRenderer.tsx+Impl.tsx | Upgrade — Figma mock regex→Unicode replaced by real KaTeX; visual diverges from Figma's italic-text |

---

### 2C. Styling Alignment

1. **Color tokens** — Match. Both share vanilla shadcn tokens; brand hexes `#18E299`/`#0d0d0d`/`#d4fae8` identical inline. Prod additionally codifies `--color-brand*` vars (globals.css:75-77); Figma never tokenizes brand green.
2. **Typography** — Match. Both Inter `--font-sans`; prod adds real Geist Mono (Figma falls back to system mono); Figma serif formulas → prod KaTeX.
3. **Border radius** — Match. Both `--radius: 0.625rem`; pill buttons, 16px cards consistent.
4. **Spacing / Bottom Nav** — Match. Figma `h-[64px]` = prod `h-16`; both `max-w-[480px]`. Minor: prod nav omits `pb-safe`.
5. **Dark mode** — Major diff (status). Prod ships working next-themes provider + "press D" toggle (theme-provider.tsx:37-69); Figma defines `.dark` but never wires it. Neither's screens honor it — both hardcode light hexes instead of semantic tokens.

**Overall:** Minor diff. Tokens/fonts/radius/spacing/brand align functionally; divergences are brand-var codification, serif→KaTeX, and dark-mode wiring asymmetry (dormant in both at screen level).

---

### 2D. Interaction Gaps

Figma `mockOcrService.ts` simulates: (1) fail/no-recognition `OCR_FAIL`, (2) multiple formulas → S-14, (3) single formula → S-05, (4) empty preview. No low-confidence, no network-vs-no-formula distinction.

Production coverage:
- No-formula ✅ (ocr.py → `OCR_NO_FORMULA`, ocr/page.tsx:48-51)
- Single formula ✅ (ocr/page.tsx:52-55)
- Low-confidence — frontend has badge `confidence < 0.6` (ocr/page.tsx:133-137) but it's **dead code** (backend always sends `1.0`)
- Typed/network errors ✅ — richer than mock (`ApiError` code+retryable)
- Multiple formulas — **NOT handled** (the one real interaction gap; `formulas[0]` only, consistent with S-14 cut)

---

## Overall Verdict

**Ready to release (M4)? CONDITIONAL.** The core flow (input → OCR → confirm → solve → history/bookmark) works end-to-end with full backend contract fidelity (10/10 error codes, camelCase PASS, types PASS, rate limiting complete). But four correctness gaps touch Hard Floor screens.

### Blockers

1. **FR-5 history-detail regression** — history/[id]/page.tsx:22 opens only step 1 from History/Bookmark (violates AC-6, Hard Floor S-07).
2. **OCR has no timeout anywhere** — client (no AbortController) nor server; slow OCR hangs past 10s, never reaches S-10 (FR-2 / NFR-1).
3. **NFR-5 camera fallback FAIL** — useCamera.ts swallows errors, Home camera button always shown; degrades on no-camera devices (mitigated by upload).
4. **Low-confidence badge is dead code** — backend ocr.py:111 hardcodes `confidence=1.0`, frontend gates badge on `< 0.6`. Either wire real pix2tex confidence or remove the UI.

### Accepted gaps (known, intentional)

- S-14 Problem Selector CUT → multi-formula falls to `formulas[0]`.
- FR-8 UI i18n (next-intl absent; LLM injection works) — P1.
- Desktop layouts (sidebar, 2-col solution/history) — mobile-first scope.
- Figma marketing hero / decorative framing simplified.
- Dark mode dormant at screen level (hardcoded light hexes).

### Surprise gaps (highest-value input for G7 propose)

1. **Low-confidence badge dead code** — a contract built but never honored end-to-end (backend=1.0, UI gates <0.6).
2. **FR-5 history regression** — easy-to-miss `Set([1])` init bug.
3. **OCR timeout entirely absent** — only Solve has one (14s server-side).
4. **`INTERNAL_ERROR` imported but unraised in OCR router** — unexpected OCR exceptions escape as unstructured 500s.
5. **Bookmark response over-returns** — full `HistoryItem` vs SD §4.7 minimal `{isBookmarked}` (functionally fine, contract drift).
6. **Settings "Xem lại hướng dẫn" is a dead button** (settings/page.tsx:62) — no re-onboarding handler.
7. **"Xem tất cả" show-all control missing** in solution viewer (FR-5 AC-5).
