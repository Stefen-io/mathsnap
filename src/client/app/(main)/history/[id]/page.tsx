'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Bookmark } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistoryItem, toggleBookmark, ApiError } from '@/lib/api'
import { StepCard } from '@/components/StepCard'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import { t } from '@/lib/i18n'
import type { HistoryItem } from '@/types/history'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-gray-100 ${className}`} />
}

export default function HistoryDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const deviceId = useDeviceId()
  const { lang } = useLanguage()
  const [item, setItem] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set<number>())
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (!deviceId || !params.id) return
    getHistoryItem(params.id, deviceId)
      .then(data => {
        setItem(data)
        setIsBookmarked(data.isBookmarked)
        setOpenSteps(new Set(data.solutionSteps.map(s => s.index)))
        setLoading(false)
      })
      .catch(err => {
        if (err instanceof ApiError) router.replace('/history')
        setLoading(false)
      })
    // router is intentionally omitted: Next.js router is stable and including it
    // causes re-runs in test environments where the mock returns a new object per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, params.id])

  function toggleStep(index: number) {
    setOpenSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleBookmark() {
    if (!item || !deviceId) return
    const next = !isBookmarked
    setIsBookmarked(next)
    try {
      await toggleBookmark(item.id, deviceId, next)
    } catch {
      setIsBookmarked(!next)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {loading && (
        <div className="flex flex-1 flex-col gap-4 px-6 py-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-[70%]" />
          <Skeleton className="h-16 w-[50%]" />
        </div>
      )}

      {!loading && item && (
        <>
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex size-8 items-center justify-center rounded-full text-[#888] hover:bg-[#fafafa]"
              aria-label={t[lang].detailAriaBack}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <h1 className="text-[16px] font-medium text-[#0d0d0d]">{t[lang].detailTitle}</h1>
          </header>

          <div className="border-b border-black/5 bg-[#fafafa] px-4 py-3">
            <KaTeXRenderer latex={item.latex} />
          </div>

          <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-[88px]">
            {item.solutionSteps.map(step => (
              <StepCard
                key={step.index}
                step={step}
                isOpen={openSteps.has(step.index)}
                onToggle={() => toggleStep(step.index)}
                lang={lang}
              />
            ))}
          </main>

          <div className="fixed bottom-0 left-1/2 flex w-full max-w-[480px] -translate-x-1/2 items-center gap-3 border-t border-black/5 bg-white px-4 py-3">
            <button
              onClick={handleBookmark}
              className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                isBookmarked ? 'bg-[#d4fae8] text-[#0fa76e]' : 'border border-black/5 text-[#0d0d0d]'
              }`}
              aria-label={t[lang].detailAriaBookmark}
            >
              <Bookmark
                className="size-5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                strokeWidth={isBookmarked ? 1.5 : 2}
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white"
            >
              {t[lang].detailNewProblem}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
