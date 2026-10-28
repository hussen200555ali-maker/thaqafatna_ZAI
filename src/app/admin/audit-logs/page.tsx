'use client'
import { useState, useEffect } from 'react'

interface Log { id: number; action: string; entityType: string; entityId: string | null; severity: string; ipAddress: string | null; createdAt: string; user: { name: string | null } | null }

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ action: '', severity: '' })

  useEffect(() => { fetchLogs() }, [filter])
  const fetchLogs = async () => { setLoading(true); try { const p = new URLSearchParams(); if (filter.action) p.set('action', filter.action); if (filter.severity) p.set('severity', filter.severity); const res = await fetch(`/api/admin/audit-logs?${p}`); const d = await res.json(); setLogs(d.logs || []) } catch {} finally { setLoading(false) } }

  const sc: Record<string, {bg:string;text:string}> = { info:{bg:'#f1f5f9',text:'#64748b'}, warning:{bg:'#fffbeb',text:'#92400e'}, critical:{bg:'#fef2f2',text:'#dc2626'} }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>📜 سجل التدقيق</h1>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select value={filter.action} onChange={e => setFilter({...filter, action: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
            <option value="">كل العمليات</option><option value="CREATE">CREATE</option><option value="UPDATE">UPDATE</option><option value="DELETE">DELETE</option><option value="LOGIN">LOGIN</option><option value="LOGIN_FAILED">LOGIN_FAILED</option>
          </select>
          <select value={filter.severity} onChange={e => setFilter({...filter, severity: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: 'white' }}>
            <option value="">كل الخطورة</option><option value="info">info</option><option value="warning">warning</option><option value="critical">critical</option>
          </select>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['الوقت','المستخدم','العملية','الكيان','الخطورة','IP'].map(h => <th key={h} style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳</td></tr> :
               logs.length === 0 ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>لا توجد سجلات</td></tr> :
               logs.map(l => { const c = sc[l.severity] || sc.info; return (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{new Date(l.createdAt).toLocaleString('ar-EG')}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600 }}>{l.user?.name || 'النظام'}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: '#eef2ff', color: '#3730a3' }}>{l.action}</span></td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: '#475569' }}>{l.entityType}{l.entityId ? ` #${l.entityId.substring(0,8)}` : ''}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: c.bg, color: c.text }}>{l.severity}</span></td>
                  <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>{l.ipAddress || '—'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
