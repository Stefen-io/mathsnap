'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCaptureContext } from '@/contexts/CaptureContext'

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`animate-pulse rounded-lg bg-gray-100 ${className}`}
    />
  )
}

export default function OcrPage() {
  const router = useRouter()
  const { croppedBlob } = useCaptureContext()

  useEffect(() => {
    if (!croppedBlob) router.push('/camera')
  }, [croppedBlob, router])

  if (!croppedBlob) return null

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-8">
      {/* Loading label */}
      <div className="mb-6 text-center">
        <Skeleton className="mx-auto mb-3 h-4 w-28" />
        <p className="text-xs text-gray-400">Đang nhận dạng công thức...</p>
      </div>

      {/* Formula area skeleton */}
      <div className="mb-6 rounded-2xl border border-black/5 p-5">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Steps skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-black/5 p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
