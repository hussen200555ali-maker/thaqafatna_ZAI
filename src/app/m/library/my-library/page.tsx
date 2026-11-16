'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileShell } from '@/components/mobile/mobile-shell'
import { MobileBookRow, type BookLite } from '@/components/mobile/mobile-book-card'

interface Book extends BookLite {
  description?: string
  difficulty: string
  readingTimeMin: number
  pages: number
  category: { id: number; name: string; icon: string; color: string }
  _count: { chapters: number; reviews: number }
}

export default function MobileMyLibraryPage() {
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/books/my-library')
      .then(r => {
        if (!r.ok) throw new Error('not authed')
        return r.json()
      })
      .then(res => setBooks(res.books || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <MobileShell title="مكتبتي" showBack backHref="/m">
      {loading ? (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      ) : error ? (
        // غير مسجّل الدخول — عرض حالة فارغة ودودة
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 16px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(37,99,235,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px',
            border: '1px solid rgba(147,51,234,0.3)',
          }}>⭐</div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f5f5f4', margin: '0 0 8px' }}>مكتبتك الشخصية</h2>
          <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.7, margin: '0 0 20px' }}>
            سجّل الدخول لحفظ الكتب المفضّلة وتتبّع تقدّمك في القراءة، والوصول لتنزيلااتك من أي جهاز.
          </p>
          <Link href="/admin/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            background: 'linear-gradient(135deg, #9333ea, #2563eb)', color: 'white',
            fontWeight: 700, fontSize: '14px', borderRadius: '13px', textDecoration: 'none',
            boxShadow: '0 8px 20px -6px rgba(147,51,234,0.5)',
          }}>
            <span>تسجيل الدخول</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <div style={{ marginTop: '24px' }}>
            <Link href="/m" style={{ color: '#78716c', fontSize: '12px', textDecoration: 'none' }}>تصفّح المكتبة ←</Link>
          </div>
        </div>
      ) : books.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f4', margin: '0 0 6px' }}>مكتبتك فارغة</h2>
          <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.6, margin: '0 0 20px' }}>
            ابدأ بإضافة كتب مفضّلة بالضغط على علامة الإشارة المرجعية في صفحة الكتاب.
          </p>
          <Link href="/m" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px',
            background: 'linear-gradient(135deg, #9333ea, #2563eb)', color: 'white',
            fontWeight: 700, fontSize: '13px', borderRadius: '12px', textDecoration: 'none',
          }}>تصفّح المكتبة</Link>
        </div>
      ) : (
        <>
          <div style={{ padding: '14px 16px 8px', fontSize: '12px', color: '#78716c' }}>{books.length} كتاب محفوظ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 16px' }}>
            {books.map(book => <MobileBookRow key={book.id} book={book} />)}
          </div>
        </>
      )}
    </MobileShell>
  )
}
