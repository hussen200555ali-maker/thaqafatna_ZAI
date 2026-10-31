/**
 * 📚 إدارة الكتب — /admin/books
 * قائمة بكل الكتب مع إجراءات سريعة
 */
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  status: string
  isPublished: boolean
  createdAt: string
  pdfUrl?: string | null
  _count?: { chapters: number; reviews: number }
}

interface ApiResponse {
  books?: Book[]
  error?: string
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/admin/books')
      .then(r => r.json() as Promise<ApiResponse>)
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else if (Array.isArray(d.books)) {
          setBooks(d.books)
        } else if (Array.isArray(d as unknown as Book[])) {
          // احتياطي لو الـ API يرجّع array مباشرة
          setBooks(d as unknown as Book[])
        }
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // تصفية
  const filtered = books.filter(b => {
    const matchesSearch = !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#64748b' }}>
        ⏳ جاري تحميل الكتب...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '20px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>❌ خطأ في تحميل الكتب</h2>
            <p style={{ fontSize: '14px' }}>{error}</p>
            <p style={{ fontSize: '12px', marginTop: '12px', color: '#64748b' }}>
              تأكد أن `/api/admin/books` يعمل ويرجّع array من الكتب.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontFamily: 'Cairo, sans-serif' }}>📚 إدارة الكتب</h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>{books.length} كتاب في المكتبة</p>
          </div>
          <Link
            href="/admin/books/new"
            style={{
              background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}
          >
            ➕ كتاب جديد
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 ابحث بالعنوان أو المؤلف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '14px', background: 'white',
            }}
          >
            <option value="all">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="in_review">قيد المراجعة</option>
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>

        {/* Books Table */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>لا توجد كتب مطابقة</p>
            <Link href="/admin/books/new" style={{ color: '#4f46e5', fontSize: '14px', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
              ➕ أضف كتابًا جديدًا
            </Link>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>العنوان</th>
                  <th style={thStyle}>المؤلف</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}>الفصول</th>
                  <th style={thStyle}>تاريخ الإضافة</th>
                  <th style={thStyle}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book, i) => (
                  <tr key={book.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>
                      {book.title}
                      {book.pdfUrl && <span style={{ marginRight: '8px', fontSize: '11px' }}>📄 PDF</span>}
                    </td>
                    <td style={tdStyle}>{book.author}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={book.status} isPublished={book.isPublished} />
                    </td>
                    <td style={tdStyle}>{book._count?.chapters ?? 0}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(book.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td style={tdStyle}>
                      <Link
                        href={`/admin/books/${book.id}/versions`}
                        style={{ color: '#4f46e5', fontSize: '12px', textDecoration: 'none', marginRight: '8px' }}
                      >
                        الإصدارات →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '24px' }}>
          <Link href="/admin" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>
            ← العودة للوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'right', fontSize: '12px',
  fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px', fontSize: '14px', color: '#475569',
}

function StatusBadge({ status, isPublished }: { status: string; isPublished: boolean }) {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: '#f1f5f9', color: '#64748b', label: 'مسودة' },
    in_review: { bg: '#fffbeb', color: '#f59e0b', label: 'قيد المراجعة' },
    published: { bg: '#ecfdf5', color: '#10b981', label: 'منشور' },
    archived: { bg: '#fef2f2', color: '#dc2626', label: 'مؤرشف' },
  }
  const c = colors[status] || colors.draft
  return (
    <span style={{
      background: c.bg, color: c.color, padding: '4px 10px',
      borderRadius: '12px', fontSize: '11px', fontWeight: 600,
    }}>
      {c.label}{isPublished && status === 'published' && ' ✓'}
    </span>
  )
}
