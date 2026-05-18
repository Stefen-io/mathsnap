## Why

Phase 2.5 requires a public frontend URL by end of D1 so that (a) Change #3 can configure
`ALLOWED_ORIGINS` for CORS, and (b) subsequent FE changes (D2+) have a live deployment target.
The Next.js scaffold already exists; the only blocker to a live URL is the missing Vercel
deployment configuration and the KaTeX dependency required by the rendering spec.

## What Changes

**KaTeX dependency**

- From: `katex` not in `src/client/package.json`
- To: `katex` and `@types/katex` added to dependencies/devDependencies
- Reason: KaTeXRenderer (Change #8) needs it; adding now locks the version alongside the scaffold
- Impact: non-breaking, additive

**Vercel deployment configuration**

- From: No `vercel.json`; Vercel has no knowledge of `src/client/` as the app root
- To: `vercel.json` at repo root with `rootDirectory: "src/client"`
- Reason: Monorepo layout — Next.js app is not at repo root
- Impact: Enables Vercel CI/CD on `main` pushes

**Frontend env documentation**

- From: No `.env.example` in `src/client/`
- To: `src/client/.env.example` with `NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app`
- Reason: Documents the required env var for frontend→backend communication; real value filled after Change #2
- Impact: Developer onboarding, Vercel env var setup guide

## Capabilities

### New Capabilities

- `frontend-deployment`: Vercel deployment pipeline for the Next.js frontend — `vercel.json`
  config, env var contract (`NEXT_PUBLIC_API_URL`), and CI/CD on `main` push

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- `src/client/package.json`: adds `katex`, `@types/katex`
- `src/client/.env.example`: new file
- `vercel.json`: new file at repo root
- No changes to application code, routes, or components
