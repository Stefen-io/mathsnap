import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: vi.fn(),
}))

import { OnboardingOverlay } from './OnboardingOverlay'
import { useOnboarding } from '@/contexts/OnboardingContext'

describe('OnboardingOverlay', () => {
  const mockMarkAsSeen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when hasSeenOnboarding is true', () => {
    vi.mocked(useOnboarding).mockReturnValue({ hasSeenOnboarding: true, markAsSeen: mockMarkAsSeen })
    const { container } = render(<OnboardingOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('shows step 1 content initially', () => {
    vi.mocked(useOnboarding).mockReturnValue({ hasSeenOnboarding: false, markAsSeen: mockMarkAsSeen })
    render(<OnboardingOverlay />)
    expect(screen.getByText('Chụp ảnh bài toán')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tiếp' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bỏ qua' })).toBeTruthy()
  })

  it('advances to step 2 on Tiếp click', () => {
    vi.mocked(useOnboarding).mockReturnValue({ hasSeenOnboarding: false, markAsSeen: mockMarkAsSeen })
    render(<OnboardingOverlay />)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(screen.getByText('Nhận diện công thức')).toBeTruthy()
  })

  it('calls markAsSeen on Bỏ qua click', () => {
    vi.mocked(useOnboarding).mockReturnValue({ hasSeenOnboarding: false, markAsSeen: mockMarkAsSeen })
    render(<OnboardingOverlay />)
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }))
    expect(mockMarkAsSeen).toHaveBeenCalledOnce()
  })

  it('shows Bắt đầu on last step and calls markAsSeen', () => {
    vi.mocked(useOnboarding).mockReturnValue({ hasSeenOnboarding: false, markAsSeen: mockMarkAsSeen })
    render(<OnboardingOverlay />)
    // Navigate to last step (step 3)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(screen.getByRole('button', { name: 'Bắt đầu' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bỏ qua' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(mockMarkAsSeen).toHaveBeenCalledOnce()
  })
})
