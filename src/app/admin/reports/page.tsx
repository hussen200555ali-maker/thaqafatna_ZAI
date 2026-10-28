export default function AdminReportsPage() {
  const days = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة']
  const downloads = [142,187,234,165,198,247,187]
  const maxD = Math.max(...downloads)
  const cats = [{n:'📖 الأدب',c:17,p:50,col:'#4f46e5'},{n:'🕌 الدينية',c:5,p:15,col:'#10b981'},{n:'📜 التاريخ',c:4,p:12,col:'#f59e0b'},{n:'🔬 العلوم',c:3,p:9,col:'#8b5cf6'}]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '24px', fontFamily: 'Cairo, sans-serif' }}>📈 التقارير</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[{l:'التنزيلات',v:'3,287',t:'↑ 23%',up:true},{l:'مستخدمون جدد',v:'87',t:'↑ 12%',up:true},{l:'متوسط القراءة',v:'18 د',t:'↑ 3 د',up:true},{l:'معدل الإكمال',v:'42%',t:'↓ 2%',up:false}].map((k,i) => (
            <div key={i} style={{ background:'white',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'16px' }}><div style={{ fontSize:'12px',color:'#64748b' }}>{k.l}</div><div style={{ fontSize:'24px',fontWeight:800 }}>{k.v}</div><div style={{ fontSize:'11px',color:k.up?'#10b981':'#ef4444' }}>{k.t}</div></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div style={{ background:'white',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px' }}>
            <h2 style={{ fontSize:'15px',fontWeight:700,marginBottom:'16px' }}>📊 التنزيلات (7 أيام)</h2>
            <div style={{ display:'flex',alignItems:'flex-end',gap:'12px',height:'180px' }}>
              {downloads.map((d,i) => (
                <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center' }}>
                  <div style={{ fontSize:'11px',fontWeight:700,marginBottom:'4px' }}>{d}</div>
                  <div style={{ width:'100%',height:`${(d/maxD)*140}px`,background:'linear-gradient(180deg,#6366f1,#8b5cf6)',borderRadius:'6px 6px 0 0' }} />
                  <div style={{ fontSize:'11px',color:'#64748b',marginTop:'4px' }}>{days[i]}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'white',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'20px' }}>
            <h2 style={{ fontSize:'15px',fontWeight:700,marginBottom:'16px' }}>📂 حسب التصنيف</h2>
            {cats.map((c,i) => (
              <div key={i} style={{ marginBottom:'12px' }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px' }}><span>{c.n}</span><strong>{c.c}</strong></div>
                <div style={{ height:'8px',background:'#f1f5f9',borderRadius:'4px',overflow:'hidden' }}><div style={{ height:'100%',width:`${c.p}%`,background:c.col }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
