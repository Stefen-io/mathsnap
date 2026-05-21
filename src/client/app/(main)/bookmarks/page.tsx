'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useDeviceId } from '@/hooks/useDeviceId'
import { getHistory, toggleBookmark } from '@/lib/api'
import KaTeXRenderer from '@/components/KaTeXRenderer'
import type { HistoryItem } from '@/types/history'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BookmarksPage() {
  const router = useRouter()
  const deviceId = useDeviceId()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)

  useEffect(() => {
    if (!deviceId) return
    getHistory(deviceId, { page: 1, limit: 20, bookmarked: true })
      .then(r => { setItems(r.items); setLoading(false) })
      .catch(() => setLoading(false))
  }, [deviceId])

  async function handleRemoveBookmark(id: string) {
    if (!deviceId) return
    setItems(prev => prev.filter(i => i.id !== id))
    await toggleBookmark(id, deviceId, false)
  }

  if (loading) {
    return (
      <div className="space-y-3 px-6 py-6">
        {[1, 2].map(i => <div key={i} className="h-[80px] animate-pulse rounded-[16px] bg-gray-100" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6">
        <Bookmark className="size-12 stroke-1 text-[#e5e5e5]" />
        <p className="text-[16px] text-[#666666]">Chưa có bài nào được lưu</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-6 py-6 backdrop-blur-md">
        <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-[#0d0d0d]">Bookmark</h1>
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
              <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#d45656]">
                <button
                  aria-label="Bỏ lưu"
                  onClick={() => handleRemoveBookmark(item.id)}
                  className="flex size-full items-center justify-center text-white"
                >
                  <Bookmark className="size-5" />
                </button>
              </div>

              <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onDragStart={() => { draggingId.current = item.id }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) setSwipedId(item.id)
                  else setSwipedId(null)
                  setTimeout(() => { draggingId.current = null }, 0)
                }}
                animate={{ x: swipedId === item.id ? -80 : 0 }}
                onClick={() => { if (draggingId.current !== item.id) router.push(`/history/${item.id}`) }}
                className="relative z-10 flex cursor-pointer items-center justify-between gap-4 rounded-[16px] border border-black/5 bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.03)] transition-colors active:bg-[#fafafa]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 line-clamp-1 text-[16px] text-[#0d0d0d]">
                    <KaTeXRenderer latex={item.latex} />
                  </div>
                  <p className="text-[13px] text-[#888888]">{formatDate(item.createdAt)}</p>
                </div>
                <button
                  aria-label="Bỏ lưu"
                  onClick={e => { e.stopPropagation(); void handleRemoveBookmark(item.id) }}
                  className="flex size-10 shrink-0 items-center justify-center rounded-[8px] transition-colors hover:bg-black/5"
                >
                  <Bookmark className="size-5" fill="#18E299" color="#18E299" strokeWidth={1.5} />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
