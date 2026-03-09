import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

// ── Tasks ────────────────────────────────────────────────────────────────────
export function useTasks() {
  const [tasks, setTasks] = useState({
    Backlog: [
      { id:'demo-1', title:'Optimize search algorithm', description:'Improve query performance for large datasets', agent:'Scout', tag:'Core Engine', status:'Backlog', priority:'MEDIUM', time:'2h ago' },
      { id:'demo-2', title:'Research vector embeddings', description:'Evaluate new semantic search approaches', agent:'Quill', tag:'ML Research', status:'Backlog', priority:'HIGH', highlighted:true, time:'4h ago' },
      { id:'demo-3', title:'Update API documentation', description:'Document new endpoint parameters', agent:'Jarvis', tag:'Documentation', status:'Backlog', priority:'LOW', time:'5h ago' },
    ],
    'In Progress': [
      { id:'demo-4', title:'Build agent orchestration layer', description:'Implement multi-agent task coordination', agent:'Jarvis', tag:'Core Engine', status:'In Progress', priority:'HIGH', time:'1h ago' },
      { id:'demo-5', title:'Deploy monitoring dashboard', description:'Set up real-time metrics and alerts', agent:'Scout', tag:'Infrastructure', status:'In Progress', priority:'MEDIUM', time:'3h ago' },
    ],
    Review: [
      { id:'demo-6', title:'Implement content filtering', description:'Add safety checks for generated content', agent:'Quill', tag:'Safety', status:'Review', priority:'HIGH', time:'30m ago' },
      { id:'demo-7', title:'Performance benchmarking', description:'Run comprehensive load tests', agent:'Scout', tag:'QA', status:'Review', priority:'MEDIUM', time:'1h ago' },
    ],
    Done: [
      { id:'demo-8', title:'Migrate to new database', description:'Complete PostgreSQL migration', agent:'Jarvis', tag:'Infrastructure', status:'Done', priority:'HIGH', time:'6h ago' },
      { id:'demo-9', title:'User authentication flow', description:'Implement OAuth2 integration', agent:'Scout', tag:'Security', status:'Done', priority:'HIGH', time:'8h ago' },
    ],
  });
  const [loading, setLoading] = useState(false);

  const groupByStatus = (rows) => {
    const g = { Backlog:[], 'In Progress':[], Review:[], Done:[] };
    rows.forEach(t => { if (g[t.status] !== undefined) g[t.status].push({ ...t, time: timeAgo(t.created_at) }); });
    return g;
  };

  const fetchTasks = useCallback(async () => {
    if (!isSupabaseReady) return;
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(groupByStatus(data));
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!isSupabaseReady) return;
    const sub = supabase.channel('tasks').on('postgres_changes', { event:'*', schema:'public', table:'tasks' }, fetchTasks).subscribe();
    return () => supabase.removeChannel(sub);
  }, [fetchTasks]);

  const addTask = async (task) => {
    const newTask = { ...task, id: Date.now().toString(), time: 'just now', status: 'Backlog' };
    setTasks(prev => ({ ...prev, Backlog: [newTask, ...prev.Backlog] }));
    if (isSupabaseReady) {
      await supabase.from('tasks').insert({ title:task.title, description:task.description, agent:task.agent, tag:task.tag, priority:task.priority||'MEDIUM', status:'Backlog' });
    }
  };

  const moveTask = async (task, newStatus) => {
    setTasks(prev => {
      const next = {};
      for (const [k,v] of Object.entries(prev)) next[k] = v.filter(t => t.id !== task.id);
      next[newStatus] = [{ ...task, status:newStatus, time:'just now' }, ...next[newStatus]];
      return next;
    });
    if (isSupabaseReady && !task.id.startsWith('demo')) {
      await supabase.from('tasks').update({ status:newStatus, updated_at:new Date().toISOString() }).eq('id', task.id);
    }
  };

  return { tasks, loading, addTask, moveTask, fetchTasks };
}

