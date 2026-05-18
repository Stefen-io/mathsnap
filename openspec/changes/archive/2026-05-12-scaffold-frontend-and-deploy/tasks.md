## 1. KaTeX Dependency

- [x] 1.1 Run `pnpm add katex` in `src/client/` to add runtime dependency
- [x] 1.2 Run `pnpm add -D @types/katex` in `src/client/` to add TypeScript types
- [x] 1.3 Verify `tsc --noEmit` passes (no missing type declaration error for katex)

## 2. Environment Variable Contract

- [x] 2.1 Create `src/client/.env.example` with content:
      `NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app`
- [x] 2.2 Confirm `src/client/.gitignore` does NOT ignore `.env.example` (it should be committed)

## 3. Vercel Deployment Configuration

- [x] 3.1 Create `vercel.json` at repo root:
      `{ "rootDirectory": "src/client" }`
- [x] 3.2 Provision Vercel project: link repo via Vercel dashboard or `vercel link`, confirm
      root directory is set to `src/client`
- [x] 3.3 Set `NEXT_PUBLIC_API_URL` env var in Vercel project settings (placeholder value
      `https://placeholder.railway.app` until Change #2 provides real Railway URL)

## 4. Deploy and Verify

- [x] 4.1 Push changes to `main` branch to trigger Vercel auto-deploy
- [x] 4.2 Confirm Vercel build completes without errors in Vercel dashboard
- [x] 4.3 Verify public URL returns HTTP 200: `curl -o /dev/null -s -w "%{http_code}" https://mathsnap-xi.vercel.app` → 200 ✓
- [x] 4.4 Record the Vercel public URL — needed by Change #3 as `ALLOWED_ORIGINS`: https://mathsnap-xi.vercel.app
