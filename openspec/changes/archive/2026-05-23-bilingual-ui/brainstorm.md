## Design Summary

Explored during `/opsx:explore` session before proposing. App already stores language preference in `localStorage` (`mathsnap_language`: `'vi'`|`'en'`) and passes it correctly to the LLM for solution text. The gap is that all UI text is hardcoded Vietnamese with no React state propagation mechanism. Explored the full file tree, catalogued ~65–70 VI strings across 12 files, and evaluated two approaches.

## Alternatives Considered

### Approach A: Simple `useLanguage()` hook (no context)
- **Approach**: Each component calls a standalone hook that reads localStorage directly.
- **Pros**: No provider boilerplate; easy to add per-component.
- **Cons**: Each component has independent state. Settings page toggle cannot propagate to BottomNav or HomePage — they each manage their own isolated copy. Would require page reload to sync all components.
- **Why not chosen**: Fails the core requirement "instant propagation without reload."

### Approach B: LanguageContext + Provider (chosen)
- **Approach**: A `'use client'` context with `useState<Lang>('vi')` + `useEffect` to read localStorage after hydration. Provider wraps the entire app at `app/layout.tsx` root. All components subscribe via `useLanguage()`.
- **Pros**: Single source of truth; changing language in Settings re-renders all consumers immediately. Pattern already proven by `OnboardingContext.tsx` in the same codebase.
- **Cons**: Slight initial flash for EN users (vi→en switch after hydration), but negligible on mobile.
- **Why chosen**: Matches existing codebase patterns, correct propagation semantics, straightforward.

### Approach C: i18n library (react-intl / next-intl)
- **Approach**: Full i18n library with locale routing, SSR-aware language detection.
- **Pros**: SSR-aware (no flash), pluralization, rich formatting support.
- **Cons**: Heavy dependency, requires URL-based locale routing (`/en/...` vs `/vi/...`), significant refactor of Next.js routing structure, overkill for two flat languages.
- **Why not chosen**: Over-engineering for a two-language app; URL structure change is a breaking change to existing bookmarks/history.

## Agreed Approach

**Approach B: LanguageContext + Provider** with flat translation object in `lib/i18n.ts`.

Key rationale:
- Mirrors `OnboardingContext` pattern exactly — low cognitive overhead for future maintainers
- Provider placed at `app/layout.tsx` root (not `(main)/layout.tsx`) to cover `app/solve/page.tsx` which lives outside the `(main)/` route group
- Flat `{ vi: {...}, en: {...} }` satisfies TypeScript `satisfies` constraint — missing keys are caught at compile time
- `settings/page.tsx` drops its local `isEnglish` state and delegates to context setter, giving immediate app-wide propagation

## Key Decisions

1. **Provider at root `app/layout.tsx`**, not `(main)/layout.tsx` — `solve/page.tsx` is a direct child of `app/` and needs the context.
2. **SSR-safe default `'vi'`** — `useState('vi')` + `useEffect` reads localStorage, no hydration mismatch. Brief vi→en flash on first load for EN users is acceptable.
3. **`lib/i18n.ts` with `satisfies` typing** — TypeScript enforces key parity between `vi` and `en` at compile time.
4. **Onboarding slides included** — `OnboardingOverlay.tsx` STEPS array translated (adds ~12 keys).
5. **Client-side error messages translated** — toast messages and error state text in OCR/solve pages.
6. **Server API error messages excluded** — strings returned by the API in `err.message` are out of scope.
7. **`formatDate` locale parameterized** — `history/page.tsx` and `bookmarks/page.tsx` pass `lang === 'en' ? 'en-US' : 'vi-VN'` to `toLocaleDateString`.
8. **Settings label adapts** — shows "Language" in EN mode, "Ngôn ngữ" in VI mode (not bilingual fixed string).

## Open Questions

None — all scope decisions resolved during explore session.
