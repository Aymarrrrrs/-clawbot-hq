import { useMakeScenarios } from '../../hooks/useSupabase';

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m<1)  return 'just now';
  if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

const STATUS_COLOR = { active:'#22C55E', error:'#EF4444', paused:'#F59E0B' };
const STATUS_LABEL = { active:'Active', error:'Error', paused:'Paused' };

export default function PipelinePage() {
  const { scenarios, loading, triggering, fetchError, triggerResults, fetchScenarios, triggerScenario } = useMakeScenarios();
  const hasMakeKey = !!process.env.REACT_APP_MAKE_API_KEY;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#4F6EF7,#22C55E)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>◎</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>Pipeline</div>
            <div style={{ fontSize:12, color:'#4A5270' }}>
              Make.com scenarios · {hasMakeKey
                ? <span style={{ color:'#22C55E' }}>API key set</span>
                : <span style={{ color:'#F59E0B' }}>Demo — add API key</span>}
            </div>
          </div>
        </div>
        <button onClick={fetchScenarios} disabled={loading}
          style={{ background:'#1A1D2E', border:'1px solid #252830', borderRadius:8, color:'#7A8299', padding:'7px 14px', fontSize:12, fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
          {loading ? '⏳ Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {/* Env warning */}
        {!hasMakeKey && (
          <div style={{ background:'#1A130A', border:'1px solid #F59E0B33', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#8A7040', marginBottom:16, lineHeight:1.6 }}>
            ⚠ Connect Make.com by setting <code style={{ color:'#F59E0B', background:'#2A1F08', borderRadius:3, padding:'1px 5px' }}>REACT_APP_MAKE_API_KEY</code> and <code style={{ color:'#F59E0B', background:'#2A1F08', borderRadius:3, padding:'1px 5px' }}>REACT_APP_MAKE_TEAM_ID</code> in Vercel env vars. Showing demo data.
          </div>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div style={{ background:'#1A0B0B', border:'1px solid #EF444433', borderRadius:8, padding:'12px 14px', fontSize:12, color:'#C08080', marginBottom:16, lineHeight:1.6 }}>
            <div style={{ fontWeight:700, color:'#EF4444', marginBottom:4 }}>⚠ Could not load scenarios from Make API</div>
            <div style={{ fontFamily:'monospace', fontSize:11, color:'#EF7777', wordBreak:'break-all' }}>{fetchError}</div>
            {fetchError.includes('CORS') && (
              <div style={{ marginTop:8, color:'#8A6040', fontSize:11 }}>
                💡 Make's API does not allow direct browser requests. The scenarios below are demo data.
                To fix: route requests through a backend proxy and set <code style={{ color:'#F59E0B', background:'#2A1F08', borderRadius:3, padding:'1px 4px' }}>REACT_APP_MAKE_API_URL</code> to your proxy URL.
              </div>
            )}
          </div>
        )}

        {/* Scenario rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {scenarios.map(s => {
            const sc = STATUS_COLOR[s.status] || '#4B5563';
            const isRunning = triggering === s.id;
            const result = triggerResults[s.id];
            return (
              <div key={s.id} style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:10, padding:'15px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  {/* Status dot */}
                  <div style={{ width:8, height:8, borderRadius:'50%', background:sc, boxShadow:`0 0 6px ${sc}99`, flexShrink:0 }} />
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#DDE1EE', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'#4A5270' }}>
                      Last run: <span style={{ color:'#6A7090' }}>{timeAgo(s.last_run)}</span>
                      <span style={{ margin:'0 6px', color:'#2A2E40' }}>·</span>
                      Status: <span style={{ color:sc, fontWeight:600 }}>{STATUS_LABEL[s.status]||s.status}</span>
                    </div>
                  </div>
                  {/* Trigger button */}
                  <button onClick={()=>triggerScenario(s.id)} disabled={isRunning}
                    style={{ background:isRunning?'#1A1D2E':'#4F6EF720', border:`1px solid ${isRunning?'#252830':'#4F6EF744'}`, borderRadius:7, color:isRunning?'#4A5270':'#7B8FFF', padding:'6px 14px', fontSize:12, fontWeight:600, cursor:isRunning?'not-allowed':'pointer', flexShrink:0, transition:'all 0.12s' }}>
                    {isRunning ? '⏳ Running…' : '▶ Run'}
                  </button>
                </div>
                {/* Per-row trigger result */}
                {result && (
                  <div style={{ marginTop:10, padding:'8px 12px', borderRadius:6, background: result.ok ? '#0A1410' : '#1A0B0B', border:`1px solid ${result.ok ? '#22C55E33' : '#EF444433'}` }}>
                    <div style={{ fontSize:11, color: result.ok ? '#22C55E' : '#EF4444', fontWeight:600, marginBottom:2 }}>
                      {result.ok ? '✓ Trigger succeeded' : '✕ Trigger failed'}
                    </div>
                    <div style={{ fontSize:11, fontFamily:'monospace', color: result.ok ? '#5A8A6A' : '#C08080', wordBreak:'break-all' }}>{result.msg}</div>
                  </div>
                )}
              </div>
            );
          })}

          {scenarios.length === 0 && !loading && (
            <div style={{ textAlign:'center', color:'#3D4255', padding:'48px 0' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>◎</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#DDE1EE', marginBottom:6 }}>No scenarios</div>
              <div style={{ fontSize:12, color:'#4B5A70' }}>Connect Make API to see your automation scenarios.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
