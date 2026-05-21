'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Upload, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCaptureContext } from '@/contexts/CaptureContext'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function HomePage() {
  const router = useRouter()
  const { setCapturedBlob } = useCaptureContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ảnh không được vượt quá 2MB.')
      return
    }
    setCapturedBlob(file)
    router.push('/crop')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0d0d0d]">MathSnap</h1>
        <p className="mt-2 text-sm text-gray-500">Chụp ảnh bài toán, nhận lời giải từng bước</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          className="h-12 w-full rounded-full bg-[#18E299] font-medium text-[#0d0d0d] hover:bg-[#0fa76e] hover:text-white"
          onClick={() => router.push('/camera')}
        >
          <Camera className="mr-2 size-5" />
          Chụp ảnh
        </Button>

        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 size-5" />
          Tải lên
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
          Nhập LaTeX
        </Link>
      </div>
    </div>
  )
}
