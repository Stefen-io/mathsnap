# Bilingual UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire a `LanguageContext` (following `OnboardingContext` pattern) through the entire MathSnap frontend so that toggling language in Settings immediately switches all ~67 UI strings between Vietnamese and English.

**Architecture:** A new `LanguageContext` at `app/layout.tsx` root manages `lang: 'vi' | 'en'` state; `lib/i18n.ts` holds the flat bilingual catalog with TypeScript-enforced key parity; each of 12 pages/components replaces hardcoded VI strings with `t[lang].key` lookups.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.x strict, Tailwind CSS v4, Vitest, pnpm (run from `src/client/`)

---

## File Map

| Action | Path |
|--------|------|
| CREATE | `src/client/contexts/LanguageContext.tsx` |
| CREATE | `src/client/lib/i18n.ts` |
| CREATE | `src/client/lib/i18n.test.ts` |
| MODIFY | `src/client/app/layout.tsx` |
| MODIFY | `src/client/components/BottomNav.tsx` |
| MODIFY | `src/client/app/(main)/settings/page.tsx` |
| MODIFY | `src/client/app/(main)/page.tsx` |
| MODIFY | `src/client/app/(main)/history/page.tsx` |
| MODIFY | `src/client/app/(main)/bookmarks/page.tsx` |
| MODIFY | `src/client/app/(main)/history/[id]/page.tsx` |
| MODIFY | `src/client/app/(main)/manual/page.tsx` |
| MODIFY | `src/client/app/(main)/ocr/page.tsx` |
| MODIFY | `src/client/app/(main)/camera/page.tsx` |
| MODIFY | `src/client/app/(main)/crop/page.tsx` |
| MODIFY | `src/client/app/solve/page.tsx` |
| MODIFY | `src/client/components/OnboardingOverlay.tsx` |

---

## Task 1: Foundation — LanguageContext + i18n catalog

**Files:**
- Create: `src/client/contexts/LanguageContext.tsx`
- Create: `src/client/lib/i18n.ts`
- Create: `src/client/lib/i18n.test.ts`
- Modify: `src/client/app/layout.tsx`

- [ ] **Step 1: Write the failing test first**

  Create `src/client/lib/i18n.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { t } from './i18n'

  describe('i18n', () => {
    it('en and vi have the same keys', () => {
      expect(Object.keys(t.en).sort()).toEqual(Object.keys(t.vi).sort())
    })
  })
  ```

- [ ] **Step 2: Run test to confirm it fails (file missing)**

  ```bash
  cd src/client && pnpm test -- lib/i18n.test.ts
  ```
  Expected: error `Cannot find module './i18n'`

