import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-123' }))
vi.mock('@/lib/api', () => ({
  getHistory: vi.fn(),
  deleteHistoryItem: vi.fn(),
  toggleBookmark: vi.fn(),
}))
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, drag, dragConstraints, dragElastic, onDragEnd, animate, layout, initial, exit, ...props }: any) =>
      <div {...props}>{children}</div>,
  },
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import HistoryPage from './page'
import { getHistory, deleteHistoryItem, toggleBookmark } from '@/lib/api'

const MOCK_ITEMS = [
  {
    id: 'id-1', deviceId: 'd', latex: 'x^2', solutionSteps: [], language: 'vi',
    createdAt: '2026-05-01T10:00:00Z', isBookmarked: false,
  },
]

describe('HistoryPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no items', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<HistoryPage />)
    expect(await screen.findByText(/chưa có bài giải nào/i)).toBeTruthy()
  })

  it('renders items after fetch', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: MOCK_ITEMS, total: 1, page: 1, limit: 20 })
    render(<HistoryPage />)
    expect(await screen.findByTestId('katex')).toBeTruthy()
  })

  it('calls deleteHistoryItem when trash is clicked', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: MOCK_ITEMS, total: 1, page: 1, limit: 20 })
    vi.mocked(deleteHistoryItem).mockResolvedValueOnce(undefined)
    render(<HistoryPage />)
    await screen.findByTestId('katex')
    fireEvent.click(screen.getByRole('button', { name: /xóa/i }))
    await waitFor(() => expect(deleteHistoryItem).toHaveBeenCalledWith('id-1', 'device-123'))
  })

  it('calls toggleBookmark when bookmark button is clicked', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: MOCK_ITEMS, total: 1, page: 1, limit: 20 })
    vi.mocked(toggleBookmark).mockResolvedValueOnce({ ...MOCK_ITEMS[0], isBookmarked: true })
    render(<HistoryPage />)
    await screen.findByTestId('katex')
    fireEvent.click(screen.getByRole('button', { name: /lưu/i }))
    await waitFor(() => expect(toggleBookmark).toHaveBeenCalledWith('id-1', 'device-123', true))
  })
})
