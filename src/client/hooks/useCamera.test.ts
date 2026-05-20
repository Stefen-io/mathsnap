import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useCamera } from './useCamera'

function makeMockTrack() {
  return { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack
}

function makeMockStream(tracks = [makeMockTrack()]) {
  return {
    getTracks: () => tracks,
    getVideoTracks: () => tracks,
  } as unknown as MediaStream
}

describe('useCamera', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGetUserMedia = vi.fn().mockResolvedValue(makeMockStream())
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: mockGetUserMedia },
    })
    Object.defineProperty(HTMLVideoElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls getUserMedia with environment facingMode', async () => {
    renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' },
      audio: false,
    })
  })

  it('stops all tracks on unmount', async () => {
    const tracks = [makeMockTrack()]
    mockGetUserMedia.mockResolvedValue(makeMockStream(tracks))
    const { unmount } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    unmount()
    tracks.forEach(t => expect(t.stop).toHaveBeenCalled())
  })

  it('captureFrame returns a Blob with type image/jpeg', async () => {
    const fakeBlob = new Blob(['img'], { type: 'image/jpeg' })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb) => { cb(fakeBlob) }
    )
    const { result } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    // Wire refs to real DOM elements so captureFrame can operate on them
    ;(result.current.videoRef as { current: HTMLVideoElement | null }).current =
      document.createElement('video')
    ;(result.current.canvasRef as { current: HTMLCanvasElement | null }).current =
      document.createElement('canvas')
    let blob: Blob | null = null
    await act(async () => { blob = await result.current.captureFrame() })
    expect((blob as unknown as Blob).type).toBe('image/jpeg')
  })

  it('flipCamera restarts stream with opposite facingMode', async () => {
    const { result } = renderHook(() => useCamera())
    await act(async () => { await Promise.resolve() })
    expect(result.current.facingMode).toBe('environment')
    await act(async () => {
      result.current.flipCamera()
      await Promise.resolve()
    })
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' },
      audio: false,
    })
    expect(result.current.facingMode).toBe('user')
  })
})