- [ ] **Step 3: Create `src/client/lib/i18n.ts` with the full translation catalog**

  ```ts
  export type Lang = 'vi' | 'en'

  const vi = {
    // Nav
    navHome: 'Trang chủ',
    navHistory: 'Lịch sử',
    navSettings: 'Cài đặt',
    // Home
    homeSubtitle: 'Chụp ảnh bài toán, nhận lời giải từng bước',
    homeCapture: 'Chụp ảnh',
    homeUpload: 'Tải lên',
    homeManual: 'Nhập LaTeX',
    homeToastFileTooLarge: 'Ảnh không được vượt quá 2MB.',
    // History
    historyTitle: 'Lịch sử',
    historyEmpty: 'Chưa có bài giải nào',
    historyEmptyCta: 'Chụp bài toán đầu tiên →',
    historyAriaDelete: 'Xóa',
    historyAriaSave: 'Lưu',
    historyAriaUnsave: 'Bỏ lưu',
    historyToastDeleteError: 'Không thể xóa bài toán. Vui lòng thử lại.',
    // Bookmarks
    bookmarksTitle: 'Bookmark',
    bookmarksEmpty: 'Chưa có bài nào được lưu',
    bookmarksAriaUnsave: 'Bỏ lưu',
    // History detail
    detailTitle: 'Lời giải',
    detailAriaBack: 'Quay lại',
    detailAriaBookmark: 'Đánh dấu',
    detailNewProblem: 'Bài mới',
    // Manual input
    manualTitle: 'Nhập công thức',
    manualAriaBack: 'Quay lại',
    manualPreviewPlaceholder: 'Bắt đầu nhập để xem preview',
    manualInputPlaceholder: 'Nhập công thức LaTeX...',
    manualSubmit: 'Xác nhận',
    // OCR
    ocrLoading: 'Đang nhận dạng công thức...',
    ocrErrorNoFormula: 'Không nhận diện được công thức trong ảnh.',
    ocrErrorGeneric: 'Có lỗi xảy ra. Vui lòng thử lại.',
    ocrRetry: 'Thử lại',
    ocrManual: 'Nhập thủ công',
    ocrRecapture: 'Chụp lại',
    ocrImageAlt: 'Ảnh đã chụp',
    ocrCheckFormula: 'Kiểm tra công thức đã chính xác chưa?',
    ocrLowConfidence: 'Độ chính xác thấp — kiểm tra lại',
    ocrSolve: 'Giải bài này',
    // Camera
    cameraAriaShutter: 'Chụp ảnh',
    cameraAriaFlip: 'Xoay camera',
    // Crop
    cropCancel: 'Hủy',
    cropConfirm: 'Xác nhận',
    // Settings
    settingsTitle: 'Cài đặt',
    settingsLangLabel: 'Ngôn ngữ',
    settingsAriaLangToggle: 'Ngôn ngữ',
    settingsInfoSection: 'Thông tin',
    settingsVersion: 'Phiên bản',
    settingsReplayOnboarding: 'Xem lại hướng dẫn',
    settingsContactSupport: 'Liên hệ hỗ trợ',
    settingsTerms: 'Điều khoản sử dụng',
    // Solve
    solveLoading: 'Đang phân tích bài toán',
    solveErrorGeneric: 'Không thể tạo lời giải. Vui lòng thử lại.',
    solveOtherProblem: 'Nhập bài toán khác',
    solveRetry: 'Thử lại',
    solveTitle: 'Lời giải',
    solveAriaBack: 'Quay lại',
    solveAriaBookmark: 'Đánh dấu',
    solveNewProblem: 'Bài mới',
    solveToastError: 'Không thể tạo lời giải.',
    // Onboarding
    onboardingSkip: 'Bỏ qua',
    onboardingNext: 'Tiếp',
    onboardingStart: 'Bắt đầu',
    onboardingStep1Title: 'Chụp ảnh bài toán',
    onboardingStep1Desc: 'Chụp hoặc tải ảnh bài toán toán học bất kỳ — phương trình, hệ phương trình, hay tích phân.',
    onboardingStep2Title: 'Nhận diện công thức',
    onboardingStep2Desc: 'AI tự động đọc và nhận diện công thức từ ảnh của bạn với độ chính xác cao.',
    onboardingStep3Title: 'Xem lời giải từng bước',
    onboardingStep3Desc: 'Nhận lời giải chi tiết từng bước, kèm công thức và giải thích rõ ràng.',
  }

  // typeof vi enforces that `en` has exactly the same keys — TypeScript errors on any missing key
  const en: typeof vi = {
    // Nav
    navHome: 'Home',
    navHistory: 'History',
    navSettings: 'Settings',
    // Home
    homeSubtitle: 'Snap a problem, get step-by-step solutions',
    homeCapture: 'Take Photo',
    homeUpload: 'Upload',
    homeManual: 'Enter LaTeX',
    homeToastFileTooLarge: 'Image must not exceed 2MB.',
    // History
    historyTitle: 'History',
    historyEmpty: 'No solutions yet',
    historyEmptyCta: 'Snap your first problem →',
    historyAriaDelete: 'Delete',
    historyAriaSave: 'Save',
    historyAriaUnsave: 'Unsave',
    historyToastDeleteError: 'Failed to delete. Please try again.',
    // Bookmarks
    bookmarksTitle: 'Bookmarks',
    bookmarksEmpty: 'No bookmarks yet',
    bookmarksAriaUnsave: 'Remove bookmark',
    // History detail
    detailTitle: 'Solution',
    detailAriaBack: 'Go back',
    detailAriaBookmark: 'Bookmark',
    detailNewProblem: 'New problem',
    // Manual input
    manualTitle: 'Enter Formula',
    manualAriaBack: 'Go back',
    manualPreviewPlaceholder: 'Start typing to see preview',
    manualInputPlaceholder: 'Enter LaTeX formula...',
    manualSubmit: 'Confirm',
    // OCR
    ocrLoading: 'Recognising formula...',
    ocrErrorNoFormula: 'No formula detected in the image.',
    ocrErrorGeneric: 'An error occurred. Please try again.',
    ocrRetry: 'Retry',
    ocrManual: 'Enter manually',
    ocrRecapture: 'Retake',
    ocrImageAlt: 'Captured image',
    ocrCheckFormula: 'Is the formula correct?',
    ocrLowConfidence: 'Low confidence — please verify',
    ocrSolve: 'Solve this',
    // Camera
    cameraAriaShutter: 'Take photo',
    cameraAriaFlip: 'Flip camera',
    // Crop
    cropCancel: 'Cancel',
    cropConfirm: 'Confirm',
    // Settings
    settingsTitle: 'Settings',
    settingsLangLabel: 'Language',
    settingsAriaLangToggle: 'Language',
    settingsInfoSection: 'Information',
    settingsVersion: 'Version',
    settingsReplayOnboarding: 'View tutorial',
    settingsContactSupport: 'Contact support',
    settingsTerms: 'Terms of use',
    // Solve
    solveLoading: 'Analysing problem',
    solveErrorGeneric: 'Unable to generate solution. Please try again.',
    solveOtherProblem: 'Try another problem',
    solveRetry: 'Retry',
    solveTitle: 'Solution',
    solveAriaBack: 'Go back',
    solveAriaBookmark: 'Bookmark',
    solveNewProblem: 'New problem',
    solveToastError: 'Unable to generate solution.',
    // Onboarding
    onboardingSkip: 'Skip',
    onboardingNext: 'Next',
    onboardingStart: 'Get started',
    onboardingStep1Title: 'Snap a Problem',
    onboardingStep1Desc: 'Take or upload a photo of any math problem — equations, systems, or integrals.',
    onboardingStep2Title: 'Recognise the Formula',
    onboardingStep2Desc: 'AI automatically reads and recognises the formula from your photo with high accuracy.',
    onboardingStep3Title: 'Step-by-Step Solution',
    onboardingStep3Desc: 'Get a detailed step-by-step solution with formulas and clear explanations.',
  }

  export const t = { vi, en }
  ```

