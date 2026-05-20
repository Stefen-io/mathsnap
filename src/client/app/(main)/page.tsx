'use client'

import { useRouter } from 'next/navigation'
import { Camera, ImageIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0d0d0d]">
          MathSnap
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Chụp ảnh bài toán, nhận lời giải từng bước
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          className="h-12 w-full rounded-full bg-[#18E299] text-[#0d0d0d] font-medium hover:bg-[#0fa76e] hover:text-white"
          onClick={() => router.push('/camera')}
        >
          <Camera className="mr-2 size-5" />
          Chụp ảnh
        </Button>

        <Button
          variant="outline"
          className="h-12 w-full rounded-full"
          onClick={() => { /* no-op — gallery integration in future change */ }}
        >
          <ImageIcon className="mr-2 size-5" />
          Thư viện
        </Button>

        <Button
          variant="ghost"
          className="h-12 w-full rounded-full"
          onClick={() => { /* no-op — history screen in future change */ }}
        >
          <Clock className="mr-2 size-5" />
          Lịch sử
        </Button>
      </div>
    </div>
  )
}
