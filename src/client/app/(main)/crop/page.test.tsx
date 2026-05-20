import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useEffect } from 'react'
import type { Area } from 'react-easy-crop'

const mockPush = vi.fn()
const mockSetCroppedBlob = vi.fn()
const mockCapturedBlob = new Blob(['frame'], { type: 'image/jpeg' })
const { mockCroppedBlob } = vi.hoisted(() => ({
  mockCroppedBlob: new Blob(['cropped'], { type: 'image/jpeg' }),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))

vi.mock('react-easy-crop', () => ({
  default: function MockCropper({ onCropComplete }: {
    onCropComplete: (_: Area, pixels: Area) => void
  }) {
    useEffect(() => {
      onCropComplete(
        { x: 0, y: 0, width: 100, height: 75 },
        { x: 0, y: 0, width: 400, height: 300 }
      )
    }, [onCropComplete])
    return <div data-testid="cropper" />
  },
}))

vi.mock('@/lib/getCroppedImg', () => ({
  getCroppedImg: vi.fn().mockResolvedValue(mockCroppedBlob),
}))

import CropPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'

describe('CropPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when capturedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders Cropper when capturedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    expect(screen.getByTestId('cropper')).toBeTruthy()
  })

  it('Confirm calls setCroppedBlob and navigates to /ocr', async () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
    await waitFor(() => {
      expect(mockSetCroppedBlob).toHaveBeenCalledWith(mockCroppedBlob)
      expect(mockPush).toHaveBeenCalledWith('/ocr')
    })
  })

  it('Cancel navigates to /camera', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: mockCapturedBlob, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: mockSetCroppedBlob, reset: vi.fn(),
    })
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })
})
