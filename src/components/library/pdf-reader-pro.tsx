'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink,
  Loader2, AlertCircle, BookOpen, Search, X, Bookmark, BookmarkCheck,
  List, Sun, Moon, ScrollText, Maximize2, Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// إعداد worker لـ pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// ============== Types ==============
interface SearchResult {
  page: number
  text: string
  snippet: string
}

interface PdfReaderProProps {
  pdfUrl: string
  pdfFileName?: string
  pdfSize?: number
  title: string
  initialPage?: number
  initialMode?: 'light' | 'dark' | 'sepia'
  onPageChange?: (page: number) => void
  onDocumentLoad?: (totalPages: number) => void
}

// ============== PdfReaderPro ==============
/**
 * 📖 PdfReaderPro — قارئ PDF احترافي مخصص 100%
 *
 * المحرك: react-pdf (Canvas rendering)
 * الواجهة: Tailwind + shadcn/ui (بدون واجهات جاهزة)
 *
 * المميزات:
 * - Zen Mode: إخفاء تلقائي للـ Header عند scroll
 * - أوضاع قراءة: نهاري / ليلي / سيبيا
 * - حفظ رقم الصفحة تلقائيًا
 * - بحث داخل الكتاب (with snippets + navigation)
 * - علامات مرجعية (Bookmarks)
 * - تكبير/تصغير سلس (Canvas transform)
 * - اختصارات لوحة المفاتيح
 * - متجاوب مع الجوال
 */
