'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, ApiError } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import { StepCard } from '@/components/StepCard'
import type { SolutionStep } from '@/types/history'

type PageState = 'loading' | 'success' | 'error'

interface ErrorInfo {
  message: string
  retryable: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

export default function SolvePage() {
  const router = useRouter()
  const { ocrLatex, setSolveResult, reset } = useCaptureContext()
  const deviceId = useDeviceId()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [steps, setSteps] = useState<SolutionStep[]>([])
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))
  const [error, setError] = useState<ErrorInfo | null>(null)

  function toggleStep(index: number) {
    setOpenSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }

  async function runSolve() {
    if (!ocrLatex || !deviceId) return
    setPageState('loading')
    setError(null)
    try {
      const result = await postSolve(ocrLatex, deviceId)
      setSolveResult(result)
      setSteps(result.solutionSteps)
      setPageState('success')
    } catch (err) {
      const info: ErrorInfo = err instanceof ApiError
        ? { message: err.message, retryable: err.retryable }
        : { message: 'Đã xảy ra lỗi. Vui lòng thử lại.', retryable: true }
      toast.error(info.message)
      setError(info)
      setPageState('error')
    }
  }

  useEffect(() => {
    if (!ocrLatex) { router.replace('/camera'); return }
    if (!deviceId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runSolve()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrLatex, deviceId])

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {pageState === 'loading' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-[70%]" />
          <Skeleton className="h-16 w-[50%]" />
          <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888]">
            Đang phân tích bài toán<span className="animate-pulse">_</span>
          </p>
        </div>
      )}

      {pageState === 'error' && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="w-full rounded-[16px] border border-black/5 p-6 text-center shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[15px] text-[#333]">{error.message}</p>
            {error.retryable && (
              <button
                onClick={runSolve}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      )}

      {pageState === 'success' && (
        <>
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-full text-[#888] hover:bg-[#fafafa]"
              aria-label="Quay lại"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <h1 className="text-[16px] font-medium text-[#0d0d0d]">Lời giải</h1>
          </header>

          <div className="border-b border-black/5 bg-[#fafafa] px-4 py-3">
            {ocrLatex && <KaTeXRenderer latex={ocrLatex} />}
          </div>

          <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[88px]">
            {steps.map(step => (
              <StepCard
                key={step.index}
                step={step}
                isOpen={openSteps.has(step.index)}
                onToggle={() => toggleStep(step.index)}
              />
            ))}
          </main>

          <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 flex items-center gap-3 border-t border-black/5 bg-white px-4 py-3">
            <button
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-black/5 text-[#0d0d0d]"
              aria-label="Đánh dấu"
            >
              <Bookmark className="size-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => { reset(); router.push('/') }}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
            >
              Bài mới
            </button>
          </div>
        </>
      )}
    </div>
  )
}