// ── Agents ───────────────────────────────────────────────────────────────────
export function useAgents() {
  const DEFAULT = [
    { id:'a1', name:'Jarvis',   initials:'JV', color:'#7C6AF7', role:'Chief Orchestrator',    status:'active', task_count:24,
      system_prompt:'You are Jarvis — Chief Orchestrator of Clawbot HQ. You coordinate all agents, maintain system stability, prevent task conflicts, enforce deliverable standards, and prioritize strategic leverage. No task without deliverable. No execution without logic.' },
    { id:'a2', name:'Scout',    initials:'SC', color:'#22C55E', role:'Intelligence Agent',     status:'active', task_count:18,
      system_prompt:'You are Scout — Intelligence Agent of Clawbot HQ. You focus on competitor research, market intelligence, performance monitoring, and data analysis. Your outputs are strategy reports, angle analysis, and actionable intelligence briefs.' },
    { id:'a3', name:'Quill',    initials:'QL', color:'#F59E0B', role:'Creative Strategist',    status:'active', task_count:15,
      system_prompt:'You are Quill — Creative Strategist of Clawbot HQ. You focus on hooks, emotional triggers, ad scripts, persuasion frameworks, and narrative structures. Your outputs are creative briefs, ad scripts, and content directions.' },
    { id:'a4', name:'Henry',    initials:'HN', color:'#EC4899', role:'Performance Agent',      status:'idle',   task_count:9,
      system_prompt:'You are Henry — Performance Agent of Clawbot HQ. You focus on campaign structuring, budget logic, scaling decisions, and KPI monitoring. Your outputs are campaign setups, optimization logic, and kill/scale signals.' },
    { id:'a5', name:'Sentinel', initials:'SN', color:'#EF4444', role:'Security & Growth Intel', status:'idle',  task_count:0,
      system_prompt:'You are Sentinel — Security & Internal Growth Intel agent at Clawbot HQ. You conduct nightly audits of MCP configurations, credential hygiene, and transcript scrubbing. You also search for new Claude skills, plugins, and AI tools relevant to the agency stack. Your outputs are security audit reports and intelligence briefings on emerging AI capabilities. Be thorough, precise, and proactive. Structure your report with: 1) Security Audit Summary, 2) Credential Hygiene Check, 3) New AI Tools & Claude Plugins Discovered, 4) Recommended Actions.' },
  ];
  const [agents, setAgents] = useState(DEFAULT);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('agents').select('*').then(({ data }) => { if (data?.length) setAgents(data); });
  }, []);

  const updateAgent = async (id, updates) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    if (isSupabaseReady) await supabase.from('agents').update(updates).eq('id', id);
  };

  return { agents, updateAgent };
}

// ── Activity ─────────────────────────────────────────────────────────────────
export function useActivity() {
  const DEMO = [
    { id:'act-1', agent:'Scout',  action:'Completed deployment to production', priority:null, created_at: new Date(Date.now()-120000).toISOString() },
    { id:'act-2', agent:'Jarvis', action:'Started orchestration layer build',  priority:'HIGH', created_at: new Date(Date.now()-300000).toISOString() },
    { id:'act-3', agent:'Quill',  action:'Generated content analysis report',  priority:'MEDIUM', created_at: new Date(Date.now()-480000).toISOString() },
    { id:'act-4', agent:'Scout',  action:'Updated monitoring dashboard',        priority:null, created_at: new Date(Date.now()-720000).toISOString() },
    { id:'act-5', agent:'Jarvis', action:'Reviewed API documentation changes',  priority:'LOW', created_at: new Date(Date.now()-900000).toISOString() },
    { id:'act-6', agent:'Quill',  action:'Processed 1,247 content items',       priority:null, created_at: new Date(Date.now()-1080000).toISOString() },
  ];
  const [activity, setActivity] = useState(DEMO);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('activity').select('*').order('created_at',{ascending:false}).limit(30).then(({data})=>{ if(data?.length) setActivity(data); });
    const sub = supabase.channel('activity').on('postgres_changes',{event:'INSERT',schema:'public',table:'activity'},
      ({new:row}) => setActivity(prev => [row,...prev.slice(0,29)])).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const logActivity = useCallback(async (entry) => {
    const row = { id:Date.now().toString(), ...entry, created_at:new Date().toISOString() };
    setActivity(prev => [row,...prev.slice(0,29)]);
    if (isSupabaseReady) await supabase.from('activity').insert({ agent:entry.agent, action:entry.action, priority:entry.priority||null, deliverable:entry.deliverable||null });
  }, []);

  return { activity, logActivity };
}

