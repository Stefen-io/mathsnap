'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { HistoryItem } from '@/types/history'

interface CaptureState {
  capturedBlob: Blob | null
  croppedBlob: Blob | null
  ocrLatex: string | null
  solveResult: HistoryItem | null
  setCapturedBlob: (blob: Blob) => void
  setCroppedBlob: (blob: Blob) => void
  setOcrLatex: (latex: string | null) => void
  setSolveResult: (item: HistoryItem | null) => void
  reset: () => void
}

const CaptureContext = createContext<CaptureState | null>(null)

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [ocrLatex, setOcrLatex] = useState<string | null>(null)
  const [solveResult, setSolveResult] = useState<HistoryItem | null>(null)

  function reset() {
    setCapturedBlob(null)
    setCroppedBlob(null)
    setOcrLatex(null)
    setSolveResult(null)
  }

  return (
    <CaptureContext.Provider
      value={{
        capturedBlob,
        croppedBlob,
        ocrLatex,
        solveResult,
        setCapturedBlob,
        setCroppedBlob,
        setOcrLatex,
        setSolveResult,
        reset,
      }}
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
