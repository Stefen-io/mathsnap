'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { getCroppedImg } from '@/lib/getCroppedImg'

export default function CropPage() {
  const router = useRouter()
  const { capturedBlob, setCroppedBlob } = useCaptureContext()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!capturedBlob) { router.push('/camera'); return }
    const url = URL.createObjectURL(capturedBlob)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedBlob])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!imageUrl || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageUrl, croppedAreaPixels)
    setCroppedBlob(blob)
    router.push('/ocr')
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
          aria-label="Hủy"
          onClick={() => router.push('/camera')}
          className="flex-1 rounded-full border border-white/30 py-3 text-sm font-medium text-white transition-colors hover:border-white/50"
        >
          Hủy
        </button>
        <button
          aria-label="Xác nhận"
          onClick={handleConfirm}
          className="flex-1 rounded-full bg-[#18E299] py-3 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-[#0fa76e]"
        >
          Xác nhận
        </button>
      </div>
    </div>
  )
}
