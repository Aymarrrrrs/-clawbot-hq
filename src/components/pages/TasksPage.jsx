import { useState } from 'react';
import AgentAvatar from '../shared/AgentAvatar';
import TagPill from '../shared/TagPill';
import { COLUMNS, STATUS_DOT, TAG_COLORS, PRIORITY_COLOR } from '../../data/constants';

function TaskCard({ task, onDragStart, agents }) {
  return (
    <div draggable onDragStart={()=>onDragStart(task)}
      style={{ background:task.highlighted?'transparent':'#1A1D26', border:task.highlighted?'1.5px solid #4F6EF7':'1px solid #252830', borderRadius:12, padding:'15px 16px', marginBottom:10, cursor:'grab', transition:'all 0.15s', boxShadow:task.highlighted?'0 0 16px #4F6EF722':'0 1px 3px rgba(0,0,0,0.3)', userSelect:'none' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor=task.highlighted?'#4F6EF7':'#353845';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor=task.highlighted?'#4F6EF7':'#252830';}}>
      {task.priority&&<div style={{ display:'inline-block', fontSize:9, fontWeight:700, color:PRIORITY_COLOR[task.priority], background:PRIORITY_COLOR[task.priority]+'20', padding:'1px 6px', borderRadius:4, marginBottom:6 }}>{task.priority}</div>}
      <div style={{ fontWeight:600, fontSize:13.5, color:task.highlighted?'#7B8FFF':'#DDE1EE', marginBottom:5, lineHeight:1.35 }}>{task.title}</div>
      <div style={{ fontSize:12, color:'#5A6175', marginBottom:13, lineHeight:1.5 }}>{task.description||task.desc}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <AgentAvatar agent={task.agent} size={24} agents={agents} />
          <span style={{ fontSize:12, color:'#7A8299' }}>{task.agent}</span>
        </div>
        <TagPill tag={task.tag} />
      </div>
      <div style={{ marginTop:10, fontSize:11, color:'#3D4255', display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ fontSize:10 }}>🕐</span>{task.time||'just now'}
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onAdd, agents, jarvisLoading }) {
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState('');
  const [agent,setAgent]=useState('Jarvis'); const [tag,setTag]=useState('Core Engine');
  const [priority,setPriority]=useState('MEDIUM'); const [askJarvis,setAskJarvis]=useState(true);
  const inp = { width:'100%', background:'#0B0D13', border:'1px solid #252830', borderRadius:8, padding:'10px 13px', color:'#DDE1EE', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#13151E', border:'1px solid #252830', borderRadius:18, padding:32, width:500, boxShadow:'0 32px 80px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontSize:17, fontWeight:700, color:'#DDE1EE', marginBottom:20 }}>New Task</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done..." style={inp} onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Deliverable *</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Expected output (no task without a deliverable)" rows={3} style={{ ...inp, resize:'none' }} onFocus={e=>e.target.style.borderColor='#4F6EF7'} onBlur={e=>e.target.style.borderColor='#252830'} />
        </div>
        <div style={{ display:'flex', gap:14, marginBottom:14 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Agent</label>
            <select value={agent} onChange={e=>setAgent(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {agents.map(a=><option key={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Priority</label>
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {['HIGH','MEDIUM','LOW'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:'#5A6580', fontWeight:700, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Tag</label>
          <select value={tag} onChange={e=>setTag(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
            {Object.keys(TAG_COLORS).map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ background:'#0F1117', borderRadius:10, border:'1px solid #1E2230', padding:'12px 14px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#7B8FFF' }}>⚡ Route through Jarvis</span>
            <div onClick={()=>setAskJarvis(!askJarvis)} style={{ width:36, height:20, borderRadius:10, cursor:'pointer', background:askJarvis?'#4F6EF7':'#252830', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:3, left:askJarvis?19:3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
            </div>
          </div>
          <div style={{ fontSize:11, color:'#3D4255', marginTop:4 }}>Jarvis will orchestrate, assess priority, and delegate</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', background:'transparent', border:'1px solid #252830', borderRadius:10, color:'#5A6580', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={()=>{ if(title.trim()){ onAdd({title,description:desc,agent,tag,priority,askJarvis}); onClose(); }}} disabled={!title.trim()||jarvisLoading}
            style={{ flex:2, padding:'11px', background:title.trim()?'#4F6EF7':'#252830', border:'none', borderRadius:10, color:'#fff', cursor:title.trim()?'pointer':'not-allowed', fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:'background 0.15s' }}>
            {jarvisLoading?'⚡ Jarvis thinking...':'+ Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage({ tasks, onAddTask, onMoveTask, agents, jarvisLoading }) {
  const [dragging,setDragging]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const allTasks = Object.values(tasks).flat();
  const done = tasks['Done']?.length||0;
  const completion = allTasks.length>0?Math.round((done/allTasks.length)*100):0;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {showModal&&<NewTaskModal onClose={()=>setShowModal(false)} onAdd={onAddTask} agents={agents} jarvisLoading={jarvisLoading} />}
      <div style={{ flex:1, padding:'24px 26px', overflowY:'auto' }}>
        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:26 }}>
          {[['TASKS THIS WEEK',28,'+12%',true],['IN PROGRESS',tasks['In Progress']?.length||0,null,null],['TOTAL TASKS',allTasks.length,'+8%',true],['COMPLETION %',`${completion}%`,'+3%',true]].map(([l,v,d,p])=>(
            <div key={l} style={{ background:'#11131C', border:'1px solid #1A1D26', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#3D4A60', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>{l}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontSize:30, fontWeight:800, color:'#DDE1EE', fontFamily:"'JetBrains Mono',monospace" }}>{v}</span>
                {d&&<span style={{ fontSize:12, fontWeight:700, color:p?'#22C55E':'#EF4444' }}>{d}</span>}
              </div>
            </div>
          ))}
        </div>
        {/* Board header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#DDE1EE' }}>Mission Board</div>
          <button onClick={()=>setShowModal(true)}
            style={{ background:'#4F6EF7', border:'none', borderRadius:10, padding:'9px 18px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px #4F6EF744', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#3D5CE5';e.currentTarget.style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#4F6EF7';e.currentTarget.style.transform='translateY(0)';}}>
            {jarvisLoading?'⚡ Jarvis thinking...':'+ New Task'}
          </button>
        </div>
        {/* Kanban */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, alignItems:'start' }}>
          {COLUMNS.map(col=>(
            <div key={col}
              onDragOver={e=>{e.preventDefault();setDragOver(col);}}
              onDragLeave={()=>setDragOver(null)}
              onDrop={()=>{ if(dragging){onMoveTask(dragging,col);setDragging(null);setDragOver(null); }}}
              style={{ background:dragOver===col?'#161A24':'transparent', border:dragOver===col?'1.5px dashed #4F6EF755':'1.5px dashed transparent', borderRadius:14, padding:'4px 4px 12px', minHeight:220, transition:'all 0.15s' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, padding:'0 2px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:STATUS_DOT[col]||'#555' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'#4B5A70', letterSpacing:'0.08em', textTransform:'uppercase' }}>{col}</span>
                </div>
                <span style={{ background:'#1E2230', color:'#5A6580', borderRadius:6, padding:'2px 9px', fontSize:11, fontWeight:700 }}>{tasks[col]?.length||0}</span>
              </div>
              {tasks[col]?.map(task=><TaskCard key={task.id} task={task} onDragStart={setDragging} agents={agents} />)}
              {(!tasks[col]||tasks[col].length===0)&&<div style={{ border:'1px dashed #1E2230', borderRadius:10, padding:'20px', textAlign:'center', color:'#2A2E3E', fontSize:12 }}>Drop tasks here</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
