import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { OnboardingProvider, useOnboarding } from './OnboardingContext'

function Probe() {
  const { hasSeenOnboarding, markAsSeen, replayOnboarding } = useOnboarding()
  return (
    <div>
      <span data-testid="status">{hasSeenOnboarding ? 'seen' : 'unseen'}</span>
      <span data-testid="seen">{String(hasSeenOnboarding)}</span>
      <button onClick={markAsSeen}>Mark seen</button>
      <button onClick={replayOnboarding}>replay</button>
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
    render(<OnboardingProvider><Probe /></OnboardingProvider>)
    expect(screen.getByTestId('status').textContent).toBe('unseen')
  })

  it('reads hasSeenOnboarding as true when localStorage has seen=true', async () => {
    localStorage.setItem('mathsnap.onboarding.seen', 'true')
    render(<OnboardingProvider><Probe /></OnboardingProvider>)
    await act(async () => {})
    expect(screen.getByTestId('status').textContent).toBe('seen')
  })

  it('markAsSeen sets localStorage and updates state', async () => {
    render(<OnboardingProvider><Probe /></OnboardingProvider>)
    const btn = screen.getByRole('button', { name: 'Mark seen' })
    await act(async () => btn.click())
    expect(localStorage.getItem('mathsnap.onboarding.seen')).toBe('true')
    expect(screen.getByTestId('status').textContent).toBe('seen')
  })

  it('throws when useOnboarding is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useOnboarding must be used within OnboardingProvider')
    spy.mockRestore()
  })

  it('replayOnboarding sets hasSeenOnboarding back to false', () => {
    render(<OnboardingProvider><Probe /></OnboardingProvider>)
    act(() => { screen.getByText('Mark seen').click() })
    expect(screen.getByTestId('seen').textContent).toBe('true')
    act(() => { screen.getByText('replay').click() })
    expect(screen.getByTestId('seen').textContent).toBe('false')
  })
})
