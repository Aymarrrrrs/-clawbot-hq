import { AGENT_COLORS } from '../../data/constants';
const initials = n => n ? n.slice(0,2).toUpperCase() : '??';
export default function AgentAvatar({ agent, size=32, agents=[] }) {
  const found = agents.find(a=>a.name===agent);
  const color = found?.color || AGENT_COLORS[agent] || '#555';
  const ini   = found?.initials || initials(agent);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.34, fontWeight:700, color:'#fff', flexShrink:0, letterSpacing:'0.02em', boxShadow:`0 0 0 2px ${color}33` }}>
      {ini}
    </div>
  );
}
