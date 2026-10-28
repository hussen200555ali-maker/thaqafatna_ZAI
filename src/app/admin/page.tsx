/**
 * 📊 لوحة التحكم — /admin
 * Dashboard كامل مع API حقيقي
 */
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalBooks: number; publishedBooks: number; totalUsers: number
    pendingReviews: number; newMessages: number; totalDownloads: number; criticalLogs: number
  }
  recentActivity: Array<{ action: string; entityType: string; severity: string; userName: string; time: string }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#64748b' }}>⏳ جاري التحميل...</div>

  const s = data?.stats || { totalBooks: 0, publishedBooks: 0, totalUsers: 0, pendingReviews: 0, newMessages: 0, totalDownloads: 0, criticalLogs: 0 }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontFamily: 'Cairo, sans-serif' }}>📊 لوحة التحكم</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>نظرة عامة على المكتبة</p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'إجمالي الكتب', value: s.totalBooks, sub: `${s.publishedBooks} منشور`, icon: '📚', bg: '#eef2ff', color: '#4f46e5' },
            { label: 'إجمالي التنزيلات', value: s.totalDownloads.toLocaleString('ar-EG'), sub: 'كل الكتب', icon: '📥', bg: '#ecfdf5', color: '#10b981' },
            { label: 'المستخدمون', value: s.totalUsers, sub: 'مسجلون', icon: '👥', bg: '#fffbeb', color: '#f59e0b' },
            { label: 'مراجعات معلّقة', value: s.pendingReviews, sub: 'بانتظار الاعتدال', icon: '⭐', bg: '#f0f9ff', color: '#0ea5e9' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{kpi.icon}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{kpi.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', fontFamily: 'Cairo, sans-serif' }}>{kpi.value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Activity + Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', fontFamily: 'Cairo, sans-serif' }}>النشاط الأخير</h2>
            {data?.recentActivity?.length ? data.recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: a.severity === 'critical' ? '#fef2f2' : a.severity === 'warning' ? '#fffbeb' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{a.severity === 'critical' ? '🚨' : a.severity === 'warning' ? '⚠️' : '📋'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#0f172a' }}><strong>{a.userName}</strong> — {a.action} على {a.entityType}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(a.time).toLocaleString('ar-EG')}</div>
                </div>
              </div>
            )) : <p style={{ color: '#94a3b8', padding: '20px', textAlign: 'center' }}>لا يوجد نشاط حديث</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/admin/books" style={linkStyle}>📚 إدارة الكتب</Link>
            <Link href="/admin/users" style={linkStyle}>👥 المستخدمون ({s.totalUsers})</Link>
            <Link href="/admin/reviews" style={linkStyle}>💬 مراجعات معلّقة ({s.pendingReviews})</Link>
            <Link href="/admin/messages" style={linkStyle}>📧 رسائل جديدة ({s.newMessages})</Link>
            <Link href="/admin/audit-logs" style={linkStyle}>📜 سجل التدقيق</Link>
            <Link href="/admin/settings" style={linkStyle}>⚙️ الإعدادات</Link>
            <Link href="/admin/reports" style={linkStyle}>📈 التقارير</Link>
            {s.criticalLogs > 0 && (
              <div style={{ ...linkStyle, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>🚨 {s.criticalLogs} تنبيهات حرجة</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const linkStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#0f172a', textDecoration: 'none', cursor: 'pointer' }
