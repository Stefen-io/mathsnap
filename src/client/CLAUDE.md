# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `src/client/`. Use `pnpm` to run the commands.

```bash
pnpm install										# Install dependencies
pnpm dev												# Dev serve with Turbopack (http://localhost:3000)
pnpm build											# Production build
pnpm lint												# ESLint
pnpm format											# Prettier (writes in place)
pnpm typecheck									# TypeScript (noEmit)
pnpm test												# Tests
pnpm vitest											# Tests in watch mode
pnpm add <pkg>									# Install package (prod)
pnpm shadcn add <component>			# Add shadcn component
pnpm shadcn remove <component>	# Remove shadcn component
```

## Tech Stack

- Next.js 16, React 19, TypeScript strict mode
- Tailwind CSS v4 — no `tailwind.config.js`, use CSS variables
- shadcn/ui (radix-ui + cva + clsx + tailwind-merge)
- React Hook Form + Zod v4, Sonner, Vaul, next-themes, KaTeX

## Testing

**Framework:** Vitest + happy-dom

**Why Vitest:** The client uses `"type": "module"` (ESM) and `moduleResolution: bundler`. Vitest handles this natively; Jest requires complex Babel transform configuration for the same setup.

**Convention:** Test files are co-located next to their source file as `*.test.ts` (e.g., `lib/device-id.ts` → `lib/device-id.test.ts`).

**Scope:** Unit tests for pure utility functions in `lib/`. No E2E or browser-automation tests at this stage.

## Architecture

This is a **mobile-first Next.js 16 app** (max content width 480px) for a math problem solver that accepts LaTeX input and returns step-by-step solutions.

### App Router layout

```
app/
  layout.tsx          # root: fonts (Inter + Geist Mono), ThemeProvider
  (main)/
    layout.tsx        # wraps pages in 480px container + BottomNav
    page.tsx          # home (scan/solve)
    history/          # past solves
    bookmarks/        # bookmarked solves
    settings/         # app settings
```

### Design System

Full spec: @DESIGN.md (Mintlify-inspired). Read this before writing any UI component — especially the Color Palette, Typography Rules, and Component Stylings sections.

Quick rules to avoid the most common violations:

- Buttons and inputs always use `border-radius: 9999px` (full pill)
- Font-weight: 400, 500, 600 only — never 700
- Borders: `1px solid rgba(0,0,0,0.05)` — never solid opaque borders
- Brand green (`var(--color-brand)`) only for CTAs, hover states, and focus rings — not decorative fills
- No gray section backgrounds — white throughout, depth comes from border opacity and whitespace

### Path aliases

`@/` maps to the repo root (see `tsconfig.json`). Use `@/components`, `@/lib`, `@/hooks`, `@/types`.

## Environment

Copy `.env.example` to `.env`:

```
NEXT_PUBLIC_API_URL=https://<railway-app>.up.railway.app
```

## Coding Conventions

- Forms: react-hook-form + zod schema, no exceptions
- Math rendering: KaTeX only
- Tailwind class order: managed by prettier-plugin-tailwindcss — don't sort manually
- Don't rewrite components shadcn/ui already provides
