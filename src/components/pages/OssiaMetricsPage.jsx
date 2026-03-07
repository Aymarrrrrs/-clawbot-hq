import { useState } from 'react';
import { useOssiaMetrics } from '../../hooks/useSupabase';
import { isSupabaseReady } from '../../lib/supabase';

const inp = {
  background:'#13151E', border:'1px solid #1A1D26', borderRadius:8,
  color:'#DDE1EE', padding:'9px 12px', fontSize:13, outline:'none', width:'100%',
};
const lbl = {
  fontSize:11, color:'#4A5270', fontWeight:600, marginBottom:5,
  display:'block', textTransform:'uppercase', letterSpacing:'0.06em',
};

function StatCard({ icon, label, value, suffix='', color }) {
  return (
    <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:12, padding:'20px 22px', display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:17 }}>{icon}</span>
        <span style={{ fontSize:11, color:'#4A5270', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize:30, fontWeight:800, color, lineHeight:1, letterSpacing:'-0.02em' }}>
        {value}<span style={{ fontSize:16, fontWeight:600, marginLeft:2 }}>{suffix}</span>
      </div>
    </div>
  );
}

const FIELDS = [
  { key:'roas',         label:'ROAS',               step:'0.01', icon:'🎯', color:'#22C55E', fmt:v=>`${(+v).toFixed(1)}`, suffix:'x'  },
  { key:'revenue_week', label:'Revenue (Week)',       step:'1',    icon:'💰', color:'#4F6EF7', fmt:v=>`$${(+v).toLocaleString()}`, suffix:'' },
  { key:'ad_spend',     label:'Ad Spend',             step:'1',    icon:'📤', color:'#F59E0B', fmt:v=>`$${(+v).toLocaleString()}`, suffix:'' },
  { key:'cpm',          label:'CPM',                  step:'0.01', icon:'👁', color:'#EC4899', fmt:v=>`$${(+v).toFixed(2)}`, suffix:''  },
  { key:'ctr',          label:'CTR',                  step:'0.01', icon:'🖱', color:'#7C6AF7', fmt:v=>`${(+v).toFixed(2)}`, suffix:'%' },
];

export default function OssiaMetricsPage() {
  const { metrics, saveMetrics } = useOssiaMetrics();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(null);

  const startEdit = () => {
    setForm({ roas:metrics.roas, revenue_week:metrics.revenue_week, ad_spend:metrics.ad_spend, cpm:metrics.cpm, ctr:metrics.ctr });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveMetrics({ roas:+form.roas, revenue_week:+form.revenue_week, ad_spend:+form.ad_spend, cpm:+form.cpm, ctr:+form.ctr });
    setEditing(false);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid #1A1D26', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#22C55E,#4F6EF7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📊</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#DDE1EE' }}>Ossia Metrics</div>
            <div style={{ fontSize:12, color:'#4A5270' }}>
              Ad performance · {isSupabaseReady ? <span style={{ color:'#22C55E' }}>Live</span> : <span style={{ color:'#F59E0B' }}>Manual input</span>}
            </div>
          </div>
        </div>
        <button onClick={startEdit}
          style={{ background:'#1A1D2E', border:'1px solid #252830', borderRadius:8, color:'#7A8299', padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
          ✎ Update Metrics
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>
        {/* Stat grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:14, marginBottom:20 }}>
          {FIELDS.map(f=>(
            <StatCard key={f.key} icon={f.icon} label={f.label} color={f.color}
              value={f.fmt(metrics[f.key]??0)} suffix={f.suffix} />
          ))}
        </div>

        {metrics.updated_at && (
          <div style={{ fontSize:11, color:'#2A2E40', fontFamily:"'JetBrains Mono',monospace" }}>
            Last updated: {new Date(metrics.updated_at).toLocaleString()}
          </div>
        )}

        {!isSupabaseReady && (
          <div style={{ marginTop:18, background:'#1A130A', border:'1px solid #F59E0B33', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#8A7040' }}>
            ⚡ Supabase not connected. Click <strong style={{ color:'#F59E0B' }}>Update Metrics</strong> to enter data manually — values persist in memory until page reload. Connect Supabase to persist permanently.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'#000000CC', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#0D0F17', border:'1px solid #1A1D26', borderRadius:14, padding:'24px', width:400, maxWidth:'92vw' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#DDE1EE', marginBottom:20 }}>Update Metrics</div>
            <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {FIELDS.map(f=>(
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input style={inp} type="number" step={f.step} value={form[f.key]}
                    onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button type="submit"
                  style={{ flex:1, background:'linear-gradient(135deg,#4F6EF7,#7B5CF6)', border:'none', borderRadius:8, color:'#DDE1EE', padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Save
                </button>
                <button type="button" onClick={()=>setEditing(false)}
                  style={{ flex:1, background:'#1A1D2E', border:'1px solid #252830', borderRadius:8, color:'#7A8299', padding:'10px', fontSize:13, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
