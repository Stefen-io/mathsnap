import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()
const mockRouter = { push: mockPush, back: vi.fn(), replace: vi.fn() }

vi.mock('next/navigation', () => ({ useRouter: () => mockRouter }))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: vi.fn(),
}))
vi.mock('@/hooks/useDeviceId', () => ({
  useDeviceId: vi.fn(),
}))
vi.mock('@/lib/api', () => ({
  postSolve: vi.fn(),
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
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div> },
}))

import SolvePage from './page'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, ApiError } from '@/lib/api'

const baseContext = {
  capturedBlob: null,
  croppedBlob: null,
  ocrLatex: 'x^2 + 1 = 0',
  solveResult: null,
  setCapturedBlob: vi.fn(),
  setCroppedBlob: vi.fn(),
  setOcrLatex: vi.fn(),
  setSolveResult: vi.fn(),
  reset: vi.fn(),
}

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
