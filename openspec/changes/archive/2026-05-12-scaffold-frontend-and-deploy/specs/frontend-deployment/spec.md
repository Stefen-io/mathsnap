## ADDED Requirements

### Requirement: KaTeX dependency declared
The `src/client/package.json` SHALL declare `katex` as a runtime dependency and `@types/katex`
as a dev dependency so KaTeX rendering components can be imported without additional install steps.

#### Scenario: katex present after install
- **WHEN** a developer runs `pnpm install` in `src/client/`
- **THEN** `node_modules/katex` and `node_modules/@types/katex` are present with no manual step

#### Scenario: TypeScript recognises KaTeX types
- **WHEN** a `.tsx` file imports from `katex`
- **THEN** `tsc --noEmit` completes without "Could not find declaration file for module 'katex'" error

---

### Requirement: Vercel root directory configuration
The Vercel project MUST be configured to build from `src/client/` so Vercel CI/CD builds the
correct Next.js application and not the repository root. Root Directory is configured via the
Vercel dashboard (not via `vercel.json` — Vercel does not accept `rootDirectory` in `vercel.json`).

#### Scenario: Vercel build uses correct directory
- **WHEN** a commit is pushed to `main` and Vercel triggers a build
- **THEN** Vercel resolves `package.json`, `next.config.mjs`, and `pnpm-lock.yaml` from
  `src/client/`, and the build succeeds without "No Next.js version found" or similar errors

#### Scenario: vercel.json is at repo root
- **WHEN** the repository is cloned fresh
- **THEN** `vercel.json` exists at the root of the repository containing `{ "outputDirectory": ".next" }`;
  it does NOT contain a `rootDirectory` key (root directory is a Vercel dashboard setting, not a file config)

---

### Requirement: Environment variable contract documented
`src/client/.env.example` MUST exist and declare `NEXT_PUBLIC_API_URL` so developers and the
Vercel project know which env var to set for the frontend→backend URL.

#### Scenario: .env.example present with correct key
- **WHEN** a developer clones the repository
- **THEN** `src/client/.env.example` contains the line `NEXT_PUBLIC_API_URL=<placeholder>`

#### Scenario: Missing env var is detectable at build time
- **WHEN** `NEXT_PUBLIC_API_URL` is not set in the Vercel environment
- **THEN** any code that reads `process.env.NEXT_PUBLIC_API_URL` receives `undefined`, allowing
  the consuming component to display a fallback rather than silently calling a wrong URL

---

### Requirement: Frontend public URL accessible
After deploy, the Vercel-assigned public URL MUST return HTTP 200 for the root path `/` so
downstream changes and CORS configuration have a stable origin to reference.

#### Scenario: Root path returns 200
- **WHEN** an HTTP GET request is made to the Vercel deployment URL at path `/`
- **THEN** the response status code is 200 and the response body contains valid HTML
