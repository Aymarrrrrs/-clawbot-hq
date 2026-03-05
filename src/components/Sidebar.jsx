import { NAV_ITEMS } from '../data/constants';

export default function Sidebar({ activeNav, setActiveNav }) {
  return (
    <div style={{
      width: 205, background: '#0D0F17', borderRight: '1px solid #1A1D26',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 20px', borderBottom: '1px solid #1A1D26', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #4F6EF7 0%, #7B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, boxShadow: '0 4px 12px #4F6EF755',
        }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#DDE1EE', letterSpacing: '-0.01em' }}>Clawbot HQ</div>
          <div style={{ fontSize: 10, color: '#3D4255', fontWeight: 600 }}>Mission Control</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.id;
          return (
            <div key={item.id} onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#DDE1EE' : '#4A5270',
                background: active ? '#1A1D2E' : 'transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#13151E'; e.currentTarget.style.color = '#7A8299'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5270'; }}}
            >
              <span style={{ fontSize: 13, width: 18, textAlign: 'center', opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: '#4F6EF722', color: '#4F6EF7',
                  borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                }}>
                  {item.badge}
                </span>
              )}
              {active && <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#4F6EF7' }} />}
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #1A1D26' }}>
        <div style={{ fontSize: 10, color: '#2A2E40', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
          v1.0.0 · Clawbot HQ
        </div>
      </div>
    </div>
  );
}
