import AgentAvatar from './AgentAvatar';
import TagPill from './TagPill';

export default function TaskCard({ task, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      style={{
        background: task.highlighted ? 'transparent' : '#1A1D26',
        border: task.highlighted ? '1.5px solid #4F6EF7' : '1px solid #252830',
        borderRadius: 12, padding: '15px 16px', marginBottom: 10,
        cursor: 'grab', transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
        boxShadow: task.highlighted ? '0 0 16px #4F6EF722' : '0 1px 3px rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = task.highlighted ? '0 4px 24px #4F6EF733' : '0 4px 16px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = task.highlighted ? '#4F6EF7' : '#353845';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = task.highlighted ? '0 0 16px #4F6EF722' : '0 1px 3px rgba(0,0,0,0.3)';
        e.currentTarget.style.borderColor = task.highlighted ? '#4F6EF7' : '#252830';
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13.5, color: task.highlighted ? '#7B8FFF' : '#DDE1EE', marginBottom: 5, lineHeight: 1.35 }}>
        {task.title}
      </div>
      <div style={{ fontSize: 12, color: '#5A6175', marginBottom: 13, lineHeight: 1.5 }}>
        {task.desc}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <AgentAvatar agent={task.agent} size={24} />
          <span style={{ fontSize: 12, color: '#7A8299' }}>{task.agent}</span>
        </div>
        <TagPill tag={task.tag} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#3D4255', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 10 }}>🕐</span> {task.time}
      </div>
    </div>
  );
}
