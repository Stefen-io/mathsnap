import type { HistoryItem } from '@/types/history'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

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
  const res = await fetch(`${BASE}/api/ocr`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId },
    body: form,
  })
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
