'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileShell } from '@/components/mobile/mobile-shell'

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

type TabId = 'about' | 'details' | 'chapters' | 'reviews'

export default function MobileBookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const [bookId, setBookId] = useState<number | null>(null)
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('about')
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

  const handleShare = async () => {
    if (!book) return
    const shareUrl = window.location.href
    const shareData = { title: book.title, text: `${book.title} — ${book.author}`, url: shareUrl }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch { return }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
    }
  }

  const getReadUrl = () => {
    if (!book) return '#'
    if (book.chapters && book.chapters.length > 0) return `/library/reader/${book.id}/${book.chapters[0].id}`
    if (book.pdfUrl) return `/library/reader/${book.id}/1`
    return '#'
  }
  const readUrl = getReadUrl()
  const canRead = readUrl !== '#'

  if (loading) {
    return (
      <MobileShell>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e', fontSize: '14px' }}>⏳ جاري التحميل...</div>
      </MobileShell>
    )
  }

  if (!book) {
    return (
      <MobileShell title="الكتاب غير موجود" showBack backHref="/m">
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px' }}>📭</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#a8a29e' }}>الكتاب غير موجود</div>
          <Link href="/m" style={{ color: '#c084fc', fontSize: '13px', textDecoration: 'none' }}>العودة للمكتبة ←</Link>
        </div>
      </MobileShell>
    )
  }

  const b = book
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'about', label: 'عن الكتاب' },
    { id: 'details', label: 'التفاصيل' },
    { id: 'chapters', label: 'الفصول', count: b.chapters.length },
    { id: 'reviews', label: 'المراجعات', count: b._count.reviews },
  ]

  return (
    <MobileShell hideBottomNav>
      {/* Hero with cover */}
      <div style={{
        position: 'relative', padding: '60px 16px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(147,51,234,0.12) 0%, transparent 100%)',
      }}>
        <div style={{
          width: '150px', height: '210px', margin: '0 auto 16px', borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), 0 8px 20px -6px rgba(147,51,234,0.4)',
        }}>
          {b.coverImage ? (
            <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a, #6366f1)', fontSize: '48px' }}>📚</div>
          )}
        </div>

        {/* Category badge */}
        <Link href={`/m/library/categories?cat=${encodeURIComponent(b.category.name)}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '100px',
          background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)',
          color: '#c084fc', fontSize: '11px', fontWeight: 600, textDecoration: 'none', marginBottom: '10px',
        }}>
          <span>{b.category.icon}</span><span>{b.category.name}</span>
        </Link>

        <h1 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.25, color: '#fff', margin: '0 0 6px', fontFamily: "'Cairo', sans-serif" }}>
          {b.title}
        </h1>

        <Link href={`/m/library/authors/${encodeURIComponent(b.author)}`} style={{ fontSize: '14px', color: '#c084fc', textDecoration: 'none' }}>
          {b.author}
        </Link>

        {/* Rating + stats */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '10px', fontSize: '12px', color: '#a8a29e', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: '#fbbf24' }}>⭐ {b.ratingAvg.toFixed(1)}</span>
            <span style={{ color: '#78716c' }}>({formatNumber(b.ratingCount)})</span>
          </span>
          <span style={{ color: '#44403c' }}>·</span>
          <span>👁️ {formatNumber(b.views)}</span>
          <span style={{ color: '#44403c' }}>·</span>
          <span>📥 {formatNumber(b.downloads)}</span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {b.pdfUrl && (
            <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>📄 PDF</span>
          )}
          {b.isFeatured && (
            <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>⭐ مميز</span>
          )}
          <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
            {b.pdfSize ? formatBytes(b.pdfSize) : '—'}
          </span>
        </div>
      </div>

      {/* Quick info chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '7px', padding: '0 16px 20px' }}>
        {[
          { icon: '📄', value: b.pages, label: 'صفحة' },
          { icon: '⏱️', value: `${b.readingTimeMin}د`, label: 'قراءة' },
          { icon: '📊', value: difficultyLabels[b.difficulty] || b.difficulty, label: 'الصعوبة' },
          { icon: '🌐', value: b.language === 'ar' ? 'عربي' : b.language, label: 'اللغة' },
        ].map((info, i) => (
          <div key={i} style={{
            padding: '10px 6px', borderRadius: '12px', textAlign: 'center',
            background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(41,37,36,0.6)',
          }}>
            <div style={{ fontSize: '15px' }}>{info.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4', marginTop: '3px' }}>{info.value}</div>
            <div style={{ fontSize: '9px', color: '#78716c' }}>{info.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(12,10,9,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(41,37,36,0.6)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', overflowX: 'auto' }} className="m-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px',
              background: tab === t.id ? 'rgba(147,51,234,0.15)' : 'transparent',
              color: tab === t.id ? '#c084fc' : '#78716c',
              border: tab === t.id ? '1px solid rgba(147,51,234,0.3)' : '1px solid transparent',
            }}>
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span style={{ fontSize: '10px', background: 'rgba(68,64,60,0.5)', padding: '1px 6px', borderRadius: '100px' }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px 16px 120px', minHeight: '50vh' }}>
        {tab === 'about' && (
          <div>
            <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#d6d3d1', margin: 0 }}>
              {b.description || 'لا يوجد وصف متاح لهذا الكتاب بعد.'}
            </p>
            {b.keywords && b.keywords.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>الكلمات المفتاحية:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {b.keywords.map((kw, i) => (
                    <span key={i} style={{ padding: '5px 11px', borderRadius: '8px', background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(68,64,60,0.4)', color: '#d6d3d1', fontSize: '12px' }}>#{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {[
              { label: 'الفئة', value: b.category.name },
              { label: 'اللغة', value: b.language === 'ar' ? 'العربية' : b.language === 'en' ? 'الإنجليزية' : b.language },
              { label: 'عدد الصفحات', value: `${b.pages} صفحة` },
              { label: 'وقت القراءة', value: `${b.readingTimeMin} دقيقة` },
              { label: 'الصعوبة', value: difficultyLabels[b.difficulty] || b.difficulty },
              { label: 'عدد الفصول', value: `${b.chapters.length} فصل` },
              { label: 'حجم الملف', value: b.pdfSize ? formatBytes(b.pdfSize) : '—' },
              { label: 'عدد الصفحات PDF', value: b.pdfPageCount ? `${b.pdfPageCount}` : '—' },
            ].map((info, i) => (
              <div key={i} style={{
                padding: '12px', borderRadius: '12px',
                background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(41,37,36,0.6)',
              }}>
                <div style={{ fontSize: '10px', color: '#78716c', marginBottom: '4px' }}>{info.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e7e5e4' }}>{info.value}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'chapters' && (
          <div>
            {b.chapters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#78716c' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div>
                <div style={{ fontSize: '13px' }}>لا توجد فصول مضافة</div>
                {canRead && <div style={{ fontSize: '11px', marginTop: '6px', color: '#a8a29e' }}>يمكنك فتح PDF مباشرة</div>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {b.chapters.map((ch, i) => (
                  <Link key={ch.id} href={`/library/reader/${b.id}/${ch.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                      borderRadius: '11px', background: 'rgba(28,25,23,0.5)', border: '1px solid rgba(41,37,36,0.6)',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                        background: 'rgba(147,51,234,0.15)', color: '#c084fc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700,
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e7e5e4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</div>
                        <div style={{ fontSize: '10px', color: '#78716c', marginTop: '2px' }}>{ch.estimatedMinutes} دقيقة</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="15 18 9 12 15 6" /></svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            {(!b.reviews || b.reviews.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#78716c' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '13px' }}>لا توجد مراجعات بعد</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>كن أول من يقيّم هذا الكتاب</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {b.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} style={{
                    padding: '14px', borderRadius: '12px',
                    background: 'rgba(28,25,23,0.4)', border: '1px solid rgba(41,37,36,0.6)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #9333ea, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0,
                      }}>{(review.user?.name || '?').charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e7e5e4' }}>{review.user?.name || 'مجهول'}</div>
                        <div style={{ fontSize: '10px', color: '#78716c' }}>{new Date(review.createdAt).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <div style={{ color: '#fbbf24', fontSize: '12px' }}>⭐ {review.rating}</div>
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#a8a29e', margin: 0 }}>{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA — فتح PDF / قراءة + تنزيل + مشاركة */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(50%)',
        maxWidth: '480px', width: '100%', zIndex: 50,
        background: 'rgba(12,10,9,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(41,37,36,0.7)',
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', gap: '8px',
      }}>
        {canRead ? (
          <a
            href={readUrl}
            target={readUrl.startsWith('http') ? '_blank' : undefined}
            rel={readUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', background: 'linear-gradient(135deg, #9333ea, #ec4899, #f59e0b)',
              backgroundSize: '200% 200%', color: 'white', fontSize: '14px', fontWeight: 700,
              border: 'none', borderRadius: '13px', cursor: 'pointer', textDecoration: 'none', minHeight: '48px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
            <span>{b.pdfUrl && !b.chapters?.length ? 'افتح PDF' : 'ابدأ القراءة'}</span>
          </a>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '13px', background: 'rgba(68,64,60,0.3)', color: '#78716c', fontSize: '13px', fontWeight: 600,
            border: '1px solid rgba(68,64,60,0.5)', borderRadius: '13px',
          }}>📄 لا يوجد محتوى للقراءة</div>
        )}
        {b.pdfUrl && (
          <a
            href={b.pdfUrl}
            download={b.pdfFileName || `${b.title}.pdf`}
            aria-label="تنزيل PDF"
            style={{
              width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16,185,129,0.12)', color: '#34d399',
              border: '1px solid rgba(16,185,129,0.3)', borderRadius: '13px', textDecoration: 'none', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </a>
        )}
        <button
          onClick={handleShare}
          aria-label="مشاركة"
          style={{
            width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: shared ? 'rgba(16,185,129,0.15)' : 'rgba(41,37,36,0.6)',
            color: shared ? '#34d399' : '#d6d3d1',
            border: shared ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(68,64,60,0.4)',
            borderRadius: '13px', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
        </button>
      </div>

      <style>{`.m-tabs::-webkit-scrollbar{display:none}.m-tabs{scrollbar-width:none}`}</style>
    </MobileShell>
  )
}
