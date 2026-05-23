## Context

MathSnap is a mobile-first Next.js app (max 480px) for solving math problems via camera/OCR. It has two users: Vietnamese speakers (primary) and English speakers. Language preference is already stored in `localStorage` under key `mathsnap_language` (`'vi'` | `'en'`), and the `solve/page.tsx` reads it correctly to set the LLM response language. However, all UI text strings are hardcoded in Vietnamese with no React mechanism to switch them. The existing codebase has a well-established pattern for browser-only state via `OnboardingContext.tsx` (localStorage + `useState` + `useEffect`).

**Current state:**
- `app/(main)/settings/page.tsx`: manages `isEnglish` via local `useState`, writes to localStorage on toggle. Change is not propagated.
- `app/solve/page.tsx`: reads `mathsnap_language` from localStorage at solve-time. Already correct.
- All other pages/components: 65–70 Vietnamese string literals hardcoded.

## Goals / Non-Goals

**Goals:**
- Switching language in Settings propagates immediately to all UI without reload
- All client-visible text (nav labels, page headers, button labels, empty states, aria-labels, toast messages, onboarding slides) respects the selected language
- TypeScript enforces key parity between `vi` and `en` translation objects at compile time
- Pattern stays consistent with existing `OnboardingContext` approach

**Non-Goals:**
- SSR-aware language detection (no cookies, no locale routing, no `Accept-Language` header)
- i18n library adoption (react-intl, next-intl, i18next)
- URL-based locale routing (`/en/...` vs `/vi/...`)
- Translation of API-returned error messages (server strings stay as-is)
- Pluralization or rich message formatting

## Decisions

### D1: LanguageContext at `app/layout.tsx` root (not `(main)/layout.tsx`)

`app/solve/page.tsx` lives outside the `(main)/` route group — placing the provider only in `(main)/layout.tsx` would cause `useLanguage()` to throw in `solve/page.tsx`. Root layout covers all pages.

```
app/layout.tsx
  └── LanguageProvider      ← root-level, wraps everything
        └── (main)/layout.tsx
              └── BottomNav, page.tsx, history/, ...
        └── solve/page.tsx  ← also covered
```

### D2: SSR-safe initialization via `useEffect`

```ts
const [lang, setLang] = useState<Lang>('vi')   // server renders 'vi'
useEffect(() => {                               // client-only, post-hydration
  if (localStorage.getItem('mathsnap_language') === 'en') setLang('en')
}, [])
```

This is identical to `OnboardingContext` pattern. Server and initial client both render `'vi'`, so no hydration mismatch. EN users see a single unperceived frame of VI text before the effect fires.

### D3: Flat translation object in `lib/i18n.ts` with `satisfies` constraint

```ts
export type Lang = 'vi' | 'en'
export const t = {
  vi: { /* all keys */ },
  en: { /* all keys */ },
} satisfies Record<Lang, Record<string, string>>
```

`satisfies` (TypeScript 4.9+) enforces that both `vi` and `en` share the exact same shape — missing key in either direction is a compile error. No runtime cost. No external dependency.

Usage in components: `const { lang } = useLanguage(); t[lang].someKey`

### D4: Settings page delegates to context setter

`settings/page.tsx` currently owns `isEnglish` as local state. After this change it reads `lang` and calls `setLang` from context. This means flipping the toggle immediately re-renders all subscribed components app-wide.

### D5: `formatDate` locale parameterized

`history/page.tsx` and `bookmarks/page.tsx` both have `toLocaleDateString('vi-VN', ...)`. These receive `lang` as a parameter and select `'en-US'` vs `'vi-VN'` accordingly.

### D6: Onboarding STEPS array inline-translated

`OnboardingOverlay.tsx` has a static `STEPS` array with VI titles and descriptions. It becomes a function `getSteps(lang: Lang)` that returns the appropriate text. This avoids scattering 6 multi-sentence strings across i18n.ts as unwieldy keys.

## Risks / Trade-offs

- **Brief VI flash on first EN load** → Acceptable. Effect fires before browser paint on most devices. Alternative (cookie) is over-engineering for this app.
- **i18n.ts grows large** → ~70 keys × 2 languages ≈ 140 lines. Still readable. No tooling needed.
- **Context re-renders on lang change** → All consumers re-render on switch. Acceptable: this is a deliberate user action, not a frequent event.
- **`satisfies` requires TS 4.9+** → Next.js 16 ships TS 5.x. No risk.

## Migration Plan

1. Add `LanguageProvider` to `app/layout.tsx` — additive, no breaking change
2. Create `lib/i18n.ts` — new file, no risk
3. Update components one by one — each change is self-contained, non-breaking
4. `settings/page.tsx` local state → context last (depends on context existing)

No API changes. No database migrations. No rollback needed — all changes are frontend-only.

## Open Questions

None.
