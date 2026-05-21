'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, Bookmark, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistory, deleteHistoryItem, toggleBookmark } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { HistoryItem } from '@/types/history'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const deviceId = useDeviceId()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [swipedId, setSwipedId] = useState<string | null>(null)

  useEffect(() => {
    if (!deviceId) return
    getHistory(deviceId, { page: 1, limit: 20 })
      .then(r => { setItems(r.items); setLoading(false) })
      .catch(() => setLoading(false))
  }, [deviceId])

  async function handleDelete(id: string) {
    if (!deviceId) return
    setItems(prev => prev.filter(i => i.id !== id))
    try {
      await deleteHistoryItem(id, deviceId)
    } catch {
      toast.error('Không thể xóa bài toán. Vui lòng thử lại.')
      getHistory(deviceId, { page: 1, limit: 20 }).then(r => setItems(r.items))
    }
  }

  async function handleToggleBookmark(item: HistoryItem) {
    if (!deviceId) return
    const next = !item.isBookmarked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isBookmarked: next } : i))
    try {
      await toggleBookmark(item.id, deviceId, next)
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isBookmarked: item.isBookmarked } : i))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 px-6 py-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[80px] animate-pulse rounded-[16px] bg-gray-100" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6">
        <PenTool className="size-12 stroke-1 text-[#e5e5e5]" />
        <p className="text-[16px] text-[#666666]">Chưa có bài giải nào</p>
        <button
          onClick={() => router.push('/camera')}
          className="text-[15px] font-medium text-[#18E299] hover:underline"
        >
          Chụp bài toán đầu tiên →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Lịch sử</h1>
      </div>

      <div className="space-y-4 px-6 py-6 pb-[100px]">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden rounded-[16px] bg-[#d45656]"
            >
              {/* Delete reveal background */}
              <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#d45656]">
                <button
                  aria-label="Xóa"
                  onClick={() => handleDelete(item.id)}
                  className="flex size-full items-center justify-center text-white"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>

              {/* Foreground card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) setSwipedId(item.id)
                  else setSwipedId(null)
                }}
                animate={{ x: swipedId === item.id ? -80 : 0 }}
                onClick={() => router.push(`/history/${item.id}`)}
                className="relative z-10 flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-black/5 bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.03)] transition-colors active:bg-[#fafafa]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-1 text-[16px] text-[#0d0d0d]">
                    <KaTeXRenderer latex={item.latex} />
                  </div>
                  <p className="text-[13px] text-[#888888]">{formatDate(item.createdAt)}</p>
                </div>
                <button
                  aria-label={item.isBookmarked ? 'Bỏ lưu' : 'Lưu'}
                  onClick={e => { e.stopPropagation(); void handleToggleBookmark(item) }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-black/5"
                >
                  <Bookmark
                    className="size-5"
                    fill={item.isBookmarked ? '#18E299' : 'none'}
                    color={item.isBookmarked ? '#18E299' : '#666666'}
                    strokeWidth={item.isBookmarked ? 1.5 : 2}
                  />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
