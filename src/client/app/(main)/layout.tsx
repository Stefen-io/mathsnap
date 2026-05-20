import type { ReactNode } from 'react'
import { CaptureProvider } from '@/contexts/CaptureContext'
import BottomNav from '@/components/BottomNav'
import { NavSpacer } from '@/components/NavSpacer'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <CaptureProvider>
      <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col bg-white">
        <main className="flex-1">{children}</main>
        <NavSpacer />
        <BottomNav />
      </div>
    </CaptureProvider>
  )
}
