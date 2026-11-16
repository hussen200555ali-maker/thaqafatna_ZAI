'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MobileShell } from '@/components/mobile/mobile-shell'
import { MobileBookCardGrid, type BookLite } from '@/components/mobile/mobile-book-card'

interface Category {
  id: number
  name: string
  icon: string
  color: string
  booksCount: number
}

interface Book extends BookLite {
  description?: string
  difficulty: string
  readingTimeMin: number
  pages: number
  ratingCount: number
  category: { id: number; name: string; icon: string; color: string }
  _count: { chapters: number; reviews: number }
}

function CategoriesContent() {
  const searchParams = useSearchParams()
  const selectedCat = searchParams.get('cat')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/book-categories').then(r => r.json()),
      fetch('/api/books?limit=100').then(r => r.json()),
    ])
      .then(([catsRes, booksRes]) => {
        setCategories(catsRes.categories || [])
        setBooks(booksRes.books || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredBooks = selectedCat
    ? books.filter(b => b.category?.name === selectedCat)
    : []

  return (
    <MobileShell title="التصنيفات" showBack backHref="/m">
      {loading ? (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      ) : selectedCat ? (
        <>
          {/* Books in selected category */}
          <div style={{ padding: '16px 16px 8px' }}>
            <Link href="/m/library/categories" style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px',
              color: '#c084fc', textDecoration: 'none', marginBottom: '10px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span>كل التصنيفات</span>
            </Link>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f5f5f4', margin: '0 0 4px' }}>{selectedCat}</h2>
            <div style={{ fontSize: '12px', color: '#78716c' }}>{filteredBooks.length} كتاب</div>
          </div>
          {filteredBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#78716c' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
              <div style={{ fontSize: '13px' }}>لا توجد كتب في هذا التصنيف</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px 16px' }}>
              {filteredBooks.map(book => <MobileBookCardGrid key={book.id} book={book} />)}
            </div>
          )}
        </>
      ) : (
        <>
          {/* All categories */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '12px' }}>تصفّح حسب التصنيف · {categories.length} تصنيف</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {categories.map(cat => (
                <Link key={cat.id} href={`/m/library/categories?cat=${encodeURIComponent(cat.name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{
                    position: 'relative', padding: '16px', borderRadius: '14px', overflow: 'hidden',
                    background: cat.color || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', minHeight: '92px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: '26px' }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{cat.name}</div>
                      <div style={{ fontSize: '10px', opacity: 0.85 }}>{cat.booksCount} كتاب</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </MobileShell>
  )
}

export default function MobileCategoriesPage() {
  return (
    <Suspense fallback={
      <MobileShell title="التصنيفات" showBack backHref="/m">
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      </MobileShell>
    }>
      <CategoriesContent />
    </Suspense>
  )
}
