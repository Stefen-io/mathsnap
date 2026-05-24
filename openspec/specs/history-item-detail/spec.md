# Spec: history-item-detail

## Purpose

**REMOVED** — The standalone history detail route `app/(main)/history/[id]/page.tsx` has been deleted. Its responsibility — fetching a stored solution via `getHistoryItem` and rendering it with the shared `StepCard` UI — is folded into the unified solve page operating in VIEW mode (`/solve?id={item.id}`). See the `solution-viewer` capability.

Any navigation previously targeting `/history/{id}` MUST be changed to `/solve?id={id}`.

## Requirements

_All requirements removed. See `solution-viewer` spec for the VIEW mode behavior that supersedes this capability._
