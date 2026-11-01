/**
 * 🔑 BackupCodes — مكون لعرض/توليد الرموز الاحتياطية
 *
 * المميزات:
 * - عرض عدد الرموز المتبقية
 * - زر "توليد رموز جديدة" (يحذف القديمة)
 * - عرض الرموز مرة واحدة فقط بعد التوليد
 * - تحذير أمني واضح
 * - إمكانية النسخ
 */

'use client'

import { useState, useEffect } from 'react'
import { Key, Copy, Check, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function BackupCodesSection() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [showCodes, setShowCodes] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // جلب عدد الرموز المتبقية
  const loadRemaining = () => {
    fetch('/api/admin/2fa/backup-codes/generate')
      .then(r => r.json())
      .then(d => setRemaining(d.remaining ?? 0))
      .catch(() => setError('فشل جلب حالة الرموز'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRemaining() }, [])

  // توليد رموز جديدة
  const handleGenerate = async () => {
    if (!confirm('سيتم حذف الرموز القديمة وتوليد 10 رموز جديدة. هل أنت متأكد؟')) return

    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/2fa/backup-codes/generate', { method: 'POST' })
      if (!res.ok) throw new Error('فشل التوليد')
      const data = await res.json()
      setCodes(data.codes)
      setShowCodes(true)
      setRemaining(data.remaining)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  // نسخ رمز
  const copyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(index)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  // نسخ كل الرموز
  const copyAllCodes = async () => {
    if (!codes) return
    try {
      const text = codes.join('\n')
      await navigator.clipboard.writeText(text)
      setCopied(-1)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="border-b bg-amber-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-amber-900">
                الرموز الاحتياطية (Backup Codes)
              </h3>
              <p className="text-xs text-amber-700">
                تُستخدم عند فقدان جهاز 2FA — كل رمز يُستخدم مرة واحدة
              </p>
            </div>
          </div>
          {remaining !== null && (
            <Badge variant={remaining > 5 ? 'default' : remaining > 0 ? 'secondary' : 'destructive'}>
              {remaining} / 10 متبقية
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status */}
        {!codes && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div>
                <div className="text-sm font-medium text-slate-900">الحالة الحالية</div>
                <div className="text-xs text-slate-500">
                  {loading ? 'جاري التحميل...' : `${remaining ?? 0} رمز متبقٍ من أصل 10`}
                </div>
              </div>
              {remaining === 0 && (
                <Badge variant="destructive">لا توجد رموز</Badge>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>تحذير:</strong> عند التوليد، ستُحذف الرموز القديمة.
                احفظ الرموز الجديدة في مكان آمن (مدير كلمات المرور) — لن تظهر مرة أخرى.
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || loading}
              className="w-full gap-2"
              variant={remaining === 0 ? 'default' : 'outline'}
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  {remaining === 0 ? 'توليد 10 رموز احتياطية' : 'توليد رموز جديدة (يحذف القديمة)'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Display codes after generation */}
        {codes && (
          <div className="space-y-4">
            {/* Critical warning */}
            <div className="flex items-start gap-2 rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-900">⚠️ احفظ هذه الرموز الآن!</div>
                <p className="mt-1 text-sm text-red-700">
                  هذه الرموز تُعرض <strong>مرة واحدة فقط</strong>. لن تتمكن من رؤيتها مرة أخرى.
                  احفظها في مدير كلمات مرور آمن أو اطبعها واحفظها في مكان آمن.
                </p>
              </div>
            </div>

            {/* Show/Hide toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCodes(!showCodes)}
                className="gap-2"
              >
                {showCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCodes ? 'إخفاء الرموز' : 'إظهار الرموز'}
              </Button>
              <Button variant="outline" size="sm" onClick={copyAllCodes} className="gap-2">
                {copied === -1 ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                نسخ الكل
              </Button>
            </div>

            {/* Codes grid */}
            <div className={cn('grid grid-cols-2 gap-2', !showCodes && 'blur-sm select-none')}>
              {codes.map((code, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm"
                >
                  <span className="text-slate-900">{code}</span>
                  <button
                    onClick={() => copyCode(code, i)}
                    className="text-slate-400 hover:text-slate-700"
                    title="نسخ"
                  >
                    {copied === i ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Done button */}
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() => {
                setCodes(null)
                setShowCodes(false)
              }}
            >
              <Check className="h-4 w-4" />
              حفظتها — إخفاء الرموز
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
