import { render, screen, fireEvent } from '@testing-library/react'
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
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ lang: 'vi', setLang: vi.fn() })),
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
import { useLanguage } from '@/contexts/LanguageContext'
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

  it('calls postOcr exactly once even when lang changes after mount', async () => {
    // Simulate LanguageContext: first render 'vi', subsequent renders 'en'.
    // If lang were in runOcr deps, this would create a new runOcr reference,
    // re-fire the triggering effect, and issue a second postOcr call.
    vi.mocked(useLanguage)
      .mockReturnValueOnce({ lang: 'vi', setLang: vi.fn() })
      .mockReturnValueOnce({ lang: 'en', setLang: vi.fn() })
    vi.mocked(postOcr).mockResolvedValueOnce({ formulas: [{ latex: 'x^2', confidence: 0.9 }] })
    vi.mocked(useCaptureContext).mockReturnValue({
      ...baseContext,
      croppedBlob: new Blob(['crop'], { type: 'image/jpeg' }),
    })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    const { rerender } = render(<OcrPage />)
    rerender(<OcrPage />)
    await screen.findByText('x^2', { exact: false }).catch(() => null)
    expect(postOcr).toHaveBeenCalledTimes(1)
  })

  it('shows Thử lại button for RATE_LIMITED burst (retryable)', async () => {
    vi.mocked(postOcr).mockRejectedValueOnce(
      Object.assign(new ApiError('RATE_LIMITED', 'You are sending requests too fast. Please wait 1 minute.', true), { name: 'ApiError' })
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
      Object.assign(new ApiError('RATE_LIMITED', 'You have reached today\'s limit. Please try again tomorrow.', false), { name: 'ApiError' })
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

  it('OCR_TIMEOUT shows Thử lại and Nhập thủ công', async () => {
    const timeoutErr = new ApiError('OCR_TIMEOUT', 'Nhận dạng quá lâu...', true)
    vi.mocked(postOcr).mockRejectedValue(timeoutErr)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, croppedBlob: new Blob(['x']) })
    vi.mocked(useDeviceId).mockReturnValue('dev')
    render(<OcrPage />)
    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nhập thủ công' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Nhập thủ công' }))
    expect(mockPush).toHaveBeenCalledWith('/manual')
  })
})
