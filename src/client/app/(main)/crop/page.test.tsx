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

const baseContext = {
  capturedBlob: mockCapturedBlob,
  croppedBlob: null,
  ocrLatex: null,
  solveResult: null,
  setCapturedBlob: vi.fn(),
  setCroppedBlob: mockSetCroppedBlob,
  setOcrLatex: vi.fn(),
  setSolveResult: vi.fn(),
  reset: vi.fn(),
}

describe('CropPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when capturedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      capturedBlob: null,
    })
    render(<CropPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders Cropper when capturedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue(baseContext)
    render(<CropPage />)
    expect(screen.getByTestId('cropper')).toBeTruthy()
  })

  it('Confirm calls setCroppedBlob and navigates to /ocr', async () => {
    vi.mocked(useCaptureContext).mockReturnValue(baseContext)
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
    await waitFor(() => {
      expect(mockSetCroppedBlob).toHaveBeenCalledWith(mockCroppedBlob)
      expect(mockPush).toHaveBeenCalledWith('/ocr')
    })
  })

  it('Cancel navigates to /camera', () => {
    vi.mocked(useCaptureContext).mockReturnValue(baseContext)
    render(<CropPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  describe('custom ratio', () => {
    beforeEach(() => {
      vi.mocked(useCaptureContext).mockReturnValue(baseContext)
    })

    it('shows preset buttons and Custom button by default', () => {
      render(<CropPage />)
      expect(screen.getByRole('button', { name: '4:3' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '16:9' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '1:1' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Custom' })).toBeTruthy()
    })

    it('clicking Custom shows W/H inputs and Apply button', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      expect(screen.getByLabelText('Width')).toBeTruthy()
      expect(screen.getByLabelText('Height')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Apply custom ratio' })).toBeTruthy()
    })

    it('Apply is disabled with empty inputs', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      expect(screen.getByRole('button', { name: 'Apply custom ratio' })).toBeDisabled()
    })

    it('Apply is disabled when W is zero', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      fireEvent.change(screen.getByLabelText('Width'), { target: { value: '0' } })
      fireEvent.change(screen.getByLabelText('Height'), { target: { value: '3' } })
      expect(screen.getByRole('button', { name: 'Apply custom ratio' })).toBeDisabled()
    })

    it('Apply is enabled with both W and H > 0', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      fireEvent.change(screen.getByLabelText('Width'), { target: { value: '16' } })
      fireEvent.change(screen.getByLabelText('Height'), { target: { value: '9' } })
      expect(screen.getByRole('button', { name: 'Apply custom ratio' })).not.toBeDisabled()
    })

    it('clicking Apply returns to preset view', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      fireEvent.change(screen.getByLabelText('Width'), { target: { value: '3' } })
      fireEvent.change(screen.getByLabelText('Height'), { target: { value: '2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply custom ratio' }))
      expect(screen.getByRole('button', { name: 'Custom' })).toBeTruthy()
      expect(screen.queryByLabelText('Width')).toBeNull()
    })

    it('re-entering custom mode shows empty inputs', () => {
      render(<CropPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      fireEvent.change(screen.getByLabelText('Width'), { target: { value: '3' } })
      fireEvent.change(screen.getByLabelText('Height'), { target: { value: '2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Apply custom ratio' }))
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
      expect((screen.getByLabelText('Width') as HTMLInputElement).value).toBe('')
      expect((screen.getByLabelText('Height') as HTMLInputElement).value).toBe('')
    })
  })
})
