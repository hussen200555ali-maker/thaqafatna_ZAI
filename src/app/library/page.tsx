'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * 📚 صفحة المكتبة الرئيسية — تصميم Dark Elegant Noor Editorial
 * مستوحى من: Noor Book + Apple Books
 *
 * المميزات:
 * - Hero section مع search bar + suggestions
 * - Stats grid (4 KPIs)
 * - Featured books grid (6 books)
 * - Categories grid (8 categories)
 * - Most Downloaded ranking
 * - Author CTA section
 * - Footer
 */

interface Book {
  id: number
  title: string
  author: string
  coverImage: string
  pdfUrl?: string | null
  contentType?: string
  difficulty: string
  readingTimeMin: number
  pages: number
  ratingAvg: number
  ratingCount: number
  views: number
  downloads: number
  isFeatured: boolean
  isPremium: boolean
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

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const searchPlaceholders = [
  'ابحث عن كتاب... أو مؤلف... أو موضوع...',
  'مثلاً: «مقدمة ابن خلدون»',
  'اكتب اسم مؤلفك المفضل...',
  'جرّب: «الفلسفة»',
  'ابحث في التصنيف: الأدب العربي',
]

export default function LibraryPage() {
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPlaceholder, setSearchPlaceholder] = useState(searchPlaceholders[0])

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

