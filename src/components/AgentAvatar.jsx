import { AGENTS } from '../data/constants';

export default function AgentAvatar({ agent, size = 32 }) {
  const a = AGENTS[agent] || { initials: (agent || '??').slice(0, 2).toUpperCase(), color: '#555' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: a.color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700,
      color: '#fff', flexShrink: 0, letterSpacing: '0.02em',
      boxShadow: `0 0 0 2px ${a.color}33`,
    }}>
      {a.initials}
    </div>
  );
}
