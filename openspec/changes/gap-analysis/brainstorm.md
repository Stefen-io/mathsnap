## Design Summary

This change closes the release-blocking gaps found in the pre-G7 audit (`docs/plans/G7_GAP_REGISTER.md`) by bringing the codebase back into conformance with the canonical `openspec/specs/`. It is a conformance + small-delta change (6 fixes), not a feature.

Brainstorming was performed via the `gap-analysis` explore session (the audit) plus two explicit decisions captured below; this document records the agreed outcome rather than re-running an interactive session.

## Alternatives Considered

### Fix 5 — Low-confidence badge ("dead code")
- **Approach A — Remove badge + delete requirement**: drop the badge from `ocr/page.tsx` and remove the requirement from `formula-preview-edit`.
  - **Cons**: deletes intentional forward-looking design; `ocr-endpoint:47` hardcodes `confidence=1.0` *"until pix2tex exposes a real confidence score"*, so the badge is dormant by design, not dead.
- **Approach B — Keep dormant (CHOSEN)**: leave the badge; it activates automatically when real confidence lands. No spec change, no code change. The gap register's "dead code" label was a misread of intent.
- **Approach C — Wire real pix2tex confidence**: make the badge live now.
  - **Cons**: backend work, changes `ocr-endpoint`'s hardcoded-1.0 requirement; out of scope for a pre-release conformance pass.

### Fix 6 — Solution viewer open-state ("Xem tất cả")
- **Approach A — Start all-open per spec (CHOSEN)**: `solution-viewer:48` already mandates an all-open accordion with "no locked state". The real gap is `solve/page.tsx` starting with only step 1 open. Fix = start all steps expanded; no button needed. Aligns with Fix 1 (history detail).
- **Approach B — All-open + "Thu gọn" (collapse-all)**: adds a new collapse-all requirement.
  - **Cons**: scope creep; not in spec.
- **Approach C — Keep step-1-only + add "Xem tất cả"**: matches the PRD's "progressive disclosure / locked" framing.
  - **Cons**: directly contradicts the canonical spec's "no locked state"; would require modifying `solution-viewer` to introduce locking.

### Workflow routing — opsx change vs direct PR
- **Direct PR**: CLAUDE.md routes bug-fix/dead-code work to direct PR.
- **opsx change (CHOSEN)**: user opted for the formal artifact trail as a pre-G7 gate; reinforced once the audit revealed the work carries 7 spec deltas (exactly what opsx is for).

### OCR timeout error code (Fix 2)
- **Reuse `LLM_TIMEOUT`**: semantically wrong (solve-only) and implies a backend response.
- **Client-only `OCR_TIMEOUT` (CHOSEN)**: synthesised client-side on `AbortController` abort; keeps the backend error envelope unchanged.
- **New backend `OCR_TIMEOUT` code**: unnecessary — the timeout is a client concern; would expand `api-schemas`.

## Agreed Approach

Conformance-first, minimal-delta. Fix the 6 gaps that align code to existing specs (Fixes 1, 3, 6, 7) and add the small guards the specs lacked (Fixes 2, 4). Drop Fix 5. No backend contract change; `OCR_TIMEOUT` is client-only. Remove the now-stale "no Nhập thủ công CTA" constraint in `formula-preview-edit` since S-11 exists.

## Key Decisions

- **Fix 5 dropped** — badge is intentional dormant design.
- **Fix 6 = conform** — start all steps open; no "Xem tất cả" button.
- **`OCR_TIMEOUT` is client-only** — backend error contract untouched.
- **`INTERNAL_ERROR` catch-all** reuses the existing error envelope; mapped errors pass through unchanged.
- **`formula-preview-edit`** loses its stale "MUST NOT add Nhập thủ công" line.
- **Fix 7** needs an `onboarding-overlay` extension: `useOnboarding()` gains `replayOnboarding()` (the current context has no replay path). `settings-screen` stays conformance — wire the row to it.
- **Fix 4 Home detection** uses a non-streaming probe, NOT `useCamera` (mounting `useCamera` on Home would start a stream + prompt on load).

## Open Questions

- None blocking. Cold-start/UptimeRobot (NFR-6) and FR-8 UI i18n remain out of scope (tracked separately).
