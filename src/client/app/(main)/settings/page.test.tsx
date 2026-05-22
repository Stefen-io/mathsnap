import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockReplay = vi.fn()

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({ hasSeenOnboarding: true, markAsSeen: vi.fn(), replayOnboarding: mockReplay }),
}))

vi.mock('motion/react', () => ({
  motion: { div: ({ children, layout, ...p }: { children: React.ReactNode; layout?: boolean; [key: string]: unknown }) => <div {...p}>{children}</div> },
}))

import SettingsPage from './page'

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders language toggle and version row', () => {
    render(<SettingsPage />)
    expect(screen.getByText(/ngôn ngữ/i)).toBeTruthy()
    expect(screen.getByText('1.0.0')).toBeTruthy()
  })

  it('reads initial language from localStorage', () => {
    localStorage.setItem('mathsnap_language', 'en')
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    expect(toggle.className).toContain('bg-[#18E299]')
  })

  it('writes to localStorage on toggle', () => {
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    fireEvent.click(toggle)
    expect(localStorage.getItem('mathsnap_language')).toBe('en')
  })

  it('toggling back writes vi to localStorage', () => {
    localStorage.setItem('mathsnap_language', 'en')
    render(<SettingsPage />)
    const toggle = screen.getByRole('button', { name: /ngôn ngữ/i })
    fireEvent.click(toggle)
    expect(localStorage.getItem('mathsnap_language')).toBe('vi')
  })

  it('renders Xem lại hướng dẫn row', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Xem lại hướng dẫn')).toBeTruthy()
  })

  it('Xem lại hướng dẫn triggers replayOnboarding', () => {
    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Xem lại hướng dẫn'))
    expect(mockReplay).toHaveBeenCalledTimes(1)
  })
})
