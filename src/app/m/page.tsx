'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MobileShell } from '@/components/mobile/mobile-shell'
import { MobileBookCardCarousel, MobileBookRow, CategoryChip, type BookLite } from '@/components/mobile/mobile-book-card'

interface Book extends BookLite {
  description?: string
  difficulty: string
  readingTimeMin: number
  pages: number
  ratingCount: number
  isPremium?: boolean
  keywords?: string[] | string
  category: { id: number; name: string; icon: string; color: string }
  _count: { chapters: number; reviews: number }
  createdAt: string
}

interface Category {
  id: number
  name: string
  icon: string
  color: string
  booksCount: number
}

function formatArabicNumber(n: number): string {
  return n.toLocaleString('ar-EG')
}

const SUGGESTIONS = ['ابن خلدون', 'الفلسفة', 'التراث', 'تطوير الذات', 'الأدب العربي']

export default function MobileHomePage() {
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/books?limit=100').then(r => r.json()),
      fetch('/api/book-categories').then(r => r.json()),
    ])
      .then(([booksRes, catsRes]) => {
        setBooks(booksRes.books || [])
        setCategories(catsRes.categories || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featured = books.filter(b => b.isFeatured).slice(0, 10)
  const displayFeatured = featured.length >= 4 ? featured : books.slice(0, 10)
  const mostDownloaded = [...books].sort((a, b) => b.downloads - a.downloads).slice(0, 5)
  const totalBooks = books.length
  const totalDownloads = books.reduce((s, b) => s + b.downloads, 0)

  const trimmed = activeSearch.trim()
  const isSearching = trimmed.length > 0
  const searchResults = isSearching
    ? books.filter(b => {
        const q = trimmed.toLowerCase()
        return (b.title || '').toLowerCase().includes(q) ||
               (b.author || '').toLowerCase().includes(q) ||
               (b.description || '').toLowerCase().includes(q)
      })
    : []

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setActiveSearch(searchQuery)
    if (searchQuery.trim()) {
      setTimeout(() => {
        document.getElementById('m-search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  const focusSearch = () => {
    searchInputRef.current?.focus()
    setTimeout(() => {
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  if (loading) {
    return (
      <MobileShell>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', color: '#a8a29e' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #9333ea, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', animation: 'mPulse 1.4s infinite' }}>📚</div>
          <div style={{ fontSize: '15px' }}>جاري تحميل المكتبة...</div>
          <style>{`@keyframes mPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.9)}}`}</style>
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      {/* Header: logo + search */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(12, 10, 9, 0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(41, 37, 36, 0.5)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{ padding: '12px 16px 14px' }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Link href="/m" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '11px',
                background: 'linear-gradient(135deg, #9333ea, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                boxShadow: '0 6px 16px -4px rgba(147, 51, 234, 0.5)',
              }}>📚</div>
              <div>
                <div style={{
                  fontSize: '16px', fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>ثقافتنا</div>
                <div style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>{formatArabicNumber(totalBooks)} كتاب</div>
              </div>
            </Link>
            <button onClick={focusSearch} aria-label="بحث" style={{
              width: '38px', height: '38px', borderRadius: '11px',
              background: 'rgba(41, 37, 36, 0.6)', border: '1px solid rgba(68, 64, 60, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 4px 4px 14px',
            background: 'rgba(28, 25, 23, 0.8)', border: '1px solid rgba(68, 64, 60, 0.5)',
            borderRadius: '14px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2.2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن كتاب أو مؤلف..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#f5f5f4', fontSize: '14px', fontFamily: 'inherit', padding: '10px 0', minWidth: 0,
              }}
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setActiveSearch('') }} aria-label="مسح" style={{ background: 'transparent', border: 'none', color: '#78716c', fontSize: '18px', padding: '6px 8px', cursor: 'pointer' }}>×</button>
            )}
            <button type="submit" style={{
              padding: '9px 16px', background: 'linear-gradient(135deg, #9333ea, #2563eb)',
              color: 'white', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '11px',
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>بحث</button>
          </form>
        </div>
      </header>

      {/* Search results (if searching) */}
      {isSearching && (
        <section id="m-search-results" style={{ padding: '16px 16px 8px', scrollMarginTop: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5f5f4' }}>🔍 نتائج البحث</div>
              <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>
                {searchResults.length > 0 ? `${searchResults.length} نتيجة لـ «${trimmed}»` : `لا نتائج لـ «${trimmed}»`}
              </div>
            </div>
            <button onClick={() => { setSearchQuery(''); setActiveSearch('') }} style={{
              padding: '6px 12px', borderRadius: '9px', background: 'rgba(41,37,36,0.6)',
              color: '#d6d3d1', border: '1px solid rgba(68,64,60,0.4)', fontSize: '12px',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>✕ إغلاق</button>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#78716c', background: 'rgba(28,25,23,0.5)', borderRadius: '14px', border: '1px solid rgba(41,37,36,0.6)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#a8a29e' }}>لم نعثر على نتائج</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>جرّب كلمات مختلفة</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(book => <MobileBookRow key={book.id} book={book} />)}
            </div>
          )}
        </section>
      )}

      {!isSearching && (
        <>
          {/* Featured carousel */}
          <section style={{ padding: '18px 0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f4', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⭐</span><span>الكتب المميزة</span>
                </h2>
                <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px' }}>مختارات فريق التحرير</div>
              </div>
            </div>
            <div style={{
              display: 'flex', gap: '12px', overflowX: 'auto', scrollSnapType: 'x mandatory',
              padding: '0 16px 4px', WebkitOverflowScrolling: 'touch',
            }} className="m-carousel">
              {displayFeatured.map(book => (
                <div key={book.id} style={{ scrollSnapAlign: 'start' }}>
                  <MobileBookCardCarousel book={book} />
                </div>
              ))}
            </div>
          </section>

          {/* Stats compact */}
          <section style={{ padding: '8px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { icon: '📚', value: formatArabicNumber(totalBooks), label: 'كتاب' },
                { icon: '📂', value: formatArabicNumber(categories.length), label: 'تصنيف' },
                { icon: '📥', value: formatArabicNumber(totalDownloads), label: 'تنزيل' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '12px 10px', borderRadius: '12px', textAlign: 'center',
                  background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(41,37,36,0.6)',
                }}>
                  <div style={{ fontSize: '18px' }}>{s.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f5f5f4', fontFamily: "'Cairo', sans-serif", marginTop: '2px' }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#78716c' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section style={{ padding: '18px 16px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f4', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📂</span><span>التصنيفات</span>
              </h2>
              <Link href="/m/library/categories" style={{ fontSize: '12px', color: '#c084fc', textDecoration: 'none' }}>الكل ←</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {(categories.length > 0 ? categories.slice(0, 6) : []).map(cat => (
                <CategoryChip key={cat.id} name={cat.name} icon={cat.icon} color={cat.color} count={cat.booksCount} />
              ))}
            </div>
          </section>

          {/* Most downloaded */}
          {mostDownloaded.length > 0 && (
            <section style={{ padding: '18px 16px 8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f5f4', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔥</span><span>الأكثر تنزيلاً</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mostDownloaded.map((book, i) => <MobileBookRow key={book.id} book={book} rank={i + 1} />)}
              </div>
            </section>
          )}

          {/* Suggestions */}
          <section style={{ padding: '12px 16px 24px' }}>
            <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>جرّب البحث عن:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setSearchQuery(s); setActiveSearch(s); focusSearch() }} style={{
                  padding: '6px 12px', borderRadius: '100px', background: 'rgba(41,37,36,0.5)',
                  color: '#d6d3d1', fontSize: '12px', border: '1px solid rgba(68,64,60,0.4)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{s}</button>
              ))}
            </div>
          </section>
        </>
      )}

      <style>{`
        .m-carousel::-webkit-scrollbar { display: none; }
        .m-carousel { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </MobileShell>
  )
}
