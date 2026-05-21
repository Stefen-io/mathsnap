import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockRouter = { push: mockPush }

vi.mock('next/navigation', () => ({ useRouter: () => mockRouter }))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))
vi.mock('@/hooks/useDeviceId', () => ({
  useDeviceId: vi.fn(),
}))
vi.mock('@/lib/api', () => ({
  postOcr: vi.fn(() => new Promise(() => {})),
  ApiError: class ApiError extends Error {
    code: string
    retryable: boolean
    constructor(code: string, message: string, retryable: boolean) {
      super(message)
      this.code = code
      this.retryable = retryable
    }
  },
}))

import OcrPage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postOcr, ApiError } from '@/lib/api'

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

  it('shows Thử lại button for RATE_LIMITED burst (retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('RATE_LIMITED', 'Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.', true), { name: 'ApiError' })
    )
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<OcrPage />)
    expect(await screen.findByText('Bạn đang gửi quá nhanh. Vui lòng đợi 1 phút.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Chụp lại' })).toBeNull()
  })

  it('shows Chụp lại button for RATE_LIMITED daily (non-retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('RATE_LIMITED', 'Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.', false), { name: 'ApiError' })
    )
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<OcrPage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chụp lại' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
  })

  it('shows Chụp lại for INVALID_IMAGE (non-retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('INVALID_IMAGE', 'File exceeds 2MB limit.', false), { name: 'ApiError' })
    )
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<OcrPage />)
    expect(await screen.findByText('File exceeds 2MB limit.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chụp lại' })).toBeTruthy()
  })

  it('shows Chụp lại for OCR_NO_FORMULA (empty formulas)', async () => {
    vi.mocked(postOcr).mockResolvedValueOnce({ formulas: [] })
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<OcrPage />)
    expect(await screen.findByText('Không nhận diện được công thức trong ảnh.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Chụp lại' })).toBeTruthy()
  })
})
