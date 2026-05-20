import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import KaTeXRendererImpl from './KaTeXRendererImpl'

describe('KaTeXRendererImpl', () => {
  it('renders without crashing given a latex prop', () => {
    const { container } = render(<KaTeXRendererImpl latex="x^2" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders a non-empty span', () => {
    const { container } = render(<KaTeXRendererImpl latex="\\frac{1}{2}" />)
    const span = container.querySelector('span')
    expect(span).toBeTruthy()
    expect(span!.innerHTML.length).toBeGreaterThan(0)
  })
})
