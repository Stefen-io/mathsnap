import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { OnboardingProvider, useOnboarding } from './OnboardingContext'

// Helper component to expose hook state
function TestConsumer() {
  const { hasSeenOnboarding, markAsSeen } = useOnboarding()
  return (
    <div>
      <span data-testid="status">{hasSeenOnboarding ? 'seen' : 'unseen'}</span>
      <button onClick={markAsSeen}>Mark seen</button>
    </div>
  )
}

describe('OnboardingContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes hasSeenOnboarding to false when localStorage is empty', () => {
    render(<OnboardingProvider><TestConsumer /></OnboardingProvider>)
    expect(screen.getByTestId('status').textContent).toBe('unseen')
  })

  it('reads hasSeenOnboarding as true when localStorage has seen=true', async () => {
    localStorage.setItem('mathsnap.onboarding.seen', 'true')
    render(<OnboardingProvider><TestConsumer /></OnboardingProvider>)
    // Wait for useEffect to run
    await act(async () => {})
    expect(screen.getByTestId('status').textContent).toBe('seen')
  })

  it('markAsSeen sets localStorage and updates state', async () => {
    render(<OnboardingProvider><TestConsumer /></OnboardingProvider>)
    const btn = screen.getByRole('button', { name: 'Mark seen' })
    await act(async () => btn.click())
    expect(localStorage.getItem('mathsnap.onboarding.seen')).toBe('true')
    expect(screen.getByTestId('status').textContent).toBe('seen')
  })

  it('throws when useOnboarding is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useOnboarding must be used within OnboardingProvider')
    spy.mockRestore()
  })
})
