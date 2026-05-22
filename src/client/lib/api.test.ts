import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getHistory, getHistoryItem, deleteHistoryItem, toggleBookmark, postOcr, ApiError } from './api'

const DEVICE = 'device-uuid-1234'
const ITEM_ID = 'item-uuid-5678'

describe('getHistory', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls GET /api/history with X-Device-ID header', async () => {
    const mockResponse = { items: [], total: 0, page: 1, limit: 20 }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    )
    const result = await getHistory(DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/history'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Device-ID': DEVICE }) })
    )
    expect(result.total).toBe(0)
  })

  it('passes bookmarked=true query param when specified', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], total: 0, page: 1, limit: 20 }), { status: 200 })
    )
    await getHistory(DEVICE, { bookmarked: true })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('bookmarked=true'),
      expect.any(Object)
    )
  })
})

describe('getHistoryItem', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls GET /api/history/{id} with X-Device-ID header', async () => {
    const mockItem = { id: ITEM_ID, deviceId: DEVICE, latex: 'x', solutionSteps: [], language: 'vi', createdAt: '', isBookmarked: false }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockItem), { status: 200 })
    )
    const result = await getHistoryItem(ITEM_ID, DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}`),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Device-ID': DEVICE }) })
    )
    expect(result.id).toBe(ITEM_ID)
  })

  it('throws ApiError on 404', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'HISTORY_NOT_FOUND', message: 'not found', retryable: false }), { status: 404 })
    )
    await expect(getHistoryItem(ITEM_ID, DEVICE)).rejects.toThrow(ApiError)
  })
})

describe('deleteHistoryItem', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls DELETE /api/history/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await deleteHistoryItem(ITEM_ID, DEVICE)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}`),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ 'X-Device-ID': DEVICE }),
      })
    )
  })
})

describe('toggleBookmark', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('calls PATCH /api/history/{id}/bookmark with isBookmarked in body', async () => {
    const mockItem = { id: ITEM_ID, deviceId: DEVICE, latex: 'x', solutionSteps: [], language: 'vi', createdAt: '', isBookmarked: true }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockItem), { status: 200 })
    )
    const result = await toggleBookmark(ITEM_ID, DEVICE, true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}/bookmark`),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isBookmarked: true }),
      })
    )
    expect(result.isBookmarked).toBe(true)
  })

  it('calls PATCH with isBookmarked: false when unbookmarking', async () => {
    const mockItem = { id: ITEM_ID, deviceId: DEVICE, latex: 'x', solutionSteps: [], language: 'vi', createdAt: '', isBookmarked: false }
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockItem), { status: 200 })
    )
    const result = await toggleBookmark(ITEM_ID, DEVICE, false)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/history/${ITEM_ID}/bookmark`),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isBookmarked: false }),
      })
    )
    expect(result.isBookmarked).toBe(false)
  })
})

describe('postOcr timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('throws OCR_TIMEOUT when the request aborts after 10s', async () => {
    vi.mocked(fetch).mockImplementationOnce((_url, init) =>
      new Promise((_resolve, reject) => {
        ;(init!.signal as AbortSignal).addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')))
      }))
    const p = postOcr(new Blob(['x']), 'dev').catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(10000)
    const err = await p
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ code: 'OCR_TIMEOUT', retryable: true })
  })

  it('clears the timer and resolves on a fast response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ formulas: [{ latex: 'x', confidence: 1 }] }), { status: 200 }))
    const res = await postOcr(new Blob(['x']), 'dev')
    expect(res.formulas[0].latex).toBe('x')
  })
})
