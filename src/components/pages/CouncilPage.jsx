import { useState, useRef, useEffect } from 'react';
import AgentAvatar from '../shared/AgentAvatar';
import { AGENT_COLORS } from '../../data/constants';

export default function CouncilPage({
  sessions, activeSession, setActiveSession,
  createSession, agents,
  onSendMessage, councilLoading,
}) {
  const [topic, setTopic]       = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const bottomRef               = useRef(null);

  const session = sessions.find(s => s.id === activeSession);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages?.length]);

  const handleCreate = async () => {
    if (!topic.trim()) return;
    await createSession(topic);
    setTopic(''); setShowNew(false);
    // No auto-debate — user types first message to start
  };

  const handleSend = () => {
    if (!msgInput.trim() || !session || councilLoading) return;
    onSendMessage(session.id, msgInput.trim());
    setMsgInput('');
  };

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Session list */}
      <div style={{ width:260, borderRight:'1px solid #1A1D26', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid #1A1D26' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#DDE1EE', marginBottom:12 }}>Council Sessions</div>
          <button onClick={()=>setShowNew(!showNew)}
            style={{ width:'100%', background:'#4F6EF7', border:'none', borderRadius:10, padding:'9px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            + New Session
          </button>
          {showNew && (
            <div style={{ marginTop:10 }}>
              <input value={topic} onChange={e=>setTopic(e.target.value)}
                placeholder="Debate topic…"
                onKeyDown={e=>e.key==='Enter'&&handleCreate()}
                style={{ width:'100%', background:'#0B0D13', border:'1px solid #4F6EF7', borderRadius:8, padding:'9px 12px', color:'#DDE1EE', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", marginBottom:8 }} />
              <button onClick={handleCreate} disabled={!topic.trim()}
                style={{ width:'100%', background:topic.trim()?'#22C55E':'#252830', border:'none', borderRadius:8, padding:'8px', color:'#fff', fontSize:13, fontWeight:700, cursor:topic.trim()?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif" }}>
                Create Session →
              </button>
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {sessions.map(s=>(
            <div key={s.id} onClick={()=>setActiveSession(s.id)}
              style={{ padding:'12px 10px', borderRadius:10, cursor:'pointer', background:activeSession===s.id?'#1A1D2E':'transparent', border:activeSession===s.id?'1px solid #4F6EF733':'1px solid transparent', marginBottom:4, transition:'all 0.12s' }}
              onMouseEnter={e=>{ if(activeSession!==s.id) e.currentTarget.style.background='#13151E'; }}
              onMouseLeave={e=>{ if(activeSession!==s.id) e.currentTarget.style.background='transparent'; }}>
              <div style={{ fontSize:13, fontWeight:600, color:activeSession===s.id?'#DDE1EE':'#7A8299', marginBottom:4, lineHeight:1.3 }}>{s.topic}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'#3D4255' }}>{s.messages?.length||0} messages</span>
                <span style={{ background:s.status==='active'?'#22C55E20':'#3D425520', color:s.status==='active'?'#22C55E':'#5A6580', borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session view */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!session ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#3D4255' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⬡</div>
            <div style={{ fontSize:15, fontWeight:600 }}>No session selected</div>
            <div style={{ fontSize:12, marginTop:6 }}>Create a new Council session to start a multi-agent debate</div>
          </div>
        ) : (
          <>
            {/* Session header */}
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #1A1D26', background:'#0D0F17' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE', marginBottom:6 }}>{session.topic}</div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  {agents.filter(a=>['Jarvis','Scout','Quill','Henry'].includes(a.name)).map((a,i)=>(
                    <div key={a.name} title={a.name} style={{ marginLeft: i===0 ? 0 : -6 }}>
                      <AgentAvatar agent={a.name} size={24} agents={agents} />
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:12, color:'#5A6580' }}>Jarvis · Scout · Quill · Henry</span>
                {councilLoading && (
                  <span style={{ fontSize:11, color:'#4F6EF7', animation:'pulse 1s infinite' }}>⚡ Agents responding…</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:12 }}>
              {/* Empty state */}
              {(!session.messages || session.messages.length === 0) && !councilLoading && (
                <div style={{ textAlign:'center', color:'#3D4255', padding:'40px' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>⬡</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#5A6580', marginBottom:6 }}>Council is ready</div>
                  <div style={{ fontSize:12 }}>Type your first message below — all four agents will respond in character.</div>
                </div>
              )}

              {/* Message bubbles */}
              {session.messages?.map((msg, i) => {
                const isUser = msg.isUser || msg.agent === 'You';
                return (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                    {!isUser && <AgentAvatar agent={msg.agent} size={34} agents={agents} />}
                    {isUser && (
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'#4F6EF720', border:'1px solid #4F6EF744', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👤</div>
                    )}
                    <div style={{ flex:1, maxWidth:'75%', background: isUser ? '#111830' : '#11131C', border:`1px solid ${isUser ? '#4F6EF733' : (AGENT_COLORS[msg.agent]||'#252830')+'33'}`, borderRadius:14, padding:'12px 16px', borderTopLeftRadius: isUser ? 14 : 4, borderTopRightRadius: isUser ? 4 : 14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:700, color: isUser ? '#7B8FFF' : (AGENT_COLORS[msg.agent]||'#DDE1EE') }}>
                          {isUser ? 'You' : msg.agent}
                        </span>
                        <span style={{ fontSize:10, color:'#3D4255' }}>{msg.time||'just now'}</span>
                      </div>
                      <div style={{ fontSize:13, color:'#C8CDD8', lineHeight:1.65, whiteSpace:'pre-wrap' }}>{msg.message}</div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {councilLoading && (
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#252830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>⬡</div>
                  <div style={{ background:'#11131C', border:'1px solid #252830', borderRadius:14, borderTopLeftRadius:4, padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#4F6EF7', animation:`pulse 1.2s ${i*0.2}s infinite` }} />
                      ))}
                      <span style={{ fontSize:12, color:'#5A6580', marginLeft:6 }}>Agents deliberating…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message input bar */}
            <div style={{ padding:'14px 24px', borderTop:'1px solid #1A1D26', background:'#0D0F17', display:'flex', gap:10 }}>
              <input
                value={msgInput}
                onChange={e=>setMsgInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSend()}
                placeholder="Ask the Council anything… (Enter to send)"
                disabled={councilLoading}
                style={{ flex:1, background:'#13151E', border:'1px solid #1A1D26', borderRadius:10, padding:'10px 14px', color:'#DDE1EE', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", opacity: councilLoading ? 0.5 : 1 }}
              />
              <button onClick={handleSend} disabled={!msgInput.trim()||councilLoading}
                style={{ background:msgInput.trim()&&!councilLoading?'#4F6EF7':'#1A1D2E', border:'1px solid transparent', borderRadius:10, color:msgInput.trim()&&!councilLoading?'#fff':'#4A5270', padding:'10px 18px', fontSize:13, fontWeight:700, cursor:msgInput.trim()&&!councilLoading?'pointer':'not-allowed', flexShrink:0, transition:'all 0.12s', fontFamily:"'DM Sans',sans-serif" }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