  // Rotating placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchPlaceholder(prev => {
        const idx = searchPlaceholders.indexOf(prev)
        return searchPlaceholders[(idx + 1) % searchPlaceholders.length]
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const featuredBooks = books.filter(b => b.isFeatured).slice(0, 6)
  const displayBooks = featuredBooks.length >= 4 ? featuredBooks : books.slice(0, 6)
  const mostDownloaded = [...books].sort((a, b) => b.downloads - a.downloads).slice(0, 5)
  const totalBooks = books.length
  const totalDownloads = books.reduce((s, b) => s + b.downloads, 0)
  const totalAuthors = new Set(books.map(b => b.author)).size

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)',
        color: '#f5f5f4', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      }}>
        ⏳ جاري تحميل المكتبة...
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)',
      color: '#f5f5f4',
      minHeight: '100vh', overflowX: 'hidden',
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '480px', height: '480px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2, background: '#9333ea' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-10%', width: '480px', height: '480px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2, background: '#2563eb' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '30%', width: '380px', height: '380px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, background: '#059669' }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12, 10, 9, 0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(41, 37, 36, 0.6)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #9333ea, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px -8px rgba(147, 51, 234, 0.5)',
              fontSize: '20px',
            }}>📚</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '18px', fontWeight: 800,
                background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>ثقافتنا</div>
              <div style={{ fontSize: '10px', color: '#78716c', marginTop: '-2px' }}>المكتبة الذكية</div>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link href="/library" style={navItemStyle(true)}>الرئيسية</Link>
            <Link href="/library/categories" style={navItemStyle(false)}>التصنيفات</Link>
            <Link href="/library/authors" style={navItemStyle(false)}>المؤلفون</Link>
            <Link href="/library/my-library" style={navItemStyle(false)}>⭐ مكتبتي</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={iconBtnStyle} title="بحث">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
            <button style={iconBtnStyle} title="إشعارات">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </button>
            <Link href="/admin/login" style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #9333ea, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>ح</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '100px',
            background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)',
            color: '#c084fc', fontSize: '12px', fontWeight: 500, marginBottom: '24px',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#c084fc', animation: 'pulse 2s infinite',
              display: 'inline-block',
            }}></span>
            <span>مكتبة عربية ذكية · {formatArabicNumber(totalBooks)} كتاب</span>
          </div>

          <h1 style={{
            fontFamily: "'Cairo', sans-serif",
            fontSize: '56px', fontWeight: 800, lineHeight: 1.1,
            marginBottom: '16px', letterSpacing: '-0.02em',
          }}>
            اكتشف عالم
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #c084fc, #ec4899, #fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>الكتب العربية</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#a8a29e', maxWidth: '640px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            آلاف الكتب العربية في مختلف التصنيفات · اقرأ وحمّل مجاناً · مدعوم بالذكاء الاصطناعي
          </p>

          {/* Search Bar */}
          <div style={{ maxWidth: '720px', margin: '0 auto 16px', position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(37, 99, 235, 0.3))',
              borderRadius: '16px', filter: 'blur(20px)', opacity: 0.5,
            }} />
            <div style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px',
              background: 'rgba(28, 25, 23, 0.8)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(68, 64, 60, 0.6)', borderRadius: '16px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
            }}>
              <div style={{ padding: '0 16px 0 8px', color: '#78716c' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'white', fontSize: '16px', fontFamily: 'inherit', padding: '12px 0',
                }}
              />
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #9333ea, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: '14px',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                boxShadow: '0 8px 16px -4px rgba(147, 51, 234, 0.4)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}>بحث</button>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', color: '#78716c' }}>جرّب:</span>
            {['الليبرالية', 'ابن خلدون', 'التراث', 'تطوير الذات', 'الفلسفة'].map(s => (
              <button key={s} style={{
                padding: '6px 14px', borderRadius: '100px',
                background: 'rgba(41, 37, 36, 0.5)',
                color: '#d6d3d1', fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.2s', border: '1px solid transparent',
                fontFamily: 'inherit',
              }}>{s}</button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section style={{ marginBottom: '64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { icon: '📚', value: formatArabicNumber(totalBooks), label: 'كتاب عربي', color: '#9333ea' },
              { icon: '📂', value: formatArabicNumber(categories.length), label: 'تصنيف', color: '#2563eb' },
              { icon: '✍️', value: formatArabicNumber(totalAuthors), label: 'مؤلف', color: '#059669' },
              { icon: '📥', value: formatArabicNumber(totalDownloads), label: 'تنزيل', color: '#f59e0b' },
            ].map((stat, i) => (
              <div key={i} style={{
                position: 'relative', padding: '24px',
                background: 'rgba(28, 25, 23, 0.5)',
                border: '1px solid rgba(41, 37, 36, 0.6)',
                borderRadius: '18px', overflow: 'hidden', transition: 'all 0.3s',
              }}>
                <div style={{
                  position: 'absolute', top: '-16px', right: '-16px',
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: stat.color, filter: 'blur(32px)', opacity: 0.2,
                }} />
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', fontFamily: "'Cairo', sans-serif" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '12px', color: '#a8a29e', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Books */}
        <section style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>⭐</span>
                <span>الكتب المميزة</span>
              </h2>
              <p style={{ fontSize: '14px', color: '#78716c', marginTop: '4px' }}>مختارات فريق التحرير</p>
            </div>
            <Link href="/library/categories" style={{ fontSize: '14px', color: '#c084fc', textDecoration: 'none', cursor: 'pointer' }}>
              عرض الكل ←
            </Link>
          </div>

          {displayBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#78716c' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              لا توجد كتب مضافة بعد
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {displayBooks.map(book => (
                <Link key={book.id} href={`/library/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ cursor: 'pointer', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = ''}>
                    <div style={{
                      position: 'relative', aspectRatio: '2/3',
                      borderRadius: '8px', overflow: 'hidden',
                      boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)', marginBottom: '12px',
                      background: 'linear-gradient(135deg, #1e3a8a, #6366f1)',
                    }}>
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>📚</div>
                      )}
                      {book.pdfUrl && (
                        <div style={{
                          position: 'absolute', top: '8px', right: '8px',
                          background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                          fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                          backdropFilter: 'blur(4px)',
                        }}>PDF</div>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e7e5e4', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#78716c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {book.author}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                      <span style={{ color: '#fbbf24' }}>⭐ {book.ratingAvg.toFixed(1)}</span>
                      <span style={{ color: '#78716c' }}>· 👁️ {formatCount(book.views)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Categories */}
        <section style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>📂</span>
                <span>تصفّح حسب التصنيف</span>
              </h2>
              <p style={{ fontSize: '14px', color: '#78716c', marginTop: '4px' }}>اختر تصنيفك المفضل واكتشف كتباً جديدة</p>
            </div>
            <Link href="/library/categories" style={{ fontSize: '14px', color: '#c084fc', textDecoration: 'none' }}>
              عرض الكل ←
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {(categories.length > 0 ? categories : [
              { id: 1, name: 'الأدب العربي', icon: '📖', color: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', booksCount: 0 },
              { id: 2, name: 'الكتب الدينية', icon: '🕌', color: 'linear-gradient(135deg, #10b981, #047857)', booksCount: 0 },
              { id: 3, name: 'التاريخ والتراث', icon: '📜', color: 'linear-gradient(135deg, #f59e0b, #b45309)', booksCount: 0 },
              { id: 4, name: 'العلوم والمعرفة', icon: '🔬', color: 'linear-gradient(135deg, #8b5cf6, #5b21b6)', booksCount: 0 },
              { id: 5, name: 'الجغرافيا والرحلات', icon: '🌍', color: 'linear-gradient(135deg, #06b6d4, #0e7490)', booksCount: 0 },
              { id: 6, name: 'الفنون والآداب', icon: '🎨', color: 'linear-gradient(135deg, #ec4899, #9f1239)', booksCount: 0 },
              { id: 7, name: 'أدب الأطفال', icon: '🧸', color: 'linear-gradient(135deg, #f97316, #9a3412)', booksCount: 0 },
              { id: 8, name: 'التنمية البشرية', icon: '🌱', color: 'linear-gradient(135deg, #14b8a6, #115e59)', booksCount: 0 },
            ]).map(cat => (
              <Link key={cat.id} href={`/library/categories?cat=${cat.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  position: 'relative', padding: '24px',
                  borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.3s', color: 'white', minHeight: '120px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  background: cat.color || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = ''}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', position: 'relative' }}>{cat.icon}</div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{cat.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{formatArabicNumber(cat.booksCount)} كتاب</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Most Downloaded */}
        {mostDownloaded.length > 0 && (
          <section style={{ marginBottom: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🔥</span>
                  <span>الأكثر تنزيلاً</span>
                </h2>
                <p style={{ fontSize: '14px', color: '#78716c', marginTop: '4px' }}>الكتب الأكثر شعبية هذا الأسبوع</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mostDownloaded.map((book, i) => (
                <Link key={book.id} href={`/library/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', borderRadius: '14px',
                    background: 'rgba(28, 25, 23, 0.5)',
                    border: '1px solid rgba(41, 37, 36, 0.6)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.3)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(41, 37, 36, 0.6)'}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#44403c', width: '40px', textAlign: 'center', fontFamily: "'Cairo', sans-serif" }}>
                      {i + 1}
                    </div>
                    <div style={{
                      width: '50px', height: '70px', borderRadius: '4px',
                      overflow: 'hidden', flexShrink: 0,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      background: 'linear-gradient(135deg, #1e3a8a, #6366f1)',
                    }}>
                      {book.coverImage ? (
                        <img src={book.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📚</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e7e5e4', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>{book.author}</div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>📥 {formatCount(book.downloads)} تنزيل</span>
                        <span style={{ color: '#fbbf24' }}>⭐ {book.ratingAvg.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section>
          <div style={{
            position: 'relative', padding: '48px',
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(37, 99, 235, 0.15))',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '24px', overflow: 'hidden', textAlign: 'center',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✍️</div>
            <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
              هل أنت مؤلف؟
            </h2>
            <p style={{ fontSize: '16px', color: '#d6d3d1', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.7 }}>
              ارفع كتابك وانشره لآلاف القراء العرب مجاناً. انضم لمجتمع المؤلفين العرب.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/contact" style={{
                padding: '14px 28px', background: 'white', color: '#0c0a09',
                fontWeight: 700, fontSize: '14px', border: 'none',
                borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                textDecoration: 'none', transition: 'all 0.2s',
              }}>📤 ارفع كتابك</Link>
              <Link href="/library/authors" style={{
                padding: '14px 28px', background: 'rgba(41, 37, 36, 0.5)', color: 'white',
                border: '1px solid rgba(68, 64, 60, 0.5)',
                fontWeight: 600, fontSize: '14px', borderRadius: '12px', cursor: 'pointer',
                fontFamily: 'inherit', textDecoration: 'none', transition: 'all 0.2s',
              }}>تعرّف على المؤلفين</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(41, 37, 36, 0.6)',
        padding: '48px 24px 32px',
        background: 'rgba(12, 10, 9, 0.5)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #9333ea, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
              <strong style={{ color: 'white' }}>ثقافتنا</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#78716c', lineHeight: 1.7 }}>
              منصة عربية تعليمية ترفيهية تجمع بين الألغاز التكيّفية والمكتبة الذكية.
            </p>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#d6d3d1', marginBottom: '12px' }}>المكتبة</div>
            <Link href="/library" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>كل الكتب</Link>
            <Link href="/library/categories" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>التصنيفات</Link>
            <Link href="/library/authors" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>المؤلفون</Link>
            <Link href="/library/my-library" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>مكتبتي</Link>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#d6d3d1', marginBottom: '12px' }}>المساعدة</div>
            <Link href="/contact" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>تواصل معنا</Link>
            <Link href="/admin/login" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>دخول الأدمن</Link>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#d6d3d1', marginBottom: '12px' }}>عن المكتبة</div>
            <Link href="/contact" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>عن ثقافتنا</Link>
            <Link href="/contact" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>سياسة الخصوصية</Link>
            <Link href="/contact" style={{ display: 'block', fontSize: '13px', color: '#78716c', padding: '4px 0', textDecoration: 'none' }}>شروط الاستخدام</Link>
          </div>
        </div>
        <div style={{ maxWidth: '1400px', margin: '32px auto 0', paddingTop: '24px', borderTop: '1px solid rgba(41, 37, 36, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#57534e' }}>
          <span>© 2026 ثقافتنا · جميع الحقوق محفوظة</span>
          <span>صُنع بـ ❤️ للغة وثقافة الأمة العربية</span>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @media (max-width: 1024px) {
          main { grid-template-columns: 1fr !important; }
          footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: '10px',
    color: active ? '#fff' : '#d6d3d1', fontSize: '14px', cursor: 'pointer',
    transition: 'all 0.2s', textDecoration: 'none',
    background: active ? 'rgba(68, 64, 60, 0.5)' : 'transparent',
  }
}

const iconBtnStyle: React.CSSProperties = {
  width: '40px', height: '40px', borderRadius: '10px',
  background: 'rgba(41, 37, 36, 0.5)', border: '1px solid rgba(68, 64, 60, 0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#a8a29e', cursor: 'pointer', transition: 'all 0.2s',
}
