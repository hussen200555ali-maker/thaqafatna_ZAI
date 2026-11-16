'use client'

import { useEffect } from 'react'

/**
 * يسجّل service worker لتطبيق /m (يتيح التثبيت كـ PWA + العمل offline)
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const register = () => {
      navigator.serviceWorker
        .register('/sw-mobile.js', { scope: '/' })
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log('[PWA] Service Worker مسجّل:', reg.scope)
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[PWA] فشل تسجيل Service Worker:', err)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
