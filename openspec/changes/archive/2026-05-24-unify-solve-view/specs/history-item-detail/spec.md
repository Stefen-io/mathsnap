## REMOVED Requirements

### Requirement: History detail page fetches and renders stored solution

**Reason**: The standalone history detail route `app/(main)/history/[id]/page.tsx` is
removed. Its responsibility — fetching a stored solution via `getHistoryItem` and rendering
it with the shared `StepCard` UI — is folded into the unified solve page operating in VIEW
mode (`/solve?id={item.id}`). See the `solution-viewer` capability.

**Migration**: Any navigation to `/history/{id}` MUST be changed to `/solve?id={id}`. The
history and bookmarks list views are updated accordingly. The VIEW-mode behavior of
`solution-viewer` (fetch by `id`, no `postSolve`, redirect to `/history` on fetch error,
problem bar shows `item.latex`) supersedes this requirement.

---

### Requirement: History detail page shows functional bookmark toggle

**Reason**: The bottom action bar (Bookmark toggle + "Bài mới" CTA) previously owned by the
history detail page is provided by the unified solve page's bottom action bar, which already
covers bookmark initialization, optimistic toggle via `toggleBookmark`, and the shared
styling. The detail-specific implementation is therefore redundant and removed with the page.

**Migration**: No action needed — the equivalent bottom action bar is defined by the
`solution-viewer` capability ("Bottom action bar has functional Bookmark button and Bài mới
CTA"), which applies in both SOLVE and VIEW modes.
