import { useState } from 'react';

const FORMATS = [
  { value:'carousel',     label:'Carousel' },
  { value:'static',       label:'Static'   },
  { value:'before-after', label:'Before / After' },
];

const CONCEPT_TYPES = [
  'Hook-Based','Product Feature','Testimonial','Problem / Solution','Lifestyle','UGC Style',
];

const inp = {
  background:'#13151E', border:'1px solid #1A1D26', borderRadius:8,
  color:'#DDE1EE', padding:'9px 12px', fontSize:13, outline:'none', width:'100%',
};
const lbl = {
  fontSize:11, color:'#4A5270', fontWeight:600, marginBottom:5,
  display:'block', textTransform:'uppercase', letterSpacing:'0.06em',
};

export default function OssiaCreativePage() {
  const [form, setForm] = useState({
    productUrl:'', format:'carousel', conceptType:'Hook-Based', numConcepts:3, extraContext:'',
  });
  const [status, setStatus]   = useState('idle'); // idle | generating | ready | error
  const [errMsg, setErrMsg]   = useState('');
  const [rawLog, setRawLog]   = useState(null);   // { url, payload, httpStatus, body, error }
  const [showDebug, setShowDebug] = useState(false);

  const WEBHOOK = process.env.REACT_APP_MAKE_WEBHOOK_URL;
  const NOTION  = process.env.REACT_APP_NOTION_AD_LIBRARY_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!WEBHOOK) {
      setStatus('error');
      setErrMsg('REACT_APP_MAKE_WEBHOOK_URL not set in Vercel env.');
      setRawLog({ url:'(not set)', payload:null, httpStatus:null, body:null, error:'Env var missing' });
      return;
    }

    const payload = { ...form, timestamp: new Date().toISOString() };
    const log = { url: WEBHOOK, payload, httpStatus: null, body: null, error: null };

    setStatus('generating'); setErrMsg(''); setRawLog(null);

    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      log.httpStatus = res.status;
      try { log.body = await res.text(); } catch { log.body = '(could not read body)'; }
      setRawLog(log);

      if (!res.ok) throw new Error(`HTTP ${res.status} — ${(log.body||'').slice(0, 200)}`);
      setStatus('ready');

    } catch (err) {
      const isCors = err.message === 'Failed to fetch' ||
                     err.message === 'Load failed' ||
                     err.message?.includes('NetworkError');
      log.error = isCors
        ? 'Network/CORS error — request never reached Make. Check that the webhook URL is correct and Make allows browser requests.'
        : err.message;
      setRawLog(log);
      setStatus('error');
      setErrMsg(log.error);
    }
  };

  const maskedUrl = WEBHOOK
    ? WEBHOOK.replace(/(hook\.[^/]+\/[^/]+\/)[^/]+/, '$1••••••••')
    : '(not set)';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#EC4899,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎨</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>Ossia Creative Engine</div>
          <div style={{ fontSize:12, color:'#4A5270' }}>Generate ad concepts via Make automation</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', gap:24, flexWrap:'wrap' }}>
        {/* Form */}
        <div style={{ flex:'1 1 360px', maxWidth:520 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div>
              <label style={lbl}>Product URL</label>
              <input style={inp} placeholder="https://yourstore.com/products/..."
                value={form.productUrl} onChange={e=>setForm(p=>({...p,productUrl:e.target.value}))} required />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Ad Format</label>
                <select style={inp} value={form.format} onChange={e=>setForm(p=>({...p,format:e.target.value}))}>
                  {FORMATS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Concepts (#)</label>
                <input style={inp} type="number" min={1} max={10}
                  value={form.numConcepts} onChange={e=>setForm(p=>({...p,numConcepts:+e.target.value}))} />
              </div>
            </div>

            <div>
              <label style={lbl}>Concept Type</label>
              <select style={inp} value={form.conceptType} onChange={e=>setForm(p=>({...p,conceptType:e.target.value}))}>
                {CONCEPT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Extra Context</label>
              <textarea style={{...inp, resize:'vertical', minHeight:80}}
                placeholder="Target audience, key pain points, tone, competitors to beat..."
                value={form.extraContext} onChange={e=>setForm(p=>({...p,extraContext:e.target.value}))} />
            </div>

            <button type="submit" disabled={status==='generating'}
              style={{ background:status==='generating'?'#1A1D2E':'linear-gradient(135deg,#4F6EF7,#7B5CF6)', border:'1px solid transparent', borderRadius:8, color:status==='generating'?'#4A5270':'#DDE1EE', padding:'11px 20px', fontSize:13, fontWeight:600, cursor:status==='generating'?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.12s' }}>
              {status==='generating'
                ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #4F6EF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Firing webhook...</>
                : '⚡ Generate Concepts'}
            </button>
          </form>

          {/* Status panels */}
          {status==='ready' && (
            <div style={{ marginTop:16, background:'#0A1410', border:'1px solid #22C55E44', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span>✅</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#22C55E' }}>Webhook fired — Make received the request</span>
              </div>
              <div style={{ fontSize:12, color:'#4A5270', marginBottom:10 }}>Your concepts are generating in Make. View results in the Notion Ad Library.</div>
              {NOTION && (
                <a href={NOTION} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#4F6EF720', border:'1px solid #4F6EF744', borderRadius:8, padding:'7px 14px', fontSize:12, color:'#7B8FFF', fontWeight:600, textDecoration:'none' }}>
                  📚 Open Notion Ad Library →
                </a>
              )}
            </div>
          )}
          {status==='error' && (
            <div style={{ marginTop:16, background:'#1A0B0B', border:'1px solid #EF444444', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', marginBottom:4 }}>⚠ Webhook Error</div>
              <div style={{ fontSize:12, color:'#C08080', lineHeight:1.6 }}>{errMsg}</div>
            </div>
          )}

          {/* Raw Debug Log */}
          {rawLog && (
            <div style={{ marginTop:12 }}>
              <button onClick={()=>setShowDebug(v=>!v)}
                style={{ background:'none', border:'none', color:'#4A5270', fontSize:11, cursor:'pointer', padding:0, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:4 }}>
                {showDebug ? '▾' : '▸'} Raw request/response log
              </button>
              {showDebug && (
                <div style={{ marginTop:8, background:'#080A10', border:'1px solid #1A1D26', borderRadius:8, padding:'12px 14px', fontSize:11, fontFamily:'monospace', color:'#7A8299', overflowX:'auto' }}>
                  <div style={{ marginBottom:6 }}>
                    <span style={{ color:'#4A5270' }}>URL: </span>
                    <span style={{ color:'#DDE1EE', wordBreak:'break-all' }}>{maskedUrl}</span>
                  </div>
                  <div style={{ marginBottom:6 }}>
                    <span style={{ color:'#4A5270' }}>Method: </span><span style={{ color:'#7B8FFF' }}>POST</span>
                    {rawLog.httpStatus != null && (
                      <> · <span style={{ color:'#4A5270' }}>Status: </span>
                      <span style={{ color: rawLog.httpStatus < 300 ? '#22C55E' : '#EF4444', fontWeight:700 }}>{rawLog.httpStatus}</span></>
                    )}
                    {rawLog.httpStatus == null && rawLog.error && (
                      <> · <span style={{ color:'#EF4444' }}>No response (network error)</span></>
                    )}
                  </div>
                  {rawLog.payload && (
                    <div style={{ marginBottom:6 }}>
                      <div style={{ color:'#4A5270', marginBottom:2 }}>Payload sent:</div>
                      <pre style={{ margin:0, color:'#C8CDD8', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                        {JSON.stringify(rawLog.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                  {rawLog.body != null && (
                    <div>
                      <div style={{ color:'#4A5270', marginBottom:2 }}>Response body:</div>
                      <pre style={{ margin:0, color: rawLog.httpStatus >= 200 && rawLog.httpStatus < 300 ? '#22C55E' : '#EF7777', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
                        {rawLog.body || '(empty)'}
                      </pre>
                    </div>
                  )}
                  {rawLog.error && (
                    <div>
                      <div style={{ color:'#4A5270', marginBottom:2 }}>Error:</div>
                      <pre style={{ margin:0, color:'#EF4444', whiteSpace:'pre-wrap' }}>{rawLog.error}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ width:210, flexShrink:0 }}>
          <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:10, padding:'16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#DDE1EE', marginBottom:12 }}>How it works</div>
            {[['1','Enter product URL & brief'],['2','Fires Make webhook'],['3','AI generates ad concepts'],['4','Drops into Notion Ad Library']].map(([n,t])=>(
              <div key={n} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ width:18, height:18, borderRadius:5, background:'#4F6EF720', border:'1px solid #4F6EF744', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#7B8FFF', fontWeight:700, flexShrink:0 }}>{n}</div>
                <div style={{ fontSize:12, color:'#4A5270', lineHeight:1.5 }}>{t}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:10, background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#3D4255', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Webhook URL</div>
            <div style={{ fontSize:10, color: WEBHOOK ? '#22C55E' : '#F59E0B', wordBreak:'break-all', lineHeight:1.5 }}>
              {WEBHOOK ? maskedUrl : '⚠ Not set'}
            </div>
          </div>

          {!NOTION && (
            <div style={{ marginTop:8, background:'#1A130A', border:'1px solid #F59E0B33', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#8A7040' }}>
              ⚠ Set <code style={{ color:'#F59E0B', background:'#2A1F08', borderRadius:4, padding:'1px 5px' }}>REACT_APP_NOTION_AD_LIBRARY_URL</code> for the library link
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
