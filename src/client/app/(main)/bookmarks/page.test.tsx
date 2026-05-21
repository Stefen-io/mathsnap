import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/hooks/useDeviceId', () => ({ useDeviceId: () => 'device-123' }))
vi.mock('@/lib/api', () => ({
  getHistory: vi.fn(),
  toggleBookmark: vi.fn(),
}))
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: { div: ({ children, drag, dragConstraints, dragElastic, onDragEnd, animate, layout, initial, exit, onDragStart, ...p }: any) => <div {...p}>{children}</div> },
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import BookmarksPage from './page'
import { getHistory } from '@/lib/api'

describe('BookmarksPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no bookmarks', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<BookmarksPage />)
    expect(await screen.findByText(/chưa có bài nào được lưu/i)).toBeTruthy()
  })

  it('calls getHistory with bookmarked: true', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 })
    render(<BookmarksPage />)
    await screen.findByText(/chưa có bài nào được lưu/i)
    expect(getHistory).toHaveBeenCalledWith('device-123', expect.objectContaining({ bookmarked: true }))
  })

  it('renders bookmark items', async () => {
    vi.mocked(getHistory).mockResolvedValueOnce({
      items: [{ id: 'b1', deviceId: 'd', latex: 'y=mx', solutionSteps: [], language: 'vi', createdAt: '2026-05-01T10:00:00Z', isBookmarked: true }],
      total: 1, page: 1, limit: 20,
    })
    render(<BookmarksPage />)
    expect(await screen.findByTestId('katex')).toBeTruthy()
  })
})
