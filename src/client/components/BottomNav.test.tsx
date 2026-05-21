import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

describe('BottomNav', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders 4 tab links', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<BottomNav />)
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })

  it('Home tab has aria-current="page" at /', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    render(<BottomNav />)
    const homeLink = screen.getByRole('link', { name: /trang chủ/i })
    expect(homeLink.getAttribute('aria-current')).toBe('page')
  })

  it('History tab has aria-current="page" at /history', () => {
    vi.mocked(usePathname).mockReturnValue('/history')
    render(<BottomNav />)
    const historyLink = screen.getByRole('link', { name: /lịch sử/i })
    expect(historyLink.getAttribute('aria-current')).toBe('page')
  })

  it('Bookmarks tab has href /bookmarks', () => {
    vi.mocked(usePathname).mockReturnValue('/bookmarks')
    render(<BottomNav />)
    const link = screen.getByRole('link', { name: /bookmark/i })
    expect(link.getAttribute('href')).toBe('/bookmarks')
    expect(link.getAttribute('aria-current')).toBe('page')
  })

  it('returns null on /camera (hidden on capture routes)', () => {
    vi.mocked(usePathname).mockReturnValue('/camera')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null on /crop', () => {
    vi.mocked(usePathname).mockReturnValue('/crop')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null on /ocr', () => {
    vi.mocked(usePathname).mockReturnValue('/ocr')
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })
})
