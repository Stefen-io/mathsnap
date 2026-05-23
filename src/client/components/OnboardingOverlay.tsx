'use client'

import { useState, useEffect } from 'react'
import { Camera, Bookmark, Lock, CheckCircle2 } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { OnboardingStep } from '@/components/OnboardingStep'
import { PaginationDots } from '@/components/PaginationDots'

function getSteps(lang: Lang) {
  return [
    {
      title: t[lang].onboardingStep1Title,
      description: t[lang].onboardingStep1Desc,
      illustration: <Camera className="size-12 text-[#0fa76e]" aria-hidden="true" />,
    },
    {
      title: t[lang].onboardingStep2Title,
      description: t[lang].onboardingStep2Desc,
      illustration: (
        <div className="flex w-[220px] flex-col gap-3 rounded-[16px] border border-black/5 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#d4fae8] px-3 py-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.6px] text-[#0fa76e]">01</span>
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
              <div className="h-2 w-3/4 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
            <Lock className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-[#aaaaaa]" aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2 w-2/3 rounded bg-[rgba(0,0,0,0.08)]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t[lang].onboardingStep3Title,
      description: t[lang].onboardingStep3Desc,
      illustration: <Bookmark className="size-12 text-[#0fa76e]" aria-hidden="true" />,
    },
  ]
}

export function OnboardingOverlay() {
  const { hasSeenOnboarding, markAsSeen } = useOnboarding()
  const { lang } = useLanguage()
  const STEPS = getSteps(lang)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || hasSeenOnboarding) return null

  const isLastStep = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[60] flex flex-col bg-white pt-safe pb-safe"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.6px] text-[#888888]">
          {step + 1} / {STEPS.length}
        </span>
        {!isLastStep && (
          <button
            onClick={markAsSeen}
            className="text-[14px] font-medium text-[#888888] transition-colors hover:text-[#0d0d0d]"
          >
            {t[lang].onboardingSkip}
          </button>
        )}
      </div>

      <OnboardingStep
        title={current.title}
        description={current.description}
        illustration={current.illustration}
      />

      <div className="flex flex-col items-center gap-4 px-6 pb-8">
        <div className="flex items-center gap-2">
          <PaginationDots total={STEPS.length} current={step} />
        </div>
        <button
          onClick={isLastStep ? markAsSeen : () => setStep(s => s + 1)}
          className="h-12 w-full rounded-full bg-[#0d0d0d] text-[15px] font-medium text-white shadow-[0px_1px_2px_rgba(0,0,0,0.06)]"
        >
          {isLastStep ? t[lang].onboardingStart : t[lang].onboardingNext}
        </button>
      </div>
    </div>
  )
}
