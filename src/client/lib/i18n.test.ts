import { describe, it, expect } from 'vitest'
import { t } from './i18n'

describe('i18n', () => {
  it('en and vi have the same keys', () => {
    expect(Object.keys(t.en).sort()).toEqual(Object.keys(t.vi).sort())
  })
})
