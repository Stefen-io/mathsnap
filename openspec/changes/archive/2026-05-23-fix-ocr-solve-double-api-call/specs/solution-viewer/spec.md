## MODIFIED Requirements

### Requirement: Solve page guards on ocrLatex and fires POST /api/solve on mount

The system SHALL provide `app/solve/page.tsx` as a flat Client Component route
outside the `(main)` layout. On mount it MUST read `ocrLatex` from `CaptureContext`;
if `null`, it MUST call `router.replace('/camera')`. Once `deviceId` from
`useDeviceId` is non-null, it MUST call `postSolve(ocrLatex, deviceId)` exactly once
per component mount — including when React StrictMode fires the triggering effect
twice in development. Subsequent effect re-runs due to StrictMode MUST NOT issue a
second request.

#### Scenario: Null ocrLatex redirects to camera
- **WHEN** `/solve` is mounted with `CaptureContext.ocrLatex === null`
- **THEN** the router replaces to `/camera`

#### Scenario: postSolve is fired after deviceId is ready
- **WHEN** `deviceId` becomes non-null and `ocrLatex` is set
- **THEN** `postSolve(ocrLatex, deviceId)` is called exactly once

#### Scenario: StrictMode double-effect does not produce a second request
- **WHEN** React StrictMode fires the mount effect twice in development
- **THEN** `postSolve` is invoked only once (no concurrent duplicate request)
