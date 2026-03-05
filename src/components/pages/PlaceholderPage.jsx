const ICONS = { projects:'▣', memory:'◉', docs:'📄', team:'👥', pipeline:'◎', radar:'📡' };
const DESCRIPTIONS = {
  projects: 'Manage long-running projects and campaigns across agents.',
  memory:   'Persistent knowledge base shared across all agents.',
  docs:     'Shared documentation, playbooks, and SOPs.',
  team:     'Human team members and their roles alongside agents.',
  pipeline: 'End-to-end workflow pipelines and automation sequences.',
  radar:    'Market signals, competitor monitoring, and trend alerts.',
};
export default function PlaceholderPage({ page }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#3D4255' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{ICONS[page]||'⊞'}</div>
      <div style={{ fontSize:18, fontWeight:700, color:'#DDE1EE', marginBottom:8, textTransform:'capitalize' }}>{page}</div>
      <div style={{ fontSize:13, color:'#4B5A70', maxWidth:320, textAlign:'center', lineHeight:1.6 }}>{DESCRIPTIONS[page]||'Coming soon.'}</div>
      <div style={{ marginTop:24, background:'#4F6EF720', border:'1px solid #4F6EF744', borderRadius:10, padding:'8px 18px', fontSize:12, color:'#7B8FFF', fontWeight:600 }}>
        🚧 Phase 3 — Coming Soon
      </div>
    </div>
  );
}
