import AgentAvatar from './AgentAvatar';
import { AGENT_COLORS, PRIORITY_COLOR } from '../../data/constants';
import { isSupabaseReady } from '../../lib/supabase';

function timeAgo(iso) {
  if (!iso) return 'just now';
  const diff = Date.now()-new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m<1) return 'just now'; if (m<60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

export default function LiveFeed({ activity, agents=[] }) {
  return (
    <div style={{ width:272, background:'#0D0F17', borderLeft:'1px solid #1A1D26', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'20px 18px 14px', borderBottom:'1px solid #1A1D26' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#DDE1EE' }}>Live Activity</div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:isSupabaseReady?'#22C55E':'#F59E0B', boxShadow:isSupabaseReady?'0 0 6px #22C55E':'0 0 6px #F59E0B', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:10, color:isSupabaseReady?'#22C55E':'#F59E0B', fontWeight:600 }}>{isSupabaseReady?'LIVE':'DEMO'}</span>
          </div>
        </div>
        <div style={{ fontSize:11, color:'#3D4255', marginTop:3 }}>Real-time agent operations</div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 12px' }}>
        {activity.map((item,i)=>(
          <div key={item.id||i} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'9px 4px', borderBottom:'1px solid #0F1117', opacity:Math.max(0.3,1-i*0.05) }}>
            <AgentAvatar agent={item.agent} size={28} agents={agents} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:700, color:AGENT_COLORS[item.agent]||'#DDE1EE' }}>{item.agent}</span>
                {item.priority&&<span style={{ fontSize:9, fontWeight:700, color:PRIORITY_COLOR[item.priority]||'#aaa', background:(PRIORITY_COLOR[item.priority]||'#aaa')+'20', padding:'1px 5px', borderRadius:4 }}>{item.priority}</span>}
                <span style={{ fontSize:10, color:'#3D4255', marginLeft:'auto' }}>{timeAgo(item.created_at)}</span>
              </div>
              <div style={{ fontSize:11, color:'#5A6580', marginTop:2, lineHeight:1.45, wordBreak:'break-word' }}>{item.action}</div>
              {item.deliverable&&<div style={{ fontSize:10, color:'#4F6EF7', marginTop:3 }}>→ {item.deliverable}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'12px 14px', borderTop:'1px solid #1A1D26' }}>
        <div style={{ fontSize:10, color:'#3D4255', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Agent Status</div>
        {agents.map(a=>(
          <div key={a.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:a.status==='active'?'#22C55E':'#3D4255' }} />
              <span style={{ fontSize:11, color:'#5A6580' }}>{a.name}</span>
            </div>
            <span style={{ fontSize:10, color:a.status==='active'?'#22C55E':'#3D4255' }}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
