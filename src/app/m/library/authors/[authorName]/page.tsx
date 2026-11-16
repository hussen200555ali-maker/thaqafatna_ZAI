'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileShell } from '@/components/mobile/mobile-shell'
import { MobileBookCardGrid, type BookLite } from '@/components/mobile/mobile-book-card'

interface Book extends BookLite {
  description?: string
  difficulty: string
  readingTimeMin: number
  pages: number
  category: { id: number; name: string; icon: string; color: string }
  _count: { chapters: number; reviews: number }
}

export default function MobileAuthorDetailPage({ params }: { params: Promise<{ authorName: string }> }) {
  const [authorName, setAuthorName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    params.then((p) => setAuthorName(decodeURIComponent(p.authorName)))
  }, [params])

  useEffect(() => {
    if (!authorName) return
    fetch(`/api/books/by-author?author=${encodeURIComponent(authorName)}`)
      .then(r => r.json())
      .then(res => setBooks(res.books || []))
      .catch(() => {
        // fallback: fetch all and filter
        fetch('/api/books?limit=100')
          .then(r => r.json())
          .then(res => setBooks((res.books || []).filter((b: Book) => b.author === authorName)))
      })
      .finally(() => setLoading(false))
  }, [authorName])

  const totalDownloads = books.reduce((s, b) => s + b.downloads, 0)

  return (
    <MobileShell title={authorName || 'المؤلف'} showBack backHref="/m/library/authors">
      {loading ? (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#78716c' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#a8a29e' }}>لا توجد كتب لهذا المؤلف</div>
          <Link href="/m/library/authors" style={{ display: 'inline-block', marginTop: '16px', color: '#c084fc', fontSize: '12px', textDecoration: 'none' }}>كل المؤلفين ←</Link>
        </div>
      ) : (
        <>
          {/* Author hero */}
          <div style={{
            padding: '24px 16px 16px', textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(147,51,234,0.1), transparent)',
          }}>
            <div style={{
              width: '72px', height: '72px', margin: '0 auto 12px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #9333ea, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '28px', fontFamily: "'Cairo', sans-serif",
              boxShadow: '0 12px 28px -8px rgba(147,51,234,0.5)',
            }}>{authorName.charAt(0)}</div>
            <h1 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{authorName}</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '12px', color: '#a8a29e' }}>
              <span>📚 {books.length} كتاب</span>
              <span style={{ color: '#44403c' }}>·</span>
              <span>📥 {totalDownloads >= 1000 ? `${(totalDownloads/1000).toFixed(1)}K` : totalDownloads} تنزيل</span>
            </div>
          </div>

          {/* Books grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px 16px' }}>
            {books.map(book => <MobileBookCardGrid key={book.id} book={book} />)}
          </div>
        </>
      )}
    </MobileShell>
  )
}