// ── Content ───────────────────────────────────────────────────────────────────
export function useContent() {
  const DEMO = [
    { id:'c1', title:'Q1 Competitor Analysis', body:'Comprehensive analysis of top 5 competitors in the market...', agent:'Scout', type:'report', status:'published', created_at:new Date(Date.now()-86400000).toISOString() },
    { id:'c2', title:'TikTok Ad Script — Hook Series', body:'Hook 1: "Stop scrolling if you want to 10x your output..."\nHook 2: "This AI does the work of 5 employees..."', agent:'Quill', type:'script', status:'draft', created_at:new Date(Date.now()-172800000).toISOString() },
    { id:'c3', title:'Campaign Performance Report', body:'Week 3 results: CTR up 23%, CPA down 15%, ROAS at 4.2x...', agent:'Henry', type:'report', status:'review', created_at:new Date(Date.now()-259200000).toISOString() },
    { id:'c4', title:'Onboarding Email Sequence', body:'Email 1 (Day 0): Welcome to Clawbot HQ...\nEmail 2 (Day 3): Your first agent mission...', agent:'Quill', type:'email', status:'draft', created_at:new Date(Date.now()-345600000).toISOString() },
  ];
  const [content, setContent] = useState(DEMO);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('content').select('*').order('created_at',{ascending:false}).then(({data})=>{ if(data?.length) setContent(data); });
  }, []);

  const addContent = async (item) => {
    const row = { id:Date.now().toString(), ...item, created_at:new Date().toISOString() };
    setContent(prev => [row,...prev]);
    if (isSupabaseReady) await supabase.from('content').insert(item);
    return row;
  };

  const updateContent = async (id, updates) => {
    setContent(prev => prev.map(c => c.id===id ? {...c,...updates} : c));
    if (isSupabaseReady) await supabase.from('content').update(updates).eq('id',id);
  };

  return { content, addContent, updateContent };
}

// ── Approvals ─────────────────────────────────────────────────────────────────
export function useApprovals() {
  const DEMO = [
    { id:'ap1', title:'TikTok Hook Series v2', body:'Hook 1: Stop scrolling — this AI replaced my entire content team.\nHook 2: I gave an AI my brand voice. Here is what happened in 7 days.\nHook 3: The content strategy nobody talks about (but everyone copies).', agent:'Quill', status:'pending', created_at:new Date(Date.now()-3600000).toISOString() },
    { id:'ap2', title:'Competitor Intel Report — March', body:'Top findings:\n• Competitor A launched new pricing tier at $49/mo\n• Competitor B pulling back on TikTok spend (-40%)\n• Gap identified in "AI for solopreneurs" messaging\n\nRecommendation: Move fast on solopreneur angle.', agent:'Scout', status:'pending', created_at:new Date(Date.now()-7200000).toISOString() },
    { id:'ap3', title:'Campaign Budget Reallocation', body:'Current: $2,000/day split evenly across 4 ad sets.\nProposed: Shift 60% budget to Ad Set 2 (ROAS 5.1x), kill Ad Set 4 (ROAS 1.2x).\nProjected impact: +$800/day profit.', agent:'Henry', status:'pending', created_at:new Date(Date.now()-10800000).toISOString() },
    { id:'ap4', title:'Q4 Strategy Brief', body:'Recommended focus areas for Q4:\n1. Double down on video content (3x engagement vs static)\n2. Launch referral program\n3. Expand to LinkedIn audience', agent:'Jarvis', status:'approved', created_at:new Date(Date.now()-86400000).toISOString() },
  ];
  const [approvals, setApprovals] = useState(DEMO);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('approvals').select('*').order('created_at',{ascending:false}).then(({data})=>{ if(data?.length) setApprovals(data); });
    const sub = supabase.channel('approvals').on('postgres_changes',{event:'INSERT',schema:'public',table:'approvals'},
      ({new:row})=>setApprovals(prev=>[row,...prev])).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const updateApproval = async (id, status, notes='') => {
    setApprovals(prev => prev.map(a => a.id===id ? {...a,status,reviewer_notes:notes} : a));
    if (isSupabaseReady) await supabase.from('approvals').update({status,reviewer_notes:notes}).eq('id',id);
  };

  const addApproval = async (item) => {
    const row = { id:Date.now().toString(), ...item, status:'pending', created_at:new Date().toISOString() };
    setApprovals(prev=>[row,...prev]);
    if (isSupabaseReady) await supabase.from('approvals').insert(item);
  };

  return { approvals, updateApproval, addApproval };
}

// ── Council ───────────────────────────────────────────────────────────────────
export function useCouncil() {
  const [sessions, setSessions] = useState([
    { id:'s1', topic:'Q2 Marketing Strategy Direction', status:'active', created_at:new Date().toISOString(), messages:[] },
  ]);
  const [activeSession, setActiveSession] = useState('s1');

  const createSession = async (topic) => {
    const s = { id:Date.now().toString(), topic, status:'active', created_at:new Date().toISOString(), messages:[] };
    setSessions(prev=>[s,...prev]);
    setActiveSession(s.id);
    if (isSupabaseReady) await supabase.from('council_sessions').insert({topic,status:'active'});
    return s;
  };

  const addMessage = (sessionId, msg) => {
    setSessions(prev => prev.map(s => s.id===sessionId ? {...s, messages:[...s.messages, msg]} : s));
    if (isSupabaseReady) supabase.from('council_messages').insert({session_id:sessionId, agent:msg.agent, message:msg.message});
  };

  return { sessions, activeSession, setActiveSession, createSession, addMessage };
}

