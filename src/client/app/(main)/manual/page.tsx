'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCaptureContext } from '@/contexts/CaptureContext'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import { t } from '@/lib/i18n'

export default function ManualPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const { setOcrLatex } = useCaptureContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [latex, setLatex] = useState('')

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])

  const isDisabled = latex.trim().length === 0

  function handleSubmit() {
    if (isDisabled) return
    setOcrLatex(latex.trim())
    router.push('/solve')
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#d4fae8]/40 via-white to-white">
      <div className="flex-1 overflow-y-auto pb-[100px]">
        {/* Top bar */}
        <div className="relative flex h-16 items-center justify-center px-6">
          <button
            onClick={() => router.back()}
            className="absolute left-6 flex size-11 items-center justify-center rounded-full text-[#0d0d0d] hover:bg-[#fafafa]"
            aria-label={t[lang].manualAriaBack}
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#0d0d0d]">{t[lang].manualTitle}</h1>
        </div>

        {/* Preview */}
        <div className="sticky top-16 z-10 mx-6 mb-6 mt-6">
          <div className="flex min-h-[120px] items-center justify-center rounded-[16px] border border-black/5 bg-[#fafafa] p-6">
            {latex.trim() ? (
              <KaTeXRenderer latex={latex} />
            ) : (
              <span className="text-center text-[14px] text-[#888888]">
                {t[lang].manualPreviewPlaceholder}
              </span>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="mx-6 flex flex-col gap-3">
          <span className="self-start rounded border border-black/5 bg-[#fafafa] px-2 py-1 font-mono text-[12px] uppercase tracking-[0.6px] text-[#666666]">
            LaTeX
          </span>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={e => setLatex(e.target.value)}
            className="h-[200px] w-full resize-none rounded-[16px] border border-black/10 bg-white p-4 font-mono text-[14px] text-[#0d0d0d] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all focus:border-[#18E299] focus:outline-none focus:ring-1 focus:ring-[#18E299]"
            placeholder={t[lang].manualInputPlaceholder}
          />
        </div>
      </div>

      {/* Sticky submit */}
      <div className="sticky bottom-0 z-20 mx-auto w-full border-t border-black/5 bg-white/90 p-6 backdrop-blur-md">
        <motion.button
          whileTap={!isDisabled ? { scale: 0.98 } : undefined}
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all ${
            isDisabled
              ? 'cursor-not-allowed bg-[#e5e5e5] text-[#888888]'
              : 'bg-[#0d0d0d] text-white hover:opacity-90'
          }`}
        >
          {t[lang].manualSubmit}
          <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  )
}
