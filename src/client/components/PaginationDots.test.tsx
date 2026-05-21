import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PaginationDots } from './PaginationDots'

describe('PaginationDots', () => {
  it('renders correct number of dots', () => {
    const { container } = render(<PaginationDots total={3} current={0} />)
    const dots = container.querySelectorAll('div > div')
    expect(dots.length).toBe(3)
  })

  it('active dot has dark background', () => {
    const { container } = render(<PaginationDots total={3} current={1} />)
    const dots = Array.from(container.querySelectorAll('div > div'))
    expect(dots[1].className).toContain('bg-[#0d0d0d]')
    expect(dots[0].className).not.toContain('bg-[#0d0d0d]')
    expect(dots[2].className).not.toContain('bg-[#0d0d0d]')
  })
})
