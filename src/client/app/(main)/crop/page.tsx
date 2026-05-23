'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useCaptureContext } from '@/contexts/CaptureContext'
import { getCroppedImg } from '@/lib/getCroppedImg'

const RATIO_PRESETS = [
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '1:1', value: 1 },
] as const

export default function CropPage() {
  const router = useRouter()
  const { capturedBlob, setCroppedBlob } = useCaptureContext()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [aspect, setAspect] = useState<number>(4 / 3)
  const [isCustom, setIsCustom] = useState(false)
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')

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

  function handleAspectChange(newAspect: number) {
    setAspect(newAspect)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setIsCustom(false)
  }

  function handleCustomApply() {
    handleAspectChange(customWNum / customHNum)
  }

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

  const customWNum = parseFloat(customW)
  const customHNum = parseFloat(customH)
  const isApplyDisabled =
    isNaN(customWNum) ||
    isNaN(customHNum) ||
    customWNum <= 0 ||
    customHNum <= 0

  if (!capturedBlob || !imageUrl) return null

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Ratio selector */}
      <div className="flex justify-center gap-2 py-3">
        {!isCustom ? (
          <>
            {RATIO_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleAspectChange(preset.value)}
                className={[
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  aspect === preset.value
                    ? 'border-[#18E299] text-[#18E299]'
                    : 'border-white/20 text-white/60',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => { setIsCustom(true); setCustomW(''); setCustomH('') }}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/60 transition-colors"
            >
              Custom
            </button>
          </>
        ) : (
          <>
            <input
              type="number"
              min="0.1"
              step="any"
              value={customW}
              onChange={(e) => setCustomW(e.target.value)}
              placeholder="W"
              aria-label="Width"
              className="w-14 rounded-full border border-white/20 bg-transparent py-1.5 text-center text-sm text-white"
            />
            <span className="flex items-center text-sm text-white/60">:</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={customH}
              onChange={(e) => setCustomH(e.target.value)}
              placeholder="H"
              aria-label="Height"
              className="w-14 rounded-full border border-white/20 bg-transparent py-1.5 text-center text-sm text-white"
            />
            <button
              onClick={handleCustomApply}
              disabled={isApplyDisabled}
              aria-label="Apply custom ratio"
              className="rounded-full bg-[#18E299] px-4 py-1.5 text-sm font-medium text-[#0d0d0d] transition-colors disabled:opacity-40"
            >
              ✓
            </button>
          </>
        )}
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
