/**
 * 📦 سجل الإصدارات — /admin/books/[id]/versions
 *
 * المميزات:
 * - عرض كل إصدارات الكتاب
 * - رفع PDF جديد (drag & drop أو click)
 * - تنزيل إصدار
 * - استعادة إصدار سابق
 * - استخدام AdminLayout
 */

'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Upload, Download, Eye, RotateCcw, Loader2, FileText } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { LoadingState, ErrorState, EmptyState } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Version {
  id: number
  version: number
  pdfUrl: string
  pdfFileName: string
  pdfSize: number
  pdfPageCount: number
  isActive: boolean
  notes: string | null
  uploadedAt: string
  uploadedBy: string
  uploader?: { name: string | null }
}

const ADMIN_KEY = 'thaqafatna-admin-2026'

export default function BookVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [bookId, setBookId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { params.then(p => setBookId(p.id)) }, [params])

  const loadVersions = useCallback(() => {
    if (!bookId) return
    setLoading(true)
    fetch(`/api/admin/books/${bookId}/versions`)
      .then(r => r.json())
      .then(d => {
        setVersions(d.versions || [])
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [bookId])

  useEffect(() => { loadVersions() }, [loadVersions])

  // رفع PDF
  const handleUpload = useCallback(async (file: File) => {
    if (!bookId) return
    if (file.type !== 'application/pdf') {
      setUploadError('صيغة غير مدعومة. يجب أن يكون PDF')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('حجم الملف يتجاوز 50 MB')
      return
    }

    setUploading(true)
    setUploadError(null)

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

      // إعادة تحميل الإصدارات
      loadVersions()
      alert('✅ تم رفع PDF بنجاح')
    } catch (e: any) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }, [bookId, loadVersions])

  // Drag & Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <AdminLayout
      title="📦 سجل الإصدارات"
      subtitle={versions.length > 0 ? `${versions.length} إصدارات` : 'لا توجد إصدارات بعد'}
      actions={
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin/books">
            <ArrowRight className="h-4 w-4" />
            العودة للكتب
          </Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadVersions} />
      ) : (
        <div className="space-y-4">
          {/* الإصدارات */}
          {versions.length === 0 ? (
            <EmptyState
              icon="📦"
              title="لا توجد إصدارات بعد"
              description="ارفع أول PDF لإنشاء الإصدار الأول"
            />
          ) : (
            versions.map((v) => (
              <Card
                key={v.id}
                className={cn(
                  'p-5 transition-all',
                  v.isActive && 'border-r-4 border-r-emerald-500'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {v.isActive && (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                          نشط
                        </Badge>
                      )}
                      <span className="text-lg font-bold text-slate-900">
                        الإصدار {v.version}
                      </span>
                      <span className="text-xs text-slate-500">
                        · {formatBytes(v.pdfSize)} · {v.pdfPageCount} صفحة
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      📅 {new Date(v.uploadedAt).toLocaleDateString('ar-EG')}
                      {' · '}
                      بواسطة {v.uploader?.name || 'النظام'}
                    </div>
                    {v.notes && (
                      <div className="mt-2 text-sm text-slate-500">
                        📝 {v.notes}
                      </div>
                    )}
                    {v.pdfFileName && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <FileText className="h-3 w-3" />
                        {v.pdfFileName}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {v.pdfUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        aria-label="تنزيل"
                      >
                        <a href={v.pdfUrl} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {v.pdfUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        aria-label="عرض"
                      >
                        <a href={v.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {!v.isActive && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        aria-label="استعادة"
                        title="استعادة هذا الإصدار"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}

          {/* منطقة رفع PDF */}
          <Card className="p-6">
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 hover:border-primary hover:bg-slate-50'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                  <div className="text-base font-semibold text-slate-900">جاري رفع PDF...</div>
                  <div className="mt-1 text-sm text-slate-500">قد يستغرق ذلك دقيقة</div>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-slate-400" />
                  <div className="text-base font-semibold text-slate-900">
                    اسحب ملف PDF هنا
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    أو اضغط للاختيار · حد أقصى 50 MB · PDF فقط
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f)
                      e.target.value = '' // reset للسماح بإعادة رفع نفس الملف
                    }}
                  />
                </>
              )}
            </div>

            {uploadError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                ❌ {uploadError}
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}