// ── Agent Chat ─────────────────────────────────────────────────────────────────
export function useAgentChat(agentName) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isSupabaseReady || !agentName) return;
    supabase.from('agent_chats').select('*').eq('agent',agentName).order('created_at',{ascending:true}).limit(50)
      .then(({data})=>{ if(data?.length) setMessages(data.map(m=>({role:m.role,content:m.message}))); });
  }, [agentName]);

  const saveMessage = async (role, message) => {
    setMessages(prev=>[...prev,{role,content:message}]);
    if (isSupabaseReady) await supabase.from('agent_chats').insert({agent:agentName,role,message});
  };

  return { messages, saveMessage };
}

// ── Ossia Metrics ─────────────────────────────────────────────────────────────
export function useOssiaMetrics() {
  const DEMO = { roas:4.2, revenue_week:12400, ad_spend:2950, cpm:8.40, ctr:2.1, updated_at:new Date().toISOString() };
  const [metrics, setMetrics] = useState(DEMO);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('ossia_metrics').select('*').order('created_at',{ascending:false}).limit(1)
      .then(({data})=>{ if(data?.length) setMetrics({...data[0], updated_at:data[0].created_at}); });
  }, []);

  const saveMetrics = async (vals) => {
    const row = { ...vals, updated_at:new Date().toISOString() };
    setMetrics(row);
    if (isSupabaseReady) await supabase.from('ossia_metrics').insert(vals);
  };

  return { metrics, saveMetrics };
}

