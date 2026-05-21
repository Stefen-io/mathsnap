'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const STORAGE_KEY = 'mathsnap.onboarding.seen'

interface OnboardingState {
  hasSeenOnboarding: boolean
  markAsSeen: () => void
}

const OnboardingContext = createContext<OnboardingState | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setHasSeenOnboarding(true)
    }
  }, [])

  function markAsSeen() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setHasSeenOnboarding(true)
  }

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, markAsSeen }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
