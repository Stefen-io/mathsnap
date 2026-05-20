import { describe, it, expect, beforeEach } from 'vitest'
import { getDeviceId } from './device-id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('getDeviceId', () => {
  beforeEach(() => { localStorage.clear() })

  it('generates and persists a UUID v4 on first call', () => {
    const id = getDeviceId()
    expect(id).toMatch(UUID_V4)
    expect(localStorage.getItem('mathsnap_device_id')).toBe(id)
  })

  it('returns the same UUID on subsequent calls', () => {
    expect(getDeviceId()).toBe(getDeviceId())
  })

  it('generates a new UUID after localStorage.clear()', () => {
    const first = getDeviceId()
    localStorage.clear()
    const second = getDeviceId()
    expect(second).not.toBe(first)
    expect(second).toMatch(UUID_V4)
  })

  it('returned value matches UUID v4 regex', () => {
    expect(getDeviceId()).toMatch(UUID_V4)
  })
})
