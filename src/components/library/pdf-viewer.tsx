'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PDFViewerProps {
  pdfUrl: string
  pdfFileName?: string
  pdfSize?: number
  pageCount?: number
  title: string
  isDarkMode?: boolean
  onClose?: () => void
}

/**
 * 📄 عارض PDF احترافي
 *
 * المميزات:
 * - عرض PDF حقيقي عبر iframe (يدعم كل المتصفحات)
 * - شريط أدوات: تكبير، تصغير، ملء الشاشة، تنزيل
 * - شارة اسم الملف وحجمه
 * - دعم الوضع الليلي
 * - زر "فتح في نافذة جديدة"
 * - دعم RTL للعربية
 */
export function PDFViewer({
  pdfUrl,
  pdfFileName = 'كتاب PDF',
  pdfSize = 0,
  pageCount = 0,
  title,
  isDarkMode = false,
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(100) // نسبة التكبير
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // بناء URL مع خيارات العرض
  const buildPdfUrl = (baseUrl: string, zoomLevel: number) => {
    const params = new URLSearchParams()
    params.set('view', 'FitH')
    params.set('toolbar', '0') // إخفاء شريط Adobe
    params.set('navpanes', '1') // إظهار قائمة الصفحات
    params.set('zoom', `${zoomLevel}`)
    return `${baseUrl}#${params.toString()}`
  }

  const formatBytes = (bytes: number): string => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50))
  const handleResetZoom = () => setZoom(100)

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await containerRef.current?.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // رابط التنزيل المباشر
  const downloadUrl = pdfUrl.includes('?')
    ? `${pdfUrl}&download=1`
    : `${pdfUrl}?download=1`

  const openUrl = pdfUrl // فتح في نافذة جديدة

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden shadow-xl border-2 ${
        isDarkMode ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'
      }`}
      ref={containerRef}
    >
      {/* ===== شريط الأدوات العلوي ===== */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${
          isDarkMode
            ? 'bg-stone-800 border-stone-700 text-stone-200'
            : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}
      >
        {/* اليسار: معلومات الملف */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-xl flex-shrink-0">📄</div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate" title={pdfFileName}>
              {pdfFileName}
            </div>
            <div className="text-[10px] opacity-70 flex gap-2">
              {pdfSize > 0 && <span>💾 {formatBytes(pdfSize)}</span>}
              {pageCount > 0 && <span>📑 {pageCount} صفحة</span>}
              <span className="text-blue-500">📊 {zoom}%</span>
            </div>
          </div>
        </div>

        {/* اليمين: أزرار التحكم */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* تصغير */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 ${
              isDarkMode ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
            }`}
            title="تصغير"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* النسبة */}
          <button
            onClick={handleResetZoom}
            className="px-2 h-8 rounded-lg text-xs font-medium transition-colors min-w-[50px]"
            style={{
              backgroundColor: isDarkMode ? '#44403c' : '#e7e5e4',
            }}
            title="استعادة الحجم الطبيعي"
          >
            {zoom}%
          </button>

          {/* تكبير */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 ${
              isDarkMode ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
            }`}
            title="تكبير"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* فاصل */}
          <div className="w-px h-6 mx-1 bg-current opacity-20" />

          {/* فتح في نافذة جديدة */}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDarkMode ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
            }`}
            title="فتح في نافذة جديدة"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* ملء الشاشة */}
          <button
            onClick={toggleFullscreen}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDarkMode ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
            }`}
            title={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
              </svg>
            )}
          </button>

          {/* تنزيل */}
          <a
            href={downloadUrl}
            download={pdfFileName || `${title}.pdf`}
            className="px-3 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center gap-1 text-xs font-bold transition-all shadow-sm"
            title="تنزيل PDF"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>تنزيل</span>
          </a>
        </div>
      </div>

      {/* ===== عارض PDF ===== */}
      <div className="relative" style={{ height: isFullscreen ? '100vh' : '85vh', minHeight: '600px' }}>
        <iframe
          src={buildPdfUrl(pdfUrl, zoom)}
          title={`${title} - PDF Viewer`}
          className="w-full h-full border-0"
          allow="fullscreen"
          style={{
            backgroundColor: isDarkMode ? '#1c1917' : '#525659',
          }}
        />

        {/* رسالة تحميل */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            isDarkMode ? 'bg-stone-900' : 'bg-stone-100'
          }`}
          style={{
            animation: 'fadeOut 1.5s ease-out 1s forwards',
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-3 animate-bounce">📄</div>
            <div className={`text-sm font-medium ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              جاري تحميل الكتاب...
            </div>
          </div>
        </div>
      </div>

      {/* شريط سفلي بمعلومات */}
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2 border-t text-xs ${
          isDarkMode
            ? 'bg-stone-800 border-stone-700 text-stone-400'
            : 'bg-stone-50 border-stone-200 text-stone-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            📖 {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-70">💡 استخدم أزرار التكبير للتحكم بحجم الخط</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; visibility: hidden; }
        }
      `}</style>
    </motion.div>
  )
}
