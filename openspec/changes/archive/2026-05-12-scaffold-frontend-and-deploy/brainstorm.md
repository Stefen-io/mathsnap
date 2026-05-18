## Design Summary

Scaffold for frontend already exists in `src/client/` (Next.js 16.1.7, App Router, Tailwind v4,
Shadcn/ui radix-vega preset, React 19). Real remaining work is minimal: add KaTeX dependency,
add env template, wire Vercel deployment config, and push to trigger first deploy.

## Alternatives Considered

### Option A: Re-scaffold from scratch with `create-next-app`
- **Approach**: Delete src/client/ and re-init via `pnpm create next-app@16`
- **Pros**: Clean slate, guaranteed correct version pinning
- **Cons**: Destroys existing working scaffold; wastes 30+ minutes of prior work; risks
  re-introducing config drift
- **Why not chosen**: Existing scaffold is functionally correct — Next.js 16.1.7, App Router,
  Tailwind v4, Shadcn, ThemeProvider all in place

### Option B: Use existing scaffold + minimal additions (chosen)
- **Approach**: Add `katex` + `@types/katex` to existing package.json; create `vercel.json` at
  repo root pointing rootDirectory to `src/client/`; add `.env.example`; push to main
- **Pros**: Fastest path; no churn; builds on validated scaffold
- **Cons**: Relies on existing scaffold being correct (already verified)
- **Why chosen**: Scope is already 80% done; minimal additions are low-risk

### Option C: Vercel monorepo integration via dashboard only
- **Approach**: Skip `vercel.json`; configure root directory in Vercel dashboard during
  project provisioning
- **Pros**: No config file in repo
- **Cons**: Config lives outside the repo — not reproducible from git alone; harder to
  review/audit
- **Why not chosen**: `vercel.json` at repo root is the standard approach for monorepos and
  keeps infra config in source control

## Agreed Approach

**Option B** — extend existing scaffold with three additions:

1. `pnpm add katex @types/katex` (in `src/client/`)
2. `src/client/.env.example` with `NEXT_PUBLIC_API_URL=<railway-url-placeholder>`
3. `vercel.json` at repo root: `{ "rootDirectory": "src/client" }`

Then push to main branch → Vercel auto-deploy → verify public URL returns 200.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| KaTeX package | raw `katex` + `@types/katex` | SYSTEM_DESIGN 10.1 specifies `dynamic(() => import('katex'), {ssr:false})` — raw package, not react-katex |
| Vercel root dir | `vercel.json` at repo root | Keeps infra config in source control; pnpm auto-detected from `pnpm-lock.yaml` |
| Env var name | `NEXT_PUBLIC_API_URL` | Approved name for frontend→Railway URL; exposed to client via NEXT_PUBLIC_ prefix |
| DoD scope | Public URL accessible only | CORS verify is scope of Change #3 (`provision-data-and-health-monitoring`) |
| components.json style | `radix-vega` unchanged | Intentional Figma Make preset — do not alter |

## Open Questions

- Railway URL not yet provisioned (Change #2) — `.env.example` will use placeholder
  `https://<your-railway-app>.up.railway.app`; Vercel env var set after Change #2 completes
