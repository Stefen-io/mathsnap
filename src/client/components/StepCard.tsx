'use client'

import { AnimatePresence, motion } from 'motion/react'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { SolutionStep } from '@/types/history'
import { t, type Lang } from '@/lib/i18n'

interface StepCardProps {
  step: SolutionStep
  isOpen: boolean
  onToggle: () => void
  lang: Lang
}

export function StepCard({ step, isOpen, onToggle, lang }: StepCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)] ${
        step.isAnswer
          ? 'border-l-4 border-[#18E299] border-t-black/5 border-r-black/5 border-b-black/5'
          : 'border-black/5'
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
          {step.isAnswer ? t[lang].stepAnswer : `${t[lang].stepLabel} ${step.index}`}
        </span>
        <span className="flex-1 text-[15px] font-medium text-[#0d0d0d]">{step.title}</span>
        <svg
          className={`size-4 shrink-0 text-[#888] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
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
