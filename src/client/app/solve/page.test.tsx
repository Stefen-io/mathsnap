import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))
vi.mock('@/hooks/useDeviceId', () => ({
  useDeviceId: vi.fn(),
}))
vi.mock('@/lib/api', () => ({
  postSolve: vi.fn(),
  getHistoryItem: vi.fn(),
  toggleBookmark: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string; retryable: boolean
    constructor(code: string, message: string, retryable: boolean) {
      super(message); this.code = code; this.retryable = retryable
    }
  },
}))
vi.mock('@/components/StepCard', () => ({
  StepCard: ({ step, isOpen }: { step: { index: number; title: string }; isOpen: boolean }) => (
    <div data-testid={`step-${step.index}`} data-open={isOpen}>Step: {step.title}</div>
  ),
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: vi.fn(() => ({ lang: 'vi', setLang: vi.fn() })),
}))

import SolvePage from './page'
import { postSolve, getHistoryItem, toggleBookmark, ApiError } from '@/lib/api'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import type { HistoryItem } from '@/types/history'

const mockItem: HistoryItem = {
  id: 'item-123', deviceId: 'device-456', latex: 'x^2',
  solutionSteps: [{ index: 1, title: 'Bước 1', explanation: 'exp', isAnswer: false }],
  language: 'vi', createdAt: '2026-05-01T10:00:00Z', isBookmarked: false,
}

const baseContext = {
  capturedBlob: null,
  croppedBlob: null,
  ocrLatex: 'x^2',
  solveResult: null,
  setCapturedBlob: vi.fn(),
  setCroppedBlob: vi.fn(),
  setOcrLatex: vi.fn(),
  setSolveResult: vi.fn(),
  reset: vi.fn(),
}

describe('SolvePage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })

  it('redirects to /camera when ocrLatex is null', () => {
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')
    render(<SolvePage />)
    expect(mockReplace).toHaveBeenCalledWith('/camera')
  })

  it('renders loading skeleton when deviceId is not ready', () => {
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue(null)
    render(<SolvePage />)
    expect(screen.getByText(/Đang phân tích bài toán/)).toBeTruthy()
  })

  it('renders step cards after postSolve succeeds', async () => {
    vi.mocked(postSolve).mockResolvedValueOnce(mockItem)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')
    render(<SolvePage />)
    expect(await screen.findByTestId('step-1')).toBeTruthy()
  })

  it('starts with all steps expanded on success', async () => {
    const item = { ...mockItem, solutionSteps: [
      { index: 1, title: 'S1', explanation: '', isAnswer: false },
      { index: 2, title: 'S2', explanation: '', isAnswer: true },
    ] }
    vi.mocked(postSolve).mockResolvedValueOnce(item)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')
    render(<SolvePage />)
    const cards = await screen.findAllByTestId(/^step-/)
    expect(cards).toHaveLength(2)
    cards.forEach(c => expect(c.getAttribute('data-open')).toBe('true'))
  })

  it('calls postSolve exactly once on mount (regression guard against solveStartedRef removal)', async () => {
    vi.mocked(postSolve).mockResolvedValueOnce(mockItem)
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    const { rerender } = render(<SolvePage />)
    // Re-render with identical props to confirm a plain re-render does not re-fire the effect
    rerender(<SolvePage />)

    await screen.findByTestId('step-1')
    expect(postSolve).toHaveBeenCalledTimes(1)
  })
})

describe('SolvePage error dispatch', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })

  it('shows Thử lại for LLM_TIMEOUT (retryable)', async () => {
    vi.mocked(postSolve).mockRejectedValue(
      new ApiError('LLM_TIMEOUT', 'Hệ thống đang bận. Vui lòng thử lại.', true)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Hệ thống đang bận. Vui lòng thử lại.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nhập bài toán khác' })).toBeNull()
  })

  it('shows Nhập bài toán khác for LLM_CONTENT_POLICY', async () => {
    vi.mocked(postSolve).mockRejectedValue(
      new ApiError('LLM_CONTENT_POLICY', 'Bài toán không phù hợp.', false)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Bài toán không phù hợp.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nhập bài toán khác' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
  })

  it('shows no button for RATE_LIMITED daily (retryable=false)', async () => {
    vi.mocked(postSolve).mockRejectedValue(
      new ApiError('RATE_LIMITED', 'You have reached today\'s limit. Please try again tomorrow.', false)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay. Vui lòng thử lại vào ngày mai.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nhập bài toán khác' })).toBeNull()
  })
})

describe('SolvePage bookmark button', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })

  it('calls toggleBookmark(true) when bookmark button is tapped', async () => {
    vi.mocked(postSolve).mockResolvedValueOnce(mockItem)
    vi.mocked(toggleBookmark).mockResolvedValueOnce({ ...mockItem, isBookmarked: true })
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await screen.findByRole('button', { name: /đánh dấu/i })

    fireEvent.click(screen.getByRole('button', { name: /đánh dấu/i }))

    await waitFor(() => {
      expect(toggleBookmark).toHaveBeenCalledWith('item-123', 'device-456', true)
    })
  })
})

describe('SolvePage VIEW mode', () => {
  beforeEach(() => { vi.clearAllMocks(); mockSearchParams = new URLSearchParams() })

  it('fetches by id, renders steps, and does not call postSolve or redirect to camera', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...mockItem, latex: 'y^2' })
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    expect(await screen.findByTestId('step-1')).toBeTruthy()
    expect(getHistoryItem).toHaveBeenCalledWith('item-123', 'device-456')
    expect(postSolve).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalledWith('/camera')
  })

  it('shows item.latex in the problem bar (not ocrLatex)', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...mockItem, latex: 'y^2' })
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await screen.findByTestId('step-1')
    expect(screen.getByTestId('katex').textContent).toBe('y^2')
  })

  it('redirects to /history on ApiError', async () => {
    mockSearchParams = new URLSearchParams('id=item-123')
    vi.mocked(getHistoryItem).mockRejectedValueOnce(new ApiError('HISTORY_NOT_FOUND', 'not found', false))
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext, ocrLatex: null })
    vi.mocked(useDeviceId).mockReturnValue('device-456')

    render(<SolvePage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/history'))
  })
})
