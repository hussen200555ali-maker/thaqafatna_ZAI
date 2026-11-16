'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 📱 MobileShell — الهيكل الأساسي لواجهة الموبايل الاحترافية
 *
 * تصميم app-like:
 * - حاوية عرض بعرض موبايل (max 480px) متمركّزة على الشاشات الكبيرة
 * - شريط تنقّل سفلي ثابت (4 تبويبات) مع safe-area-inset
 * - header اختياري بزر رجوع + عنوان
 * - خلفية داكنة أنيقة مطابقة لهوية ثقافتنا
 * - مناطق لمس ≥ 48px
 */

interface TabItem {
  href: string
  label: string
  icon: string
  match: (pathname: string) => boolean
}

const TABS: TabItem[] = [
  { href: '/m', label: 'الرئيسية', icon: '🏠', match: (p) => p === '/m' || p === '/m/library' },
  { href: '/m/library/categories', label: 'التصنيفات', icon: '📂', match: (p) => p.startsWith('/m/library/categories') },
  { href: '/m/library/authors', label: 'المؤلفون', icon: '✍️', match: (p) => p.startsWith('/m/library/authors') },
  { href: '/m/library/my-library', label: 'مكتبتي', icon: '⭐', match: (p) => p.startsWith('/m/library/my-library') },
]

interface MobileShellProps {
  children: React.ReactNode
  /** عنوان الـ header (إن لم يُمرَّر، لا يظهر header) */
  title?: string
  /** إظهار زر الرجوع */
  showBack?: boolean
  /** رابط الرجوع */
  backHref?: string
  /** إخفاء شريط التنقّل السفلي (للقارئ مثلاً) */
  hideBottomNav?: boolean
}

export function MobileShell({ children, title, showBack, backHref = '/m', hideBottomNav }: MobileShellProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      background: 'linear-gradient(180deg, #0c0a09 0%, #1c1917 40%, #0c0a09 100%)',
      color: '#f5f5f4',
      minHeight: '100vh',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      overflowX: 'hidden',
      boxShadow: '0 0 80px rgba(0,0,0,0.4)',
    }}>
      {/* الخلفيات الزخرفية */}
      <div style={{ position: 'fixed', top: 0, right: 0, left: 0, maxWidth: '480px', margin: '0 auto', pointerEvents: 'none', zIndex: 0, overflow: 'hidden', height: '320px' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.18, background: '#9333ea' }} />
        <div style={{ position: 'absolute', top: '60px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.15, background: '#2563eb' }} />
      </div>

      {/* Header اختياري */}
      {title && (
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: scrolled ? 'rgba(12, 10, 9, 0.92)' : 'rgba(12, 10, 9, 0.6)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(41, 37, 36, 0.6)' : '1px solid transparent',
          transition: 'all 0.25s ease',
        }}>
          <div style={{
            padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            {showBack && (
              <Link href={backHref} aria-label="رجوع" style={{
                width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                background: 'rgba(41, 37, 36, 0.6)', border: '1px solid rgba(68, 64, 60, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#d6d3d1', textDecoration: 'none',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
            )}
            <h1 style={{
              fontSize: '17px', fontWeight: 700, color: '#f5f5f4',
              flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              margin: 0,
            }}>{title}</h1>
          </div>
        </header>
      )}

      {/* المحتوى */}
      <main style={{
        position: 'relative', zIndex: 1,
        paddingBottom: hideBottomNav ? '0' : 'calc(76px + env(safe-area-inset-bottom, 0px))',
        minHeight: title ? 'auto' : '100vh',
      }}>
        {children}
      </main>

      {/* شريط التنقّل السفلي */}
      {!hideBottomNav && (
        <nav style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(50%)',
          maxWidth: '480px', width: '100%', zIndex: 50,
          background: 'rgba(12, 10, 9, 0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(41, 37, 36, 0.7)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            padding: '8px 4px 8px',
          }}>
            {TABS.map((tab) => {
              const active = tab.match(pathname)
              return (
                <Link key={tab.href} href={tab.href} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  padding: '6px 12px', borderRadius: '12px', textDecoration: 'none',
                  color: active ? '#c084fc' : '#78716c',
                  minWidth: '56px', minHeight: '48px', justifyContent: 'center',
                  transition: 'color 0.2s',
                  background: active ? 'rgba(147, 51, 234, 0.12)' : 'transparent',
                }}>
                  <span style={{ fontSize: '21px', lineHeight: 1, filter: active ? 'drop-shadow(0 0 8px rgba(192,132,252,0.5))' : 'none' }}>{tab.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
