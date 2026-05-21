import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockBack = vi.fn()
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }) }))

vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))

vi.mock('@/hooks/useDeviceId', () => ({
  useDeviceId: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  postSolve: vi.fn(),
  toggleBookmark: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string
    retryable: boolean
    constructor(code: string, message: string, retryable: boolean) {
      super(message)
      this.name = 'ApiError'
      this.code = code
      this.retryable = retryable
    }
  },
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span>{latex}</span>,
}))

vi.mock('@/components/StepCard', () => ({
  StepCard: ({ step }: { step: { title: string } }) => <div>Step: {step.title}</div>,
}))

import SolvePage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, toggleBookmark, ApiError } from '@/lib/api'

const mockItem = {
  id: 'item-123',
  deviceId: 'device-456',
  latex: '\\frac{1}{2}',
  solutionSteps: [{ index: 1, title: 'Step 1', explanation: 'Explanation', isAnswer: false }],
  language: 'vi' as const,
  createdAt: '2024-01-01T00:00:00Z',
  isBookmarked: false,
}

const baseContext = {
  ocrLatex: '\\frac{1}{2}',
  solveResult: null,
  setSolveResult: vi.fn(),
  reset: vi.fn(),
  capturedBlob: null,
  croppedBlob: null,
  setCapturedBlob: vi.fn(),
  setCroppedBlob: vi.fn(),
  setOcrLatex: vi.fn(),
}

describe('SolvePage', () => {
  beforeEach(() => vi.clearAllMocks())

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
})

describe('SolvePage error dispatch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows Thử lại for LLM_TIMEOUT (retryable)', async () => {
    vi.mocked(postSolve).mockRejectedValueOnce(
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
    vi.mocked(postSolve).mockRejectedValueOnce(
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
    vi.mocked(postSolve).mockRejectedValueOnce(
      new ApiError('RATE_LIMITED', 'Bạn đã dùng hết lượt hôm nay.', false)
    )
    vi.mocked(useCaptureContext).mockReturnValue({ ...baseContext })
    vi.mocked(useDeviceId).mockReturnValue('test-device')
    render(<SolvePage />)
    expect(await screen.findByText('Bạn đã dùng hết lượt hôm nay.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nhập bài toán khác' })).toBeNull()
  })
})

describe('SolvePage bookmark button', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls toggleBookmark(true) when bookmark button is tapped', async () => {
    vi.mocked(postSolve).mockResolvedValueOnce(mockItem as any)
    vi.mocked(toggleBookmark).mockResolvedValueOnce({ ...mockItem, isBookmarked: true } as any)
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