- [ ] **Step 4: Run the test — it should pass now**

  ```bash
  cd src/client && pnpm test -- lib/i18n.test.ts
  ```
  Expected: PASS — "en and vi have the same keys"

- [ ] **Step 5: Create `src/client/contexts/LanguageContext.tsx`**

  ```tsx
  'use client'

  import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
  import type { Lang } from '@/lib/i18n'

  const STORAGE_KEY = 'mathsnap_language'

  interface LanguageState {
    lang: Lang
    setLang: (lang: Lang) => void
  }

  const LanguageContext = createContext<LanguageState | null>(null)

  export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>('vi')

    useEffect(() => {
      if (localStorage.getItem(STORAGE_KEY) === 'en') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState('en')
      }
    }, [])

    function setLang(next: Lang) {
      localStorage.setItem(STORAGE_KEY, next)
      setLangState(next)
    }

    return (
      <LanguageContext.Provider value={{ lang, setLang }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  export function useLanguage(): LanguageState {
    const ctx = useContext(LanguageContext)
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
    return ctx
  }
  ```

- [ ] **Step 6: Add `LanguageProvider` to `src/client/app/layout.tsx`**

  Add the import alongside the other providers:
  ```tsx
  import { LanguageProvider } from "@/contexts/LanguageContext"
  ```

  Wrap the existing tree — place `LanguageProvider` outside `OnboardingProvider` (it must be available to `OnboardingOverlay` too):
  ```tsx
  <ThemeProvider>
    <CaptureProvider>
      <LanguageProvider>
        <OnboardingProvider>
          {children}
          <OnboardingOverlay />
          <Toaster />
        </OnboardingProvider>
      </LanguageProvider>
    </CaptureProvider>
  </ThemeProvider>
  ```

