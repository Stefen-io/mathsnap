'use client'

import { usePathname } from 'next/navigation'

const CAPTURE_ROUTES = ['/camera', '/crop', '/ocr']

export function NavSpacer() {
  const pathname = usePathname()
  if (CAPTURE_ROUTES.some(r => pathname.startsWith(r))) return null
  return <div className="h-16 shrink-0" aria-hidden="true" />
}
