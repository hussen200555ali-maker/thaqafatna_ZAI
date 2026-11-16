'use client'

import Link from 'next/link'

/**
 * 📚 بطاقات الكتب للموبايل — ثلاثة أنماط
 *
 * - MobileBookCardCarousel: بطاقة عمودية لتمرير أفقي (cover + title)
 * - MobileBookRow: صف أفقي للقوائم (cover + title + author + meta)
 * - MobileBookCardGrid: بطاقة مدمّجة لشبكة عمودين
 *
 * جميعها: مناطق لمس كاملة، RTL، تدرّج احتياطي للغلاف، شارة PDF.
 */

export interface BookLite {
  id: number
  title: string
  author: string
  coverImage?: string
  pdfUrl?: string | null
  ratingAvg: number
  views: number
  downloads: number
  isFeatured?: boolean
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function CoverImg({ src, title, size }: { src?: string; title: string; size: { w: number; h: number } }) {
  if (src) {
    return (
      <img
        src={src} alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
    )
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a, #6366f1)',
      fontSize: size.w > 120 ? '40px' : '22px',
    }}>📚</div>
  )
}

/** بطاقة لتمرير أفقي — cover 2:3 + عنوان + مؤلف + تقييم */
export function MobileBookCardCarousel({ book, width = 132 }: { book: BookLite; width?: number }) {
  return (
    <Link href={`/m/library/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: `${width}px` }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px', boxShadow: '0 8px 20px -8px rgba(0,0,0,0.6)' }}>
        <CoverImg src={book.coverImage} title={book.title} size={{ w: width, h: width * 1.5 }} />
        {book.pdfUrl && (
          <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>PDF</span>
        )}
        {book.isFeatured && !book.pdfUrl && (
          <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(245,158,11,0.9)', color: '#1c1917', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>⭐</span>
        )}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e7e5e4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{book.title}</div>
      <div style={{ fontSize: '10px', color: '#78716c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>{book.author}</div>
      <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '3px' }}>⭐ {book.ratingAvg.toFixed(1)}</div>
    </Link>
  )
}

/** صف أفقي للقوائم — cover صغير + عنوان + مؤلف + meta */
export function MobileBookRow({ book, rank }: { book: BookLite; rank?: number }) {
  return (
    <Link href={`/m/library/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
        borderRadius: '14px', background: 'rgba(28,25,23,0.5)',
        border: '1px solid rgba(41,37,36,0.6)', transition: 'border-color 0.2s',
      }}>
        {rank !== undefined && (
          <div style={{
            fontSize: '20px', fontWeight: 800, color: rank <= 3 ? '#c084fc' : '#44403c',
            width: '24px', textAlign: 'center', flexShrink: 0, fontFamily: "'Cairo', sans-serif",
          }}>{rank}</div>
        )}
        <div style={{
          width: '44px', height: '62px', borderRadius: '5px', overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
        }}>
          <CoverImg src={book.coverImage} title={book.title} size={{ w: 44, h: 62 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e7e5e4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
          <div style={{ fontSize: '12px', color: '#78716c', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.author}</div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '10px', marginTop: '5px' }}>
            <span style={{ color: '#fbbf24' }}>⭐ {book.ratingAvg.toFixed(1)}</span>
            <span style={{ color: '#34d399' }}>📥 {formatCount(book.downloads)}</span>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>
    </Link>
  )
}

/** بطاقة مدمّجة لشبكة عمودين — cover + title + author */
export function MobileBookCardGrid({ book }: { book: BookLite }) {
  return (
    <Link href={`/m/library/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', marginBottom: '6px', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.6)' }}>
        <CoverImg src={book.coverImage} title={book.title} size={{ w: 100, h: 150 }} />
        {book.pdfUrl && (
          <span style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px' }}>PDF</span>
        )}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e7e5e4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
      <div style={{ fontSize: '10px', color: '#78716c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>⭐ {book.ratingAvg.toFixed(1)}</div>
    </Link>
  )
}

/** شارة تصنيف */
export function CategoryChip({ name, icon, color, count }: { name: string; icon: string; color: string; count?: number }) {
  return (
    <Link href={`/m/library/categories?cat=${encodeURIComponent(name)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        position: 'relative', padding: '14px', borderRadius: '14px', overflow: 'hidden',
        background: color || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white', minHeight: '84px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '24px' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{name}</div>
          {count !== undefined && <div style={{ fontSize: '10px', opacity: 0.85 }}>{count} كتاب</div>}
        </div>
      </div>
    </Link>
  )
}
