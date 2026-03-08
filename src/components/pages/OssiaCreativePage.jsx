import { useState } from 'react';
import { useClaude } from '../../hooks/useClaude';

// ── Google Service Account — Vertex AI / Imagen Bearer Token ──────────────────
// ⚠  REACT_APP_* vars are bundled into the public JS. For shared deployments,
//    move JWT signing to a Vercel Edge Function.
const SA_CLIENT_EMAIL = 'make-imagen-automation@gen-lang-client-0070707113.iam.gserviceaccount.com';
const SA_PRIVATE_KEY  = (process.env.REACT_APP_GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const SA_TOKEN_URI    = 'https://oauth2.googleapis.com/token';
const IMAGEN_WEBHOOK  = 'https://hook.us2.make.com/3ftvqfu5vfq6340an58fhbx9z9odivm2';

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

// ── Strip markdown fences Claude sometimes wraps around JSON ──────────────────
function stripJsonFences(text) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ── Claude prompt: generates exactly the 6 fields Notion needs ────────────────
function buildConceptPrompt(form) {
  return `Generate ${form.numConcepts} ${form.conceptType} ad concepts for this product.

Brand: ${form.brand || 'Unknown brand'}
Product: ${form.product || 'Unknown product'}
Product URL: ${form.productUrl}
Ad Format: ${form.format}
Extra Context: ${form.extraContext || 'None provided'}

Respond with ONLY valid JSON — no markdown fences, no explanation, no text outside the JSON.
Use exactly this structure (do not add or rename any fields):
{
  "concepts": [
    {
      "concept_name": "Short memorable name for this concept (4-8 words)",
      "copy_angle": "The strategic angle or hook driving this concept (1 sentence)",
      "target_audience": "Specific audience segment this targets (1 sentence)",
      "best_platform": "Single best platform for this concept — e.g. Instagram Reels, TikTok, Facebook Feed",
      "caption_copy": "Full ready-to-post ad caption including hook, body, and CTA (3-5 sentences)",
      "audience_note": "One insight about why this audience responds to this angle (1 sentence)"
    }
  ]
}`;
}

const SYSTEM_PROMPT =
  `You are an expert performance marketing creative strategist for DTC brands. ` +
  `Generate ad concepts as valid JSON only. ` +
  `Never use markdown fences. Never add commentary. ` +
  `Your entire response must be a single valid JSON object starting with { and ending with }.`;

// ── Concept card field layout ─────────────────────────────────────────────────
const CONCEPT_FIELDS = [
  { key:'copy_angle',     label:'Copy Angle'       },
  { key:'target_audience',label:'Target Audience'  },
  { key:'best_platform',  label:'Best Platform'    },
  { key:'caption_copy',   label:'Caption Copy'     },
  { key:'audience_note',  label:'Audience Note'    },
];

// ── JWT helpers — SubtleCrypto RS256 ─────────────────────────────────────────
function b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function b64urlFromBytes(bytes) {
  let s = '';
  bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
async function getVertexToken() {
  const now     = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss:   SA_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   SA_TOKEN_URI,
    iat:   now,
    exp:   now + 3600,
  }));
  const sigInput  = `${header}.${payload}`;
  const pemBody   = SA_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(sigInput)
  );
  const jwt  = `${sigInput}.${b64urlFromBytes(new Uint8Array(signature))}`;
  const resp = await fetch(SA_TOKEN_URI, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error('Token exchange failed: ' + JSON.stringify(data));
  return data.access_token;
}

