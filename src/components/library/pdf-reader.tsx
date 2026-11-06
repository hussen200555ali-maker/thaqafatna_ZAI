'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronUp, ChevronDown, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Download, ExternalLink, Loader2, AlertCircle, BookOpen, Search, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// إعداد worker لـ pdfjs-dist (يستخدم CDN لتفادي مشاكل bundling)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfReaderProps {
  pdfUrl: string
  pdfFileName?: string
  pdfSize?: number
  pageCount?: number
  title: string
  isDarkMode?: boolean
  /** رقم الصفحة المحفوظة من آخر قراءة */
  initialPage?: number
  /** يُستدعى عند تغيير الصفحة (للحفظ التلقائي) */
  onPageChange?: (page: number) => void
  /** يُستدعى عند تحميل المستند */
  onDocumentLoad?: (totalPages: number) => void
}

/**
 * 📖 PdfReader — عارض PDF احترافي باستخدام react-pdf
 *
 * المميزات:
 * - عرض صفحة بصفحة (لا يحمل الملف كاملًا دفعة واحدة)
 * - تكبير/تصغير بدون إعادة تحميل (Canvas rendering)
 * - تمرير سلس بين الصفحات
 * - حفظ رقم الصفحة تلقائيًا
 * - دعم الوضع الليلي (invert filter)
 * - وضع السيبيا (sepia)
 * - ملء الشاشة
 * - متجاوب مع الجوال
 * - اختصارات لوحة المفاتيح (← → للتنقل)
 */