export function PdfReaderPro({
  pdfUrl,
  pdfFileName = 'كتاب PDF',
  pdfSize = 0,
  title,
  initialPage = 1,
  initialMode = 'light',
  onPageChange,
  onDocumentLoad,
}: PdfReaderProProps) {
  // ===== Document state =====
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ===== UI state =====
  const [readingMode, setReadingMode] = useState<'light' | 'dark' | 'sepia'>(initialMode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [tocOpen, setTocOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchIdx, setSearchIdx] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // ===== Bookmarks =====
  const [bookmarks, setBookmarks] = useState<number[]>([])

  // ===== Refs =====
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const pageDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pdfDocRef = useRef<any>(null)

  // ===== Filters for reading modes =====
  const pageFilter = readingMode === 'dark'
    ? 'invert(0.92) hue-rotate(180deg) brightness(0.85) contrast(0.95)'
    : readingMode === 'sepia'
    ? 'sepia(0.5) brightness(0.95) contrast(0.95)'
    : 'none'

  const bgColor = readingMode === 'dark' ? '#1a1a1a' : readingMode === 'sepia' ? '#f4ecd8' : '#ffffff'

  // ===== Document callbacks =====
  const onDocLoadSuccess = useCallback((pdf: any) => {
    pdfDocRef.current = pdf
    setNumPages(pdf.numPages)
    setLoading(false)
    setError(null)
    onDocumentLoad?.(pdf.numPages)

    // استرجاع العلامات المرجعية من localStorage
    try {
      const stored = localStorage.getItem(`thaqafatna-bookmarks-${title}`)
      if (stored) setBookmarks(JSON.parse(stored))
    } catch {}
  }, [onDocumentLoad, title])

  const onDocLoadError = useCallback((err: Error) => {
    setError(err.message || 'فشل تحميل PDF')
    setLoading(false)
  }, [])

  // ===== Page navigation =====
  const goToPage = useCallback((page: number) => {
    if (page < 1 || (numPages > 0 && page > numPages)) return
    setCurrentPage(page)
    // scroll لأعلى منطقة العرض
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    if (pageDebounce.current) clearTimeout(pageDebounce.current)
    pageDebounce.current = setTimeout(() => onPageChange?.(page), 500)
  }, [numPages, onPageChange])

  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage])
  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage])

  // ===== Zoom (smooth, no reload) =====
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3.0))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))

  // ===== Fullscreen =====
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // ===== Zen Mode: auto-hide header on scroll =====
  useEffect(() => {
    const onScroll = () => {
      const currentY = scrollRef.current?.scrollTop ?? window.scrollY
      if (currentY > lastScrollY.current && currentY > 80) {
        // scrolling down → hide header
        setHeaderVisible(false)
      } else {
        // scrolling up → show header
        setHeaderVisible(true)
      }
      lastScrollY.current = currentY
    }
    const el = scrollRef.current || window
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': e.preventDefault(); goNext(); break
        case 'ArrowRight': case 'ArrowUp': e.preventDefault(); goPrev(); break
        case '+': case '=': e.preventDefault(); zoomIn(); break
        case '-': e.preventDefault(); zoomOut(); break
        case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break
        case 'Escape': setSearchOpen(false); setTocOpen(false); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  // ===== Search inside book =====
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !pdfDocRef.current) return
    setIsSearching(true)
    const results: SearchResult[] = []
    const query = searchQuery.toLowerCase()

    for (let p = 1; p <= numPages; p++) {
      try {
        const page = await pdfDocRef.current.getPage(p)
        const textContent = await page.getTextContent()
        const fullText = textContent.items.map((item: any) => item.str).join(' ')
        const lowerText = fullText.toLowerCase()
        const idx = lowerText.indexOf(query)
        if (idx !== -1) {
          const start = Math.max(0, idx - 30)
          const end = Math.min(fullText.length, idx + query.length + 30)
          results.push({
            page: p,
            text: fullText.substring(idx, idx + query.length),
            snippet: '...' + fullText.substring(start, end) + '...',
          })
        }
      } catch {}
    }

    setSearchResults(results)
    setSearchIdx(0)
    setIsSearching(false)
    if (results.length > 0) goToPage(results[0].page)
  }, [searchQuery, numPages, goToPage])

  const goSearchNext = () => {
    if (searchResults.length === 0) return
    const next = (searchIdx + 1) % searchResults.length
    setSearchIdx(next)
    goToPage(searchResults[next].page)
  }

  const goSearchPrev = () => {
    if (searchResults.length === 0) return
    const prev = (searchIdx - 1 + searchResults.length) % searchResults.length
    setSearchIdx(prev)
    goToPage(searchResults[prev].page)
  }

  // ===== Bookmarks =====
  const toggleBookmark = () => {
    setBookmarks(prev => {
      const exists = prev.includes(currentPage)
      const updated = exists ? prev.filter(p => p !== currentPage) : [...prev, currentPage].sort((a,b) => a-b)
      localStorage.setItem(`thaqafatna-bookmarks-${title}`, JSON.stringify(updated))
      return updated
    })
  }

  const isBookmarked = bookmarks.includes(currentPage)

  // ===== Generate TOC (page-based if no outline in PDF) =====
  const tocEntries = Array.from({ length: Math.min(numPages, 50) }, (_, i) => ({
    page: i + 1,
    label: `صفحة ${i + 1}`,
  }))

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: bgColor }}
    >
      {/* ===== Header (Zen Mode: auto-hide) ===== */}
      <header
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 border-b transition-transform duration-300 z-30',
          readingMode === 'dark' ? 'bg-stone-900 border-stone-700 text-stone-200' : 'bg-white border-stone-200 text-stone-700',
          !headerVisible && !searchOpen && !tocOpen && '-translate-y-full'
        )}
      >
        {/* Left: TOC toggle + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="الفهرس"
            aria-label="فتح الفهرس"
          >
            <List className="h-5 w-5" />
          </button>
          <div className="min-w-0 hidden sm:block">
            <div className="text-sm font-bold truncate">{title}</div>
            <div className="text-[10px] opacity-60 truncate">{pdfFileName}</div>
          </div>
        </div>

        {/* Center: Page indicator */}
        <div className="flex items-center gap-1">
          <button onClick={goPrev} disabled={currentPage <= 1} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800" title="السابق (→)">
            <ChevronRight className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => { const p = parseInt(e.target.value); if (!isNaN(p)) goToPage(p) }}
            min={1} max={numPages}
            className={cn('w-12 text-center text-xs font-bold rounded-md border px-1 py-1', readingMode === 'dark' ? 'bg-stone-800 border-stone-600 text-white' : 'bg-white border-stone-300')}
          />
          <span className="text-xs opacity-60">/ {numPages}</span>
          <button onClick={goNext} disabled={currentPage >= numPages} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800" title="التالي (←)">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button onClick={() => setSearchOpen(!searchOpen)} className={cn('w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800', searchOpen && 'bg-blue-100 dark:bg-blue-900')} title="بحث داخل الكتاب" aria-label="بحث">
            <Search className="h-5 w-5" />
          </button>
          {/* Bookmark */}
          <button onClick={toggleBookmark} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title={isBookmarked ? 'إزالة العلامة' : 'حفظ العلامة'} aria-label="علامة مرجعية">
            {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-amber-500" /> : <Bookmark className="h-5 w-5" />}
          </button>
          {/* Zoom */}
          <button onClick={zoomOut} disabled={scale <= 0.5} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800" title="تصغير (-)">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={zoomIn} disabled={scale >= 3.0} className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-800" title="تكبير (+)">
            <ZoomIn className="h-4 w-4" />
          </button>
          {/* Divider */}
          <div className="w-px h-6 mx-1 bg-current opacity-20" />
          {/* Reading modes */}
          <button onClick={() => setReadingMode('light')} className={cn('w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800', readingMode === 'light' && 'bg-blue-100')} title="نهاري" aria-label="وضع نهاري">
            <Sun className="h-4 w-4" />
          </button>
          <button onClick={() => setReadingMode('sepia')} className={cn('w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800', readingMode === 'sepia' && 'bg-amber-100')} title="سيبيا" aria-label="وضع سيبيا">
            <ScrollText className="h-4 w-4" />
          </button>
          <button onClick={() => setReadingMode('dark')} className={cn('w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800', readingMode === 'dark' && 'bg-indigo-900')} title="ليلي" aria-label="وضع ليلي">
            <Moon className="h-4 w-4" />
          </button>
          {/* Divider */}
          <div className="w-px h-6 mx-1 bg-current opacity-20" />
          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="ملء الشاشة (F)" aria-label="ملء الشاشة">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {/* Download */}
          <a href={pdfUrl.includes('?') ? `${pdfUrl}&download=1` : `${pdfUrl}?download=1`} download={pdfFileName} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="تنزيل" aria-label="تنزيل">
            <Download className="h-4 w-4" />
          </a>
          {/* Open external */}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="فتح في نافذة" aria-label="فتح في نافذة جديدة">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* ===== Search Panel ===== */}
      {searchOpen && (
        <div className={cn('flex items-center gap-2 px-4 py-2 border-b z-20', readingMode === 'dark' ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200')}>
          <Search className="h-4 w-4 opacity-50 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="ابحث داخل الكتاب..."
            className={cn('flex-1 text-sm bg-transparent border-none outline-none', readingMode === 'dark' ? 'text-white' : 'text-stone-800')}
            autoFocus
          />
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : searchResults.length > 0 ? (
            <div className="flex items-center gap-1 text-xs">
              <button onClick={goSearchPrev} className="w-7 h-7 rounded flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="السابق">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <span className="font-medium px-1">{searchIdx + 1} / {searchResults.length}</span>
              <button onClick={goSearchNext} className="w-7 h-7 rounded flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="التالي">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          <button onClick={() => { setSearchOpen(false); setSearchResults([]); setSearchQuery('') }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800" title="إغلاق">
            <X className="h-4 w-4" />
          </button>
          {/* Snippet preview */}
          {searchResults.length > 0 && searchResults[searchIdx] && (
            <div className={cn('absolute top-full left-0 right-0 px-4 py-2 text-xs border-b max-h-32 overflow-auto', readingMode === 'dark' ? 'bg-stone-800 border-stone-700 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-600')}>
              <span className="font-bold">صفحة {searchResults[searchIdx].page}: </span>
              {searchResults[searchIdx].snippet}
            </div>
          )}
        </div>
      )}

      {/* ===== Main Area: TOC + Reader ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC Sidebar */}
        {tocOpen && (
          <aside className={cn('w-64 flex-shrink-0 border-l overflow-y-auto', readingMode === 'dark' ? 'bg-stone-900 border-stone-700 text-stone-300' : 'bg-white border-stone-200 text-stone-700')}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <List className="h-4 w-4" /> الفهرس
                </h3>
                <button onClick={() => setTocOpen(false)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Bookmarks section */}
              {bookmarks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold opacity-60 mb-2 flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> العلامات ({bookmarks.length})
                  </h4>
                  {bookmarks.map(pg => (
                    <button
                      key={pg}
                      onClick={() => { goToPage(pg); setTocOpen(false) }}
                      className={cn('w-full text-right px-2 py-1.5 text-xs rounded-md hover:bg-stone-100 dark:hover:bg-stone-800', pg === currentPage && 'bg-amber-100 dark:bg-amber-900/30 font-bold')}
                    >
                      📑 صفحة {pg}
                    </button>
                  ))}
                  <div className="h-px bg-current opacity-10 my-3" />
                </div>
              )}
              {/* Pages */}
              <h4 className="text-xs font-semibold opacity-60 mb-2">الصفحات</h4>
              {tocEntries.map(entry => (
                <button
                  key={entry.page}
                  onClick={() => { goToPage(entry.page); setTocOpen(false) }}
                  className={cn('w-full text-right px-2 py-1.5 text-xs rounded-md hover:bg-stone-100 dark:hover:bg-stone-800', entry.page === currentPage && 'bg-blue-100 dark:bg-blue-900/30 font-bold')}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Reader Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto flex justify-center"
          style={{ background: bgColor }}
        >
          {/* Loading */}
          {loading && (
            <div className="sticky top-0 flex flex-col items-center justify-center py-20 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-sm font-medium text-stone-500">جاري تحميل الكتاب...</p>
              {pdfSize > 0 && <p className="text-xs opacity-60 mt-1">{(pdfSize / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm font-medium text-red-600 mb-2">فشل تحميل PDF</p>
              <p className="text-xs text-stone-500 mb-4">{error}</p>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> فتح مباشرة
                </Button>
              </a>
            </div>
          )}

          {/* PDF Document */}
          {!error && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocLoadSuccess}
              onLoadError={onDocLoadError}
              loading={null}
              error={null}
              className="py-4"
            >
              <div style={{ filter: pageFilter }}>
                <Page
                  key={`page_${currentPage}`}
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  className="shadow-2xl"
                  loading={
                    <div className="flex items-center justify-center h-[800px] w-[600px]">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  }
                />
              </div>
            </Document>
          )}
        </div>
      </div>

      {/* ===== Bottom Progress Bar ===== */}
      <footer className={cn('flex items-center justify-between gap-4 px-4 py-2 border-t z-20', readingMode === 'dark' ? 'bg-stone-900 border-stone-700 text-stone-400' : 'bg-white border-stone-200 text-stone-500')}>
        <div className="flex items-center gap-2 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{title}</span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${numPages > 0 ? (currentPage / numPages) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">
            {currentPage} / {numPages} ({numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0}%)
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs opacity-60">
          <span>⌨️ ← → · ± · F · Esc</span>
        </div>
      </footer>
    </div>
  )
}
