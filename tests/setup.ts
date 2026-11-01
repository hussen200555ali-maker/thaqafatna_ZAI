import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// تنظيف بعد كل اختبار
afterEach(() => {
  cleanup()
})

// Mock localStorage — يعمل في node و jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

// تعريف localStorage على globalThis (يعمل في node و jsdom)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).localStorage = (globalThis as any).localStorage || localStorageMock
}

// Mock matchMedia — يستخدم فقط لو موجود (jsdom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  // Mock IntersectionObserver (يستخدمه بعض مكونات shadcn)
  class IntersectionObserverMock {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = []
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  })
}

// تعريف IntersectionObserver على globalThis (لـ node)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).IntersectionObserver === 'undefined') {
  class IntersectionObserverMock {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = []
  }
  (globalThis as any).IntersectionObserver = IntersectionObserverMock
}
