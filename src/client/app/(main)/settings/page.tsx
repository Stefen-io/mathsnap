'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'

export default function SettingsPage() {
  const [isEnglish, setIsEnglish] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('mathsnap_language') === 'en'
  })

  function handleLanguageToggle() {
    const next = !isEnglish
    setIsEnglish(next)
    localStorage.setItem('mathsnap_language', next ? 'en' : 'vi')
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Cài đặt</h1>
      </div>

      <div className="flex flex-col gap-8 px-6 py-6 pb-[100px]">
        {/* Language section */}
        <section>
          <h2 className="mb-3 px-2 font-mono text-[12px] uppercase tracking-[0.6px] text-[#888888]">
            Language
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">Ngôn ngữ / Language</span>
              <button
                aria-label="Ngôn ngữ"
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
            Thông tin
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-black/5 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-6">
              <span className="text-[16px] text-[#0d0d0d]">Phiên bản</span>
              <span className="font-mono text-[14px] text-[#888888]">1.0.0</span>
            </div>
            <button className="group flex h-[64px] w-full items-center justify-between border-b border-black/5 px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Xem lại hướng dẫn</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex h-[64px] w-full items-center justify-between border-b border-black/5 px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Liên hệ hỗ trợ</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
            <button className="group flex h-[64px] w-full items-center justify-between px-6 transition-colors hover:bg-[#fafafa] active:bg-black/5">
              <span className="text-[16px] text-[#0d0d0d]">Điều khoản sử dụng</span>
              <ChevronRight className="size-5 text-[#888888] transition-colors group-hover:text-[#18E299]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
