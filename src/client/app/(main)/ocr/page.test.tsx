import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))
vi.mock('@/hooks/useDeviceId', () => ({
  useDeviceId: vi.fn(),
}))

import OcrPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'

const baseContext = {
  capturedBlob: null,
  croppedBlob: null,
  ocrLatex: null,
  solveResult: null,
  setCapturedBlob: vi.fn(),
  setCroppedBlob: vi.fn(),
  setOcrLatex: vi.fn(),
  setSolveResult: vi.fn(),
  reset: vi.fn(),
}

describe('OcrPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when croppedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue(null)
    render(<OcrPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders loading skeleton and label when croppedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue(null)
    render(<OcrPage />)
    expect(screen.getByText('Đang nhận dạng công thức...')).toBeTruthy()
  })

  it('does not call postOcr before deviceId is ready', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue(null)
    render(<OcrPage />)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
