'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * 📱 MobileNav — قائمة تنقّل منزلقة للموبايل
 *
 * تعرض زر همبرغر في الـ header (يظهر فقط على الشاشات ≤ 768px)
 * وتدرجاً جانبياً (drawer) من جهة اليمين (RTL) يحتوي روابط المكتبة.
 *
 * المميزات:
 * - يظهر فقط على الموبايل (display:none على الديسكتوب)
 * - خلفية معتمة عند الفتح (تُغلق بالنقر عليها)
 * - قفل تمرير الصفحة عند الفتح
 * - إغلاق تلقائي بعد النقر على أي رابط
 * - مناطق لمس ≥ 44px (معيار WCAG)
 */

interface NavItem {
  href: string
  label: string
  icon: string
  active?: boolean
}

interface MobileNavProps {
  items?: NavItem[]
}

const DEFAULT_ITEMS: NavItem[] = [
  { href: '/library', label: 'الرئيسية', icon: '🏠' },
  { href: '/library/categories', label: 'التصنيفات', icon: '📂' },
  { href: '/library/authors', label: 'المؤلفون', icon: '✍️' },
  { href: '/library/my-library', label: 'مكتبتي', icon: '⭐' },
  { href: '/contact', label: 'تواصل معنا', icon: '💬' },
]

export function MobileNav({ items = DEFAULT_ITEMS }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  // قفل تمرير الصفحة عند فتح القائمة
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // إغلاق عند الضغط على Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* زر الهمبرغر — يظهر فقط على الموبايل */}
      <button
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        className="mobile-nav-trigger"
        style={{
          display: 'none', // يُعرض فقط عبر CSS على الموبايل
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'rgba(41, 37, 36, 0.5)',
          border: '1px solid rgba(68, 64, 60, 0.4)',
          alignItems: 'center', justifyContent: 'center',
          color: '#d6d3d1', cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* الخلفية المعتمة */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'mobileNavFadeIn 0.2s ease',
          }}
        />
      )}

      {/* الدرج المنزلق */}
      <nav
        className="mobile-nav-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '280px', maxWidth: '85vw', zIndex: 100,
          background: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)',
          borderLeft: '1px solid rgba(68, 64, 60, 0.5)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          fontFamily: "'Tajawal', 'Cairo', sans-serif",
        }}
      >
        {/* رأس الدرج */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px', borderBottom: '1px solid rgba(41, 37, 36, 0.6)',
        }}>
          <Link href="/library" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #9333ea, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>📚</div>
            <div>
              <div style={{
                fontSize: '16px', fontWeight: 800,
                background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>ثقافتنا</div>
              <div style={{ fontSize: '10px', color: '#78716c', marginTop: '-2px' }}>المكتبة الذكية</div>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(41, 37, 36, 0.5)', border: '1px solid rgba(68, 64, 60, 0.4)',
              color: '#a8a29e', cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* روابط التنقّل */}
        <div style={{ padding: '12px', flex: 1 }}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '12px',
                color: item.active ? '#fff' : '#d6d3d1',
                fontSize: '15px', fontWeight: 600,
                textDecoration: 'none', marginBottom: '4px',
                background: item.active ? 'rgba(147, 51, 234, 0.15)' : 'transparent',
                border: item.active ? '1px solid rgba(147, 51, 234, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
                minHeight: '48px', // منطقة لمس كافية
              }}
            >
              <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* تذييل الدرج */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(41, 37, 36, 0.6)',
          fontSize: '11px', color: '#57534e', textAlign: 'center',
        }}>
          © 2026 ثقافتنا · صُنع بـ ❤️ للغة العربية
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav-trigger { display: flex !important; }
        }
        @keyframes mobileNavFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
