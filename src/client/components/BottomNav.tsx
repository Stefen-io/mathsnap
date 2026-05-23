'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Bookmark, Settings } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

const CAPTURE_ROUTES = ['/camera', '/crop', '/ocr']

export default function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  const TABS = [
    { href: '/', label: t[lang].navHome, icon: Home },
    { href: '/history', label: t[lang].navHistory, icon: Clock },
    { href: '/bookmarks', label: t[lang].navBookmarks, icon: Bookmark },
    { href: '/settings', label: t[lang].navSettings, icon: Settings },
  ] as const
  if (CAPTURE_ROUTES.some(r => pathname.startsWith(r))) return null

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-black/5 bg-white">
      <ul className="flex h-16 items-center justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-[#18E299]' : 'text-gray-500 hover:text-[#18E299]'
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
