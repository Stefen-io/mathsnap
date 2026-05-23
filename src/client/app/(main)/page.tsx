'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Upload, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function HomePage() {
  const router = useRouter()
  const { setCapturedBlob } = useCaptureContext()
  const { lang } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cameraAvailable, setCameraAvailable] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) { if (!cancelled) setCameraAvailable(false); return }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) setCameraAvailable(devices.some(d => d.kind === 'videoinput'))
      } catch {
        if (!cancelled) setCameraAvailable(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t[lang].homeToastFileTooLarge)
      return
    }
    setCapturedBlob(file)
    router.push('/crop')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0d0d0d]">MathSnap</h1>
        <p className="mt-2 text-sm text-gray-500">{t[lang].homeSubtitle}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {cameraAvailable && (
          <Button
            className="h-12 w-full rounded-full bg-[#18E299] font-medium text-[#0d0d0d] hover:bg-[#0fa76e] hover:text-white"
            onClick={() => router.push('/camera')}
          >
            <Camera className="mr-2 size-5" />
            {t[lang].homeCapture}
          </Button>
        )}

        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 size-5" />
          {t[lang].homeUpload}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <Link
          href="/manual"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-[#666666] transition-colors hover:text-[#18E299]"
        >
          <PenLine className="size-4" />
          {t[lang].homeManual}
        </Link>
      </div>
    </div>
  )
}
