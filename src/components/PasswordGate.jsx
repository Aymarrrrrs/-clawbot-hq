import { useState, useEffect, useRef } from 'react';

// SHA-256(REACT_APP_DAILY_SALT + YYYY-MM-DD) → full 64-char hex
async function getDailyCode() {
  const salt = process.env.REACT_APP_DAILY_SALT || '';
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD local-ish (UTC)
  const raw  = salt + date;
  console.log('Salt:', salt);
  console.log('Date:', date);
  console.log('Raw string being hashed:', raw);
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex  = Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

export default function PasswordGate({ onUnlock }) {
  const [input,   setInput]   = useState('');
  const [error,   setError]   = useState('');
  const [shaking, setShaking] = useState(false);
  const [checking,setChecking]= useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);

    const expected = await getDailyCode();

    console.log('Input:',    input.trim());
    console.log('Expected:', expected.trim());

    if (input.trim() === expected.trim()) {
      onUnlock();
    } else {
      setError('Invalid password');
      setShaking(true);
      setInput('');
      setTimeout(() => { setShaking(false); setChecking(false); }, 620);
      // Re-focus after shake so user can type immediately
      setTimeout(() => inputRef.current?.focus(), 640);
    }
    if (input.trim() === expected.trim()) setChecking(false);
  };

  return (
    <div style={{
      position:   'fixed',
      inset:       0,
      background: '#0B0D13',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      zIndex:      9999,
    }}>

      <div style={{
        background:   '#0D0F17',
        border:       '1px solid #1A1D26',
        borderRadius:  16,
        padding:      '44px 48px',
        width:        '100%',
        maxWidth:      360,
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:           28,
      }}>

        {/* Brand mark */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,#4F6EF7,#7B5CF6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18,
          }}>
            🤖
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:'#DDE1EE', letterSpacing:'-0.01em' }}>
            Clawbot HQ
          </div>
          <div style={{ fontSize:12, color:'#4A5270' }}>
            Enter today's access code
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}
        >
          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="Enter access code"
            maxLength={64}
            autoComplete="off"
            spellCheck="false"
            style={{
              width:         '100%',
              background:    '#13151E',
              border:        `1px solid ${error ? '#EF444466' : '#1A1D26'}`,
              borderRadius:   8,
              color:         '#DDE1EE',
              padding:       '12px 16px',
              fontSize:       20,
              outline:       'none',
              textAlign:     'center',
              letterSpacing: '0.25em',
              boxSizing:     'border-box',
              transition:    'border-color 0.15s',
              animation:      shaking ? 'gate-shake 0.55s ease' : 'none',
            }}
          />

          {/* Error message — reserves space to avoid layout shift */}
          <div style={{
            fontSize:  12,
            color:    '#EF4444',
            textAlign:'center',
            minHeight: 18,
            transition:'opacity 0.15s',
            opacity:   error ? 1 : 0,
          }}>
            {error || ' '}
          </div>

          {/* Dev shortcut — click to reveal today's code */}
          <button
            type="button"
            onClick={async () => { const code = await getDailyCode(); alert('Today\'s code:\n\n' + code); }}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#2A2D3E', fontSize: 11, cursor: 'pointer',
              textDecoration: 'underline', textAlign: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#4A5270'}
            onMouseLeave={e => e.currentTarget.style.color = '#2A2D3E'}
          >
            Get today's code
          </button>

          <button
            type="submit"
            disabled={checking || !input}
            style={{
              background:  checking || !input
                ? '#1A1D2E'
                : 'linear-gradient(135deg,#4F6EF7,#7B5CF6)',
              border:      '1px solid transparent',
              borderRadius: 8,
              color:       checking || !input ? '#4A5270' : '#DDE1EE',
              padding:     '11px 20px',
              fontSize:     13,
              fontWeight:   600,
              cursor:      checking || !input ? 'not-allowed' : 'pointer',
              transition:  'background 0.15s, color 0.15s',
              display:     'flex',
              alignItems:  'center',
              justifyContent:'center',
              gap:          8,
            }}
          >
            {checking
              ? <>
                  <span style={{
                    display:'inline-block', width:12, height:12,
                    border:'2px solid #4F6EF7', borderTopColor:'transparent',
                    borderRadius:'50%', animation:'spin 0.7s linear infinite',
                  }} />
                  Checking…
                </>
              : 'Unlock →'}
          </button>
        </form>

        {/* Subtle date hint so you know which day's code to compute */}
        <div style={{ fontSize:10, color:'#2A2D3E' }}>
          {new Date().toISOString().slice(0, 10)}
        </div>
      </div>

      <style>{`
        @keyframes gate-shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-9px); }
          30%       { transform: translateX(9px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
