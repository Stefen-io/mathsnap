# Spec: camera-intake-flow

## Purpose

Defines the end-to-end camera capture flow: a React context for sharing image blobs between routes, the Camera page with live preview and shutter, the `useCamera` hook for stream lifecycle management, the Crop page with react-easy-crop, and the OCR skeleton page. Together these screens form the intake pipeline from capture through to OCR handoff.

## Requirements

### Requirement: CaptureContext holds image state between routes

The system SHALL provide `contexts/CaptureContext.tsx` exporting `CaptureProvider`
and `useCaptureContext`. The context SHALL hold `capturedBlob: Blob | null`,
`croppedBlob: Blob | null`, `ocrLatex: string | null`, and
`solveResult: HistoryItem | null`, plus setter functions `setCapturedBlob`,
`setCroppedBlob`, `setOcrLatex`, `setSolveResult`, and a `reset()` function.
Calling `reset()` MUST set all four state values to `null`. Calling
`useCaptureContext()` outside of `CaptureProvider` MUST throw an error with a
descriptive message.

#### Scenario: Initial context state is null
- **WHEN** `CaptureProvider` is mounted without any prior state
- **THEN** `capturedBlob`, `croppedBlob`, `ocrLatex`, and `solveResult` are all `null`

#### Scenario: setCapturedBlob updates state
- **WHEN** `setCapturedBlob(blob)` is called with a Blob
- **THEN** `capturedBlob` returns that Blob on the next render

#### Scenario: reset clears all four fields
- **WHEN** `reset()` is called after all four state values have been set
- **THEN** `capturedBlob`, `croppedBlob`, `ocrLatex`, and `solveResult` are all `null`

#### Scenario: setOcrLatex updates ocrLatex
- **WHEN** `setOcrLatex("x^2 + 1")` is called
- **THEN** `ocrLatex` returns `"x^2 + 1"` on the next render

#### Scenario: useCaptureContext throws outside provider
- **WHEN** `useCaptureContext()` is called in a component not wrapped by `CaptureProvider`
- **THEN** an error is thrown containing the word "CaptureProvider"

---

### Requirement: Camera screen activates getUserMedia on mount

The system SHALL render `app/(main)/camera/page.tsx` at `/camera`. On mount, it MUST call `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })`. The live video stream MUST be attached to a `<video>` element with `autoPlay` and `playsInline` attributes. The component MUST be a Client Component (`'use client'`).

#### Scenario: Camera screen mounts and requests stream
- **WHEN** the Camera page is rendered
- **THEN** `navigator.mediaDevices.getUserMedia` is called with `facingMode: 'environment'`

#### Scenario: Video element is present with autoPlay and playsInline
- **WHEN** the Camera page renders successfully
- **THEN** a `<video autoPlay playsInline>` element is in the DOM

---

### Requirement: useCamera hook manages stream lifecycle

The system SHALL provide `hooks/useCamera.ts` that abstracts `getUserMedia`, stream teardown on unmount, canvas frame capture, and facingMode toggling. The hook MUST stop all tracks on cleanup to prevent camera indicator remaining active. `captureFrame()` MUST return a `Promise<Blob>` with `type: 'image/jpeg'` and quality `0.85`.

#### Scenario: Stream stops on unmount
- **WHEN** the component using `useCamera` is unmounted
- **THEN** all `MediaStreamTrack` instances are stopped

#### Scenario: captureFrame returns a JPEG Blob
- **WHEN** `captureFrame()` is called while the stream is active
- **THEN** the returned Blob has `type === 'image/jpeg'`

#### Scenario: flipCamera toggles facingMode
- **WHEN** `flipCamera()` is called while `facingMode` is `'environment'`
- **THEN** a new stream is started with `facingMode: 'user'`

---

### Requirement: Shutter button captures frame and navigates to crop

The Camera screen SHALL display a shutter button. Tapping the shutter button MUST call `captureFrame()` to get a JPEG Blob, store it via `setCapturedBlob(blob)` in `CaptureContext`, and then navigate to `/crop`.

#### Scenario: Shutter tap captures and navigates
- **WHEN** the user taps the shutter button
- **THEN** `setCapturedBlob` is called with a non-null Blob and the router navigates to `/crop`

---

### Requirement: Crop screen renders react-easy-crop with captured image

The system SHALL render `app/(main)/crop/page.tsx` at `/crop`. It MUST display `Cropper` from `react-easy-crop` initialized with `capturedBlob` from `CaptureContext` as the image source (converted to an object URL). Aspect ratio SHALL be `4 / 3`. Zoom range SHALL be 1 to 3. If `capturedBlob` is `null` on mount, the page MUST redirect to `/camera`.

#### Scenario: Cropper renders with captured image
- **WHEN** `/crop` is navigated to with a non-null `capturedBlob`
- **THEN** the `Cropper` component is rendered with a valid image source

#### Scenario: Null capturedBlob redirects to camera
- **WHEN** `/crop` is navigated to with `capturedBlob === null`
- **THEN** the router redirects to `/camera`

---

### Requirement: Crop confirm produces croppedBlob and navigates to OCR

The Crop screen SHALL display a "Confirm" button and a "Cancel" button. Tapping Confirm MUST call `getCroppedImg()` to produce a cropped `Blob` (JPEG, 0.85 quality), store it via `setCroppedBlob(blob)` in `CaptureContext`, and navigate to `/ocr`. Tapping Cancel MUST navigate to `/camera`.

#### Scenario: Confirm crops and navigates to OCR
- **WHEN** the user taps Confirm on the Crop screen
- **THEN** `setCroppedBlob` is called with a non-null Blob and the router navigates to `/ocr`

#### Scenario: Cancel returns to Camera
- **WHEN** the user taps Cancel on the Crop screen
- **THEN** the router navigates to `/camera`

---

### Requirement: OCR screen renders a loading skeleton without API calls

> **Superseded by `formula-preview-edit` capability spec.** The OCR screen
> `app/(main)/ocr/page.tsx` MUST be rewritten to call `POST /api/ocr`. The
> skeleton-only, no-network-request behaviour described in this requirement NO
> LONGER APPLIES. The guard on `croppedBlob === null` (redirect to `/camera`)
> SHALL be preserved.

#### Scenario: Null croppedBlob redirects to camera
- **WHEN** `/ocr` is navigated to with `croppedBlob === null`
- **THEN** the router redirects to `/camera`
