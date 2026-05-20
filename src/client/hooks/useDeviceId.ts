'use client'

import { useSyncExternalStore } from 'react'
import { getDeviceId } from '@/lib/device-id'

const noopSubscribe = () => () => {}

export function useDeviceId(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => getDeviceId(),    // client snapshot
    () => null,             // server snapshot
  )
}
