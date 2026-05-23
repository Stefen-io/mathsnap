## MODIFIED Requirements

### Requirement: OCR page calls POST /api/ocr and enters a confirm state on success

The system SHALL call `postOcr(croppedBlob, deviceId)` exactly once per component
mount once `deviceId` is non-null. A change in `lang` after mount MUST NOT trigger
a second API call. While awaiting the response, it MUST display a pulsing loading
skeleton with label "Đang nhận dạng công thức...". On a successful response it MUST
transition to a `confirm` state with `editedLatex` initialised to `formulas[0].latex`
and `confidence` set to `formulas[0].confidence`.

#### Scenario: OCR loading skeleton displayed while request is in-flight
- **WHEN** `/ocr` is mounted with a non-null `croppedBlob` and the API call is pending
- **THEN** a pulsing skeleton and the text "Đang nhận dạng công thức..." are visible

#### Scenario: Confirm state entered after successful OCR
- **WHEN** `postOcr` resolves with `formulas[0]`
- **THEN** the confirm UI is rendered with the returned `latex` value

#### Scenario: Null croppedBlob redirects to camera
- **WHEN** `/ocr` is mounted with `croppedBlob === null`
- **THEN** the router redirects to `/camera`

#### Scenario: Lang change after mount does not trigger a second API call
- **WHEN** `LanguageContext` transitions from `'vi'` to `'en'` after the OCR page mounts
- **THEN** only one `POST /ocr` request is issued (no duplicate on lang change)

---

## ADDED Requirements

### Requirement: OCR error strings SHALL use the locale settled at response time

When `postOcr` rejects or returns an empty formulas array, the displayed error message
MUST reflect the user's locale as it exists at the time the response resolves — not
the locale captured at the time the call was initiated. If `lang` transitioned from
`'vi'` to `'en'` between call start and response, the error string MUST be in `'en'`.

#### Scenario: Error message language matches settled locale
- **WHEN** `lang` is `'vi'` at call-start and transitions to `'en'` before `postOcr` resolves
- **THEN** the displayed error message is in English (`'en'`), not Vietnamese (`'vi'`)

#### Scenario: Error message correct when lang does not change
- **WHEN** `lang` remains `'vi'` throughout the OCR call lifecycle
- **THEN** the displayed error message is in Vietnamese
