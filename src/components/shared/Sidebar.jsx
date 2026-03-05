import { NAV_ITEMS } from '../../data/constants';
import { isSupabaseReady } from '../../lib/supabase';

export default function Sidebar({ activeNav, setActiveNav, pendingApprovals }) {
  return (
    <div style={{ width:205, background:'#0D0F17', borderRight:'1px solid #1A1D26', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'18px 16px 20px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#4F6EF7,#7B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 4px 12px #4F6EF755' }}>🤖</div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#DDE1EE', letterSpacing:'-0.01em' }}>Clawbot HQ</div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background: isSupabaseReady?'#22C55E':'#F59E0B', boxShadow: isSupabaseReady?'0 0 4px #22C55E':'0 0 4px #F59E0B' }} />
            <span style={{ fontSize:10, color: isSupabaseReady?'#22C55E':'#F59E0B', fontWeight:600 }}>{isSupabaseReady?'LIVE':'DEMO'}</span>
          </div>
        </div>
      </div>
      <div style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = activeNav===item.id;
          const badge = item.badge==='approvals' ? pendingApprovals : item.badge;
          return (
            <div key={item.id} onClick={()=>setActiveNav(item.id)}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:active?600:400, color:active?'#DDE1EE':'#4A5270', background:active?'#1A1D2E':'transparent', transition:'all 0.12s' }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='#13151E';e.currentTarget.style.color='#7A8299';}}}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#4A5270';}}}>
              <span style={{ fontSize:13, width:18, textAlign:'center', opacity:active?1:0.7 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {badge>0 && <span style={{ background:'#4F6EF722', color:'#4F6EF7', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{badge}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding:'12px 14px', borderTop:'1px solid #1A1D26' }}>
        <div style={{ fontSize:10, color:'#2A2E40', textAlign:'center', fontFamily:"'JetBrains Mono',monospace" }}>v2.0.0 · Clawbot HQ</div>
      </div>
    </div>
  );
}
