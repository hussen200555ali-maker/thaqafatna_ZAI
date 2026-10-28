'use client'
import { useState, useEffect } from 'react'

interface Category { id: number; name: string; icon: string; color: string; slug: string; isPublished: boolean }

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/book-categories').then(r => r.json()).then(d => { setCats(d.categories || []); setLoading(false) }).catch(() => setLoading(false)) }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>📂 التصنيفات</h1>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#','الأيقونة','الاسم','Slug','اللون','الحالة','إجراءات'].map(h => <th key={h} style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳</td></tr> :
               cats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: '20px' }}>{c.icon}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '12px 16px' }}><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{c.slug}</code></td>
                  <td style={{ padding: '12px 16px' }}><div style={{ width: '24px', height: '24px', borderRadius: '4px', background: c.color }} /></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: c.isPublished ? '#ecfdf5' : '#f1f5f9', color: c.isPublished ? '#065f46' : '#64748b' }}>{c.isPublished ? 'منشور' : 'مخفي'}</span></td>
                  <td style={{ padding: '12px 16px' }}><button style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>✏️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
