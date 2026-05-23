## 1. Foundation — Context and Translation Catalog

- [x] 1.1 Create `src/client/contexts/LanguageContext.tsx`: `'use client'` context with `useState<Lang>('vi')`, `useEffect` reading `localStorage.getItem('mathsnap_language')` after hydration, `setLang` that also writes localStorage. Export `LanguageProvider` and `useLanguage()`.
- [x] 1.2 Create `src/client/lib/i18n.ts`: define `Lang = 'vi' | 'en'` type and export `t` — a flat translation object with all ~70 string keys for both `vi` and `en`, using `satisfies Record<Lang, Record<string, string>>` type constraint.
- [x] 1.3 Create `src/client/lib/i18n.test.ts`: single test asserting `Object.keys(t.en).sort()` deep-equals `Object.keys(t.vi).sort()`.
- [x] 1.4 Add `LanguageProvider` to `src/client/app/layout.tsx`, wrapping children alongside existing providers (order: inside `OnboardingProvider` or alongside — either is fine).

## 2. Navigation

- [x] 2.1 Update `src/client/components/BottomNav.tsx`: call `useLanguage()`, replace static `TABS` const with computed labels from `t[lang]` for "Trang chủ" → `homeLabel`, "Lịch sử" → `historyLabel`, "Cài đặt" → `settingsLabel` (Bookmark stays as-is).

## 3. Settings Page

- [x] 3.1 Update `src/client/app/(main)/settings/page.tsx`: remove local `isEnglish` state, read `lang` + `setLang` from `useLanguage()`. Translate all hardcoded strings: page title, section headers, row labels, aria-label on toggle.

## 4. Home Page

- [x] 4.1 Update `src/client/app/(main)/page.tsx`: call `useLanguage()`, replace hardcoded strings (subtitle, button labels, toast error message) with `t[lang]` lookups.

## 5. History Page

- [x] 5.1 Update `src/client/app/(main)/history/page.tsx`: call `useLanguage()`, translate page header, empty state text, empty state CTA, aria-labels (delete/bookmark), toast error. Parameterize `formatDate` to accept `lang` and select `'en-US'` vs `'vi-VN'`.

## 6. Bookmarks Page

- [x] 6.1 Update `src/client/app/(main)/bookmarks/page.tsx`: call `useLanguage()`, translate page header, empty state text, aria-labels. Parameterize `formatDate` locale same as history.

## 7. History Detail Page

- [x] 7.1 Update `src/client/app/(main)/history/[id]/page.tsx`: call `useLanguage()`, translate page title ("Lời giải"), back aria-label, bookmark aria-label, "Bài mới" button.

## 8. Manual Input Page

- [x] 8.1 Update `src/client/app/(main)/manual/page.tsx`: call `useLanguage()`, translate page title, preview placeholder, textarea placeholder, submit button, back aria-label.

## 9. OCR Page

- [x] 9.1 Update `src/client/app/(main)/ocr/page.tsx`: call `useLanguage()`, translate loading text, all error messages (including the hardcoded `OCR_NO_FORMULA` message), button labels ("Thử lại", "Nhập thủ công", "Chụp lại", "Giải bài này"), image alt text, confidence warning, confirmation prompt.

## 10. Camera Page

- [x] 10.1 Update `src/client/app/(main)/camera/page.tsx`: call `useLanguage()`, translate shutter and flip aria-labels.

## 11. Crop Page

- [x] 11.1 Update `src/client/app/(main)/crop/page.tsx`: call `useLanguage()`, translate "Hủy" and "Xác nhận" button text and aria-labels.

## 12. Solve Page

- [x] 12.1 Update `src/client/app/solve/page.tsx`: call `useLanguage()`, translate loading text, error messages, button labels ("Nhập bài toán khác", "Thử lại", "Bài mới"), page title, aria-labels, toast error messages. **Do NOT change** the `localStorage.getItem('mathsnap_language')` call used for `postSolve` — keep it reading directly from localStorage.

## 13. Onboarding Overlay

- [x] 13.1 Update `src/client/components/OnboardingOverlay.tsx`: call `useLanguage()`, replace the static `STEPS` const with a `getSteps(lang: Lang)` function returning localized slide titles and descriptions. Add EN translations for all 3 slide title+description pairs to `lib/i18n.ts` (or inline in the function — consistent with how similar content is handled).

## 14. Verification

- [x] 14.1 Run `pnpm typecheck` — zero errors (validates `satisfies` constraint catches any missing keys).
- [x] 14.2 Run `pnpm test` — all tests pass including the new `i18n.test.ts` key-parity test.
- [x] 14.3 Run `pnpm lint` — zero new lint errors.
- [x] 14.4 Manual smoke test: toggle English in Settings → verify BottomNav, HomePage, History, Bookmarks, Solve all display English. Toggle back to Vietnamese → all return to Vietnamese.
