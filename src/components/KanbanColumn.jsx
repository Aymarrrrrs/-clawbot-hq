import TaskCard from './TaskCard';

const COL_DOT = {
  'Backlog':     '#4B5563',
  'In Progress': '#4F6EF7',
  'Review':      '#F59E0B',
  'Done':        '#22C55E',
};

export default function KanbanColumn({ title, tasks, onDragStart, onDrop, isOver, onDragOver, onDragLeave }) {
  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        background: isOver ? '#161A24' : 'transparent',
        border: isOver ? '1.5px dashed #4F6EF755' : '1.5px dashed transparent',
        borderRadius: 14, padding: '4px 4px 12px',
        transition: 'all 0.15s', minHeight: 220,
      }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: COL_DOT[title] || '#555' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4B5A70', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>
        <span style={{
          background: '#1E2230', color: '#5A6580', borderRadius: 6,
          padding: '2px 9px', fontSize: 11, fontWeight: 700,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
      ))}

      {tasks.length === 0 && (
        <div style={{ border: '1px dashed #1E2230', borderRadius: 10, padding: '20px', textAlign: 'center', color: '#2A2E3E', fontSize: 12 }}>
          Drop tasks here
        </div>
      )}
    </div>
  );
}
