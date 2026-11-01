/**
 * ➕ كتاب جديد — /admin/books/new
 * تصميم احترافي بـ 5 تبويبات + رفع فعلي للغلاف و PDF
 *
 * التدفّق:
 * 1. البيانات → POST /api/books (status=draft) → يُعيد bookId
 * 2. الغلاف → POST /api/admin/books/[id]/upload-cover
 * 3. PDF → POST /api/admin/books/[id]/upload-pdf
 * 4. النشر → PATCH /api/books/[id] { status: 'published' }
 * 5. مراجعة → عرض البيانات النهائية
 */
'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BookForm {
  title: string
  author: string
  description: string
  categoryId: string
  difficulty: string
  pages: number
  readingTimeMin: number
  language: string
  keywords: string
  status: string
  coverImage: string
  pdfUrl: string
  pdfFileName: string
  pdfSize: number
}

interface UploadedFile {
  url: string
  fileName: string
  size: number
}

const ADMIN_KEY = 'thaqafatna-admin-2026' // نفس القيمة في route.ts

export default function NewBookPage() {
  const router = useRouter()
  const [tab, setTab] = useState(1)
  const [bookId, setBookId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pdfUploaded, setPdfUploaded] = useState<UploadedFile | null>(null)

  const [form, setForm] = useState<BookForm>({
    title: '', author: '', description: '', categoryId: '',
    difficulty: 'medium', pages: 0, readingTimeMin: 15, language: 'ar',
    keywords: '', status: 'draft', coverImage: '', pdfUrl: '',
    pdfFileName: '', pdfSize: 0,
  })

  const coverInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState<'cover' | 'pdf' | null>(null)

  const tabs = [
    { id: 1, label: 'البيانات', icon: '📝', desc: 'العنوان والمؤلف' },
    { id: 2, label: 'الغلاف', icon: '🖼️', desc: 'صورة الغلاف' },
    { id: 3, label: 'الملف (PDF)', icon: '📄', desc: 'ملف PDF' },
    { id: 4, label: 'النشر', icon: '📢', desc: 'حالة النشر' },
    { id: 5, label: 'مراجعة', icon: '✅', desc: 'مراجعة نهائية' },
  ]

  // Step 1: إنشاء الكتاب كـ draft للحصول على bookId
  const createDraftBook = async (): Promise<boolean> => {
    if (!form.title || !form.author || !form.categoryId) {
      setError('الرجاء ملء: العنوان، المؤلف، التصنيف')
      return false
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'draft' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const newId = data.book?.id || data.id
      if (!newId) throw new Error('لم يُرجع الـ API معرّف الكتاب')
      setBookId(newId)
      return true
    } catch (e: any) {
      setError(e.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Tab navigation
  const goNext = async () => {
    if (tab === 1) {
      // إنشاء مسودة أولًا
      const ok = bookId ? true : await createDraftBook()
      if (ok) setTab(2)
    } else if (tab < 5) {
      setTab(tab + 1)
    }
  }
  const goPrev = () => tab > 1 && setTab(tab - 1)

  // Step 2: رفع الغلاف
  const handleCoverUpload = useCallback(async (file: File) => {
    if (!bookId) {
      setError('يجب حفظ بيانات الكتاب أولًا')
      return
    }
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError('صيغة غير مدعومة. استخدم: JPG, PNG, WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يتجاوز 5 MB')
      return
    }
    setUploadingCover(true)
    setError(null)
    try {
      // معاينة فورية
      const preview = URL.createObjectURL(file)
      setCoverPreview(preview)

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/books/${bookId}/upload-cover`, {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_KEY },
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setForm(f => ({ ...f, coverImage: data.coverImage || data.url }))
    } catch (e: any) {
      setError(e.message)
      setCoverPreview(null)
    } finally {
      setUploadingCover(false)
    }
  }, [bookId])

  // Step 3: رفع PDF
  const handlePdfUpload = useCallback(async (file: File) => {
    if (!bookId) {
      setError('يجب حفظ بيانات الكتاب أولًا')
      return
    }
    if (file.type !== 'application/pdf') {
      setError('صيغة غير مدعومة. يجب أن يكون PDF')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('حجم الملف يتجاوز 50 MB')
      return
    }
    setUploadingPdf(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/books/${bookId}/upload-pdf`, {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_KEY },
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setPdfUploaded({
        url: data.pdfUrl,
        fileName: data.pdfFileName,
        size: data.pdfSize,
      })
      setForm(f => ({
        ...f,
        pdfUrl: data.pdfUrl,
        pdfFileName: data.pdfFileName,
        pdfSize: data.pdfSize,
      }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploadingPdf(false)
    }
  }, [bookId])

  // Drag & Drop handlers
  const handleDrop = (e: React.DragEvent, type: 'cover' | 'pdf') => {
    e.preventDefault()
    setDragActive(null)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (type === 'cover') handleCoverUpload(file)
    else handlePdfUpload(file)
  }

  // Step 4: نشر الكتاب
  const publishBook = async (status: string) => {
    if (!bookId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('فشل النشر')
      setForm(f => ({ ...f, status }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Final submit
  const handleSubmit = async () => {
    if (bookId) {
      router.push('/admin/books')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    marginBottom: '6px', color: '#475569',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/admin/books" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
            → العودة لقائمة الكتب
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontFamily: 'Cairo, sans-serif', marginTop: '8px' }}>
            ➕ كتاب جديد
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            الخطوة {tab} من 5 · {tabs[tab - 1]?.desc}
            {bookId && <span style={{ marginRight: '12px', color: '#10b981' }}>· ✅ مُنشأ (#{bookId})</span>}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', background: 'white', borderRadius: '12px 12px 0 0', padding: '0 8px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => (t.id <= (bookId ? 5 : 1) ? setTab(t.id) : null)}
              style={{
                padding: '14px 20px', fontSize: '13px', fontWeight: 600,
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent',
                color: tab === t.id ? '#4f46e5' : '#94a3b8',
                background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                marginBottom: '-2px', transition: 'all 0.15s',
                opacity: t.id <= (bookId ? 5 : 1) ? 1 : 0.4,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: tab === t.id ? '#4f46e5' : '#e2e8f0',
                  color: tab === t.id ? 'white' : '#94a3b8',
                  fontSize: '11px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.id}</span>
                {t.icon} {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', padding: '24px' }}>

          {/* Tab 1: Data */}
          {tab === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>عنوان الكتاب *</label>
                <input style={inputStyle} value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مقدمة ابن خلدون" />
              </div>
              <div>
                <label style={labelStyle}>المؤلف *</label>
                <input style={inputStyle} value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  placeholder="عبد الرحمن بن خلدون" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>الوصف</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر للكتاب..." />
              </div>
              <div>
                <label style={labelStyle}>التصنيف *</label>
                <select style={inputStyle} value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">اختر...</option>
                  <option value="1">📖 الأدب العربي</option>
                  <option value="2">🕌 الكتب الدينية</option>
                  <option value="3">📜 التاريخ والتراث</option>
                  <option value="4">🔬 العلوم والمعرفة</option>
                  <option value="5">🌍 الجغرافيا والرحلات</option>
                  <option value="6">🎨 الفنون والآداب</option>
                  <option value="7">🧸 أدب الأطفال</option>
                  <option value="8">🌱 التنمية البشرية</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>الصعوبة</label>
                <select style={inputStyle} value={form.difficulty}
                  onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">صعب</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>عدد الصفحات</label>
                <input type="number" style={inputStyle} value={form.pages || ''}
                  onChange={e => setForm({ ...form, pages: parseInt(e.target.value) || 0 })}
                  placeholder="412" />
              </div>
              <div>
                <label style={labelStyle}>وقت القراءة (دقيقة)</label>
                <input type="number" style={inputStyle} value={form.readingTimeMin || ''}
                  onChange={e => setForm({ ...form, readingTimeMin: parseInt(e.target.value) || 15 })}
                  placeholder="65" />
              </div>
              <div>
                <label style={labelStyle}>اللغة</label>
                <select style={inputStyle} value={form.language}
                  onChange={e => setForm({ ...form, language: e.target.value })}>
                  <option value="ar">العربية</option>
                  <option value="en">الإنجليزية</option>
                  <option value="fr">الفرنسية</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>الكلمات المفتاحية (مفصولة بفواصل)</label>
                <input style={inputStyle} value={form.keywords}
                  onChange={e => setForm({ ...form, keywords: e.target.value })}
                  placeholder="تاريخ, اجتماع, فلسفة, عمران" />
              </div>
            </div>
          )}

          {/* Tab 2: Cover */}
          {tab === 2 && (
            <div>
              {!bookId && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ يجب حفظ بيانات الكتاب في التبويب الأول أولًا
                </div>
              )}

              {/* Drop Zone */}
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive('cover') }}
                onDragLeave={() => setDragActive(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'cover')}
                onClick={() => coverInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive === 'cover' ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: bookId ? 'pointer' : 'not-allowed',
                  background: dragActive === 'cover' ? '#eef2ff' : '#fafafa',
                  transition: 'all 0.15s',
                  opacity: bookId ? 1 : 0.6,
                }}
              >
                {coverPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img src={coverPreview} alt="معاينة الغلاف" style={{ maxWidth: '180px', maxHeight: '260px', borderRadius: '8px', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)' }} />
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✅ تم رفع الغلاف بنجاح</div>
                    <button onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click() }} style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
                      تغيير الصورة
                    </button>
                  </div>
                ) : uploadingCover ? (
                  <div>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>جاري رفع الغلاف...</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>اسحب صورة الغلاف هنا</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      أو اضغط للاختيار · JPG, PNG, WebP · حد أقصى 5 MB
                    </div>
                  </>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCoverUpload(f)
                  }}
                />
              </div>

              {/* URL Fallback */}
              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>أو الصق رابط صورة</label>
                <input style={inputStyle} value={form.coverImage}
                  onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..." />
                {form.coverImage && !coverPreview && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }}>✅ سيتم استخدام الرابط</div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: PDF */}
          {tab === 3 && (
            <div>
              {!bookId && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ يجب حفظ بيانات الكتاب في التبويب الأول أولًا
                </div>
              )}

              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive('pdf') }}
                onDragLeave={() => setDragActive(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'pdf')}
                onClick={() => pdfInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive === 'pdf' ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: bookId ? 'pointer' : 'not-allowed',
                  background: dragActive === 'pdf' ? '#eef2ff' : '#fafafa',
                  transition: 'all 0.15s',
                  opacity: bookId ? 1 : 0.6,
                }}
              >
                {pdfUploaded ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '40px' }}>📄</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{pdfUploaded.fileName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {(pdfUploaded.size / 1024 / 1024).toFixed(2)} MB · ✅ تم الرفع
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); pdfInputRef.current?.click() }} style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}>
                      استبدال الملف
                    </button>
                  </div>
                ) : uploadingPdf ? (
                  <div>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>جاري رفع PDF...</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      قد يستغرق ذلك دقيقة حسب حجم الملف
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>اسحب ملف PDF هنا</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      أو اضغط للاختيار · حد أقصى 50 MB · PDF فقط
                    </div>
                  </>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handlePdfUpload(f)
                  }}
                />
              </div>

              {pdfUploaded && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', fontSize: '12px', color: '#065f46' }}>
                  ✅ الملف جاهز · سيتمكن القرّاء من تنزيله فور نشر الكتاب
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Publishing */}
          {tab === 4 && (
            <div>
              <label style={labelStyle}>حالة النشر</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
                {[
                  { v: 'draft', l: '📝 مسودة', d: 'لن يظهر للقرّاء', c: '#64748b' },
                  { v: 'published', l: '✅ منشور', d: 'يظهر للجميع', c: '#10b981' },
                  { v: 'archived', l: '📦 مؤرشف', d: 'مخفي نهائيًا', c: '#ef4444' },
                ].map(o => (
                  <label
                    key={o.v}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '4px',
                      padding: '16px', border: form.status === o.v ? `2px solid ${o.c}` : '1px solid #e2e8f0',
                      borderRadius: '10px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s',
                      background: form.status === o.v ? '#fafafa' : 'white',
                    }}
                  >
                    <input type="radio" name="status" checked={form.status === o.v}
                      onChange={() => setForm({ ...form, status: o.v })}
                      style={{ display: 'none' }} />
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>{o.l}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{o.d}</span>
                  </label>
                ))}
              </div>

              {form.status === 'published' && !pdfUploaded && !form.pdfUrl && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '12px', color: '#92400e' }}>
                  ⚠️ لم ترفع ملف PDF بعد. الكتاب سيُنشر بدون ملف PDF.
                </div>
              )}

              {form.status === 'published' && (
                <button
                  onClick={() => publishBook('published')}
                  disabled={saving}
                  style={{
                    marginTop: '16px', padding: '12px 24px', background: '#10b981', color: 'white',
                    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? '⏳ جاري النشر...' : '🚀 انشر الكتاب الآن'}
                </button>
              )}
            </div>
          )}

          {/* Tab 5: Review */}
          {tab === 5 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>✅ مراجعة البيانات</h3>

              {coverPreview && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <img src={coverPreview} alt="الغلاف" style={{ maxWidth: '140px', borderRadius: '8px', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['العنوان', form.title],
                  ['المؤلف', form.author],
                  ['التصنيف', ['—', '📖 الأدب العربي', '🕌 الكتب الدينية', '📜 التاريخ والتراث', '🔬 العلوم', '🌍 الجغرافيا', '🎨 الفنون', '🧸 الأطفال', '🌱 تنمية'][parseInt(form.categoryId)] || '—'],
                  ['الصعوبة', { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }[form.difficulty] || '—'],
                  ['عدد الصفحات', form.pages ? `${form.pages} صفحة` : '—'],
                  ['وقت القراءة', form.readingTimeMin ? `${form.readingTimeMin} دقيقة` : '—'],
                  ['اللغة', { ar: 'العربية', en: 'الإنجليزية', fr: 'الفرنسية' }[form.language] || '—'],
                  ['الحالة', { draft: '📝 مسودة', published: '✅ منشور', archived: '📦 مؤرشف' }[form.status] || '—'],
                  ['الغلاف', coverPreview || form.coverImage ? '✅ مرفوع' : '❌ غير مرفوع'],
                  ['PDF', pdfUploaded ? `✅ ${pdfUploaded.fileName}` : '❌ غير مرفوع'],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{k}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
          <button
            onClick={goPrev}
            disabled={tab === 1}
            style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid #e2e8f0', background: 'white', color: '#475569',
              cursor: tab === 1 ? 'not-allowed' : 'pointer', opacity: tab === 1 ? 0.5 : 1,
            }}
          >
            → السابق
          </button>

          {tab < 5 ? (
            <button
              onClick={goNext}
              disabled={saving}
              style={{
                padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                border: 'none', background: '#4f46e5', color: 'white',
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '⏳ جاري الحفظ...' : tab === 1 ? '💾 حفظ ومتابعة' : 'التالي ←'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                border: 'none', background: '#10b981', color: 'white', cursor: 'pointer',
              }}
            >
              ✅ انتقل لقائمة الكتب
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
