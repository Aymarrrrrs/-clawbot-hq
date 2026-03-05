import { useState } from 'react';
import AgentAvatar from '../shared/AgentAvatar';

const STATUS_STYLE = {
  draft:     { bg:'#F59E0B20', color:'#F59E0B', label:'Draft' },
  review:    { bg:'#4F6EF720', color:'#4F6EF7', label:'In Review' },
  published: { bg:'#22C55E20', color:'#22C55E', label:'Published' },
};
const TYPE_ICON = { report:'📊', script:'🎬', email:'📧', brief:'📋', analysis:'🔍' };

function ContentModal({ item, onClose, onStatusChange }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#13151E', border:'1px solid #252830', borderRadius:18, padding:28, width:600, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>{item.title}</div>
            <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#5A6580' }}>by {item.agent}</span>
              <span style={{ fontSize:11, color:'#3D4255' }}>·</span>
              <span style={{ fontSize:11, color:'#3D4255' }}>{new Date(item.created_at).toLocaleDateString()}</span>
              <span style={{ ...STATUS_STYLE[item.status], borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{STATUS_STYLE[item.status]?.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#5A6580', cursor:'pointer', fontSize:20 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', background:'#0F1117', border:'1px solid #252830', borderRadius:12, padding:'16px', marginBottom:16 }}>
          <pre style={{ color:'#DDE1EE', fontSize:13, lineHeight:1.7, fontFamily:"'DM Sans',sans-serif", whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{item.body||'No content yet.'}</pre>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {item.status!=='published'&&<button onClick={()=>{onStatusChange(item.id,'published');onClose();}} style={{ flex:1, padding:'10px', background:'#22C55E', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>✓ Approve & Publish</button>}
          {item.status!=='review'&&item.status!=='published'&&<button onClick={()=>{onStatusChange(item.id,'review');onClose();}} style={{ flex:1, padding:'10px', background:'#4F6EF7', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Send to Review</button>}
          <button onClick={onClose} style={{ padding:'10px 20px', background:'transparent', border:'1px solid #252830', borderRadius:10, color:'#5A6580', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ContentPage({ content, agents, onUpdateContent, onGenerateContent, generateLoading }) {
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [genAgent, setGenAgent] = useState('Quill');
  const [genType, setGenType] = useState('script');

  const filtered = filter==='all' ? content : content.filter(c=>c.status===filter);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {viewing&&<ContentModal item={viewing} onClose={()=>setViewing(null)} onStatusChange={(id,s)=>onUpdateContent(id,{status:s})} />}
      <div style={{ flex:1, padding:'24px 26px', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#DDE1EE' }}>Content Library</div>
            <div style={{ fontSize:12, color:'#4B5A70', marginTop:3 }}>Deliverables and outputs from all agents</div>
          </div>
          <button onClick={()=>setShowGenerate(true)}
            style={{ background:'#4F6EF7', border:'none', borderRadius:10, padding:'9px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px #4F6EF744' }}>
            {generateLoading?'⚡ Generating...':'+ Generate Content'}
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[['all','All'],['draft','Drafts'],['review','In Review'],['published','Published']].map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)}
              style={{ padding:'6px 14px', borderRadius:8, border:filter===val?'1px solid #4F6EF766':'1px solid #252830', background:filter===val?'#4F6EF720':'transparent', color:filter===val?'#7B8FFF':'#5A6580', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}>
              {label}
              <span style={{ marginLeft:6, background:'#1A1D26', borderRadius:10, padding:'1px 6px', fontSize:10, color:'#5A6580' }}>{val==='all'?content.length:content.filter(c=>c.status===val).length}</span>
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {filtered.map(item=>{
            const ss = STATUS_STYLE[item.status]||STATUS_STYLE.draft;
            return (
              <div key={item.id} onClick={()=>setViewing(item)}
                style={{ background:'#11131C', border:'1px solid #1A1D26', borderRadius:14, padding:'18px', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#252830';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1A1D26';e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:20 }}>{TYPE_ICON[item.type]||'📄'}</div>
                  <span style={{ background:ss.bg, color:ss.color, borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{ss.label}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:'#DDE1EE', marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12, color:'#5A6175', marginBottom:14, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {item.body||'No content yet.'}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <AgentAvatar agent={item.agent} size={22} agents={agents} />
                    <span style={{ fontSize:11, color:'#5A6580' }}>{item.agent}</span>
                  </div>
                  <span style={{ fontSize:11, color:'#3D4255' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length===0&&(
          <div style={{ textAlign:'center', padding:'60px', color:'#3D4255' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:600 }}>No content yet</div>
            <div style={{ fontSize:12, marginTop:6 }}>Generate content or wait for agents to produce deliverables</div>
          </div>
        )}
      </div>

      {/* Generate modal */}
      {showGenerate&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
          <div style={{ background:'#13151E', border:'1px solid #252830', borderRadius:18, padding:28, width:480, boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE', marginBottom:20 }}>Generate Content</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>What do you need?</label>
              <textarea value={genPrompt} onChange={e=>setGenPrompt(e.target.value)} rows={4} placeholder="e.g. Write 3 TikTok hooks for a productivity app targeting solopreneurs..."
                style={{ width:'100%', background:'#0B0D13', border:'1px solid #252830', borderRadius:10, padding:'12px', color:'#DDE1EE', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" }}
                onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
            </div>
            <div style={{ display:'flex', gap:14, marginBottom:20 }}>
              {[['Agent',genAgent,setGenAgent,agents.map(a=>a.name)],['Type',genType,setGenType,['script','report','email','brief','analysis']]].map(([label,val,setter,opts])=>(
                <div key={label} style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
                  <select value={val} onChange={e=>setter(e.target.value)} style={{ width:'100%', background:'#0B0D13', border:'1px solid #252830', borderRadius:8, padding:'10px 12px', color:'#DDE1EE', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowGenerate(false)} style={{ flex:1, padding:'11px', background:'transparent', border:'1px solid #252830', borderRadius:10, color:'#5A6580', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={()=>{ if(genPrompt.trim()){ onGenerateContent({prompt:genPrompt,agent:genAgent,type:genType}); setShowGenerate(false); setGenPrompt(''); }}}
                disabled={!genPrompt.trim()||generateLoading}
                style={{ flex:2, padding:'11px', background:genPrompt.trim()?'#4F6EF7':'#252830', border:'none', borderRadius:10, color:'#fff', cursor:genPrompt.trim()?'pointer':'not-allowed', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                {generateLoading?'⚡ Generating...':'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
