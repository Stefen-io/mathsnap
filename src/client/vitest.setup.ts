import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// URL.createObjectURL / revokeObjectURL are not implemented in happy-dom
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

vi.mock('@/contexts/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useLanguage: () => ({ lang: 'vi' as const, setLang: vi.fn() }),
}))
