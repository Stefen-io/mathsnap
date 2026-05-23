'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useCamera } from '@/hooks/useCamera'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

export default function CameraPage() {
  const router = useRouter()
  const { videoRef, canvasRef, flipCamera, captureFrame, isReady } = useCamera()
  const { setCapturedBlob } = useCaptureContext()
  const { lang } = useLanguage()

  async function handleCapture() {
    const blob = await captureFrame()
    setCapturedBlob(blob)
    router.push('/crop')
  }

  return (
    <div className="relative flex h-dvh w-full flex-col bg-black">
      {/* Live viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {/* Off-screen capture canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-8 pb-10 pt-4">
        {/* Spacer to balance flip button */}
        <div className="size-10" aria-hidden="true" />

        {/* Shutter */}
        <button
          aria-label={t[lang].cameraAriaShutter}
          disabled={!isReady}
          onClick={handleCapture}
          className="size-16 rounded-full border-4 border-white bg-white/30 transition-transform active:scale-95 disabled:opacity-40"
        />

        {/* Flip camera */}
        <button
          aria-label={t[lang].cameraAriaFlip}
          onClick={flipCamera}
          className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <RefreshCw className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
