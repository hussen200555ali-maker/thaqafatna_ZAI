/**
 * ⚙️ الإعدادات — /admin/settings
 */

'use client'

import { useState } from 'react'
import { Save, Database, Shield, Bell, Plug, AlertTriangle, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { SectionCard } from '@/components/admin/admin-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tab = 'general' | 'security' | 'policies' | 'integrations' | 'danger'

const tabs: Array<{ key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'general', label: 'عام', icon: Database },
  { key: 'security', label: 'الأمان', icon: Shield },
  { key: 'policies', label: 'السياسات', icon: Bell },
  { key: 'integrations', label: 'التكاملات', icon: Plug },
  { key: 'danger', label: 'منطقة الخطر', icon: AlertTriangle },
]

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('general')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <AdminLayout
      title="⚙️ الإعدادات"
      subtitle="إعدادات الموقع والسياسات والتكاملات"
      actions={
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t.key)}
              className={cn(
                'gap-2',
                t.key === 'danger' && tab !== t.key && 'text-red-600 hover:text-red-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Button>
          )
        })}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="space-y-4">
          <SectionCard title="🌐 إعدادات عامة">
            <div className="space-y-4">
              <SettingRow label="اسم الموقع" description="يظهر في الـ Header وفي المتصفح">
                <Input defaultValue="ثقافتنا" className="w-72" />
              </SettingRow>
              <SettingRow label="الوصف المختصر" description="يظهر في محركات البحث">
                <Input defaultValue="منصة عربية تعليمية ترفيهية" className="w-96" />
              </SettingRow>
              <SettingRow label="اللغة الافتراضية" description="لغة الواجهة الرئيسية">
                <select className="w-48 rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <option>العربية</option>
                  <option>الإنجليزية</option>
                </select>
              </SettingRow>
              <SettingRow label="السماح بتسجيل مستخدمين جدد" description="عند الإيقاف، لا يمكن لأحد إنشاء حساب">
                <Switch defaultChecked />
              </SettingRow>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <SectionCard title="🛡️ إعدادات الأمان">
          <div className="space-y-4">
            <SettingRow label="2FA إلزامي للأدمن" description="يجب تفعيل التحقق الثنائي لكل حساب إداري">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow label="حد تسجيل الدخول الإداري" description="عدد المحاولات قبل القفل">
              <Input type="number" defaultValue={3} className="w-20" />
            </SettingRow>
            <SettingRow label="مدة القفل (دقيقة)" description="بعد تجاوز المحاولات">
              <Input type="number" defaultValue={15} className="w-20" />
            </SettingRow>
          </div>
        </SectionCard>
      )}

      {/* Policies */}
      {tab === 'policies' && (
        <SectionCard title="📜 السياسات">
          <div className="space-y-4">
            <SettingRow label="اعتدال المراجعات تلقائيًا" description="المراجعات الجديدة تنتظر موافقة الأدمن">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow label="حد تنزيل PDF (لكل مستخدم/ساعة)" description="منع الإفراط في التنزيل">
              <Input type="number" defaultValue={10} className="w-20" />
            </SettingRow>
          </div>
        </SectionCard>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <SectionCard title="🔌 التكاملات">
          <div className="space-y-3">
            <IntegrationRow name="Vercel Blob" description="تخزين الملفات · ✓ متصل · 1 GB مستخدم من 10 GB" status="active" />
            <IntegrationRow name="Upstash Redis" description="Rate Limiting · ✓ متصل · 4,231 طلب اليوم" status="active" />
            <IntegrationRow name="Neon PostgreSQL" description="قاعدة البيانات · ✓ متصل · 156 MB مستخدم" status="active" />
            <IntegrationRow name="Sentry" description="مراقبة الأخطاء · غير مفعّل" status="inactive" />
          </div>
        </SectionCard>
      )}

      {/* Danger Zone */}
      {tab === 'danger' && (
        <Card className="border-red-200">
          <div className="border-b border-red-200 bg-red-50 p-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-red-700">
              <AlertTriangle className="h-5 w-5" />
              منطقة الخطر
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            <SettingRow label="تصدير كل البيانات" description="تنزيل نسخة كاملة من قاعدة البيانات">
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                تصدير
              </Button>
            </SettingRow>
            <SettingRow label="حذف كل المستخدمين غير النشطين" description="حسابات لم تسجّل دخول منذ 90 يومًا">
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                حذف (87)
              </Button>
            </SettingRow>
            <SettingRow label="حذف المكتبة نهائيًا" description="⚠️ لا يمكن التراجع — سيُحذف كل شيء">
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                حذف نهائي
              </Button>
            </SettingRow>
          </div>
        </Card>
      )}
    </AdminLayout>
  )
}

// ============== Helper Components ==============

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <Label className="text-sm font-medium text-slate-900">{label}</Label>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function IntegrationRow({ name, description, status }: {
  name: string
  description: string
  status: 'active' | 'inactive'
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <div className="mt-0.5 text-xs text-slate-500">{description}</div>
      </div>
      {status === 'active' ? (
        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          مفعّل
        </Badge>
      ) : (
        <Button variant="outline" size="sm">إعداد</Button>
      )}
    </div>
  )
}
