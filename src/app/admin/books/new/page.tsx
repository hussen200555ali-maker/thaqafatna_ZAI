/**
 * ➕ كتاب جديد — /admin/books/new (5 تبويبات)
 */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewBookPage() {
  const router = useRouter()
  const [tab, setTab] = useState(1)
  const [form, setForm] = useState({
    title: '', author: '', description: '', categoryId: '', difficulty: 'medium',
    pages: 0, readingTimeMin: 15, language: 'ar', keywords: '',
    coverImage: '', pdfUrl: '', pdfFileName: '', status: 'draft',
  })

  const tabs = [
    { id: 1, label: 'البيانات', icon: '📝' },
    { id: 2, label: 'الغلاف', icon: '🖼️' },
    { id: 3, label: 'الملف (PDF)', icon: '📄' },
    { id: 4, label: 'النشر', icon: '📢' },
    { id: 5, label: 'مراجعة', icon: '✅' },
  ]

  const handleSubmit = async () => {
    const res = await fetch('/api/books', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { const data = await res.json(); router.push('/admin/books') }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#475569' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontFamily: 'Cairo, sans-serif' }}>➕ كتاب جديد</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>الخطوة {tab} من 5</p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600, border: 'none', borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent', color: tab === t.id ? '#4f46e5' : '#94a3b8', background: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-2px' }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* Tab 1: Data */}
        {tab === 1 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={labelStyle}>عنوان الكتاب *</label><input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="مقدمة ابن خلدون" /></div>
            <div><label style={labelStyle}>المؤلف *</label><input style={inputStyle} value={form.author} onChange={e => setForm({...form, author: e.target.value})} placeholder="عبد الرحمن بن خلدون" /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>الوصف</label><textarea style={{ ...inputStyle, minHeight: '80px' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><label style={labelStyle}>التصنيف *</label><select style={inputStyle} value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}><option value="">اختر...</option><option value="1">📖 الأدب العربي</option><option value="2">🕌 الكتب الدينية</option><option value="3">📜 التاريخ والتراث</option></select></div>
            <div><label style={labelStyle}>الصعوبة</label><select style={inputStyle} value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div>
            <div><label style={labelStyle}>عدد الصفحات</label><input type="number" style={inputStyle} value={form.pages} onChange={e => setForm({...form, pages: parseInt(e.target.value) || 0})} /></div>
            <div><label style={labelStyle}>وقت القراءة (دقيقة)</label><input type="number" style={inputStyle} value={form.readingTimeMin} onChange={e => setForm({...form, readingTimeMin: parseInt(e.target.value) || 15})} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>الكلمات المفتاحية (مفصولة بفواصل)</label><input style={inputStyle} value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="تاريخ, اجتماع, فلسفة" /></div>
          </div>
        )}

        {/* Tab 2: Cover */}
        {tab === 2 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>اسحب صورة الغلاف هنا</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>JPG, PNG, WebP · حد أقصى 5 MB</div>
            </div>
            <div style={{ marginTop: '16px' }}><label style={labelStyle}>أو الصق رابط صورة</label><input style={inputStyle} value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} placeholder="https://..." /></div>
          </div>
        )}

        {/* Tab 3: PDF */}
        {tab === 3 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>اسحب ملف PDF هنا</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>حد أقصى 50 MB · PDF فقط</div>
            </div>
          </div>
        )}

        {/* Tab 4: Publishing */}
        {tab === 4 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <label style={labelStyle}>حالة النشر</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{v:'draft',l:'📝 مسودة'},{v:'published',l:'✅ منشور'},{v:'archived',l:'📦 مؤرشف'}].map(o => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px', border: form.status === o.v ? '2px solid #4f46e5' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input type="radio" checked={form.status === o.v} onChange={() => setForm({...form, status: o.v})} /> {o.l}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Review */}
        {tab === 5 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>✅ مراجعة البيانات</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['العنوان', form.title],['المؤلف', form.author],['التصنيف', form.categoryId],['الصعوبة', form.difficulty],['الصفحات', String(form.pages)],['الحالة', form.status]].map(([k,v]) => (
                <div key={k} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>{k}: </span><strong style={{ fontSize: '13px' }}>{v || '—'}</strong></div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button onClick={() => tab > 1 && setTab(tab - 1)} disabled={tab === 1} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: tab === 1 ? 'not-allowed' : 'pointer', opacity: tab === 1 ? 0.5 : 1 }}>→ السابق</button>
          {tab < 5 ? (
            <button onClick={() => setTab(tab + 1)} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', background: '#4f46e5', color: 'white', cursor: 'pointer' }}>التالي ←</button>
          ) : (
            <button onClick={handleSubmit} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' }}>✅ حفظ ونشر</button>
          )}
        </div>
      </div>
    </div>
  )
}
