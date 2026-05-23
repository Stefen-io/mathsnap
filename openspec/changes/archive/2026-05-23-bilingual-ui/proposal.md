## Why

MathSnap already stores language preference (`mathsnap_language` in localStorage) and routes it correctly to the LLM for solution text. However, the Settings language toggle has no effect on the UI — all text remains hardcoded Vietnamese regardless of the chosen setting. This breaks the promise made to English-speaking users. The fix requires a single React context following the pattern already established by `OnboardingContext`, plus a flat translation object covering ~70 strings across 12 files.

## What Changes

**Language toggle behavior**
- From: `settings/page.tsx` writes to localStorage; no other component reacts
- To: `LanguageProvider` at app root broadcasts `lang` state; all components re-render on change
- Impact: non-breaking; localStorage key and values unchanged

**UI text rendering**
- From: hardcoded Vietnamese string literals in JSX
- To: `t[lang].key` lookups from `lib/i18n.ts`
- Impact: non-breaking; behavior change is intentional and visible only to users who switch language

**`formatDate` locale**
- From: `'vi-VN'` hardcoded in history and bookmarks pages
- To: `lang === 'en' ? 'en-US' : 'vi-VN'` — dates display in the selected locale format
- Impact: non-breaking

## Capabilities

### New Capabilities
- `language-ui`: React context + translation catalog enabling real-time UI language switching between Vietnamese and English without page reload

### Modified Capabilities

(none — no existing spec-level requirements are changing)

## Impact

- **New files**: `src/client/contexts/LanguageContext.tsx`, `src/client/lib/i18n.ts`, `src/client/lib/i18n.test.ts`
- **Modified files**: `app/layout.tsx` (add provider), `app/(main)/settings/page.tsx` (use context), `components/BottomNav.tsx`, `app/(main)/page.tsx`, `app/(main)/history/page.tsx`, `app/(main)/bookmarks/page.tsx`, `app/(main)/history/[id]/page.tsx`, `app/(main)/manual/page.tsx`, `app/(main)/ocr/page.tsx`, `app/(main)/camera/page.tsx`, `app/(main)/crop/page.tsx`, `app/solve/page.tsx`, `components/OnboardingOverlay.tsx`
- **No backend changes**
- **No API contract changes**
- **No dependency additions**
