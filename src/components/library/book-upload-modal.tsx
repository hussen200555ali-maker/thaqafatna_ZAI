'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface Book {
  id: number
  title: string
  author: string
  pdfUrl: string
  pdfFileName: string
  pdfSize: number
  pdfPageCount: number
  coverImage: string
  coverImageFileName: string
  coverImageSize: number
  contentType: string
  uploadedAt: string | null
}

interface BookUploadModalProps {
  book: Book
  onClose: () => void
  onUpdated: () => void
}

const ADMIN_KEY = 'thaqafatna-admin-2026'
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export function BookUploadModal({ book, onClose, onUpdated }: BookUploadModalProps) {
  const [pdfUploading, setPdfUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [pdfProgress, setPdfProgress] = useState(0)
  const [coverProgress, setCoverProgress] = useState(0)
  const [dragOver, setDragOver] = useState<'pdf' | 'cover' | null>(null)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const uploadPdf = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({ title: '❌ خطأ', description: 'يجب أن يكون الملف PDF', variant: 'destructive' })
      return
    }
    if (file.size > MAX_PDF_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(2)
      toast({ title: '❌ حجم كبير', description: `حجم الملف ${mb} MB يتجاوز الحد 50 MB`, variant: 'destructive' })
      return
    }

    setPdfUploading(true)
    setPdfProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // استخدام XMLHttpRequest لتتبّع التقدّم
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/admin/books/${book.id}/upload-pdf`)
      xhr.setRequestHeader('x-admin-key', ADMIN_KEY)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100
          setPdfProgress(pct)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          toast({
            title: '✅ تم رفع PDF',
            description: `${file.name} (${formatBytes(file.size)})`,
          })
          onUpdated()
        } else {
          const err = JSON.parse(xhr.responseText || '{}')
          toast({ title: '❌ فشل الرفع', description: err.error || 'خطأ غير معروف', variant: 'destructive' })
        }
        setPdfUploading(false)
        setPdfProgress(0)
      }

      xhr.onerror = () => {
        toast({ title: '❌ خطأ شبكي', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
        setPdfUploading(false)
        setPdfProgress(0)
      }

      xhr.send(formData)
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
      setPdfUploading(false)
      setPdfProgress(0)
    }
  }, [book.id, onUpdated, toast])

  const uploadCover = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: '❌ خطأ', description: 'صيغة الصورة غير مدعومة. استخدم JPG, PNG, WebP, GIF', variant: 'destructive' })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: '❌ حجم كبير', description: 'حجم الصورة يتجاوز 5 MB', variant: 'destructive' })
      return
    }

    setCoverUploading(true)
    setCoverProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/admin/books/${book.id}/upload-cover`)
      xhr.setRequestHeader('x-admin-key', ADMIN_KEY)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setCoverProgress((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({ title: '✅ تم رفع الغلاف', description: file.name })
          onUpdated()
        } else {
          const err = JSON.parse(xhr.responseText || '{}')
          toast({ title: '❌ فشل', description: err.error, variant: 'destructive' })
        }
        setCoverUploading(false)
        setCoverProgress(0)
      }

      xhr.onerror = () => {
        toast({ title: '❌ خطأ شبكي', variant: 'destructive' })
        setCoverUploading(false)
        setCoverProgress(0)
      }

      xhr.send(formData)
    } catch (e: any) {
      toast({ title: '❌ خطأ', description: e.message, variant: 'destructive' })
      setCoverUploading(false)
      setCoverProgress(0)
    }
  }, [book.id, onUpdated, toast])

  const deletePdf = async () => {
    if (!confirm('هل تريد حذف ملف PDF؟')) return
    try {
      const res = await fetch(`/api/admin/books/${book.id}/upload-pdf`, {
        method: 'DELETE',
        headers: { 'x-admin-key': ADMIN_KEY },
      })
      if (res.ok) {
        toast({ title: '🗑️ تم حذف PDF' })
        onUpdated()
      }
    } catch (e: any) {
      toast({ title: '❌ فشل', description: e.message, variant: 'destructive' })
    }
  }

  const deleteCover = async () => {
    if (!confirm('هل تريد حذف صورة الغلاف؟')) return
    try {
      const res = await fetch(`/api/admin/books/${book.id}/upload-cover`, {
        method: 'DELETE',
        headers: { 'x-admin-key': ADMIN_KEY },
      })
      if (res.ok) {
        toast({ title: '🗑️ تم حذف الغلاف' })
        onUpdated()
      }
    } catch (e: any) {
      toast({ title: '❌ فشل', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-indigo-500 to-purple-600 text-white p-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">📤 رفع الملفات</h2>
                <p className="text-sm opacity-90 mt-1">{book.title}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* ===== رفع PDF ===== */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  <span>📄</span> ملف PDF
                </h3>
                {book.pdfUrl && (
                  <button
                    onClick={deletePdf}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    🗑️ حذف
                  </button>
                )}
              </div>

              {book.pdfUrl ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">
                        {book.pdfFileName || 'ملف PDF'}
                      </p>
                      <div className="text-xs text-stone-500 mt-1 flex gap-3 flex-wrap">
                        <span>💾 {formatBytes(book.pdfSize)}</span>
                        <span>📑 {book.pdfPageCount} صفحة</span>
                        {book.uploadedAt && (
                          <span>📅 {new Date(book.uploadedAt).toLocaleDateString('ar-EG')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className="mt-3 w-full py-2 bg-white border-2 border-dashed border-stone-300 rounded-lg text-sm text-stone-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    🔄 استبدال الملف
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('pdf') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(null)
                    const file = e.dataTransfer.files[0]
                    if (file) uploadPdf(file)
                  }}
                  onClick={() => pdfInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver === 'pdf' ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-medium text-stone-700">اسحب ملف PDF هنا</p>
                  <p className="text-xs text-stone-500 mt-1">أو اضغط للاختيار · حد أقصى 50 MB</p>
                </div>
              )}

              {pdfUploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-stone-600 mb-1">
                    <span>جاري الرفع...</span>
                    <span>{Math.round(pdfProgress)}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-indigo-500 to-purple-600 h-full transition-all"
                      style={{ width: `${pdfProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadPdf(file)
                  e.target.value = ''
                }}
              />
            </section>

            {/* ===== رفع صورة الغلاف ===== */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-stone-800 flex items-center gap-2">
                  <span>🖼️</span> صورة الغلاف
                </h3>
                {book.coverImage && (
                  <button
                    onClick={deleteCover}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    🗑️ حذف
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {/* معاينة الغلاف */}
                <div className="w-24 h-32 flex-shrink-0">
                  {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg flex items-center justify-center text-3xl">
                      📕
                    </div>
                  )}
                </div>

                {/* منطقة الرفع */}
                <div className="flex-1">
                  {book.coverImage && book.coverImageFileName ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-stone-800 truncate">{book.coverImageFileName}</p>
                      <p className="text-xs text-stone-500 mt-1">{formatBytes(book.coverImageSize)}</p>
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        🔄 استبدال الصورة
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver('cover') }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(null)
                        const file = e.dataTransfer.files[0]
                        if (file) uploadCover(file)
                      }}
                      onClick={() => coverInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${
                        dragOver === 'cover' ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300 hover:border-indigo-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">🖼️</div>
                      <p className="text-xs text-stone-600">اسحب صورة هنا</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">JPG · PNG · WebP · 5 MB</p>
                    </div>
                  )}
                </div>
              </div>

              {coverUploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-stone-600 mb-1">
                    <span>جاري رفع الصورة...</span>
                    <span>{Math.round(coverProgress)}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-emerald-500 to-teal-600 h-full transition-all"
                      style={{ width: `${coverProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadCover(file)
                  e.target.value = ''
                }}
              />
            </section>

            {/* نصيحة */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              💡 <strong>نصيحة:</strong> استخدم صورة غلاف بمقاس 300×400 بكسل للحصول على أفضل جودة. حجم PDF الأمثل 5-20 MB.
            </div>
          </div>

          {/* Footer */}
          <div className="bg-stone-50 p-4 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900"
            >
              تم
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
