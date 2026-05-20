'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postOcr, ApiError } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'

type OcrState = 'ocr-loading' | 'confirm' | 'error'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
}

export default function OcrPage() {
  const router = useRouter()
  const { croppedBlob, setOcrLatex, reset } = useCaptureContext()
  const deviceId = useDeviceId()
  const [state, setState] = useState<OcrState>('ocr-loading')
  const [editedLatex, setEditedLatex] = useState('')
  const [confidence, setConfidence] = useState(1)

  const objectUrl = useMemo(
    () => (croppedBlob ? URL.createObjectURL(croppedBlob) : null),
    [croppedBlob],
  )

  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [objectUrl])

  useEffect(() => {
    if (!croppedBlob) { router.push('/camera'); return }
    if (!deviceId) return
    postOcr(croppedBlob, deviceId)
      .then(res => {
        const formula = res.formulas[0]
        if (!formula) {
          toast.error('Không nhận diện được công thức.')
          setState('error')
          return
        }
        setEditedLatex(formula.latex)
        setConfidence(formula.confidence)
        setState('confirm')
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : 'Không nhận diện được công thức.'
        toast.error(msg)
        setState('error')
      })
  }, [croppedBlob, deviceId, router])

  if (!croppedBlob) return null

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-8 pb-[100px]">
      {state === 'ocr-loading' && (
        <div className="flex flex-col gap-4">
          <p className="text-center text-xs text-gray-400">Đang nhận dạng công thức...</p>
          <Skeleton className="h-[100px] w-full rounded-[16px]" />
          <div className="rounded-[16px] border border-black/5 p-5">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/5 p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-4 pt-12">
          <p className="text-[15px] text-[#333]">Không nhận diện được công thức.</p>
          <button
            onClick={() => { reset(); router.push('/camera') }}
            className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
          >
            Chụp lại
          </button>
        </div>
      )}

      {state === 'confirm' && (
        <>
          <div className="mb-4 rounded-[16px] border border-black/5 bg-[#fafafa] p-4">
            {objectUrl && (
              <img
                src={objectUrl}
                alt="Ảnh đã chụp"
                className="mb-4 h-[100px] w-full rounded-[12px] object-cover"
              />
            )}
            <div className="flex min-h-[64px] items-center justify-center py-2">
              <KaTeXRenderer latex={editedLatex} />
            </div>
            <p className="mt-2 text-center text-[13px] text-[#888]">
              Kiểm tra công thức đã chính xác chưa?
            </p>
          </div>

          {confidence < 0.6 && (
            <div className="mb-3 rounded-full border border-amber-300 px-3 py-1 text-center text-[13px] text-amber-700">
              Độ chính xác thấp — kiểm tra lại
            </div>
          )}

          <textarea
            value={editedLatex}
            onChange={e => setEditedLatex(e.target.value)}
            className="mb-4 h-[120px] w-full resize-none rounded-[16px] border border-black/8 p-3 font-mono text-[14px] text-[#0d0d0d] focus:outline-none focus:ring-2 focus:ring-[#18E299]"
          />

          <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 flex items-center gap-3 border-t border-black/5 bg-white px-6 py-3">
            <button
              onClick={() => { reset(); router.push('/camera') }}
              className="shrink-0 text-[15px] text-[#888] underline"
            >
              Chụp lại
            </button>
            <button
              disabled={!editedLatex.trim()}
              onClick={() => { setOcrLatex(editedLatex); router.push('/solve') }}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white disabled:opacity-40"
            >
              Giải bài này
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
