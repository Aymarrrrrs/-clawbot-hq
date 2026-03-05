import { useState } from 'react';
import AgentAvatar from '../shared/AgentAvatar';
import { PRIORITY_COLOR } from '../../data/constants';

function AgentChat({ agent, chatMessages, onSend, loading }) {
  const [input, setInput] = useState('');
  const send = () => { if(input.trim()){ onSend(input); setInput(''); }};
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        {chatMessages.length===0&&(
          <div style={{ textAlign:'center', color:'#3D4255', fontSize:13, padding:'40px 20px' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>💬</div>
            Start a conversation with {agent.name}
          </div>
        )}
        {chatMessages.map((m,i)=>(
          <div key={i} style={{ display:'flex', gap:10, flexDirection:m.role==='user'?'row-reverse':'row', alignItems:'flex-start' }}>
            {m.role==='assistant'&&<AgentAvatar agent={agent.name} size={28} agents={[agent]} />}
            <div style={{ maxWidth:'75%', background:m.role==='user'?'#4F6EF7':'#1A1D26', border:m.role==='user'?'none':'1px solid #252830', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#DDE1EE', lineHeight:1.55 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <AgentAvatar agent={agent.name} size={28} agents={[agent]} />
            <div style={{ background:'#1A1D26', border:'1px solid #252830', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#5A6580' }}>
              <span style={{ animation:'pulse 1s infinite' }}>Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding:'12px 16px', borderTop:'1px solid #1A1D26', display:'flex', gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder={`Message ${agent.name}...`}
          style={{ flex:1, background:'#0F1117', border:'1px solid #252830', borderRadius:10, padding:'10px 14px', color:'#DDE1EE', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" }}
          onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
        <button onClick={send} disabled={!input.trim()||loading}
          style={{ background:input.trim()?'#4F6EF7':'#252830', border:'none', borderRadius:10, padding:'10px 18px', color:'#fff', cursor:input.trim()?'pointer':'not-allowed', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:'background 0.15s' }}>
          Send
        </button>
      </div>
    </div>
  );
}

function EditPromptModal({ agent, onClose, onSave }) {
  const [prompt, setPrompt] = useState(agent.system_prompt||'');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#13151E', border:'1px solid #252830', borderRadius:18, padding:28, width:560, boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE', marginBottom:6 }}>Edit {agent.name}'s System Prompt</div>
        <div style={{ fontSize:12, color:'#4B5A70', marginBottom:16 }}>This is the instruction set that defines how {agent.name} thinks and responds.</div>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={12}
          style={{ width:'100%', background:'#0B0D13', border:'1px solid #252830', borderRadius:10, padding:'12px 14px', color:'#DDE1EE', fontSize:13, resize:'vertical', outline:'none', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.6, boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid #252830', borderRadius:10, color:'#5A6580', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={()=>{onSave(prompt);onClose();}} style={{ flex:2, padding:'10px', background:'#4F6EF7', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Save Prompt</button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage({ agents, onUpdateAgent, activity, onTriggerAgent, chatMessages, onChatSend, chatLoading }) {
  const [selected, setSelected] = useState(agents[0]?.id);
  const [tab, setTab] = useState('chat'); // chat | prompt | history
  const [editingPrompt, setEditingPrompt] = useState(false);
  const agent = agents.find(a=>a.id===selected)||agents[0];
  if (!agent) return null;
  const agentActivity = activity.filter(a=>a.agent===agent.name).slice(0,15);

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Agent list */}
      <div style={{ width:220, borderRight:'1px solid #1A1D26', padding:'20px 12px', display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#3D4255', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, paddingLeft:8 }}>Agent Roster</div>
        {agents.map(a=>(
          <div key={a.id} onClick={()=>setSelected(a.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 10px', borderRadius:10, cursor:'pointer', background:selected===a.id?'#1A1D2E':'transparent', border:selected===a.id?`1px solid ${a.color}33`:'1px solid transparent', transition:'all 0.12s' }}
            onMouseEnter={e=>{ if(selected!==a.id) e.currentTarget.style.background='#13151E'; }}
            onMouseLeave={e=>{ if(selected!==a.id) e.currentTarget.style.background='transparent'; }}>
            <div style={{ position:'relative' }}>
              <AgentAvatar agent={a.name} size={36} agents={agents} />
              <div style={{ position:'absolute', bottom:0, right:0, width:10, height:10, borderRadius:'50%', background:a.status==='active'?'#22C55E':'#3D4255', border:'2px solid #0D0F17' }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:selected===a.id?'#DDE1EE':'#7A8299' }}>{a.name}</div>
              <div style={{ fontSize:11, color:'#3D4255' }}>{a.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent detail */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Agent header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <AgentAvatar agent={agent.name} size={48} agents={agents} />
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#DDE1EE' }}>{agent.name}</div>
              <div style={{ fontSize:13, color:'#5A6580' }}>{agent.role}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:agent.status==='active'?'#22C55E':'#F59E0B' }} />
                  <span style={{ fontSize:11, color:agent.status==='active'?'#22C55E':'#F59E0B', fontWeight:600, textTransform:'uppercase' }}>{agent.status}</span>
                </div>
                <span style={{ fontSize:11, color:'#3D4255' }}>·</span>
                <span style={{ fontSize:11, color:'#3D4255' }}>{agent.task_count||0} tasks completed</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setEditingPrompt(true)} style={{ background:'#1A1D26', border:'1px solid #252830', borderRadius:8, padding:'8px 14px', color:'#DDE1EE', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>✏️ Edit Prompt</button>
            <button onClick={()=>onTriggerAgent(agent)} style={{ background:'#4F6EF7', border:'none', borderRadius:8, padding:'8px 14px', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>⚡ Trigger</button>
            <button onClick={()=>onUpdateAgent(agent.id,{status:agent.status==='active'?'idle':'active'})}
              style={{ background:agent.status==='active'?'#EF444420':'#22C55E20', border:`1px solid ${agent.status==='active'?'#EF4444':'#22C55E'}44`, borderRadius:8, padding:'8px 14px', color:agent.status==='active'?'#EF4444':'#22C55E', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {agent.status==='active'?'Pause':'Activate'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1A1D26', padding:'0 24px' }}>
          {[['chat','💬 Chat'],['prompt','📋 System Prompt'],['history','📊 Activity']].map(([id,label])=>(
            <div key={id} onClick={()=>setTab(id)}
              style={{ padding:'12px 16px', fontSize:13, fontWeight:tab===id?600:400, color:tab===id?'#DDE1EE':'#4A5270', borderBottom:tab===id?'2px solid #4F6EF7':'2px solid transparent', cursor:'pointer', transition:'all 0.15s', marginBottom:'-1px' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex:1, overflow:'hidden' }}>
          {tab==='chat'&&<AgentChat agent={agent} chatMessages={chatMessages[agent.name]||[]} onSend={msg=>onChatSend(agent,msg)} loading={chatLoading} />}

          {tab==='prompt'&&(
            <div style={{ padding:'20px 24px', height:'100%', overflowY:'auto' }}>
              <div style={{ background:'#0F1117', border:'1px solid #252830', borderRadius:12, padding:'16px' }}>
                <div style={{ fontSize:11, color:'#5A6580', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Current System Prompt</div>
                <pre style={{ color:'#DDE1EE', fontSize:13, lineHeight:1.65, fontFamily:"'JetBrains Mono',monospace", whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{agent.system_prompt||'No system prompt configured.'}</pre>
              </div>
              <button onClick={()=>setEditingPrompt(true)} style={{ marginTop:16, background:'#4F6EF7', border:'none', borderRadius:10, padding:'10px 20px', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>✏️ Edit System Prompt</button>
            </div>
          )}

          {tab==='history'&&(
            <div style={{ padding:'20px 24px', height:'100%', overflowY:'auto' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#DDE1EE', marginBottom:16 }}>Recent Activity</div>
              {agentActivity.length===0&&<div style={{ color:'#3D4255', fontSize:13 }}>No activity yet.</div>}
              {agentActivity.map((item,i)=>(
                <div key={item.id||i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid #1A1D26' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#1A1D26', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⚡</div>
                  <div>
                    <div style={{ fontSize:13, color:'#DDE1EE', marginBottom:3 }}>{item.action}</div>
                    {item.deliverable&&<div style={{ fontSize:11, color:'#4F6EF7' }}>→ {item.deliverable}</div>}
                    <div style={{ fontSize:11, color:'#3D4255', marginTop:4 }}>{item.created_at?new Date(item.created_at).toLocaleString():'just now'}</div>
                  </div>
                  {item.priority&&<span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, color:PRIORITY_COLOR[item.priority], background:PRIORITY_COLOR[item.priority]+'20', padding:'2px 7px', borderRadius:4, height:'fit-content', flexShrink:0 }}>{item.priority}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingPrompt&&<EditPromptModal agent={agent} onClose={()=>setEditingPrompt(false)} onSave={p=>onUpdateAgent(agent.id,{system_prompt:p})} />}
    </div>
  );
}
