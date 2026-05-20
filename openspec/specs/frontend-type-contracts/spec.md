# Spec: frontend-type-contracts

## Purpose

Defines the TypeScript type contracts shared across the frontend client: the `HistoryItem` and `SolutionStep` interfaces that mirror the API response shape, the mock fixtures that depend on them, and the `KaTeXRenderer` lazy-loaded component that accepts typed LaTeX props.

## Requirements

### Requirement: HistoryItem and SolutionStep TypeScript interfaces match API shape

The system SHALL define `SolutionStep` and `HistoryItem` interfaces in `src/client/types/history.ts` using camelCase keys matching the HTTP response shape from SYSTEM_DESIGN §3.7.

`SolutionStep` SHALL have: `index: number`, `title: string`, `explanation: string`, `formula: string | undefined`, `isAnswer: boolean`.

`HistoryItem` SHALL have: `id: string`, `deviceId: string`, `latex: string`, `solutionSteps: SolutionStep[]`, `language: 'vi' | 'en'`, `createdAt: string`, `isBookmarked: boolean`.

Both interfaces MUST be exported from `types/history.ts` and MUST compile without errors under TypeScript strict mode.

#### Scenario: types/history.ts is importable
- **WHEN** `import type { HistoryItem, SolutionStep } from '@/types/history'` is used in any file
- **THEN** the import resolves without TypeScript error

#### Scenario: HistoryItem has all required camelCase fields
- **WHEN** a value is typed as `HistoryItem`
- **THEN** TypeScript enforces the presence of `id`, `deviceId`, `latex`, `solutionSteps`, `language`, `createdAt`, `isBookmarked`

#### Scenario: SolutionStep formula is optional
- **WHEN** a `SolutionStep` object is constructed with `formula: undefined`
- **THEN** TypeScript accepts the value without error

---

### Requirement: MOCK_HISTORY fixture imports and compiles cleanly

The existing `src/client/fixtures/history.ts` imports `HistoryItem` from `@/types/history`. Once `types/history.ts` is present, the import MUST resolve and the file MUST compile without TypeScript errors.

#### Scenario: fixtures/history.ts compiles after types file is created
- **WHEN** `pnpm typecheck` is run after `types/history.ts` is created
- **THEN** `src/client/fixtures/history.ts` produces no TypeScript errors

---

### Requirement: fixtures/solution.ts provides sample SolutionStep data

The system SHALL define and export `MOCK_SOLUTION_STEPS: SolutionStep[]` from `src/client/fixtures/solution.ts` with at least 3 steps: one intermediate step with a formula, one intermediate step without a formula (`formula: undefined`), and one answer step (`isAnswer: true`).

#### Scenario: MOCK_SOLUTION_STEPS is importable and typed
- **WHEN** `import { MOCK_SOLUTION_STEPS } from '@/fixtures/solution'` is used
- **THEN** the import succeeds and `MOCK_SOLUTION_STEPS` is typed as `SolutionStep[]`

#### Scenario: At least one step has isAnswer true
- **WHEN** `MOCK_SOLUTION_STEPS` is inspected at runtime or test time
- **THEN** `MOCK_SOLUTION_STEPS.some(s => s.isAnswer === true)` is `true`

---

### Requirement: KaTeXRenderer is a lazy-loaded client-only stub

The system SHALL provide `src/client/components/KaTeXRenderer.tsx` that is loaded via `next/dynamic` with `{ ssr: false }`. The component SHALL accept a `latex: string` prop. In G3, it SHALL render the LaTeX string via `katex.renderToString()` using `dangerouslySetInnerHTML`. The component MUST NOT require a server-side render pass.

#### Scenario: KaTeXRenderer renders without SSR error
- **WHEN** `<KaTeXRenderer latex="x^2" />` is rendered in a client component
- **THEN** no SSR hydration mismatch error occurs and the element is present in the DOM after hydration

#### Scenario: KaTeXRenderer accepts latex prop without TypeScript error
- **WHEN** `<KaTeXRenderer latex="\\frac{1}{2}" />` is written in a `.tsx` file
- **THEN** TypeScript accepts the prop without error
