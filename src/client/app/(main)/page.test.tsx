import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const { mockPush, mockSetCapturedBlob, mockToastError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSetCapturedBlob: vi.fn(),
  mockToastError: vi.fn(),
}))

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
vi.mock('sonner', () => ({
  toast: { error: mockToastError },
}))

import HomePage from './page'

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('renders camera + upload + manual CTAs when camera available', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    expect(await screen.findByText('Chụp ảnh')).toBeTruthy()
    expect(screen.getByText('Tải lên')).toBeTruthy()
    expect(screen.getByText('Nhập LaTeX')).toBeTruthy()
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

  it('hides Chụp ảnh CTA when no camera device, keeps upload/manual', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'audioinput' }]),
    } })
    render(<HomePage />)
    await waitFor(() => expect(screen.queryByText('Chụp ảnh')).toBeNull())
    expect(screen.getByText('Tải lên')).toBeTruthy()
    expect(screen.getByText('Nhập LaTeX')).toBeTruthy()
    expect((navigator.mediaDevices as { getUserMedia: ReturnType<typeof vi.fn> }).getUserMedia).not.toHaveBeenCalled()
  })

  it('Tải lên button triggers hidden file input click', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')
    fireEvent.click(await screen.findByText('Tải lên'))
    expect(clickSpy).toHaveBeenCalled()
  })

  it('file >2MB shows toast.error and does not navigate', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    await screen.findByText('Tải lên')
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 3 * 1024 * 1024 })
    fireEvent.change(fileInput, { target: { files: [bigFile] } })
    expect(mockToastError).toHaveBeenCalledWith('Ảnh không được vượt quá 2MB.')
    expect(mockPush).not.toHaveBeenCalledWith('/crop')
  })

  it('valid file ≤2MB sets capturedBlob and navigates to /crop', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    await screen.findByText('Tải lên')
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const smallFile = new File(['hello'], 'small.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [smallFile] } })
    expect(mockSetCapturedBlob).toHaveBeenCalledWith(smallFile)
    expect(mockPush).toHaveBeenCalledWith('/crop')
  })

  it('Nhập LaTeX link points to /manual', async () => {
    vi.stubGlobal('navigator', { mediaDevices: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput' }]),
    } })
    render(<HomePage />)
    await screen.findByText('Nhập LaTeX')
    const link = screen.getByRole('link', { name: /Nhập LaTeX/ })
    expect(link.getAttribute('href')).toBe('/manual')
  })
})
