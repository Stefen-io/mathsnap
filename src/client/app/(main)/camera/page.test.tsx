import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockSetCapturedBlob = vi.fn()
const mockCaptureFrame = vi.fn()
const mockFlipCamera = vi.fn()
const fakeBlob = new Blob(['frame'], { type: 'image/jpeg' })

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({
    capturedBlob: null,
    croppedBlob: null,
    setCapturedBlob: mockSetCapturedBlob,
    setCroppedBlob: vi.fn(),
    reset: vi.fn(),
  }),
}))

vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    canvasRef: { current: null },
    facingMode: 'environment' as const,
    flipCamera: mockFlipCamera,
    captureFrame: mockCaptureFrame,
    isReady: true,
  }),
}))

import CameraPage from './page'

describe('CameraPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCaptureFrame.mockResolvedValue(fakeBlob)
  })

  it('renders a video element with autoPlay and playsInline', () => {
    const { container } = render(<CameraPage />)
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video!.hasAttribute('autoplay') || video!.hasAttribute('autoPlay')).toBe(true)
    expect(video!.hasAttribute('playsinline') || video!.hasAttribute('playsInline')).toBe(true)
  })

  it('renders shutter button with aria-label "Chụp ảnh"', () => {
    render(<CameraPage />)
    expect(screen.getByRole('button', { name: 'Chụp ảnh' })).toBeTruthy()
  })

  it('shutter click calls setCapturedBlob then navigates to /crop', async () => {
    render(<CameraPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Chụp ảnh' }))
    await waitFor(() => {
      expect(mockSetCapturedBlob).toHaveBeenCalledWith(fakeBlob)
      expect(mockPush).toHaveBeenCalledWith('/crop')
    })
  })

  it('flip button calls flipCamera', () => {
    render(<CameraPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xoay camera' }))
    expect(mockFlipCamera).toHaveBeenCalledOnce()
  })
})
