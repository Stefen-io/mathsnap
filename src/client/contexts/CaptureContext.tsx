'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface CaptureState {
  capturedBlob: Blob | null
  croppedBlob: Blob | null
  setCapturedBlob: (blob: Blob) => void
  setCroppedBlob: (blob: Blob) => void
  reset: () => void
}

const CaptureContext = createContext<CaptureState | null>(null)

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)

  function reset() {
    setCapturedBlob(null)
    setCroppedBlob(null)
  }

  return (
    <CaptureContext.Provider
      value={{ capturedBlob, croppedBlob, setCapturedBlob, setCroppedBlob, reset }}
    >
      {children}
    </CaptureContext.Provider>
  )
}

export function useCaptureContext(): CaptureState {
  const ctx = useContext(CaptureContext)
  if (!ctx) throw new Error('useCaptureContext must be used within a CaptureProvider')
  return ctx
}