export default function OssiaCreativePage() {
  const [form, setForm] = useState({
    brand:'', product:'',
    productUrl:'', format:'carousel', conceptType:'Hook-Based', numConcepts:3, extraContext:'',
  });
  const [status, setStatus]         = useState('idle'); // idle | generating | ready | error
  const [errMsg, setErrMsg]         = useState('');
  const [rawLog, setRawLog]         = useState(null);
  const [showDebug, setShowDebug]   = useState(false);
  const [concepts, setConcepts]     = useState([]);
  const [parseError, setParseError] = useState('');

  // ── Enhance Agent state ───────────────────────────────────────────────────
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [enhanceStatus,   setEnhanceStatus]   = useState('idle'); // idle|enhancing|done|error
  const [enhanceErr,      setEnhanceErr]      = useState('');

  // ── Generate Images state ─────────────────────────────────────────────────
  const [imageStatus, setImageStatus] = useState('idle'); // idle|token|triggering|done|error
  const [imageMsg,    setImageMsg]    = useState('');

  const { call } = useClaude();

  const WEBHOOK = process.env.REACT_APP_MAKE_WEBHOOK_URL;
  const NOTION  = process.env.REACT_APP_NOTION_AD_LIBRARY_URL;
  const API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

  // ── Main submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!WEBHOOK) {
      setStatus('error');
      setErrMsg('REACT_APP_MAKE_WEBHOOK_URL not set in Vercel env.');
      setRawLog({ url:'(not set)', payload:null, httpStatus:null, body:null, error:'Env var missing' });
      return;
    }

    setStatus('generating'); setErrMsg(''); setRawLog(null); setConcepts([]); setParseError('');

    // Step 1: Call Claude, strip fences, parse JSON
    let parsedConcepts = null;

    if (API_KEY) {
      try {
        const claudeRaw = await call(SYSTEM_PROMPT, [{ role:'user', content: buildConceptPrompt(form) }]);
        const cleaned   = stripJsonFences(claudeRaw);
        const parsed    = JSON.parse(cleaned);

        parsedConcepts = (parsed.concepts || []).map(c => ({
          concept_name:    c.concept_name    || '',
          copy_angle:      c.copy_angle      || '',
          target_audience: c.target_audience || '',
          best_platform:   c.best_platform   || '',
          caption_copy:    c.caption_copy    || '',
          audience_note:   c.audience_note   || '',
          brand:           form.brand        || '',
          product:         form.product      || '',
        }));

        setConcepts(parsedConcepts);
      } catch (parseErr) {
        const msg = parseErr instanceof SyntaxError
          ? `JSON parse failed: ${parseErr.message}`
          : `Claude call failed: ${parseErr.message}`;
        setParseError(msg);
      }
    }

    // Step 2: Fire Make webhook with pre-parsed concepts
    const payload = {
      brand:        form.brand,
      product:      form.product,
      productUrl:   form.productUrl,
      format:       form.format,
      conceptType:  form.conceptType,
      numConcepts:  form.numConcepts,
      extraContext: form.extraContext,
      timestamp:    new Date().toISOString(),
      ...(parsedConcepts ? { concepts: parsedConcepts } : {}),
    };
    const log = { url: WEBHOOK, payload, httpStatus: null, body: null, error: null };

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
        ? 'Network/CORS error — request never reached Make. Check that the webhook URL is correct.'
        : err.message;
      setRawLog(log);
      setStatus('error');
      setErrMsg(log.error);
    }
  };

  // ── Enhance with Agent ────────────────────────────────────────────────────
  const handleEnhance = async () => {
    if (!API_KEY || concepts.length === 0) return;
    setEnhanceStatus('enhancing'); setEnhanceErr('');

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system:
            'You are the Ossia Creative Director. Review these ad concepts and enhance them ' +
            'based on brand guidelines. Return ONLY a raw JSON array in the exact same shape ' +
            'as the input — same fields, improved values. No fences, no preamble.',
          messages: [{
            role:    'user',
            content: `Concepts to enhance:\n${JSON.stringify(concepts, null, 2)}` +
                     (brandGuidelines ? `\n\nBrand Guidelines:\n${brandGuidelines}` : ''),
          }],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Claude API ${res.status}${body ? ': ' + body.slice(0, 120) : ''}`);
      }

      const data     = await res.json();
      const text     = data?.content?.[0]?.text || '';
      const enhanced = JSON.parse(stripJsonFences(text));

      if (!Array.isArray(enhanced)) throw new Error('Expected JSON array — got ' + typeof enhanced);
      setConcepts(enhanced);
      setEnhanceStatus('done');
    } catch (err) {
      setEnhanceErr(err.name === 'AbortError' ? 'Timed out after 60s' : err.message);
      setEnhanceStatus('error');
    } finally {
      clearTimeout(timeout);
    }
  };

  // ── Generate Images → Drive (Make Flow 2) ────────────────────────────────
  const handleGenerateImages = async () => {
    if (concepts.length === 0) return;
    setImageStatus('token'); setImageMsg('');

    try {
      const token = await getVertexToken();
      setImageStatus('triggering');

      const res = await fetch(IMAGEN_WEBHOOK, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          vertex_token: token,
          concepts:     concepts,
          brand:        form.brand,
          product:      form.product,
          card_count:   5,
          triggered_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Webhook ${res.status}${body ? ': ' + body.slice(0, 120) : ''}`);
      }

      setImageStatus('done');
      setImageMsg('✓ Flow 2 triggered — images generating in Drive');
    } catch (err) {
      setImageStatus('error');
      setImageMsg(err.message);
    }
  };

  const maskedUrl = WEBHOOK
    ? WEBHOOK.replace(/(hook\.[^/]+\/[^/]+\/)[^/]+/, '$1••••••••')
    : '(not set)';

  const ACCENT  = ['#7C6AF7','#22C55E','#F59E0B','#EC4899','#EF4444','#60A5FA'];
  const enhBusy = enhanceStatus === 'enhancing';
  const imgBusy = imageStatus === 'token' || imageStatus === 'triggering';

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#EC4899,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎨</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>Ossia Creative Engine</div>
          <div style={{ fontSize:12, color:'#4A5270' }}>
            {API_KEY ? 'Claude generates concepts → clean JSON → Make → Notion' : 'Generate ad concepts via Make automation'}
          </div>
        </div>
        {API_KEY && (
          <div style={{ marginLeft:'auto', background:'#0A1410', border:'1px solid #22C55E44', borderRadius:6, padding:'4px 10px', fontSize:11, color:'#22C55E', fontWeight:600 }}>
            ⚡ Claude connected
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', gap:24, flexWrap:'wrap' }}>

        {/* ── Left: form ───────────────────────────────────────────────────── */}
        <div style={{ flex:'1 1 360px', maxWidth:520, display:'flex', flexDirection:'column', gap:0 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Brand + Product */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Brand Name</label>
                <input style={inp} placeholder="e.g. Glow Co."
                  value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Product Name</label>
                <input style={inp} placeholder="e.g. Vitamin C Serum"
                  value={form.product} onChange={e=>setForm(p=>({...p,product:e.target.value}))} />
              </div>
            </div>

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
              style={{ background:status==='generating'?'#1A1D2E':'linear-gradient(135deg,#4F6EF7,#7B5CF6)', border:'1px solid transparent', borderRadius:8, color:status==='generating'?'#4A5270':'#DDE1EE', padding:'11px 20px', fontSize:13, fontWeight:600, cursor:status==='generating'?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {status==='generating'
                ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #4F6EF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                    {API_KEY ? 'Generating concepts...' : 'Firing webhook...'}</>
                : '⚡ Generate Concepts'}
            </button>
          </form>

          {/* ── Agent buttons — shown after concepts are generated ────────── */}
          {concepts.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>

              {/* Brand Guidelines textarea */}
              <div>
                <label style={lbl}>Brand Guidelines for Agent</label>
                <textarea
                  style={{...inp, resize:'vertical', minHeight:72}}
                  placeholder="Tone of voice, brand values, colour palette, audience restrictions, words to avoid..."
                  value={brandGuidelines}
                  onChange={e => setBrandGuidelines(e.target.value)}
                />
              </div>

              {/* Button row */}
              <div style={{ display:'flex', gap:10 }}>

                {/* Enhance with Agent (requires Claude API key) */}
                {API_KEY && (
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={enhBusy}
                    style={{
                      flex:1,
                      background:   '#1A1D2E',
                      border:       `1px solid ${enhBusy ? '#2A2D3E' : '#4F6EF766'}`,
                      borderRadius:  8,
                      color:         enhBusy ? '#4A5270' : '#9AA3FF',
                      padding:      '11px 14px',
                      fontSize:      13,
                      fontWeight:    600,
                      cursor:        enhBusy ? 'not-allowed' : 'pointer',
                      display:      'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}
                  >
                    {enhBusy
                      ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #4F6EF7', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Enhancing...</>
                      : '🧠 Enhance with Agent'}
                  </button>
                )}

                {/* Generate Images → Drive */}
                <button
                  type="button"
                  onClick={handleGenerateImages}
                  disabled={imgBusy}
                  style={{
                    flex:1,
                    background:   imgBusy ? '#1A1D2E' : 'linear-gradient(135deg,#EC4899,#F59E0B)',
                    border:       '1px solid transparent',
                    borderRadius:  8,
                    color:         imgBusy ? '#4A5270' : '#DDE1EE',
                    padding:      '11px 14px',
                    fontSize:      13,
                    fontWeight:    600,
                    cursor:        imgBusy ? 'not-allowed' : 'pointer',
                    display:      'flex', alignItems:'center', justifyContent:'center', gap:8,
                  }}
                >
                  {imageStatus === 'token'
                    ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #F59E0B', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Generating token...</>
                    : imageStatus === 'triggering'
                    ? <><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #EC4899', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Triggering Flow 2...</>
                    : '🖼️ Generate Images → Drive'}
                </button>
              </div>

              {/* Enhance status */}
              {enhanceStatus === 'done' && (
                <div style={{ background:'#0A1410', border:'1px solid #22C55E44', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#22C55E' }}>
                  ✓ Concepts enhanced by Creative Director agent
                </div>
              )}
              {enhanceStatus === 'error' && enhanceErr && (
                <div style={{ background:'#1A0B0B', border:'1px solid #EF444444', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#EF4444' }}>
                  ⚠ Enhance error: {enhanceErr}
                </div>
              )}

              {/* Image generation status */}
              {(imageStatus === 'done' || imageStatus === 'error') && imageMsg && (
                <div style={{
                  background:   imageStatus === 'done' ? '#0A1410' : '#1A0B0B',
                  border:      `1px solid ${imageStatus === 'done' ? '#22C55E44' : '#EF444444'}`,
                  borderRadius:  8,
                  padding:      '10px 14px',
                  fontSize:      12,
                  color:         imageStatus === 'done' ? '#22C55E' : '#EF4444',
                }}>
                  {imageMsg}
                </div>
              )}
            </div>
          )}

          {/* Parse warning (non-fatal) */}
          {parseError && (
            <div style={{ marginTop:12, background:'#1A150A', border:'1px solid #F59E0B44', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#F59E0B', marginBottom:3 }}>⚠ Client-side parse warning</div>
              <div style={{ fontSize:11, color:'#8A7040', fontFamily:'monospace', whiteSpace:'pre-wrap' }}>{parseError}</div>
              <div style={{ fontSize:11, color:'#6A5830', marginTop:6 }}>Webhook was still fired — Make will attempt its own parsing as fallback.</div>
            </div>
          )}

          {/* Success */}
          {status==='ready' && (
            <div style={{ marginTop:16, background:'#0A1410', border:'1px solid #22C55E44', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span>✅</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#22C55E' }}>
                  {concepts.length > 0
                    ? `${concepts.length} concepts generated and sent to Make`
                    : 'Webhook fired — Make received the request'}
                </span>
              </div>
              <div style={{ fontSize:12, color:'#4A5270', marginBottom: NOTION ? 10 : 0 }}>
                {concepts.length > 0
                  ? 'All 8 Notion fields delivered as clean JSON. View in the Notion Ad Library.'
                  : 'Your concepts are generating in Make. View results in the Notion Ad Library.'}
              </div>
              {NOTION && (
                <a href={NOTION} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#4F6EF720', border:'1px solid #4F6EF744', borderRadius:8, padding:'7px 14px', fontSize:12, color:'#7B8FFF', fontWeight:600, textDecoration:'none' }}>
                  📚 Open Notion Ad Library →
                </a>
              )}
            </div>
          )}

          {/* Error */}
          {status==='error' && (
            <div style={{ marginTop:16, background:'#1A0B0B', border:'1px solid #EF444444', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#EF4444', marginBottom:4 }}>⚠ Webhook Error</div>
              <div style={{ fontSize:12, color:'#C08080', lineHeight:1.6 }}>{errMsg}</div>
            </div>
          )}

          {/* Raw debug log */}
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

        {/* ── Right: concept cards + info ──────────────────────────────────── */}
        <div style={{ flex:'1 1 260px', minWidth:240, display:'flex', flexDirection:'column', gap:12 }}>

          {/* Concept cards */}
          {concepts.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#DDE1EE', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Generated Concepts
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {concepts.map((c, i) => {
                  const color = ACCENT[i % ACCENT.length];
                  return (
                    <div key={i} style={{ background:'#0D0F17', border:`1px solid ${color}33`, borderRadius:10, padding:'14px 16px' }}>
                      {/* Card header */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:`${color}22`, border:`1px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color, fontWeight:700, flexShrink:0 }}>
                          {i+1}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#DDE1EE', flex:1 }}>{c.concept_name || '—'}</div>
                        {c.best_platform && (
                          <div style={{ background:`${color}18`, border:`1px solid ${color}33`, borderRadius:5, padding:'2px 8px', fontSize:10, color, fontWeight:600, whiteSpace:'nowrap' }}>
                            {c.best_platform}
                          </div>
                        )}
                      </div>

                      {/* Notion-mapped fields */}
                      {CONCEPT_FIELDS.filter(f => f.key !== 'best_platform').map(({ key, label }) =>
                        c[key] ? (
                          <div key={key} style={{ marginBottom:8 }}>
                            <div style={{ fontSize:10, color:'#3D4255', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{label}</div>
                            <div style={{ fontSize:12, color: key==='caption_copy' ? '#C8CDD8' : '#9AA3BC', lineHeight:1.6 }}>{c[key]}</div>
                          </div>
                        ) : null
                      )}

                      {/* Brand/product metadata */}
                      {(c.brand || c.product) && (
                        <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${color}22`, display:'flex', gap:12 }}>
                          {c.brand   && <div style={{ fontSize:10, color:'#3D4255' }}>Brand: <span style={{ color:'#6A7290' }}>{c.brand}</span></div>}
                          {c.product && <div style={{ fontSize:10, color:'#3D4255' }}>Product: <span style={{ color:'#6A7290' }}>{c.product}</span></div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notion field map reference */}
          <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#DDE1EE', marginBottom:10 }}>Notion Field Map</div>
            {[
              ['concept_name',    'Title / Name of concept'],
              ['copy_angle',      'Strategic angle driving the ad'],
              ['target_audience', 'Audience segment targeted'],
              ['best_platform',   'Recommended publish platform'],
              ['caption_copy',    'Full ready-to-post caption'],
              ['audience_note',   'Why this audience converts'],
              ['brand',           'From form — brand name'],
              ['product',         'From form — product name'],
            ].map(([field, desc]) => (
              <div key={field} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6 }}>
                <code style={{ fontSize:10, color:'#7B8FFF', background:'#0D1525', borderRadius:4, padding:'1px 6px', flexShrink:0, whiteSpace:'nowrap' }}>{field}</code>
                <div style={{ fontSize:11, color:'#4A5270', lineHeight:1.4 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Info panel */}
          <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#DDE1EE', marginBottom:10 }}>How it works</div>
            {(API_KEY
              ? [['1','Enter brand, product & brief'],['2','Claude generates 6 concept fields'],['3','brand + product injected client-side'],['4','8-field clean JSON → Make → Notion']]
              : [['1','Enter product URL & brief'],['2','Fires Make webhook'],['3','Make calls Claude'],['4','Drops into Notion Ad Library']]
            ).map(([n,t])=>(
              <div key={n} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ width:18, height:18, borderRadius:5, background:'#4F6EF720', border:'1px solid #4F6EF744', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#7B8FFF', fontWeight:700, flexShrink:0 }}>{n}</div>
                <div style={{ fontSize:12, color:'#4A5270', lineHeight:1.5 }}>{t}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:8, padding:'10px 12px' }}>
            <div style={{ fontSize:10, color:'#3D4255', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Webhook URL</div>
            <div style={{ fontSize:10, color: WEBHOOK ? '#22C55E' : '#F59E0B', wordBreak:'break-all', lineHeight:1.5 }}>
              {WEBHOOK ? maskedUrl : '⚠ Not set'}
            </div>
          </div>

          {!API_KEY && (
            <div style={{ background:'#0D111A', border:'1px solid #4F6EF733', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#4A5A80' }}>
              💡 Add <code style={{ color:'#7B8FFF', background:'#0D1525', borderRadius:4, padding:'1px 5px' }}>REACT_APP_CLAUDE_API_KEY</code> to Vercel env to enable client-side generation with concept previews.
            </div>
          )}

          {!NOTION && (
            <div style={{ background:'#1A130A', border:'1px solid #F59E0B33', borderRadius:8, padding:'10px 12px', fontSize:11, color:'#8A7040' }}>
              ⚠ Set <code style={{ color:'#F59E0B', background:'#2A1F08', borderRadius:4, padding:'1px 5px' }}>REACT_APP_NOTION_AD_LIBRARY_URL</code> for the library link
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
