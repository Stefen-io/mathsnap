import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockPush = vi.fn()
const mockSetCapturedBlob = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('@/contexts/CaptureContext', () => ({
  useCaptureContext: () => ({ setCapturedBlob: mockSetCapturedBlob }),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

import HomePage from './page'
import { toast } from 'sonner'

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('renders Camera and Tải lên CTAs', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    expect(await screen.findByText('Chụp ảnh')).toBeTruthy()
    expect(screen.getByText('Tải lên')).toBeTruthy()
  })

  it('Camera CTA navigates to /camera', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    fireEvent.click(await screen.findByText('Chụp ảnh'))
    expect(mockPush).toHaveBeenCalledWith('/camera')
  })

  it('Nhập LaTeX link navigates to /manual', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: /nhập latex/i })
    expect(link.getAttribute('href')).toBe('/manual')
  })

  it('shows toast and no navigation when file > 2MB', async () => {
    render(<HomePage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [bigFile] })
    fireEvent.change(input)
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mockPush).not.toHaveBeenCalledWith('/crop')
  })

  it('stores blob and navigates to /crop for valid file', async () => {
    render(<HomePage />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = new File([new ArrayBuffer(100 * 1024)], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [validFile] })
    fireEvent.change(input)
    await waitFor(() => expect(mockSetCapturedBlob).toHaveBeenCalled())
    expect(mockPush).toHaveBeenCalledWith('/crop')
  })

  it('hides Chụp ảnh CTA when no camera device, keeps upload/manual', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'audioinput' }]),
    } })
    render(<HomePage />)
    await waitFor(() => expect(screen.queryByText('Chụp ảnh')).toBeNull())
    expect(screen.getByText('Tải lên')).toBeTruthy()
    expect((navigator.mediaDevices as { getUserMedia: ReturnType<typeof vi.fn> }).getUserMedia).not.toHaveBeenCalled()
  })
})
