import { vi } from 'vitest'

// URL.createObjectURL / revokeObjectURL are not implemented in happy-dom
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()
