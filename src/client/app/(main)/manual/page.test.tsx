import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({ setOcrLatex: vi.fn(), ocrLatex: null }),
}))
vi.mock('@/components/KaTeXRenderer', () => ({
  default: ({ latex }: { latex: string }) => <span data-testid="katex">{latex}</span>,
}))

import ManualPage from './page'

describe('ManualPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing', () => {
    render(<ManualPage />)
    expect(screen.getByPlaceholderText(/nhập công thức/i)).toBeTruthy()
  })

  it('submit button disabled when textarea empty', () => {
    render(<ManualPage />)
    const btn = screen.getByRole('button', { name: /xác nhận/i })
    expect(btn).toBeDisabled()
  })

  it('submit button enabled when textarea has content', () => {
    render(<ManualPage />)
    fireEvent.change(screen.getByPlaceholderText(/nhập công thức/i), { target: { value: 'x=1' } })
    expect(screen.getByRole('button', { name: /xác nhận/i })).not.toBeDisabled()
  })

  it('navigates to /solve on submit', async () => {
    render(<ManualPage />)
    fireEvent.change(screen.getByPlaceholderText(/nhập công thức/i), { target: { value: 'x=1' } })
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/solve'))
  })

  it('back button calls router.back()', () => {
    render(<ManualPage />)
    fireEvent.click(screen.getByRole('button', { name: /quay lại/i }))
    expect(mockBack).toHaveBeenCalled()
  })

  it('Escape key calls router.back()', () => {
    render(<ManualPage />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockBack).toHaveBeenCalled()
  })
})
