import AgentAvatar from './AgentAvatar';
import { AGENTS } from '../data/constants';

const PRIORITY_COLOR = { HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#22C55E' };

export default function LiveFeed({ activity, apiConnected }) {
  return (
    <div style={{
      width: 272, background: '#0D0F17', borderLeft: '1px solid #1A1D26',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #1A1D26' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#DDE1EE' }}>Live Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: apiConnected ? '#22C55E' : '#F59E0B',
              boxShadow: apiConnected ? '0 0 6px #22C55E' : '0 0 6px #F59E0B',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 10, color: apiConnected ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>
              {apiConnected ? 'LIVE' : 'DEMO'}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#3D4255', marginTop: 3 }}>Real-time agent operations</div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {activity.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 9,
            padding: '9px 4px', borderBottom: '1px solid #0F1117',
            opacity: Math.max(0.35, 1 - i * 0.055),
            transition: 'opacity 0.3s',
          }}>
            <AgentAvatar agent={item.agent} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: AGENTS[item.agent]?.color || '#DDE1EE' }}>
                  {item.agent}
                </span>
                {item.priority && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: PRIORITY_COLOR[item.priority] || '#aaa',
                    background: (PRIORITY_COLOR[item.priority] || '#aaa') + '20',
                    padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em',
                  }}>
                    {item.priority}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#3D4255', marginLeft: 'auto' }}>{item.time}</span>
              </div>
              <div style={{ fontSize: 11, color: '#5A6580', marginTop: 2, lineHeight: 1.45, wordBreak: 'break-word' }}>
                {item.action}
              </div>
              {item.deliverable && (
                <div style={{ fontSize: 10, color: '#4F6EF7', marginTop: 4 }}>
                  → {item.deliverable}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Agent status footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #1A1D26' }}>
        <div style={{ fontSize: 10, color: '#3D4255', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Agent Status</div>
        {Object.entries(AGENTS).map(([name, info]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: info.status === 'active' ? '#22C55E' : '#3D4255' }} />
              <span style={{ fontSize: 11, color: '#5A6580' }}>{name}</span>
            </div>
            <span style={{ fontSize: 10, color: info.status === 'active' ? '#22C55E' : '#3D4255' }}>
              {info.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
