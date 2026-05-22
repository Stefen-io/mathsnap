'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

type FacingMode = 'environment' | 'user'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('environment')
  const [isReady, setIsReady] = useState(false)
  const [cameraUnavailable, setCameraUnavailable] = useState(false)

  const startStream = useCallback(async (mode: FacingMode) => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (!navigator.mediaDevices?.getUserMedia) { setCameraUnavailable(true); return }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      })
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } catch {
        setCameraUnavailable(true)
        return
      }
    }
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
    setCameraUnavailable(false)
    setIsReady(true)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startStream('environment')
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = useCallback(() => {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startStream(next)
  }, [facingMode, startStream])

  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) { reject(new Error('refs not attached')); return }
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no 2d context')); return }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/jpeg',
        0.85
      )
    })
  }, [])

  return { videoRef, canvasRef, facingMode, flipCamera, captureFrame, isReady, cameraUnavailable }
}
