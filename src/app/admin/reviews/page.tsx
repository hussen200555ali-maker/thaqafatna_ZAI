/**
 * 💬 طابور الاعتدال — /admin/reviews (كامل)
 */
'use client'
import { useState, useEffect } from 'react'

interface Review { id: number; rating: number; review: string; status: string; createdAt: string; user: { name: string }; book: { title: string } }

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => { fetchReviews() }, [tab])
  const fetchReviews = async () => { setLoading(true); try { const res = await fetch(`/api/admin/reviews?status=${tab}`); const d = await res.json(); setReviews(d.reviews || []) } catch { setReviews([]) } finally { setLoading(false) } }

  const moderate = async (id: number, action: 'approve' | 'reject') => {
    await fetch(`/api/admin/reviews/${id}/moderate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); fetchReviews()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>💬 طابور الاعتدال</h1>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {[{id:'pending',l:'⏳ بانتظار'},{id:'approved',l:'✅ موافق'},{id:'rejected',l:'❌ مرفوض'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid', borderColor: tab === t.id ? '#4f46e5' : '#e2e8f0', background: tab === t.id ? '#4f46e5' : 'white', color: tab === t.id ? 'white' : '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>{t.l}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ جاري التحميل...</div> :
         reviews.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>لا توجد مراجعات</div> :
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px' }}><strong>{r.user.name}</strong> على <strong>{r.book.title}</strong></div>
                <div style={{ fontSize: '12px', color: '#f59e0b' }}>⭐ {r.rating}</div>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>{r.review || '(لا يوجد نص)'}</p>
              {tab === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => moderate(r.id, 'approve')} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' }}>✓ موافقة</button>
                  <button onClick={() => moderate(r.id, 'reject')} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>✗ رفض</button>
                </div>
              )}
            </div>
          ))}
         </div>}
      </div>
    </div>
  )
}
