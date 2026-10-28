'use client'
import { useState, useEffect } from 'react'

interface User { id: string; name: string | null; email: string | null; twoFactorEnabled: boolean; lastLoginAt: string | null; createdAt: string; userRoles: { role: { name: string } }[] }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [search])
  const fetchUsers = async () => { setLoading(true); try { const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`); const d = await res.json(); setUsers(d.users || []) } catch {} finally { setLoading(false) } }
  const changeRole = async (userId: string, roleName: string) => { await fetch(`/api/admin/users/${userId}/role`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleName }) }); fetchUsers() }
  const rc: Record<string, {bg:string;text:string}> = { admin:{bg:'#fef2f2',text:'#dc2626'}, librarian:{bg:'#eef2ff',text:'#4f46e5'}, assistant:{bg:'#f0f9ff',text:'#0ea5e9'}, reader:{bg:'#f1f5f9',text:'#64748b'} }
  const getRole = (u: User) => u.userRoles.length ? u.userRoles[0].role.name : 'reader'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>👥 إدارة المستخدمين</h1>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث..." style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', marginBottom: '16px', fontFamily: 'inherit', outline: 'none' }} />
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['المستخدم','البريد','الدور','2FA','آخر دخول','التسجيل'].map(h => <th key={h} style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>⏳</td></tr> :
               users.map(u => { const role = getRole(u); const c = rc[role] || rc.reader; return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>{u.name || u.id.substring(0,8)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><select value={role} onChange={e => changeRole(u.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: c.bg, color: c.text, fontFamily: 'inherit', outline: 'none' }}><option value="reader">قارئ</option><option value="assistant">مساعد</option><option value="librarian">أمين مكتبة</option><option value="admin">مدير</option></select></td>
                  <td style={{ padding: '12px 16px', fontSize: '11px' }}>{u.twoFactorEnabled ? <span style={{ color: '#10b981', fontWeight: 600 }}>✓ مفعّل</span> : <span style={{ color: '#cbd5e1' }}>— غير مطلوب</span>}</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#94a3b8' }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ar-EG') : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#94a3b8' }}>{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
