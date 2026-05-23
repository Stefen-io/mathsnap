'use client'

import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

export default function SettingsPage() {
  const { replayOnboarding } = useOnboarding()
  const { lang, setLang } = useLanguage()
  const isEnglish = lang === 'en'

  function handleLanguageToggle() {
    setLang(isEnglish ? 'vi' : 'en')
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">{t[lang].settingsTitle}</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6 pb-[100px]">
        {/* Language section */}
        <section>
          <h2 className="mb-3 px-2 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888888]">
            {t[lang].settingsLangLabel}
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">{t[lang].settingsLangLabel}</span>
              <button
                aria-label={t[lang].settingsAriaLangToggle}
                onClick={handleLanguageToggle}
                className={`flex h-[26px] w-12 items-center rounded-full border p-1 transition-colors ${
                  isEnglish ? 'justify-end border-[#18E299] bg-[#18E299]' : 'justify-start border-black/10 bg-white'
                }`}
              >
                <motion.div
                  layout
                  className={`size-[18px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${
                    isEnglish ? 'bg-[#0d0d0d]' : 'bg-[#888888]'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Info section */}
        <section>
          <h2 className="mb-3 px-2 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888888]">
            {t[lang].settingsInfoSection}
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">{t[lang].settingsVersion}</span>
              <span className="font-mono text-[14px] text-[#888888]">1.0.0</span>
            </div>
            <button
              onClick={replayOnboarding}
              className="group flex h-[64px] w-full items-center justify-between border-b border-black/5 px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5"
            >
              <span className="text-[16px] text-[#0d0d0d]">{t[lang].settingsReplayOnboarding}</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex h-[64px] w-full items-center justify-between border-b border-black/5 px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">{t[lang].settingsContactSupport}</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex h-[64px] w-full items-center justify-between px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">{t[lang].settingsTerms}</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