- [ ] **Step 7: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 8: Commit**

  ```bash
  git add src/client/contexts/LanguageContext.tsx src/client/lib/i18n.ts src/client/lib/i18n.test.ts src/client/app/layout.tsx
  git commit -m "feat(i18n): add LanguageContext and translation catalog"
  ```

---

## Task 2: BottomNav

**Files:**
- Modify: `src/client/components/BottomNav.tsx`

- [ ] **Step 1: Add imports and replace static TABS with dynamic labels**

  Add at the top of the file (after existing imports):
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Remove the module-level `TABS` const entirely. Inside `BottomNav()`, add:
  ```tsx
  const { lang } = useLanguage()

  const TABS = [
    { href: '/', label: t[lang].navHome, icon: Home },
    { href: '/history', label: t[lang].navHistory, icon: Clock },
    { href: '/bookmarks', label: 'Bookmark', icon: Bookmark },
    { href: '/settings', label: t[lang].navSettings, icon: Settings },
  ] as const
  ```

  The rest of the render stays unchanged.

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add src/client/components/BottomNav.tsx
  git commit -m "feat(i18n): translate BottomNav labels"
  ```

---

## Task 3: Settings Page

**Files:**
- Modify: `src/client/app/(main)/settings/page.tsx`

- [ ] **Step 1: Replace local state with context + translate all strings**

  Add imports (replace the `useState` import — keep `ChevronRight` and `motion` imports unchanged):
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Remove `useState` from the React import (it's no longer needed here).

  Inside `SettingsPage()`, replace:
  ```tsx
  const [isEnglish, setIsEnglish] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('mathsnap_language') === 'en'
  })

  function handleLanguageToggle() {
    const next = !isEnglish
    setIsEnglish(next)
    localStorage.setItem('mathsnap_language', next ? 'en' : 'vi')
  }
  ```
  With:
  ```tsx
  const { lang, setLang } = useLanguage()
  const isEnglish = lang === 'en'

  function handleLanguageToggle() {
    setLang(isEnglish ? 'vi' : 'en')
  }
  ```

  Translate JSX strings:
  - `"Cài đặt"` h1 → `{t[lang].settingsTitle}`
  - `"Ngôn ngữ / Language"` span → `{t[lang].settingsLangLabel}`
  - `aria-label="Ngôn ngữ"` on button → `aria-label={t[lang].settingsAriaLangToggle}`
  - `"Thông tin"` h2 → `{t[lang].settingsInfoSection}`
  - `"Phiên bản"` span → `{t[lang].settingsVersion}`
  - `"Xem lại hướng dẫn"` span → `{t[lang].settingsReplayOnboarding}`
  - `"Liên hệ hỗ trợ"` span → `{t[lang].settingsContactSupport}`
  - `"Điều khoản sử dụng"` span → `{t[lang].settingsTerms}`

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add "src/client/app/(main)/settings/page.tsx"
  git commit -m "feat(i18n): translate settings page, wire to LanguageContext"
  ```

---

## Task 4: Home Page

**Files:**
- Modify: `src/client/app/(main)/page.tsx`

- [ ] **Step 1: Add language hook and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `HomePage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings:
  - `"Chụp ảnh bài toán, nhận lời giải từng bước"` → `{t[lang].homeSubtitle}`
  - `"Chụp ảnh"` (Camera button) → `{t[lang].homeCapture}`
  - `"Tải lên"` (Upload button) → `{t[lang].homeUpload}`
  - `"Nhập LaTeX"` (Link text) → `{t[lang].homeManual}`
  - `toast.error('Ảnh không được vượt quá 2MB.')` → `toast.error(t[lang].homeToastFileTooLarge)`

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add "src/client/app/(main)/page.tsx"
  git commit -m "feat(i18n): translate home page"
  ```

---

## Task 5: History Page

**Files:**
- Modify: `src/client/app/(main)/history/page.tsx`

