# scaffold-frontend-and-deploy Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** Add KaTeX dependency, wire Vercel deployment config, and push to get a live public URL.

**Architecture:** Existing Next.js 16 app at `src/client/` gains KaTeX, a `vercel.json` at repo
root directs Vercel to build from that subdirectory, and `.env.example` documents the required
env var. No application code changes.

**Tech Stack:** Next.js 16.1.7, pnpm, Vercel CI/CD, katex 0.x

---

## Task 1: KaTeX Dependency

- [ ] **Step 1:** `cd src/client`
- [ ] **Step 2:** `pnpm add katex` — adds to `dependencies`
- [ ] **Step 3:** `pnpm add -D @types/katex` — adds to `devDependencies`
- [ ] **Step 4:** Verify package.json now contains both entries:
  ```bash
  grep -E '"katex"' src/client/package.json
  ```
- [ ] **Step 5:** `pnpm run typecheck` (alias for `tsc --noEmit`) — must pass with no katex-related errors

---

## Task 2: Environment Variable Contract

- [ ] **Step 1:** Create `src/client/.env.example`:
  ```
  NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app
  ```
- [ ] **Step 2:** Confirm `.env.example` is NOT in `.gitignore` (it should be committed):
  ```bash
  grep ".env.example" src/client/.gitignore
  # should return nothing (not ignored)
  ```

---

## Task 3: Vercel Deployment Configuration

- [ ] **Step 1:** Create `vercel.json` at **repo root** (not in `src/client/`):
  ```json
  {
    "rootDirectory": "src/client"
  }
  ```
- [ ] **Step 2:** Provision Vercel project — go to vercel.com → New Project → Import repo
      → confirm "Root Directory" shows `src/client` (auto-detected from vercel.json)
- [ ] **Step 3:** In Vercel project settings → Environment Variables, add:
  - Key: `NEXT_PUBLIC_API_URL`
  - Value: `https://placeholder.railway.app` (update after Change #2 provides real URL)
  - Environment: Production + Preview

---

## Task 4: Deploy and Verify

- [ ] **Step 1:** Commit all changes:
  ```bash
  git add src/client/package.json src/client/pnpm-lock.yaml src/client/.env.example vercel.json
  git commit -m "feat: add katex dep and vercel deployment config"
  ```
- [ ] **Step 2:** Push to `main`:
  ```bash
  git push origin main
  ```
- [ ] **Step 3:** Watch Vercel dashboard for build completion (typically 1-2 min)
- [ ] **Step 4:** Verify public URL returns 200:
  ```bash
  curl -o /dev/null -s -w "%{http_code}\n" https://<project>.vercel.app
  # expected: 200
  ```
- [ ] **Step 5:** Record the Vercel public URL and share with Change #3 team for `ALLOWED_ORIGINS`
