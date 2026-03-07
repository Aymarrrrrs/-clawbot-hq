import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/shared/Sidebar';
import LiveFeed from './components/shared/LiveFeed';
import TasksPage from './components/pages/TasksPage';
import AgentsPage from './components/pages/AgentsPage';
import ContentPage from './components/pages/ContentPage';
import ApprovalsPage from './components/pages/ApprovalsPage';
import CouncilPage from './components/pages/CouncilPage';
import PlaceholderPage from './components/pages/PlaceholderPage';
import PipelinePage from './components/pages/PipelinePage';
import OssiaCreativePage from './components/pages/OssiaCreativePage';
import OssiaMetricsPage from './components/pages/OssiaMetricsPage';
import { useTasks, useAgents, useActivity, useContent, useApprovals, useCouncil, useSentinelReports } from './hooks/useSupabase';
import { useClaude } from './hooks/useClaude';

const DEMO_FEED = [
  ["Scout","Scanning competitor intelligence feeds"],
  ["Jarvis","Re-prioritizing task queue by ROI impact"],
  ["Quill","Drafting content brief for new campaign"],
  ["Scout","Running performance audit on live assets"],
  ["Jarvis","Coordinating handoff between Scout and Quill"],
  ["Quill","Synthesizing research into creative angles"],
  ["Sentinel","Auditing MCP configs for credential hygiene"],
  ["Sentinel","Scanning for new Claude plugins and AI tools"],
];

// ── Sentinel: nightly scheduler ───────────────────────────────────────────────
const SENTINEL_KEY = 'sentinel_last_run_date';
function todayStr() { return new Date().toISOString().slice(0,10); }
function shouldRunSentinel() {
  const h = new Date().getHours();
  return h >= 23 && localStorage.getItem(SENTINEL_KEY) !== todayStr();
}
function markSentinelRan() { localStorage.setItem(SENTINEL_KEY, todayStr()); }

