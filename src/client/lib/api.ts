import type { HistoryItem, HistoryListResponse } from '@/types/history'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const REQUEST_TIMEOUT = 60000 * 3

export class ApiError extends Error {
  readonly code: string
  readonly retryable: boolean

  constructor(code: string, message: string, retryable: boolean) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.retryable = retryable
  }
}

export interface OcrFormula {
  latex: string
  confidence: number
}

export interface OcrResponse {
  formulas: OcrFormula[]
}

async function handleError(res: Response): Promise<never> {
  let body: { code?: string; message?: string; retryable?: boolean }
  try {
    body = await res.json()
  } catch {
    throw new ApiError('UNKNOWN', `HTTP ${res.status}`, false)
  }
  throw new ApiError(
    body.code ?? 'UNKNOWN',
    body.message ?? 'Unknown error',
    body.retryable ?? false,
  )
}

export async function postOcr(blob: Blob, deviceId: string): Promise<OcrResponse> {
  const form = new FormData()
  form.append('image', blob, 'image.jpg')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  let res: Response
  try {
    res = await fetch(`${BASE}/api/ocr`, {
      method: 'POST',
      headers: { 'X-Device-ID': deviceId },
      body: form,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('OCR_TIMEOUT', 'OCR timed out. Please try again or enter manually.', true)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) await handleError(res)
  return res.json() as Promise<OcrResponse>
}

export async function postSolve(
  latex: string,
  deviceId: string,
  language: 'vi' | 'en' = 'vi',
): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/solve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify({ latex, language }),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}

export async function getHistory(
  deviceId: string,
  opts?: { page?: number; limit?: number; bookmarked?: boolean },
): Promise<HistoryListResponse> {
  const params = new URLSearchParams()
  if (opts?.page !== undefined) params.set('page', String(opts.page))
  if (opts?.limit !== undefined) params.set('limit', String(opts.limit))
  if (opts?.bookmarked !== undefined) params.set('bookmarked', String(opts.bookmarked))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${BASE}/api/history${query}`, {
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryListResponse>
}

export async function getHistoryItem(id: string, deviceId: string): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/history/${id}`, {
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}

export async function deleteHistoryItem(id: string, deviceId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/history/${id}`, {
    method: 'DELETE',
    headers: { 'X-Device-ID': deviceId },
  })
  if (!res.ok) await handleError(res)
}

export async function toggleBookmark(
  id: string,
  deviceId: string,
  isBookmarked: boolean,
): Promise<HistoryItem> {
  const res = await fetch(`${BASE}/api/history/${id}/bookmark`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify({ isBookmarked }),
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<HistoryItem>
}
