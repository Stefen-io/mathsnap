import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { CaptureProvider, useCaptureContext } from './CaptureContext'

describe('CaptureContext', () => {
  it('initial state has null blobs', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    expect(result.current.capturedBlob).toBeNull()
    expect(result.current.croppedBlob).toBeNull()
  })

  it('setCapturedBlob updates capturedBlob', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    act(() => { result.current.setCapturedBlob(blob) })
    expect(result.current.capturedBlob).toBe(blob)
  })

  it('setCroppedBlob updates croppedBlob', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    act(() => { result.current.setCroppedBlob(blob) })
    expect(result.current.croppedBlob).toBe(blob)
  })

  it('reset clears both blobs', () => {
    const { result } = renderHook(() => useCaptureContext(), {
      wrapper: CaptureProvider,
    })
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    act(() => {
      result.current.setCapturedBlob(blob)
      result.current.setCroppedBlob(blob)
    })
    act(() => { result.current.reset() })
    expect(result.current.capturedBlob).toBeNull()
    expect(result.current.croppedBlob).toBeNull()
  })

  it('useCaptureContext throws outside CaptureProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCaptureContext())).toThrow(/CaptureProvider/)
    spy.mockRestore()
  })
})