- [ ] **Step 1: Parameterize `formatDate` and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  import type { Lang } from '@/lib/i18n'
  ```

  Replace `formatDate` signature:
  ```tsx
  function formatDate(iso: string, lang: Lang): string {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  ```

  Inside `HistoryPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings:
  - `"Lịch sử"` h1 → `{t[lang].historyTitle}`
  - `"Chưa có bài giải nào"` → `{t[lang].historyEmpty}`
  - `"Chụp bài toán đầu tiên →"` → `{t[lang].historyEmptyCta}`
  - `aria-label="Xóa"` → `aria-label={t[lang].historyAriaDelete}`
  - `aria-label={item.isBookmarked ? 'Bỏ lưu' : 'Lưu'}` → `aria-label={item.isBookmarked ? t[lang].historyAriaUnsave : t[lang].historyAriaSave}`
  - `toast.error('Không thể xóa bài toán. Vui lòng thử lại.')` → `toast.error(t[lang].historyToastDeleteError)`
  - `{formatDate(item.createdAt)}` → `{formatDate(item.createdAt, lang)}`

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add "src/client/app/(main)/history/page.tsx"
  git commit -m "feat(i18n): translate history page, parameterize date locale"
  ```

---

## Task 6: Bookmarks Page

**Files:**
- Modify: `src/client/app/(main)/bookmarks/page.tsx`

- [ ] **Step 1: Parameterize `formatDate` and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  import type { Lang } from '@/lib/i18n'
  ```

  Replace `formatDate` (same pattern as history page):
  ```tsx
  function formatDate(iso: string, lang: Lang): string {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  ```

  Inside `BookmarksPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings:
  - `"Bookmark"` h1 → `{t[lang].bookmarksTitle}`
  - `"Chưa có bài nào được lưu"` → `{t[lang].bookmarksEmpty}`
  - Both instances of `aria-label="Bỏ lưu"` → `aria-label={t[lang].bookmarksAriaUnsave}`
  - `{formatDate(item.createdAt)}` → `{formatDate(item.createdAt, lang)}`

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add "src/client/app/(main)/bookmarks/page.tsx"
  git commit -m "feat(i18n): translate bookmarks page"
  ```

---

## Task 7: History Detail Page

**Files:**
- Modify: `src/client/app/(main)/history/[id]/page.tsx`

- [ ] **Step 1: Add language hook and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `HistoryDetailPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings:
  - `aria-label="Quay lại"` → `aria-label={t[lang].detailAriaBack}`
  - `"Lời giải"` h1 → `{t[lang].detailTitle}`
  - `aria-label="Đánh dấu"` → `aria-label={t[lang].detailAriaBookmark}`
  - `"Bài mới"` button → `{t[lang].detailNewProblem}`

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add "src/client/app/(main)/history/[id]/page.tsx"
  git commit -m "feat(i18n): translate history detail page"
  ```

---

## Task 8: Manual Input Page

**Files:**
- Modify: `src/client/app/(main)/manual/page.tsx`

- [ ] **Step 1: Add language hook and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `ManualPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings:
  - `aria-label="Quay lại"` → `aria-label={t[lang].manualAriaBack}`
  - `"Nhập công thức"` h1 → `{t[lang].manualTitle}`
  - `"Bắt đầu nhập để xem preview"` span → `{t[lang].manualPreviewPlaceholder}`
  - `placeholder="Nhập công thức LaTeX..."` → `placeholder={t[lang].manualInputPlaceholder}`
  - `"Xác nhận"` in submit button → `{t[lang].manualSubmit}`

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add "src/client/app/(main)/manual/page.tsx"
  git commit -m "feat(i18n): translate manual input page"
  ```

---

## Task 9: OCR Page

**Files:**
- Modify: `src/client/app/(main)/ocr/page.tsx`

- [ ] **Step 1: Add language hook and translate all strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `OcrPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace strings in `runOcr()` — the hardcoded `OCR_NO_FORMULA` message:
  ```tsx
  if (!formula) {
    setErrorInfo({ code: 'OCR_NO_FORMULA', message: t[lang].ocrErrorNoFormula, retryable: false })
    setState('error')
    return
  }
  ```

  The fallback catch error:
  ```tsx
  const info: OcrErrorInfo = err instanceof ApiError
    ? { code: err.code, message: err.message, retryable: err.retryable }
    : { code: 'UNKNOWN', message: t[lang].ocrErrorGeneric, retryable: false }
  ```

  Replace JSX strings:
  - `"Đang nhận dạng công thức..."` → `{t[lang].ocrLoading}`
  - `"Thử lại"` (OCR_TIMEOUT retry button) → `{t[lang].ocrRetry}`
  - `"Nhập thủ công"` → `{t[lang].ocrManual}`
  - `"Thử lại"` (retryable error button) → `{t[lang].ocrRetry}`
  - `"Chụp lại"` (non-retryable error button) → `{t[lang].ocrRecapture}`
  - `alt="Ảnh đã chụp"` → `alt={t[lang].ocrImageAlt}`
  - `"Kiểm tra công thức đã chính xác chưa?"` → `{t[lang].ocrCheckFormula}`
  - `"Độ chính xác thấp — kiểm tra lại"` → `{t[lang].ocrLowConfidence}`
  - `"Chụp lại"` (confirm state bottom button) → `{t[lang].ocrRecapture}`
  - `"Giải bài này"` → `{t[lang].ocrSolve}`

  **Important:** `runOcr` is a `useCallback`. Since `lang` is used inside it, add `lang` to its dependency array:
  ```tsx
  const runOcr = useCallback(() => {
    // ...
  }, [croppedBlob, deviceId, lang])
  ```

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add "src/client/app/(main)/ocr/page.tsx"
  git commit -m "feat(i18n): translate OCR page"
  ```

---

## Task 10: Camera Page

**Files:**
- Modify: `src/client/app/(main)/camera/page.tsx`

- [ ] **Step 1: Add language hook and translate aria-labels**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `CameraPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace:
  - `aria-label="Chụp ảnh"` → `aria-label={t[lang].cameraAriaShutter}`
  - `aria-label="Xoay camera"` → `aria-label={t[lang].cameraAriaFlip}`

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add "src/client/app/(main)/camera/page.tsx"
  git commit -m "feat(i18n): translate camera page aria-labels"
  ```

---

## Task 11: Crop Page

**Files:**
- Modify: `src/client/app/(main)/crop/page.tsx`

- [ ] **Step 1: Add language hook and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `CropPage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  Replace — both buttons use the same text as their aria-label:
  ```tsx
  <button
    aria-label={t[lang].cropCancel}
    onClick={() => router.push('/camera')}
    className="..."
  >
    {t[lang].cropCancel}
  </button>
  <button
    aria-label={t[lang].cropConfirm}
    onClick={handleConfirm}
    className="..."
  >
    {t[lang].cropConfirm}
  </button>
  ```

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add "src/client/app/(main)/crop/page.tsx"
  git commit -m "feat(i18n): translate crop page"
  ```

---

## Task 12: Solve Page

**Files:**
- Modify: `src/client/app/solve/page.tsx`

- [ ] **Step 1: Add language hook and translate strings**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  ```

  Inside `SolvePage()`, add:
  ```tsx
  const { lang } = useLanguage()
  ```

  In `runSolve()`, **do NOT change** the existing localStorage read:
  ```tsx
  const language = (localStorage.getItem('mathsnap_language') as 'vi' | 'en') ?? 'vi'
  ```
  This line stays exactly as-is — it passes language to the LLM API. The context `lang` is for UI only.

  Update the fallback error message in `runSolve()`:
  ```tsx
  const info: ErrorInfo = err instanceof ApiError
    ? { message: err.message, retryable: err.retryable }
    : { message: t[lang].solveErrorGeneric, retryable: true }
  ```

  Update toast.error calls:
  ```tsx
  toast.error(err instanceof ApiError ? err.message : t[lang].solveToastError)
  ```

  Replace JSX strings:
  - `"Đang phân tích bài toán"` → `{t[lang].solveLoading}`
  - `"Nhập bài toán khác"` → `{t[lang].solveOtherProblem}`
  - `"Thử lại"` → `{t[lang].solveRetry}`
  - `aria-label="Quay lại"` → `aria-label={t[lang].solveAriaBack}`
  - `"Lời giải"` h1 → `{t[lang].solveTitle}`
  - `aria-label="Đánh dấu"` → `aria-label={t[lang].solveAriaBookmark}`
  - `"Bài mới"` → `{t[lang].solveNewProblem}`

  **Important:** `runSolve` uses `lang` now. It's called inside a `useEffect`. Since `runSolve` is not a `useCallback`, `lang` is already closed over via re-render — no dependency array change needed. However, confirm the existing ESLint disable comment still applies correctly.

- [ ] **Step 2: Typecheck + commit**

  ```bash
  cd src/client && pnpm typecheck
  git add src/client/app/solve/page.tsx
  git commit -m "feat(i18n): translate solve page"
  ```

---

## Task 13: OnboardingOverlay

**Files:**
- Modify: `src/client/components/OnboardingOverlay.tsx`

- [ ] **Step 1: Replace static STEPS with `getSteps(lang)` function**

  Add imports:
  ```tsx
  import { useLanguage } from '@/contexts/LanguageContext'
  import { t } from '@/lib/i18n'
  import type { Lang } from '@/lib/i18n'
  ```

  Remove the module-level `const STEPS = [...]`. Replace with this function above the component:
  ```tsx
  function getSteps(lang: Lang) {
    return [
      {
        title: t[lang].onboardingStep1Title,
        description: t[lang].onboardingStep1Desc,
        illustration: <Camera className="size-12 text-[#0fa76e]" aria-hidden="true" />,
      },
      {
        title: t[lang].onboardingStep2Title,
        description: t[lang].onboardingStep2Desc,
        illustration: (
          <div className="flex w-[220px] flex-col gap-3 rounded-[16px] border border-black/5 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#d4fae8] px-3 py-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.6px] text-[#0fa76e]">01</span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
                <div className="h-2 w-3/4 rounded bg-[rgba(0,0,0,0.08)]" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
              <Lock className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
              <CheckCircle2 className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-2 w-2/3 rounded bg-[rgba(0,0,0,0.08)]" />
              </div>
            </div>
          </div>
        ),
      },
      {
        title: t[lang].onboardingStep3Title,
        description: t[lang].onboardingStep3Desc,
        illustration: <Bookmark className="size-12 text-[#0fa76e]" aria-hidden="true" />,
      },
    ]
  }
  ```

  Inside `OnboardingOverlay()`, add:
  ```tsx
  const { lang } = useLanguage()
  const STEPS = getSteps(lang)
  ```

  Replace button text:
  - `"Bỏ qua"` → `{t[lang].onboardingSkip}`
  - `isLastStep ? 'Bắt đầu' : 'Tiếp'` → `{isLastStep ? t[lang].onboardingStart : t[lang].onboardingNext}`

- [ ] **Step 2: Typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Commit**

  ```bash
  git add src/client/components/OnboardingOverlay.tsx
  git commit -m "feat(i18n): translate onboarding overlay"
  ```

---

## Task 14: Final Verification

- [ ] **Step 1: Run all tests**

  ```bash
  cd src/client && pnpm test
  ```
  Expected: All pass including `lib/i18n.test.ts`

- [ ] **Step 2: Run typecheck**

  ```bash
  cd src/client && pnpm typecheck
  ```
  Expected: 0 errors

- [ ] **Step 3: Run lint**

  ```bash
  cd src/client && pnpm lint
  ```
  Expected: 0 new errors

- [ ] **Step 4: Manual smoke test**

  Start the dev server (`pnpm dev` from `src/client/`). Open `http://localhost:3000`.
  1. Go to Settings → toggle language to English
  2. Verify BottomNav shows "Home / History / Bookmark / Settings"
  3. Navigate to Home — verify subtitle and buttons are in English
  4. Navigate to History — verify header, empty state (or item dates) are in English
  5. Navigate to Bookmarks — verify header is "Bookmarks"
  6. Go back to Settings — verify all section labels show in English
  7. Toggle back to Vietnamese — verify all UI returns to Vietnamese immediately
  8. Navigate to `/manual` — verify title and placeholders are in Vietnamese
  9. Reload page — language should persist (stays English/Vietnamese per last choice)