// ── Make Scenarios ─────────────────────────────────────────────────────────────
// Extract the path segment after /api/v2/ from a full Make status URL
// e.g. https://us2.make.com/api/v2/executions/abc → "executions/abc"
function extractMakePath(url) {
  try { return new URL(url).pathname.replace(/^\/api\/v2\//, ''); }
  catch { return null; }
}

function makeCorsMsg(e) {
  const net = e.message === 'Failed to fetch' || e.message === 'Load failed' || e.message?.includes('NetworkError');
  return net
    ? 'Network error reaching /api/make-proxy. Check that MAKE_API_KEY is set in Vercel env vars and redeploy.'
    : e.message;
}

export function useMakeScenarios() {
  const DEMO = [
    { id:1, name:'Ossia Ad Creative Flow',  status:'active', last_run:new Date(Date.now()-3600000).toISOString() },
    { id:2, name:'Content → Notion Sync',   status:'active', last_run:new Date(Date.now()-7200000).toISOString() },
    { id:3, name:'Sentinel Nightly Audit',  status:'paused', last_run:new Date(Date.now()-86400000).toISOString() },
  ];
  const [scenarios, setScenarios] = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [triggerResults, setTriggerResults] = useState({}); // { [id]: {ok:bool, msg:string} }
  const [execStatuses, setExecStatuses] = useState({});    // { [id]: {phase, status?, executionTime?, error?, module?} }

  const fetchScenarios = useCallback(async () => {
    const API_KEY = process.env.REACT_APP_MAKE_API_KEY;
    const TEAM_ID = process.env.REACT_APP_MAKE_TEAM_ID;
    const BASE = process.env.REACT_APP_MAKE_API_URL || '/api/make-proxy';
    if (!TEAM_ID) return;
    setLoading(true); setFetchError(null);
    try {
      const res = await fetch(`${BASE}?path=${encodeURIComponent('scenarios?teamId=' + TEAM_ID)}`, {
        headers: { Authorization:`Token ${API_KEY}` },
      });
      let text = ''; try { text = await res.text(); } catch {}
      if (!res.ok) { setFetchError(`HTTP ${res.status}: ${text.slice(0,200)}`); setLoading(false); return; }
      let data; try { data = JSON.parse(text); } catch { setFetchError(`Non-JSON response: ${text.slice(0,100)}`); setLoading(false); return; }
      if (data?.scenarios?.length) {
        setScenarios(data.scenarios.map(s => ({
          id: s.id,
          name: s.name,
          status: s.isActive ? 'active' : (s.isPaused ? 'paused' : 'error'),
          last_run: s.lastExecution || null,
        })));
      } else {
        setFetchError(`Unexpected response shape: ${JSON.stringify(data).slice(0,120)}`);
      }
    } catch(e) {
      setFetchError(makeCorsMsg(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  // Poll execution status every 3s for up to 60s after a successful trigger
  const pollExecution = useCallback((scenarioId, statusUrl) => {
    const path = extractMakePath(statusUrl);
    if (!path) return;
    const BASE = process.env.REACT_APP_MAKE_API_URL || '/api/make-proxy';
    const deadline = Date.now() + 60000;

    setExecStatuses(prev => ({ ...prev, [scenarioId]: { phase:'polling', status:'running' } }));

    const tick = async () => {
      if (Date.now() >= deadline) {
        setExecStatuses(prev => ({ ...prev, [scenarioId]: { phase:'timeout' } }));
        return;
      }
      try {
        const res = await fetch(`${BASE}?path=${encodeURIComponent(path)}`);
        const data = await res.json().catch(() => ({}));
        // Make returns { execution: {...} } or the object directly
        const exec = data?.execution ?? data;
        const status = exec?.status;

        if (status === 'success') {
          setExecStatuses(prev => ({ ...prev, [scenarioId]: { phase:'success', executionTime: exec.executionTime ?? null } }));
        } else if (status === 'error') {
          setExecStatuses(prev => ({ ...prev, [scenarioId]: {
            phase:'error',
            error: exec.error?.message || exec.reason || 'Execution failed',
            module: exec.error?.module ?? null,
          }}));
        } else {
          // running / waiting — update label and schedule next tick
          setExecStatuses(prev => ({ ...prev, [scenarioId]: { phase:'polling', status: status || 'running' } }));
          setTimeout(tick, 3000);
        }
      } catch(e) {
        setExecStatuses(prev => ({ ...prev, [scenarioId]: { phase:'error', error: e.message } }));
      }
    };

    setTimeout(tick, 3000); // first check 3s after trigger
  }, []);

  const triggerScenario = async (id) => {
    const API_KEY = process.env.REACT_APP_MAKE_API_KEY;
    const BASE = process.env.REACT_APP_MAKE_API_URL || '/api/make-proxy';
    setTriggering(id);
    setTriggerResults(prev => ({ ...prev, [id]: null }));
    try {
      const res = await fetch(`${BASE}?path=${encodeURIComponent('scenarios/' + id + '/run')}`, {
        method:'POST',
        headers:{ Authorization:`Token ${API_KEY}`, 'Content-Type':'application/json' },
      });
      let body = ''; let parsed = null;
      try { body = await res.text(); } catch {}
      try { parsed = JSON.parse(body); } catch {}
      if (res.ok) {
        const statusUrl = parsed?.statusUrl || null;
        setTriggerResults(prev => ({ ...prev, [id]: { ok:true, msg:`HTTP ${res.status} — ${parsed?.status || body || 'Accepted'}` } }));
        setExecStatuses(prev => ({ ...prev, [id]: null })); // clear any previous exec status
        setScenarios(prev => prev.map(s => s.id===id ? {...s, last_run:new Date().toISOString()} : s));
        if (statusUrl) pollExecution(id, statusUrl);
      } else {
        setTriggerResults(prev => ({ ...prev, [id]: { ok:false, msg:`HTTP ${res.status}: ${body.slice(0,150)}` } }));
      }
    } catch(e) {
      setTriggerResults(prev => ({ ...prev, [id]: { ok:false, msg:makeCorsMsg(e) } }));
    }
    setTriggering(null);
  };

  return { scenarios, loading, triggering, fetchError, triggerResults, execStatuses, fetchScenarios, triggerScenario };
}

// ── Sentinel Reports ───────────────────────────────────────────────────────────
export function useSentinelReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!isSupabaseReady) return;
    supabase.from('sentinel_reports').select('*').order('created_at',{ascending:false}).limit(10)
      .then(({data})=>{ if(data?.length) setReports(data); });
    const sub = supabase.channel('sentinel_reports').on('postgres_changes',{event:'INSERT',schema:'public',table:'sentinel_reports'},
      ({new:row})=>setReports(prev=>[row,...prev.slice(0,9)])).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const addReport = async (report) => {
    const row = { id:Date.now().toString(), ...report, created_at:new Date().toISOString() };
    setReports(prev=>[row,...prev.slice(0,9)]);
    if (isSupabaseReady) await supabase.from('sentinel_reports').insert(report);
    return row;
  };

  return { reports, addReport };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return 'just now';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
