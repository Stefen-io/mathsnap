## ADDED Requirements

### Requirement: useCamera exposes cameraUnavailable when the camera cannot be used

`hooks/useCamera.ts` MUST catch `getUserMedia` failures and expose a boolean `cameraUnavailable` that is set to `true` when the camera cannot be used: a `NotAllowedError` (permission denied), a `NotFoundError` (no camera device), or an unsupported API (`NotSupportedError`, or absent `navigator.mediaDevices`/`getUserMedia`). The hook MUST NOT silently swallow these errors. While `cameraUnavailable` is `true`, no live stream is attached. Successful acquisition MUST leave `cameraUnavailable === false`.

#### Scenario: Permission denial sets cameraUnavailable
- **WHEN** `getUserMedia` rejects with a `NotAllowedError`
- **THEN** `cameraUnavailable` becomes `true` and no stream is attached

#### Scenario: Missing device sets cameraUnavailable
- **WHEN** `getUserMedia` rejects with a `NotFoundError`
- **THEN** `cameraUnavailable` becomes `true`

#### Scenario: Unsupported API sets cameraUnavailable
- **WHEN** `navigator.mediaDevices?.getUserMedia` is unavailable, or rejects with `NotSupportedError`
- **THEN** `cameraUnavailable` becomes `true` without an unhandled exception escaping the hook

#### Scenario: Successful acquisition keeps cameraUnavailable false
- **WHEN** `getUserMedia` resolves with a stream
- **THEN** `cameraUnavailable` is `false` and the stream is attached to the video element