export function PdfReader({
  pdfUrl,
  pdfFileName = 'كتاب PDF',
  pdfSize = 0,
  pageCount: _pageCount = 0,
  title,
  isDarkMode = false,
  initialPage = 1,
  onPageChange,
  onDocumentLoad,
}: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [readingMode, setReadingMode] = useState<'light' | 'dark' | 'sepia'>(isDarkMode ? 'dark' : 'light')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIdx, setCurrentSearchIdx] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // تحميل المستند
  const onDocumentLoadSuccess = useCallback((pdf: any) => {
    setNumPages(pdf.numPages)
    setLoading(false)
    setError(null)
    onDocumentLoad?.(pdf.numPages)
  }, [onDocumentLoad])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err)
    setError(err.message || 'فشل تحميل ملف PDF')
    setLoading(false)
  }, [])

  // تغيير الصفحة (مع debounce للحفظ التلقائي)
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > numPages) return
    setCurrentPage(page)

    // debounce لتفادي إرسال طلبات كثيرة
    if (pageDebounceRef.current) clearTimeout(pageDebounceRef.current)
    pageDebounceRef.current = setTimeout(() => {
      onPageChange?.(page)
    }, 500)
  }, [numPages, onPageChange])

  const goToPrevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])

  // التكبير/التصغير (بدون إعادة تحميل!)
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3.0))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))
  const resetZoom = () => setScale(1.0)

  // ملء الشاشة
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // لا تعترض لوحة المفاتيح أثناء الكتابة في حقل بحث
      if (document.activeElement?.tagName === 'INPUT') return

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        goToNextPage() // RTL: يسار = تالي
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrevPage() // RTL: يمين = سابق
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        // Esc يخرج من وضع البحث
        setShowSearch(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goToNextPage, goToPrevPage])

  // فلاتر الوضع الليلي/السيبيا
  const pageFilter = readingMode === 'dark'
    ? 'invert(0.9) hue-rotate(180deg) brightness(0.9) contrast(0.9)'
    : readingMode === 'sepia'
    ? 'sepia(0.6) brightness(0.95)'
    : 'none'

  const bgColor = readingMode === 'dark' ? '#1c1917' : readingMode === 'sepia' ? '#f4ecd8' : '#f8fafc'

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col rounded-2xl overflow-hidden border-2 shadow-xl',
        isDarkMode ? 'border-stone-700' : 'border-stone-200'
      )}
      style={{ background: bgColor }}
    >
      {/* ===== شريط الأدوات العلوي ===== */}
      <div className={cn(
        'flex items-center justify-between gap-2 px-3 py-2 border-b',
        isDarkMode ? 'bg-stone-800/90 border-stone-700 text-stone-200' : 'bg-white/90 border-stone-200 text-stone-700'
      )}>
        {/* اليسار: معلومات الملف + رقم الصفحة */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="text-xl flex-shrink-0">📄</div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" title={pdfFileName}>
              {pdfFileName}
            </div>
            <div className="text-[10px] opacity-70 flex gap-2">
              {numPages > 0 && <span>📑 {numPages} صفحة</span>}
              <span className="text-blue-500">📊 {Math.round(scale * 100)}%</span>
            </div>
          </div>
        </div>

        {/* وسط: رقم الصفحة الحالية */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-stone-200 dark:hover:bg-stone-700"
            title="الصفحة السابقة (→)"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const p = parseInt(e.target.value)
              if (!isNaN(p)) goToPage(p)
            }}
            min={1}
            max={numPages}
            className={cn(
              'w-12 text-center text-xs font-bold rounded-md border px-1 py-1',
              isDarkMode ? 'bg-stone-700 border-stone-600 text-white' : 'bg-white border-stone-300'
            )}
          />
          <span className="opacity-60">/ {numPages}</span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-stone-200 dark:hover:bg-stone-700"
            title="الصفحة التالية (←)"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* اليمين: أزرار التحكم */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* التكبير */}
          <button onClick={zoomOut} disabled={scale <= 0.5} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-stone-200 dark:hover:bg-stone-700" title="تصغير (-)">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={zoomIn} disabled={scale >= 3.0} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-stone-200 dark:hover:bg-stone-700" title="تكبير (+)">
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* فاصل */}
          <div className="w-px h-6 mx-1 bg-current opacity-20" />

          {/* أوضاع القراءة */}
          <button
            onClick={() => setReadingMode('light')}
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-700', readingMode === 'light' && 'bg-blue-100 dark:bg-blue-900')}
            title="وضع نهاري"
          >
            ☀️
          </button>
          <button
            onClick={() => setReadingMode('sepia')}
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-700', readingMode === 'sepia' && 'bg-amber-100 dark:bg-amber-900')}
            title="وضع سيبيا"
          >
            📜
          </button>
          <button
            onClick={() => setReadingMode('dark')}
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-700', readingMode === 'dark' && 'bg-indigo-100 dark:bg-indigo-900')}
            title="وضع ليلي"
          >
            🌙
          </button>

          {/* فاصل */}
          <div className="w-px h-6 mx-1 bg-current opacity-20" />

          {/* فتح في نافذة */}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-700" title="فتح في نافذة جديدة">
            <ExternalLink className="h-4 w-4" />
          </a>

          {/* ملء الشاشة */}
          <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-700" title={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* تنزيل */}
          <a
            href={pdfUrl.includes('?') ? `${pdfUrl}&download=1` : `${pdfUrl}?download=1`}
            download={pdfFileName}
            className="px-3 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center gap-1 text-xs font-bold transition-all shadow-sm"
            title="تنزيل PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تنزيل</span>
          </a>
        </div>
      </div>

      {/* ===== منطقة العرض ===== */}
      <div
        className="relative flex-1 overflow-auto flex justify-center"
        style={{
          height: isFullscreen ? '100vh' : '85vh',
          minHeight: '600px',
          background: bgColor,
        }}
      >
        {/* حالة التحميل */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p className={cn('text-sm font-medium', isDarkMode ? 'text-stone-400' : 'text-stone-600')}>
              جاري تحميل الكتاب...
            </p>
            {pdfSize > 0 && (
              <p className="text-xs opacity-60 mt-1">
                {(pdfSize / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
        )}

        {/* حالة الخطأ */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-sm font-medium text-red-600 mb-2">فشل تحميل PDF</p>
            <p className="text-xs text-stone-500 mb-4">{error}</p>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                فتح مباشرة
              </Button>
            </a>
          </div>
        )}

        {/* المستند */}
        {!error && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            error={null}
            className="flex flex-col items-center py-4"
          >
            <div style={{ filter: pageFilter }}>
              <Page
                key={`page_${currentPage}`}
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
                loading={
                  <div className="flex items-center justify-center h-[800px] w-[600px]">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  </div>
                }
              />
            </div>

            {/* أزرار تنقل سفلية */}
            <div className={cn(
              'sticky bottom-4 mt-4 mx-auto flex items-center gap-2 rounded-full px-4 py-2 shadow-lg',
              isDarkMode ? 'bg-stone-800 text-stone-200' : 'bg-white text-stone-700'
            )}>
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 text-xs font-medium disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
                السابق
              </button>
              <span className="text-xs opacity-60 px-2">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className="flex items-center gap-1 text-xs font-medium disabled:opacity-30"
              >
                التالي
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </Document>
        )}
      </div>

      {/* ===== شريط سفلي ===== */}
      <div className={cn(
        'flex items-center justify-between gap-3 px-3 py-2 border-t text-xs',
        isDarkMode ? 'bg-stone-800 border-stone-700 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'
      )}>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{title}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 opacity-70">
          <span>⌨️ ← → للتنقل · ± للتكبير · Esc للخروج</span>
        </div>
      </div>
    </div>
  )
}
