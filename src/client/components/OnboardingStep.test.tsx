import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OnboardingStep } from './OnboardingStep'

describe('OnboardingStep', () => {
  it('renders title and description', () => {
    render(
      <OnboardingStep
        title="Chụp ảnh bài toán"
        description="Chụp hoặc tải ảnh bài toán"
        illustration={<span>icon</span>}
      />
    )
    expect(screen.getByText('Chụp ảnh bài toán')).toBeTruthy()
    expect(screen.getByText('Chụp hoặc tải ảnh bài toán')).toBeTruthy()
  })

  it('renders illustration', () => {
    render(
      <OnboardingStep
        title="Title"
        description="Desc"
        illustration={<span data-testid="icon">icon</span>}
      />
    )
    expect(screen.getByTestId('icon')).toBeTruthy()
  })
})
