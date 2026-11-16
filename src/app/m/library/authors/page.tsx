'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileShell } from '@/components/mobile/mobile-shell'

interface BookLite {
  id: number
  title: string
  author: string
  coverImage?: string
  ratingAvg: number
  downloads: number
  category: { id: number; name: string; icon: string; color: string }
}

interface Author {
  name: string
  bookCount: number
  topBook: BookLite
  totalDownloads: number
}

export default function MobileAuthorsPage() {
  const [loading, setLoading] = useState(true)
  const [authors, setAuthors] = useState<Author[]>([])

  useEffect(() => {
    fetch('/api/books?limit=100')
      .then(r => r.json())
      .then(res => {
        const books: BookLite[] = res.books || []
        const map = new Map<string, { books: BookLite[]; downloads: number }>()
        for (const b of books) {
          if (!b.author) continue
          const entry = map.get(b.author) || { books: [], downloads: 0 }
          entry.books.push(b)
          entry.downloads += b.downloads || 0
          map.set(b.author, entry)
        }
        const list: Author[] = Array.from(map.entries())
          .map(([name, { books, downloads }]) => ({
            name,
            bookCount: books.length,
            topBook: books.sort((a, b) => b.downloads - a.downloads)[0],
            totalDownloads: downloads,
          }))
          .sort((a, b) => b.totalDownloads - a.totalDownloads)
        setAuthors(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <MobileShell title="المؤلفون" showBack backHref="/m">
      {loading ? (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      ) : authors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#78716c' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>✍️</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#a8a29e' }}>لا يوجد مؤلفون بعد</div>
        </div>
      ) : (
        <>
          <div style={{ padding: '14px 16px 8px', fontSize: '12px', color: '#78716c' }}>{authors.length} مؤلف</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 16px' }}>
            {authors.map((author, i) => (
              <Link key={author.name} href={`/m/library/authors/${encodeURIComponent(author.name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '14px', background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(41,37,36,0.6)',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #9333ea, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '18px', fontFamily: "'Cairo', sans-serif",
                  }}>{author.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e7e5e4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{author.name}</div>
                    <div style={{ fontSize: '11px', color: '#78716c', marginTop: '3px', display: 'flex', gap: '10px' }}>
                      <span>📚 {author.bookCount} كتاب</span>
                      <span>📥 {author.totalDownloads >= 1000 ? `${(author.totalDownloads/1000).toFixed(1)}K` : author.totalDownloads}</span>
                    </div>
                  </div>
                  {author.topBook?.coverImage && (
                    <img src={author.topBook.coverImage} alt="" style={{ width: '34px', height: '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }} />
                  )}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="15 18 9 12 15 6" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </MobileShell>
  )
}
