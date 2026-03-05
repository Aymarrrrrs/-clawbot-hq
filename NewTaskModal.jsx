import { useState } from 'react';
import { AGENTS, TAG_COLORS } from '../data/constants';
import AgentAvatar from './AgentAvatar';

const inputStyle = {
  width: '100%', background: '#0B0D13', border: '1px solid #252830',
  borderRadius: 8, padding: '10px 13px', color: '#DDE1EE',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
};

export default function NewTaskModal({ onClose, onAdd, jarvisLoading }) {
  const [title, setTitle]   = useState('');
  const [desc, setDesc]     = useState('');
  const [agent, setAgent]   = useState('Jarvis');
  const [tag, setTag]       = useState('Core Engine');
  const [askJarvis, setAskJarvis] = useState(true);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({ title, desc, agent, tag, askJarvis });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#13151E', border: '1px solid #252830', borderRadius: 18,
        padding: 32, width: 480, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.15s ease',
      }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#DDE1EE', marginBottom: 6 }}>New Task</div>
        <div style={{ fontSize: 12, color: '#4B5A70', marginBottom: 24 }}>
          {askJarvis ? '⚡ Jarvis will be notified and will orchestrate this task' : 'Task will be added to Backlog'}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#5A6580', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done..."
            style={inputStyle} onFocus={e => e.target.style.borderColor = '#4F6EF7'} onBlur={e => e.target.style.borderColor = '#252830'} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#5A6580', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deliverable</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is the expected output? (No task without a deliverable)" rows={3}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.target.style.borderColor = '#4F6EF7'} onBlur={e => e.target.style.borderColor = '#252830'} />
        </div>

        {/* Agent + Tag */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#5A6580', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assign Agent</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(AGENTS).map(([name, info]) => (
                <div key={name} onClick={() => setAgent(name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.1s',
                    background: agent === name ? '#1E2230' : 'transparent',
                    border: agent === name ? `1px solid ${info.color}55` : '1px solid transparent',
                  }}>
                  <AgentAvatar agent={name} size={24} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: agent === name ? '#DDE1EE' : '#5A6580' }}>{name}</div>
                    <div style={{ fontSize: 10, color: '#3D4255' }}>{info.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#5A6580', fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tag</label>
            <select value={tag} onChange={e => setTag(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {Object.keys(TAG_COLORS).map(t => <option key={t}>{t}</option>)}
            </select>

            {/* Ask Jarvis toggle */}
            <div style={{ marginTop: 16, padding: '12px', background: '#0F1117', borderRadius: 10, border: '1px solid #1E2230' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#7B8FFF' }}>🤖 Ask Jarvis</span>
                <div onClick={() => setAskJarvis(!askJarvis)} style={{
                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s',
                  background: askJarvis ? '#4F6EF7' : '#252830', position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: askJarvis ? 19 : 3, width: 14, height: 14,
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#3D4255' }}>Jarvis will orchestrate & delegate</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #252830', borderRadius: 10, color: '#5A6580', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!title.trim() || jarvisLoading}
            style={{ flex: 2, padding: '11px', background: title.trim() ? '#4F6EF7' : '#252830', border: 'none', borderRadius: 10, color: '#fff', cursor: title.trim() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s' }}>
            {jarvisLoading ? '⚡ Jarvis thinking...' : '+ Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
