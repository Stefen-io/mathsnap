## Context

Frontend scaffold already exists at `src/client/` with Next.js 16.1.7, App Router, Tailwind v4,
Shadcn/ui (radix-vega preset), React 19, and ThemeProvider. The app boots and serves a
boilerplate page. What remains is: add KaTeX as a dependency, expose the Railway backend URL
as a frontend env var, configure Vercel to locate the app inside the monorepo, and trigger the
first deploy to obtain a stable public URL.

Stakeholders: FE development (Change #4+) depends on this public URL being live before D2.
Backend CORS setup (Change #3) requires this Vercel URL as `ALLOWED_ORIGINS`.

## Goals / Non-Goals

**Goals:**

- Add `katex` and `@types/katex` to `src/client/package.json`
- Create `src/client/.env.example` documenting `NEXT_PUBLIC_API_URL`
- Create `vercel.json` at repo root with `{ "outputDirectory": ".next" }` (root directory configured via Vercel dashboard, not vercel.json)
- Push to `main` → Vercel CI builds and deploys → public URL is live and returns HTTP 200
- Public URL is usable as `ALLOWED_ORIGINS` for Change #3

**Non-Goals:**

- Implementing `KaTeXRenderer` component (Change #8)
- Setting up CORS on backend (Change #3)
- Backend deploy on Railway (Change #2)
- Any application UI beyond the existing boilerplate page
- Modifying `components.json` style (`radix-vega` is intentional, leave unchanged)

## Decisions

| Decision                | Choice                      | Rationale                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KaTeX package           | `katex` + `@types/katex`    | SYSTEM_DESIGN 10.1: `dynamic(() => import('katex'), {ssr:false})` uses raw katex, not react-katex. TypeScript types separate from runtime package.                                                                                                |
| Vercel root dir config  | Vercel dashboard (Option C) | `rootDirectory` key is NOT accepted by Vercel via `vercel.json`. Root Directory = `src/client` was set directly in the Vercel project dashboard. `vercel.json` at repo root only contains `{ "outputDirectory": ".next" }` for build output path. |
| Env var name            | `NEXT_PUBLIC_API_URL`       | Must have `NEXT_PUBLIC_` prefix to be accessible in browser (Next.js convention). Backend Railway URL.                                                                                                                                            |
| `.env.example` location | `src/client/.env.example`   | Next.js convention — env files live beside `package.json`. Placeholder value until Change #2 provides the real Railway URL.                                                                                                                       |
| DoD scope               | Public URL returns 200 only | CORS verify requires both FE and BE deployed. That end-to-end check is the DoD of D1 overall (after Change #2 + #3), not this individual change.                                                                                                  |

## Risks / Trade-offs

| Risk                                                                                    | Mitigation                                                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Vercel doesn't accept `rootDirectory` in `vercel.json` → build error on wrong directory | **Resolved**: Root Directory set directly in Vercel dashboard to `src/client`. `vercel.json` only sets `outputDirectory`. |
| `NEXT_PUBLIC_API_URL` has placeholder value at deploy time → fetch to Railway will 404  | Expected — Change #2 provides real URL; Vercel env var updated then. Boilerplate page doesn't call the API.               |
| `radix-vega` style in `components.json` may fail shadcn CLI `add` for some components   | Deferred risk for Change #4. No shadcn components added in this change.                                                   |

## Migration Plan

1. `cd src/client && pnpm add katex @types/katex`
2. Create `src/client/.env.example`
3. Create `vercel.json` at repo root
4. Push to `main` branch
5. Verify Vercel dashboard shows successful build
6. Verify public URL returns HTTP 200 in browser / curl

Rollback: Revert commit. Vercel automatically redeploys the previous commit.

## Open Questions

- Railway URL (for `NEXT_PUBLIC_API_URL` real value) — unblocked when Change #2 completes.
