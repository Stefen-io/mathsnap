import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))

import OcrPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'

describe('OcrPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects to /camera when croppedBlob is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null, croppedBlob: null,
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders skeleton elements when croppedBlob is present', () => {
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('makes no fetch calls', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    vi.mocked(useCaptureContext).mockReturnValue({
      capturedBlob: null,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
      setCapturedBlob: vi.fn(), setCroppedBlob: vi.fn(), reset: vi.fn(),
    })
    render(<OcrPage />)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
