export default function AdminRolesPage() {
  const perms = [
    {l:'تصفّح المكتبة',r:true,a:true,li:true,ad:true},{l:'تنزيل الكتب',r:true,a:true,li:true,ad:true},{l:'إضافة تقييم',r:true,a:true,li:true,ad:true},{l:'قوائم مفضلة',r:true,a:true,li:true,ad:true},
    {l:'رفع PDF/أغلفة',r:false,a:true,li:true,ad:true},{l:'إضافة/تعديل الكتب',r:false,a:false,li:true,ad:true},{l:'نشر/إخفاء الكتب',r:false,a:false,li:true,ad:true},{l:'إدارة التصنيفات',r:false,a:false,li:true,ad:true},
    {l:'اعتدال المراجعات',r:false,a:false,li:true,ad:true},{l:'إدارة المستخدمين',r:false,a:false,li:false,ad:true},{l:'تعديل الأدوار',r:false,a:false,li:false,ad:true},{l:'عرض سجل التدقيق',r:false,a:false,li:false,ad:true},
    {l:'حذف نهائي',r:false,a:false,li:false,ad:true},{l:'الإعدادات العامة',r:false,a:false,li:false,ad:true}
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>🛡️ الأدوار والصلاحيات</h1>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#075985' }}>ℹ️ الأدوار معرّفة كـ isSystem: true — لا يمكن حذفها.</div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'right', padding: '14px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc' }}>الصلاحية</th>{['قارئ','مساعد','أمين مكتبة','مدير'].map(h => <th key={h} style={{ textAlign: 'center', padding: '14px', fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f8fafc' }}>{h}</th>)}</tr></thead>
            <tbody>
              {perms.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'right' }}>{p.l}</td>
                  {[p.r, p.a, p.li, p.ad].map((v, j) => <td key={j} style={{ padding: '12px', textAlign: 'center' }}>{v ? <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span> : <span style={{ color: '#cbd5e1', opacity: 0.3, fontSize: '16px' }}>✗</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
