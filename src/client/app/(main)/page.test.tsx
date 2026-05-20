import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import HomePage from './page'

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders 3 CTA buttons', () => {
    render(<HomePage />)
    expect(screen.getByText('Chụp ảnh')).toBeTruthy()
    expect(screen.getByText('Thư viện')).toBeTruthy()
    expect(screen.getByText('Lịch sử')).toBeTruthy()
  })

  it('Camera CTA navigates to /camera', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('Chụp ảnh'))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('renders without crashing', () => {
    expect(() => render(<HomePage />)).not.toThrow()
  })
})
