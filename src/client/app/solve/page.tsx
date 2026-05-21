'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { postSolve, ApiError } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { SolutionStep } from '@/types/history'

type PageState = 'loading' | 'success' | 'error'

interface ErrorInfo {
  message: string
  retryable: boolean
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

interface StepCardProps {
  step: SolutionStep
  isOpen: boolean
  onToggle: () => void
}

function StepCard({ step, isOpen, onToggle }: StepCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)] ${
        step.isAnswer ? 'border-l-4 border-[#18E299] border-t-black/5 border-r-black/5 border-b-black/5' : 'border-black/5'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
      >
        <span
          className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
            step.isAnswer
              ? 'bg-[#d4fae8] text-[#0fa76e]'
              : 'border border-black/5 bg-[#fafafa] text-[#666]'
          }`}
        >
          {step.isAnswer ? 'Đáp án' : `Bước ${step.index}`}
        </span>
        <span className="flex-1 text-[15px] font-medium text-[#0d0d0d]">{step.title}</span>
        <ChevronRight
          className={`size-4 shrink-0 text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="mb-3 h-px w-full bg-black/5" />
              <p className="text-[15px] leading-relaxed text-[#555]">{step.explanation}</p>
              {step.formula && (
                <div className="mt-3 flex items-center justify-center rounded-[16px] bg-[#fafafa] p-3">
                  {step.isAnswer ? (
                    <span style={{ fontSize: '2.5rem' }} className="text-[#0d0d0d]">
                      <KaTeXRenderer latex={step.formula} />
                    </span>
                  ) : (
                    <KaTeXRenderer latex={step.formula} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SolvePage() {
  const router = useRouter()
  const { ocrLatex, setSolveResult, reset } = useCaptureContext()
  const deviceId = useDeviceId()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [steps, setSteps] = useState<SolutionStep[]>([])
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([1]))
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

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
    setErrorCode(null)
    try {
      const result = await postSolve(ocrLatex, deviceId)
      setSolveResult(result)
      setSteps(result.solutionSteps)
      setPageState('success')
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      const info: ErrorInfo = err instanceof ApiError
        ? { message: err.message, retryable: err.retryable }
        : { message: 'Không thể tạo lời giải. Vui lòng thử lại.', retryable: true }
      setErrorCode(code)
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
            {errorCode === 'LLM_CONTENT_POLICY' ? (
              <button
                onClick={() => { reset(); router.push('/camera') }}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                Nhập bài toán khác
              </button>
            ) : error.retryable ? (
              <button
                onClick={runSolve}
                className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
              >
                Thử lại
              </button>
            ) : null}
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
