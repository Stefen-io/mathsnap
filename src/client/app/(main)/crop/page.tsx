'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { getCroppedImg } from '@/lib/getCroppedImg'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'

export default function CropPage() {
  const router = useRouter()
  const { capturedBlob, setCroppedBlob } = useCaptureContext()
  const { lang } = useLanguage()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const imageUrl = useMemo(
    () => (capturedBlob ? URL.createObjectURL(capturedBlob) : null),
    [capturedBlob]
  )

  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }
  }, [imageUrl])

  useEffect(() => {
    if (!capturedBlob) router.push('/camera')
  }, [capturedBlob, router])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!capturedBlob || !croppedAreaPixels) return
    const freshUrl = URL.createObjectURL(capturedBlob)
    try {
      const blob = await getCroppedImg(freshUrl, croppedAreaPixels)
      setCroppedBlob(blob)
      router.push('/ocr')
    } finally {
      URL.revokeObjectURL(freshUrl)
    }
  }

  if (!capturedBlob || !imageUrl) return null

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          minZoom={1}
          maxZoom={3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-6 py-6">
        <button
          aria-label={t[lang].cropCancel}
          onClick={() => router.push('/camera')}
          className="flex-1 rounded-full border border-white/30 py-3 text-sm font-medium text-white transition-colors hover:border-white/50"
        >
          {t[lang].cropCancel}
        </button>
        <button
          aria-label={t[lang].cropConfirm}
          onClick={handleConfirm}
          className="flex-1 rounded-full bg-[#18E299] py-3 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-[#0fa76e]"
        >
          {t[lang].cropConfirm}
        </button>
      </div>
    </div>
  )
}
