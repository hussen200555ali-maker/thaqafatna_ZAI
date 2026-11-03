'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookCover } from '@/components/library/book-cover'

/**
 * 📖 صفحة الكتاب — تصميم Dark Elegant Noor Editorial
 *
 * المميزات:
 * - Adaptive Cover (يظهر في الـ Header عند التمرير)
 * - Sidebar معاينة الغلاف + CTA + TOC + Reading Progress
 * - Content: quote section + book title + description + info grid + keywords + reviews
 * - Mobile: Sticky CTA أسفل الشاشة
 * - Background orbs (purple + blue + emerald)
 */

interface Chapter {
  id: number
  order: number
  title: string
  estimatedMinutes: number
  isFree: boolean
}

interface Review {
  id: number
  rating: number
  content: string
  createdAt: string
  user: { id: string; name: string | null }
}

interface BookDetail {
  id: number
  title: string
  author: string
  description: string
  coverImage: string
  contentType: string
  pdfUrl: string
  pdfFileName: string
  pdfSize: number
  pdfPageCount: number
  difficulty: string
  readingTimeMin: number
  pages: number
  language: string
  keywords: string[]
  views: number
  downloads: number
  ratingAvg: number
  ratingCount: number
  isFeatured: boolean
  isPremium: boolean
  category: { id: number; name: string; icon: string; color: string }
  chapters: Chapter[]
  reviews: Review[]
  _count: { reviews: number; bookmarks: number }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const difficultyLabels: Record<string, string> = {
  easy: 'سهل', medium: 'متوسط', hard: 'صعب',
}

export default function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const [bookId, setBookId] = useState<number | null>(null)
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    params.then((p) => setBookId(parseInt(p.bookId)))
  }, [params])

  useEffect(() => {
    if (!bookId) return
    fetch(`/api/books/${bookId}`)
      .then((r) => r.json())
      .then((data) => setBook(data.book))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bookId])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 📤 مشاركة الكتاب — Web Share API + fallback لنسخ الرابط
  const handleShare = async () => {
    if (!book) return
    const shareUrl = window.location.href
    const shareData = {
      title: book.title,
      text: `${book.title} — ${book.author}\n${book.description?.substring(0, 100) || ''}`,
      url: shareUrl,
    }

    try {
      // محاولة استخدام Web Share API (يدعمه الجوال + بعض المتصفحات)
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch (e) {
      // المستخدم ألغى المشاركة — لا تفعل شيئًا
      return
    }

    // Fallback: نسخ الرابط للحافظة
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      // fallback أخير: فتح Twitter
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
    }
  }

  // 📖 تحديد رابط القراءة — أول فصل لو موجود، أو PDF مباشرة، أو لا شيء
  const getReadUrl = () => {
    if (!book) return '#'
    // 1. لو عنده فصول → أول فصل
    if (book.chapters && book.chapters.length > 0) {
      return `/library/reader/${book.id}/${book.chapters[0].id}`
    }
    // 2. لو عنده PDF → افتح الـ PDF مباشرة
    if (book.pdfUrl) {
      return book.pdfUrl
    }
    // 3. لا يوجد محتوى للقراءة
    return '#'
  }

  const readUrl = getReadUrl()
  const canRead = readUrl !== '#'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0a09, #1c1917, #0c0a09)', color: '#a8a29e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
        ⏳ جاري التحميل...
      </div>
    )
  }

  if (!book) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0c0a09, #1c1917, #0c0a09)', color: '#a8a29e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
        <h1 style={{ color: '#f5f5f4', fontSize: '24px', marginBottom: '8px' }}>الكتاب غير موجود</h1>
        <Link href="/library" style={{ color: '#c084fc', fontSize: '14px' }}>العودة للمكتبة ←</Link>
      </div>
    )
  }

  const b = book

  return (
    <div style={{
      fontFamily: "'Tajawal', 'Cairo', sans-serif",
      background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)',
      color: '#f5f5f4',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '480px', height: '480px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2, background: '#9333ea' }} />
        <div style={{ position: 'absolute', top: '50%', left: '-10%', width: '480px', height: '480px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2, background: '#2563eb' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '30%', width: '380px', height: '380px', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, background: '#059669' }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12, 10, 9, 0.7)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(41, 37, 36, 0.6)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/library" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d6d3d1', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>المكتبة</span>
            </Link>

            {/* Adaptive Cover (appears on scroll) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              opacity: scrolled ? 1 : 0,
              transform: scrolled ? 'translateX(0)' : 'translateX(20px)',
              transition: 'all 0.4s ease',
            }}>
              {b.coverImage && (
                <img src={b.coverImage} alt={b.title} style={{ width: '32px', height: '44px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', objectFit: 'cover' }} />
              )}
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f4', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {b.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button title="إشارة مرجعية" style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(41, 37, 36, 0.5)', border: '1px solid rgba(68, 64, 60, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a8a29e', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v16l7-5 7 5V5z" /></svg>
            </button>
            <button title="مشاركة" style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(41, 37, 36, 0.5)', border: '1px solid rgba(68, 64, 60, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a8a29e', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: '1400px', margin: '0 auto',
        padding: '32px 24px 100px',
        display: 'grid', gridTemplateColumns: '1fr 280px', gap: '48px',
      }}>
        {/* Content Side */}
        <div style={{ minWidth: 0 }}>
          {/* Quote Section */}
          <section style={{ textAlign: 'center', margin: '0 0 56px', padding: '32px 0', position: 'relative' }}>
            <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #57534e, transparent)', margin: '0 auto 32px' }} />
            <p style={{
              fontFamily: "'Cairo', serif",
              fontSize: '22px', fontWeight: 400, lineHeight: 1.8,
              color: '#e7e5e4', maxWidth: '640px', margin: '0 auto', fontStyle: 'italic',
            }}>
              «{b.description ? b.description.substring(0, 140) + (b.description.length > 140 ? '...' : '') : 'الكتاب الصالح رفيق لا يخون، وصديق لا يغدر، ومعلم لا يَكلّ'}»
            </p>
            <p style={{ marginTop: '16px', fontSize: '13px', color: '#78716c' }}>
              — من كتاب: {b.title}
            </p>
            <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, #57534e, transparent)', margin: '32px auto 0' }} />
          </section>

          {/* Book Title Section */}
          <section style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '100px',
              background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)',
              color: '#c084fc', fontSize: '12px', fontWeight: 500, marginBottom: '16px',
            }}>
              <span>{b.category.icon}</span>
              <span>{b.category.name}</span>
            </div>

            <h1 style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '42px', fontWeight: 800, lineHeight: 1.2,
              color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em',
            }}>
              {b.title}
            </h1>

            <p style={{ fontSize: '18px', color: '#a8a29e', marginBottom: '24px' }}>
              <Link href={`/library/authors/${encodeURIComponent(b.author)}`} style={{ color: '#c084fc', textDecoration: 'none' }}>
                {b.author}
              </Link>
              <span style={{ color: '#44403c', margin: '0 8px' }}>·</span>
              <span style={{ fontSize: '13px' }}>صفحة المؤلف ←</span>
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: '#a8a29e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i <= Math.round(b.ratingAvg) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{b.ratingAvg.toFixed(1)}</span>
                <span style={{ color: '#78716c' }}>({formatNumber(b.ratingCount)} تقييم)</span>
              </div>
              <span style={{ color: '#44403c' }}>·</span>
              <span>👁️ {formatNumber(b.views)} قارئ</span>
              <span style={{ color: '#44403c' }}>·</span>
              <span>📥 {formatNumber(b.downloads)} تنزيل</span>
            </div>
          </section>

          {/* Divider */}
          <div style={{ width: '100%', height: '1px', margin: '0 0 32px', background: 'linear-gradient(90deg, transparent, #292524 20%, #292524 80%, transparent)' }} />

          {/* Description */}
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📖</span>
              <span>عن الكتاب</span>
            </h2>
            <p style={{ fontSize: '17px', lineHeight: 1.9, color: '#d6d3d1', maxWidth: '720px' }}>
              {b.description || 'لا يوجد وصف متاح لهذا الكتاب بعد.'}
            </p>
          </section>

          <div style={{ width: '100%', height: '1px', margin: '0 0 32px', background: 'linear-gradient(90deg, transparent, #292524 20%, #292524 80%, transparent)' }} />

          {/* Info Grid */}
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <span>التفاصيل</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {[
                { label: '📚 الفئة', value: b.category.name, color: '#c084fc' },
                { label: '🌐 اللغة', value: b.language === 'ar' ? 'العربية' : b.language === 'en' ? 'الإنجليزية' : b.language, color: '#60a5fa' },
                { label: '📄 الصفحات', value: `${b.pages} صفحة`, color: '#34d399' },
                { label: '⏱️ وقت القراءة', value: `${b.readingTimeMin} دقيقة`, color: '#fbbf24' },
                { label: '📊 الصعوبة', value: difficultyLabels[b.difficulty] || b.difficulty, color: '#c084fc' },
                { label: '📖 عدد الفصول', value: `${b.chapters.length} فصل`, color: '#34d399' },
                { label: '💾 حجم الملف', value: b.pdfSize ? formatBytes(b.pdfSize) : '—', color: '#fbbf24' },
                { label: '⭐ مميز', value: b.isFeatured ? 'نعم' : 'لا', color: '#60a5fa' },
              ].map((info, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: '14px',
                  background: 'rgba(28, 25, 23, 0.5)',
                  border: '1px solid rgba(41, 37, 36, 0.6)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '6px' }}>{info.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: info.color }}>{info.value}</div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ width: '100%', height: '1px', margin: '0 0 32px', background: 'linear-gradient(90deg, transparent, #292524 20%, #292524 80%, transparent)' }} />

          {/* Keywords */}
          {b.keywords && b.keywords.length > 0 && (
            <>
              <section style={{ marginBottom: '56px' }}>
                <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🏷️</span>
                  <span>الكلمات المفتاحية</span>
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {b.keywords.map((kw, i) => (
                    <span key={i} style={{
                      padding: '6px 14px', borderRadius: '8px',
                      background: 'rgba(28, 25, 23, 0.5)',
                      border: '1px solid rgba(68, 64, 60, 0.4)',
                      color: '#d6d3d1', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      #{kw}
                    </span>
                  ))}
                </div>
              </section>
              <div style={{ width: '100%', height: '1px', margin: '0 0 32px', background: 'linear-gradient(90deg, transparent, #292524 20%, #292524 80%, transparent)' }} />
            </>
          )}

          {/* Reviews */}
          {b.reviews && b.reviews.length > 0 && (
            <section style={{ marginBottom: '56px' }}>
              <h2 style={{ fontFamily: "'Cairo', sans-serif", fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>مراجعات القرّاء</span>
                <span style={{ fontSize: '14px', color: '#78716c', fontWeight: 400 }}>({b._count.reviews} مراجعات)</span>
              </h2>

              {b.reviews.slice(0, 3).map((review) => (
                <div key={review.id} style={{
                  padding: '20px', borderRadius: '14px',
                  background: 'rgba(28, 25, 23, 0.4)',
                  border: '1px solid rgba(41, 37, 36, 0.6)',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #9333ea, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '14px',
                      }}>
                        {(review.user?.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e7e5e4' }}>{review.user?.name || 'مجهول'}</div>
                        <div style={{ fontSize: '12px', color: '#78716c' }}>{new Date(review.createdAt).toLocaleDateString('ar-EG')}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#a8a29e' }}>{review.content}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside style={{
          position: 'sticky', top: '96px', alignSelf: 'start',
          maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
          paddingLeft: '8px',
        }}>
          {/* Cover + CTA Card */}
          <div style={{
            background: 'rgba(28, 25, 23, 0.5)',
            border: '1px solid rgba(41, 37, 36, 0.6)',
            borderRadius: '18px', overflow: 'hidden', marginBottom: '16px',
          }}>
            {/* Cover */}
            <div style={{
              position: 'relative', padding: '24px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(37, 99, 235, 0.1))',
            }}>
              <div style={{
                width: '140px', height: '200px', margin: '0 auto 16px',
                borderRadius: '8px', overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 8px 16px -4px rgba(147, 51, 234, 0.3)',
                position: 'relative', transition: 'transform 0.3s ease',
              }}>
                {b.coverImage ? (
                  <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a, #6366f1)', fontSize: '48px' }}>📚</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {b.pdfUrl && (
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    📄 PDF
                  </span>
                )}
                {b.isFeatured && (
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    ⭐ مميز
                  </span>
                )}
              </div>
            </div>

            {/* CTA Section */}
            <div style={{ padding: '0 16px 16px' }}>
              {canRead ? (
                <a
                  href={readUrl}
                  target={readUrl.startsWith('http') ? '_blank' : undefined}
                  rel={readUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, #9333ea, #ec4899, #f59e0b)',
                    backgroundSize: '200% 200%',
                    color: 'white', fontSize: '15px', fontWeight: 700,
                    border: 'none', borderRadius: '14px', cursor: 'pointer',
                    boxShadow: '0 8px 24px -8px rgba(147, 51, 234, 0.5)',
                    transition: 'all 0.3s ease', marginBottom: '10px', textDecoration: 'none',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <span>{b.pdfUrl && !b.chapters?.length ? 'افتح PDF' : 'ابدأ القراءة'}</span>
                </a>
              ) : (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', padding: '16px',
                    background: 'rgba(68, 64, 60, 0.3)',
                    color: '#78716c', fontSize: '14px', fontWeight: 600,
                    border: '1px solid rgba(68, 64, 60, 0.5)',
                    borderRadius: '14px', marginBottom: '10px',
                  }}
                >
                  📄 لا يوجد محتوى للقراءة
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {b.pdfUrl && (
                  <a
                    href={b.pdfUrl}
                    download={b.pdfFileName || `${b.title}.pdf`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', fontSize: '13px', fontWeight: 600,
                      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid', textDecoration: 'none',
                      background: 'rgba(16, 185, 129, 0.1)', color: '#34d399',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>تنزيل</span>
                  </a>
                )}
                <button
                  onClick={handleShare}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '12px', fontSize: '13px', fontWeight: 600,
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                    border: '1px solid',
                    background: shared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(68, 64, 60, 0.3)',
                    color: shared ? '#34d399' : '#d6d3d1',
                    borderColor: shared ? 'rgba(16, 185, 129, 0.4)' : 'rgba(68, 64, 60, 0.5)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{shared ? '✓ تم النسخ' : 'مشاركة'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reading Progress Card (mockup) */}
          <div style={{
            background: 'rgba(28, 25, 23, 0.5)',
            border: '1px solid rgba(41, 37, 36, 0.6)',
            borderRadius: '18px', padding: '16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#a8a29e' }}>📊 تقدّمك في القراءة</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc' }}>0%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(41, 37, 36, 0.6)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: '0%', borderRadius: '3px', background: 'linear-gradient(90deg, #9333ea, #ec4899, #f59e0b)', boxShadow: '0 0 12px rgba(147, 51, 234, 0.5)' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#78716c' }}>0 من {b.chapters.length} فصل مكتمل · ابدأ القراءة الآن</p>
          </div>

          {/* Sticky TOC */}
          {b.chapters.length > 0 && (
            <div style={{
              background: 'rgba(28, 25, 23, 0.5)',
              border: '1px solid rgba(41, 37, 36, 0.6)',
              borderRadius: '18px', padding: '20px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#a8a29e', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📑 الفهرس</span>
                <span style={{ color: '#78716c', fontSize: '11px', fontWeight: 400 }}>{b.chapters.length} فصل</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {b.chapters.map((ch, i) => (
                  <li
                    key={ch.id}
                    onClick={() => setActiveChapter(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', borderRadius: '8px', cursor: 'pointer',
                      transition: 'all 0.2s', fontSize: '13px',
                      background: activeChapter === i ? 'rgba(147, 51, 234, 0.15)' : 'transparent',
                      color: activeChapter === i ? '#c084fc' : '#d6d3d1',
                      marginBottom: '2px',
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '5px',
                      background: activeChapter === i ? '#9333ea' : 'rgba(68, 64, 60, 0.5)',
                      color: activeChapter === i ? 'white' : '#a8a29e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, color: activeChapter === i ? '#c084fc' : '#d6d3d1', fontWeight: activeChapter === i ? 600 : 400 }}>
                      {ch.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#78716c' }}>{ch.estimatedMinutes}د</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </main>

      {/* Mobile Sticky CTA */}
      <div style={{
        display: 'flex', gap: '8px', position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', zIndex: 50,
        background: 'rgba(12, 10, 9, 0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(41, 37, 36, 0.6)',
      }}>
        {canRead ? (
          <a
            href={readUrl}
            target={readUrl.startsWith('http') ? '_blank' : undefined}
            rel={readUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', background: 'linear-gradient(135deg, #9333ea, #ec4899, #f59e0b)',
              color: 'white', fontSize: '14px', fontWeight: 700, border: 'none',
              borderRadius: '12px', cursor: 'pointer', textDecoration: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>{b.pdfUrl && !b.chapters?.length ? 'افتح PDF' : 'اقرأ الآن'}</span>
          </a>
        ) : (
          <div
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: 'rgba(68, 64, 60, 0.3)',
              color: '#78716c', fontSize: '14px', fontWeight: 600,
              border: '1px solid rgba(68, 64, 60, 0.5)',
              borderRadius: '12px',
            }}
          >
            📄 لا يوجد محتوى للقراءة
          </div>
        )}
        {b.pdfUrl && (
          <a
            href={b.pdfUrl}
            download
            style={{
              padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16, 185, 129, 0.1)', color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px',
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        )}
      </div>

      {/* Spacer for mobile CTA */}
      <div style={{ height: '80px' }} />
    </div>
  )
}
