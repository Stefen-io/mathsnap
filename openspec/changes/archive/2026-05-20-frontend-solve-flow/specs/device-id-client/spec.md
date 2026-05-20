## ADDED Requirements

### Requirement: getDeviceId reads or generates a UUID v4 from localStorage

The system SHALL provide `lib/device-id.ts` exporting a `getDeviceId(): string`
function. On first call, it MUST generate a UUID v4 using `crypto.randomUUID()`,
persist it to `localStorage` under the key `mathsnap_device_id`, and return it. On
subsequent calls within the same session, it MUST return the same UUID without
generating a new one. This function MUST NOT import any React modules.

#### Scenario: First call generates and persists a UUID
- **WHEN** `getDeviceId()` is called and `localStorage` has no `mathsnap_device_id`
- **THEN** a new UUID v4 is generated, written to `localStorage`, and returned

#### Scenario: Second call returns the persisted UUID
- **WHEN** `getDeviceId()` is called a second time in the same session
- **THEN** the same UUID returned on the first call is returned (no new UUID generated)

#### Scenario: After localStorage.clear(), a new UUID is generated
- **WHEN** `localStorage.clear()` is called and then `getDeviceId()` is called
- **THEN** a new, different UUID v4 is generated and persisted

#### Scenario: Returned value matches UUID v4 format
- **WHEN** `getDeviceId()` returns a value
- **THEN** the value matches the regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`

---

### Requirement: useDeviceId hook is SSR-safe and returns null before hydration

The system SHALL provide `hooks/useDeviceId.ts` exporting a `useDeviceId(): string | null`
hook. It MUST return `null` on the initial server render (before `useEffect` fires)
and the UUID string after client-side hydration. The hook MUST be a Client Component
(`'use client'`). Callers MUST gate API calls on the return value being non-null.

#### Scenario: Returns null before effect fires
- **WHEN** the component using `useDeviceId` is in its initial server-render state
- **THEN** the hook returns `null`

#### Scenario: Returns UUID string after mount
- **WHEN** the `useEffect` inside `useDeviceId` fires after client hydration
- **THEN** the hook returns the UUID string from `getDeviceId()`
