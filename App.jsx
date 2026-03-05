import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import KanbanColumn from './components/KanbanColumn';
import LiveFeed from './components/LiveFeed';
import NewTaskModal from './components/NewTaskModal';
import { COLUMNS, INITIAL_TASKS, INITIAL_ACTIVITY } from './data/constants';
import { useClaudeAgent } from './hooks/useClaudeAgent';

const API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

const DEMO_ACTIONS = [
  ["Scout",  "Scanning competitor intelligence feeds"],
  ["Jarvis", "Re-prioritizing task queue by ROI impact"],
  ["Quill",  "Drafting content brief for new campaign"],
  ["Scout",  "Running performance audit on live assets"],
  ["Jarvis", "Coordinating handoff between Scout and Quill"],
  ["Quill",  "Synthesizing research into creative angles"],
  ["Scout",  "Monitoring funnel metrics for anomalies"],
  ["Jarvis", "Validating deliverables against HQ standards"],
];

export default function App() {
  const [activeNav, setActiveNav]   = useState('tasks');
  const [tasks, setTasks]           = useState(INITIAL_TASKS);
  const [activity, setActivity]     = useState(INITIAL_ACTIVITY);
  const [dragging, setDragging]     = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [nextId, setNextId]         = useState(100);

  const { callJarvis, loading: jarvisLoading } = useClaudeAgent();

  // Push to activity feed
  const pushActivity = useCallback((entry) => {
    setActivity(prev => [{
      id: Date.now(),
      agent: entry.agent || 'Jarvis',
      time: 'just now',
      action: entry.action || entry.message?.slice(0, 80) || 'Working...',
      priority: entry.priority || null,
      deliverable: entry.deliverable || null,
    }, ...prev.slice(0, 24)]);
  }, []);

  // Demo ticker when no API key
  useEffect(() => {
    if (API_KEY) return;
    const interval = setInterval(() => {
      const [agent, action] = DEMO_ACTIONS[Math.floor(Math.random() * DEMO_ACTIONS.length)];
      pushActivity({ agent, action });
    }, 6000);
    return () => clearInterval(interval);
  }, [pushActivity]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const allTasks   = Object.values(tasks).flat();
  const inProgress = tasks['In Progress'].length;
  const done       = tasks['Done'].length;
  const completion = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = (col) => {
    if (!dragging) return;
    setTasks(prev => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) next[k] = v.filter(t => t.id !== dragging.id);
      next[col] = [{ ...dragging, time: 'just now', highlighted: false }, ...next[col]];
      return next;
    });
    pushActivity({ agent: dragging.agent, action: `Moved "${dragging.title}" → ${col}`, priority: null });
    if (API_KEY) {
      callJarvis(`Task "${dragging.title}" was moved to ${col}. Acknowledge and provide next action.`, pushActivity);
    }
    setDragging(null);
    setDragOver(null);
  };

  // ── Add task ─────────────────────────────────────────────────────────────────
  const handleAddTask = async ({ title, desc, agent, tag, askJarvis }) => {
    const newTask = { id: nextId, title, desc, agent, tag, time: 'just now', highlighted: false };
    setNextId(n => n + 1);
    setTasks(prev => ({ ...prev, Backlog: [newTask, ...prev.Backlog] }));
    pushActivity({ agent, action: `New task created: "${title}"`, priority: 'MEDIUM' });

    if (askJarvis) {
      const prompt = `New task added to Backlog:
Title: "${title}"
Deliverable: "${desc || 'Not specified'}"
Assigned to: ${agent}
Tag: ${tag}

Acknowledge this task, assess its priority, and provide your orchestration plan.`;
      await callJarvis(prompt, pushActivity);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const s = {
    app:     { display: 'flex', height: '100vh', width: '100vw', background: '#0B0D13', fontFamily: "'DM Sans', sans-serif", color: '#DDE1EE', overflow: 'hidden' },
    main:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    content: { flex: 1, padding: '24px 26px', overflowY: 'auto' },
    stats:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 26 },
    statCard:{ background: '#11131C', border: '1px solid #1A1D26', borderRadius: 14, padding: '18px 20px', transition: 'border-color 0.15s' },
  };

  return (
    <div style={s.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTask}
          jarvisLoading={jarvisLoading}
        />
      )}

      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <div style={s.main}>
        <div style={s.content}>

          {/* KPI Stats */}
          <div style={s.stats}>
            {[
              ['TASKS THIS WEEK', 28,           '+12%', true ],
              ['IN PROGRESS',     inProgress,   null,   null ],
              ['TOTAL TASKS',     allTasks.length, '+8%', true],
              ['COMPLETION %',    `${completion}%`, '+3%', true],
            ].map(([label, value, delta, pos]) => (
              <div key={label} style={s.statCard}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#252830'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1A1D26'}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#3D4A60', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  {label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: '#DDE1EE', fontFamily: "'JetBrains Mono', monospace" }}>
                    {value}
                  </span>
                  {delta && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: pos ? '#22C55E' : '#EF4444' }}>
                      {delta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Board header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#DDE1EE' }}>Mission Board</div>
              {!API_KEY && (
                <div style={{ fontSize: 11, color: '#4F6EF7', marginTop: 3 }}>
                  ⚡ Demo mode · Add <code style={{ fontFamily: "'JetBrains Mono', monospace", background: '#1A1D26', padding: '1px 5px', borderRadius: 4 }}>REACT_APP_CLAUDE_API_KEY</code> to .env to activate Jarvis
                </div>
              )}
              {API_KEY && (
                <div style={{ fontSize: 11, color: '#22C55E', marginTop: 3 }}>✓ Jarvis connected · Claude API active</div>
              )}
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: '#4F6EF7', border: 'none', borderRadius: 10,
                padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                boxShadow: '0 4px 14px #4F6EF744',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3D5CE5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4F6EF7'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {jarvisLoading ? '⚡ Jarvis thinking...' : '+ New Task'}
            </button>
          </div>

          {/* Kanban */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, alignItems: 'start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col}
                title={col}
                tasks={tasks[col] || []}
                onDragStart={setDragging}
                onDrop={() => handleDrop(col)}
                onDragOver={() => setDragOver(col)}
                onDragLeave={() => setDragOver(null)}
                isOver={dragOver === col}
              />
            ))}
          </div>
        </div>
      </div>

      <LiveFeed activity={activity} apiConnected={!!API_KEY} />
    </div>
  );
}
