import { useState } from 'react';
import AgentAvatar from '../shared/AgentAvatar';

export default function ApprovalsPage({ approvals, agents, onUpdateApproval }) {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const pending   = approvals.filter(a=>a.status==='pending');
  const resolved  = approvals.filter(a=>a.status!=='pending');
  const item = approvals.find(a=>a.id===selected);

  const STATUS = {
    pending:  { bg:'#F59E0B20', color:'#F59E0B', label:'Pending Review' },
    approved: { bg:'#22C55E20', color:'#22C55E', label:'Approved' },
    rejected: { bg:'#EF444420', color:'#EF4444', label:'Rejected' },
  };

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* List */}
      <div style={{ width:320, borderRight:'1px solid #1A1D26', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'20px 18px 14px', borderBottom:'1px solid #1A1D26' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>Approvals</div>
          <div style={{ fontSize:12, color:'#4B5A70', marginTop:3 }}>{pending.length} pending review</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {pending.length>0&&(
            <>
              <div style={{ fontSize:10, fontWeight:700, color:'#3D4255', textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 8px 4px' }}>Pending</div>
              {pending.map(a=>(
                <div key={a.id} onClick={()=>{setSelected(a.id);setNotes('');}}
                  style={{ padding:'12px 10px', borderRadius:10, cursor:'pointer', background:selected===a.id?'#1A1D2E':'transparent', border:selected===a.id?'1px solid #4F6EF733':'1px solid transparent', marginBottom:4, transition:'all 0.12s' }}
                  onMouseEnter={e=>{ if(selected!==a.id) e.currentTarget.style.background='#13151E'; }}
                  onMouseLeave={e=>{ if(selected!==a.id) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <AgentAvatar agent={a.agent} size={24} agents={agents} />
                    <span style={{ fontSize:12, fontWeight:600, color:'#DDE1EE', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color:'#5A6580' }}>{a.agent}</span>
                    <span style={{ background:STATUS.pending.bg, color:STATUS.pending.color, borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:600 }}>Pending</span>
                  </div>
                </div>
              ))}
            </>
          )}
          {resolved.length>0&&(
            <>
              <div style={{ fontSize:10, fontWeight:700, color:'#3D4255', textTransform:'uppercase', letterSpacing:'0.08em', padding:'12px 8px 4px' }}>Resolved</div>
              {resolved.map(a=>(
                <div key={a.id} onClick={()=>{setSelected(a.id);setNotes('');}}
                  style={{ padding:'12px 10px', borderRadius:10, cursor:'pointer', background:selected===a.id?'#1A1D2E':'transparent', border:selected===a.id?'1px solid #4F6EF733':'1px solid transparent', marginBottom:4, opacity:0.6, transition:'all 0.12s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <AgentAvatar agent={a.agent} size={22} agents={agents} />
                    <span style={{ fontSize:12, color:'#DDE1EE', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                  </div>
                  <span style={{ background:STATUS[a.status]?.bg, color:STATUS[a.status]?.color, borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{STATUS[a.status]?.label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!item?(
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#3D4255' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:15, fontWeight:600 }}>Select an approval to review</div>
            <div style={{ fontSize:12, marginTop:6 }}>{pending.length} items awaiting your decision</div>
          </div>
        ):(
          <>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #1A1D26' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <AgentAvatar agent={item.agent} size={36} agents={agents} />
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>{item.title}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                    <span style={{ fontSize:12, color:'#5A6580' }}>by {item.agent}</span>
                    <span style={{ fontSize:11, color:'#3D4255' }}>·</span>
                    <span style={{ fontSize:11, color:'#3D4255' }}>{new Date(item.created_at).toLocaleString()}</span>
                    <span style={{ background:STATUS[item.status]?.bg, color:STATUS[item.status]?.color, borderRadius:6, padding:'1px 7px', fontSize:11, fontWeight:600 }}>{STATUS[item.status]?.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
              <div style={{ background:'#0F1117', border:'1px solid #252830', borderRadius:12, padding:'16px 18px', marginBottom:20 }}>
                <pre style={{ color:'#DDE1EE', fontSize:13, lineHeight:1.7, fontFamily:"'DM Sans',sans-serif", whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{item.body||'No content provided.'}</pre>
              </div>

              {item.reviewer_notes&&(
                <div style={{ background:'#1A1D26', borderRadius:12, padding:'14px 18px', marginBottom:20, border:`1px solid ${STATUS[item.status]?.color}33` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:STATUS[item.status]?.color, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Reviewer Notes</div>
                  <div style={{ fontSize:13, color:'#DDE1EE' }}>{item.reviewer_notes}</div>
                </div>
              )}

              {item.status==='pending'&&(
                <>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Reviewer Notes (optional)</label>
                    <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Add feedback or instructions for revision..."
                      style={{ width:'100%', background:'#0B0D13', border:'1px solid #252830', borderRadius:10, padding:'12px', color:'#DDE1EE', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" }}
                      onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={()=>onUpdateApproval(item.id,'rejected',notes)}
                      style={{ flex:1, padding:'12px', background:'#EF444420', border:'1px solid #EF444444', borderRadius:10, color:'#EF4444', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#EF444430'} onMouseLeave={e=>e.currentTarget.style.background='#EF444420'}>
                      ✕ Reject
                    </button>
                    <button onClick={()=>onUpdateApproval(item.id,'approved',notes)}
                      style={{ flex:2, padding:'12px', background:'#22C55E', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#16A34A'} onMouseLeave={e=>e.currentTarget.style.background='#22C55E'}>
                      ✓ Approve & Publish
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
