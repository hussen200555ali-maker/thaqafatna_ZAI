/**
 * 📦 سجل الإصدارات — /admin/books/[id]/versions
 */
'use client'
import { useState, useEffect } from 'react'

export default function BookVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookId, setBookId] = useState<string>('')

  useEffect(() => { params.then(p => setBookId(p.id)) }, [params])
  useEffect(() => {
    if (!bookId) return
    fetch(`/api/admin/books/${bookId}/versions`).then(r => r.json()).then(d => { setVersions(d.versions || []); setLoading(false) }).catch(() => setLoading(false))
  }, [bookId])

  if (loading) return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>⏳ جاري التحميل...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>📦 سجل الإصدارات</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {versions.map(v => (
            <div key={v.id} style={{ background: 'white', border: v.isActive ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {v.isActive && <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: '#ecfdf5', color: '#065f46' }}>نشط</span>}
                  <strong>الإصدار {v.version}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>· {(v.pdfSize / 1024 / 1024).toFixed(1)} MB · {v.pdfPageCount} صفحة</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>📅 {new Date(v.uploadedAt).toLocaleDateString('ar-EG')} · بواسطة {v.uploader?.name || 'النظام'}</div>
                {v.notes && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>📝 {v.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }} title="عرض">👁️</button>
                <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }} title="تنزيل">⬇️</button>
                {!v.isActive && <button style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #f59e0b', background: '#fffbeb', cursor: 'pointer', color: '#92400e' }} title="استعادة">↩️</button>}
              </div>
            </div>
          ))}
          {versions.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>لا توجد إصدارات بعد</div>}
        </div>
        <div style={{ marginTop: '24px', border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>اسحب ملف PDF لإنشاء إصدار جديد</div>
        </div>
      </div>
    </div>
  )
}
