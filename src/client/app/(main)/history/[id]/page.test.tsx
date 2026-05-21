import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useParams: () => ({ id: 'item-123' }),
}))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-456' }))
vi.mock('@/lib/api', () => ({
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
  StepCard: ({ step }: any) => <div data-testid="step-card">{step.title}</div>,
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import HistoryDetailPage from './page'
import { getHistoryItem, ApiError } from '@/lib/api'

const MOCK_ITEM = {
  id: 'item-123', deviceId: 'device-456', latex: 'x^2',
  solutionSteps: [{ index: 1, title: 'Bước 1', explanation: 'exp', formula: null, isAnswer: false }],
  language: 'vi', createdAt: '2026-05-01T10:00:00Z', isBookmarked: false,
}

describe('HistoryDetailPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mockReplace.mockReset(); mockPush.mockReset() })

  it('renders step cards after fetch', async () => {
    vi.mocked(getHistoryItem).mockResolvedValueOnce(MOCK_ITEM as any)
    render(<HistoryDetailPage />)
    expect(await screen.findByTestId('step-card')).toBeTruthy()
  })

  it('redirects to /history on 404', async () => {
    vi.mocked(getHistoryItem).mockRejectedValueOnce(
      new (ApiError as any)('HISTORY_NOT_FOUND', 'not found', false)
    )
    render(<HistoryDetailPage />)
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/history'))
  })

  it('initializes bookmark state from item', async () => {
    vi.mocked(getHistoryItem).mockResolvedValueOnce({ ...MOCK_ITEM, isBookmarked: true } as any)
    render(<HistoryDetailPage />)
    await screen.findByTestId('step-card')
    const btn = screen.getByRole('button', { name: /đánh dấu/i })
    expect(btn.className).toContain('bg-[#d4fae8]')
  })
})