export default function App() {
  const [activeNav, setActiveNav] = useState('tasks');
  const [chatMessages, setChatMessages] = useState({});
  const [chatLoading, setChatLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [councilLoading, setCouncilLoading] = useState(false);

  const { tasks, addTask, moveTask }                       = useTasks();
  const { agents, updateAgent }                            = useAgents();
  const { activity, logActivity }                          = useActivity();
  const { content, addContent, updateContent }             = useContent();
  const { approvals, updateApproval, addApproval }         = useApprovals();
  const { sessions, activeSession, setActiveSession, createSession, addMessage } = useCouncil();
  const { addReport: addSentinelReport }                   = useSentinelReports();
  const { call, callJarvis, loading: claudeLoading }       = useClaude();

  const pendingApprovals = approvals.filter(a=>a.status==='pending').length;

  // Demo ticker
  useEffect(() => {
    const API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;
    if (API_KEY) return;
    const t = setInterval(()=>{
      const [agent,action] = DEMO_FEED[Math.floor(Math.random()*DEMO_FEED.length)];
      logActivity({ agent, action });
    }, 7000);
    return ()=>clearInterval(t);
  }, [logActivity]);

  // ── Sentinel: nightly scheduler (checks every 60s) ───────────────────────────
  useEffect(() => {
    const check = async () => {
      if (!shouldRunSentinel()) return;
      markSentinelRan();
      const sentinelAgent = agents.find(a=>a.name==='Sentinel');
      if (!sentinelAgent) return;
      logActivity({ agent:'Sentinel', action:'Nightly audit started', priority:'HIGH' });
      updateAgent(sentinelAgent.id, { status:'active' });

      const response = await call(
        sentinelAgent.system_prompt,
        [{ role:'user', content:`Run your nightly audit for ${new Date().toLocaleDateString()}. Check MCP configs, credential hygiene, transcript scrubbing. Search for new Claude skills/plugins relevant to a performance marketing agency stack. Produce your full structured report.` }]
      );

      // Drop to Content Library
      const newItem = await addContent({
        title: `Sentinel Report — ${new Date().toLocaleDateString()}`,
        body: response,
        agent: 'Sentinel',
        type: 'report',
        status: 'draft',
      });

      // Save sentinel report
      await addSentinelReport({
        title: newItem.title,
        body: response,
        run_type: 'scheduled',
      });

      // Auto-approval
      await addApproval({ title: newItem.title, body: response, agent:'Sentinel', content_id: newItem.id });

      logActivity({ agent:'Sentinel', action:'Nightly audit complete — report in Content Library', priority:'HIGH', deliverable:'Security + Intel Report' });
      updateAgent(sentinelAgent.id, { status:'idle' });
    };

    check(); // check on mount in case it's already 11pm
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  // ── Task: add with optional Jarvis ──────────────────────────────────────────
  const handleAddTask = useCallback(async ({ title, description, agent, tag, priority, askJarvis }) => {
    await addTask({ title, description, agent, tag, priority });
    logActivity({ agent, action:`New task created: "${title}"`, priority });

    if (askJarvis) {
      const agentData = agents.find(a=>a.name==='Jarvis');
      const prompt = `New task in Clawbot HQ:
Title: "${title}"
Deliverable: "${description||'Not specified'}"
Assigned: ${agent} | Tag: ${tag} | Priority: ${priority}
Assess priority, provide orchestration plan, and delegate if needed.`;
      await callJarvis(prompt, agentData?.system_prompt, (res) => {
        logActivity({ agent:'Jarvis', action:res.action||res.message?.slice(0,80), priority:res.priority, deliverable:res.deliverable });
        if (res.delegatedTo) {
          logActivity({ agent:res.delegatedTo, action:`Received delegation: "${title}"`, priority:res.priority });
        }
      });
    }
  }, [addTask, logActivity, agents, callJarvis]);

  // ── Task: move with Jarvis notification ─────────────────────────────────────
  const handleMoveTask = useCallback(async (task, newStatus) => {
    await moveTask(task, newStatus);
    logActivity({ agent:task.agent, action:`"${task.title}" → ${newStatus}` });
    if (newStatus==='Done') {
      const agentData = agents.find(a=>a.name==='Jarvis');
      await callJarvis(`Task completed: "${task.title}". Acknowledge and identify next priority.`, agentData?.system_prompt, (res) => {
        logActivity({ agent:'Jarvis', action:res.action||'Task completion acknowledged', priority:res.priority });
      });
    }
  }, [moveTask, logActivity, agents, callJarvis]);

  // ── Agent: chat ─────────────────────────────────────────────────────────────
  const handleChatSend = useCallback(async (agent, userMessage) => {
    setChatMessages(prev=>({ ...prev, [agent.name]: [...(prev[agent.name]||[]), {role:'user',content:userMessage}] }));
    setChatLoading(true);
    logActivity({ agent:agent.name, action:`User message received`, priority:'LOW' });

    const response = await call(
      agent.system_prompt || `You are ${agent.name}, ${agent.role} at Clawbot HQ.`,
      [...(chatMessages[agent.name]||[]), {role:'user',content:userMessage}]
    );
    setChatMessages(prev=>({ ...prev, [agent.name]: [...(prev[agent.name]||[]), {role:'assistant',content:response}] }));
    logActivity({ agent:agent.name, action:response.slice(0,80), priority:'LOW' });
    setChatLoading(false);
  }, [call, chatMessages, logActivity]);

  // ── Agent: trigger manually ──────────────────────────────────────────────────
  const handleTriggerAgent = useCallback(async (agent) => {
    logActivity({ agent:agent.name, action:`Manual trigger activated`, priority:'MEDIUM' });
    const response = await call(
      agent.system_prompt || `You are ${agent.name}, ${agent.role} at Clawbot HQ.`,
      [{ role:'user', content:`You have been manually triggered. Review current state and report your top priority action.` }]
    );
    logActivity({ agent:agent.name, action:response.slice(0,100), priority:'MEDIUM' });

    // If Sentinel is triggered manually, run a full report
    if (agent.name === 'Sentinel') {
      const newItem = await addContent({
        title: `Sentinel Manual Report — ${new Date().toLocaleString()}`,
        body: response,
        agent: 'Sentinel',
        type: 'report',
        status: 'draft',
      });
      await addSentinelReport({ title: newItem.title, body: response, run_type: 'manual' });
      await addApproval({ title: newItem.title, body: response, agent:'Sentinel', content_id: newItem.id });
      logActivity({ agent:'Sentinel', action:'Manual audit report — sent to Content Library', priority:'HIGH', deliverable:'Security + Intel Report' });
    }
  }, [call, logActivity, addContent, addSentinelReport, addApproval]);

  // ── Content: generate ────────────────────────────────────────────────────────
  const handleGenerateContent = useCallback(async ({ prompt, agent: agentName, type }) => {
    setGenerateLoading(true);
    const agentData = agents.find(a=>a.name===agentName);
    logActivity({ agent:agentName, action:`Generating ${type}: "${prompt.slice(0,50)}..."`, priority:'MEDIUM' });

    const response = await call(
      agentData?.system_prompt || `You are ${agentName} at Clawbot HQ. Produce high-quality, production-ready content.`,
      [{ role:'user', content:`${prompt}\n\nProduce the complete output. Be specific, detailed, and production-ready.` }]
    );

    const newItem = await addContent({
      title: prompt.slice(0,60),
      body: response,
      agent: agentName,
      type,
      status: 'draft',
    });

    await addApproval({ title: newItem.title, body: response, agent: agentName, content_id: newItem.id });
    logActivity({ agent:agentName, action:`Content generated: "${newItem.title}"`, priority:'MEDIUM', deliverable:`${type} — sent to Approvals` });
    setGenerateLoading(false);
  }, [agents, call, addContent, addApproval, logActivity]);

  // ── Council: multi-agent debate ──────────────────────────────────────────────
  const handleCouncilDebate = useCallback(async (session, topic) => {
    setCouncilLoading(true);
    logActivity({ agent:'Jarvis', action:`Council session started: "${topic}"`, priority:'HIGH' });

    const debaters = agents.filter(a=>a.status==='active').slice(0,4);
    for (const agent of debaters) {
      const response = await call(
        agent.system_prompt || `You are ${agent.name} at Clawbot HQ.`,
        [{ role:'user', content:`The Council is deliberating on: "${topic}"\n\nProvide your expert perspective from your role as ${agent.role}. Be concise (2-3 paragraphs), specific, and actionable.` }]
      );
      addMessage(session.id, { agent:agent.name, message:response, time:'just now' });
      logActivity({ agent:agent.name, action:`Council contribution on: "${topic}"`, priority:'HIGH' });
      await new Promise(r=>setTimeout(r,500));
    }

    const jarvisAgent = agents.find(a=>a.name==='Jarvis');
    const synthesis = await call(
      jarvisAgent?.system_prompt || `You are Jarvis, Chief Orchestrator of Clawbot HQ.`,
      [{ role:'user', content:`As Jarvis, synthesize the council's deliberation on: "${topic}"\n\nProvide:\n1. Key consensus points\n2. Recommended action plan (prioritized)\n3. Who owns each action\n\nBe decisive and clear.` }]
    );
    addMessage(session.id, { agent:'Jarvis', message:`**SYNTHESIS & ACTION PLAN:**\n\n${synthesis}`, time:'just now' });
    logActivity({ agent:'Jarvis', action:`Council synthesis complete: "${topic}"`, priority:'HIGH', deliverable:'Action plan issued' });
    setCouncilLoading(false);
  }, [agents, call, addMessage, logActivity]);

  // ── Approval: update ─────────────────────────────────────────────────────────
  const handleUpdateApproval = useCallback(async (id, status, notes) => {
    await updateApproval(id, status, notes);
    const item = approvals.find(a=>a.id===id);
    logActivity({ agent:'Jarvis', action:`${status==='approved'?'✓ Approved':'✕ Rejected'}: "${item?.title}"`, priority:'HIGH' });
    if (status==='approved' && item) {
      await updateContent(item.content_id, { status:'published' });
    }
  }, [updateApproval, approvals, logActivity, updateContent]);

  const pageStyle = { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#0B0D13' };
  const PLACEHOLDER_PAGES = ['projects','memory','docs','team','radar'];

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', background:'#0B0D13', fontFamily:"'DM Sans',sans-serif", color:'#DDE1EE', overflow:'hidden' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} pendingApprovals={pendingApprovals} />

      <div style={pageStyle}>
        {activeNav==='tasks'          && <TasksPage tasks={tasks} onAddTask={handleAddTask} onMoveTask={handleMoveTask} agents={agents} jarvisLoading={claudeLoading} />}
        {activeNav==='agents'         && <AgentsPage agents={agents} onUpdateAgent={updateAgent} activity={activity} onTriggerAgent={handleTriggerAgent} chatMessages={chatMessages} onChatSend={handleChatSend} chatLoading={chatLoading} />}
        {activeNav==='content'        && <ContentPage content={content} agents={agents} onUpdateContent={updateContent} onGenerateContent={handleGenerateContent} generateLoading={generateLoading} />}
        {activeNav==='approvals'      && <ApprovalsPage approvals={approvals} agents={agents} onUpdateApproval={handleUpdateApproval} />}
        {activeNav==='council'        && <CouncilPage sessions={sessions} activeSession={activeSession} setActiveSession={setActiveSession} createSession={createSession} addMessage={addMessage} agents={agents} onCouncilDebate={handleCouncilDebate} councilLoading={councilLoading} />}
        {activeNav==='pipeline'       && <PipelinePage />}
        {activeNav==='creative-engine'&& <OssiaCreativePage />}
        {activeNav==='ossia'          && <OssiaMetricsPage />}
        {PLACEHOLDER_PAGES.includes(activeNav) && <PlaceholderPage page={activeNav} />}
      </div>

      <LiveFeed activity={activity} agents={agents} />
    </div>
  );
}
