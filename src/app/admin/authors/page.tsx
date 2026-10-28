'use client'
import { useState, useEffect } from 'react'

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/books/authors').then(r => r.json()).then(d => { setAuthors(d.authors || []); setLoading(false) }).catch(() => setLoading(false)) }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>✍️ المؤلفون</h1>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['المؤلف','عدد الكتب','المشاهدات','التنزيلات','التقييم'].map(h => <th key={h} style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳</td></tr> :
               authors.map(a => (
                <tr key={a.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{a.booksCount}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{a.totalViews}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{a.totalDownloads}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>⭐ {a.avgRating?.toFixed(1) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
