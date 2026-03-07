-- ============================================================
-- CLAWBOT HQ — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  agent text not null default 'Jarvis',
  tag text default 'Core Engine',
  status text not null default 'Backlog',
  priority text default 'MEDIUM',
  highlighted boolean default false,
  deliverable text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AGENTS
create table if not exists agents (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  initials text not null,
  color text not null,
  role text not null,
  status text default 'active',
  system_prompt text,
  task_count int default 0,
  created_at timestamptz default now()
);

-- ACTIVITY LOG
create table if not exists activity (
  id uuid default gen_random_uuid() primary key,
  agent text not null,
  action text not null,
  priority text,
  deliverable text,
  task_id uuid references tasks(id),
  created_at timestamptz default now()
);

-- CONTENT / DELIVERABLES
create table if not exists content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  agent text not null,
  task_id uuid references tasks(id),
  status text default 'draft',
  type text default 'report',
  created_at timestamptz default now()
);

-- APPROVALS
create table if not exists approvals (
  id uuid default gen_random_uuid() primary key,
  content_id uuid references content(id),
  title text not null,
  body text,
  agent text not null,
  status text default 'pending',
  reviewer_notes text,
  created_at timestamptz default now()
);

-- COUNCIL SESSIONS (multi-agent deliberation)
create table if not exists council_sessions (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists council_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references council_sessions(id) on delete cascade,
  agent text not null,
  message text not null,
  created_at timestamptz default now()
);

-- AGENT CHAT HISTORY
create table if not exists agent_chats (
  id uuid default gen_random_uuid() primary key,
  agent text not null,
  role text not null, -- 'user' | 'assistant'
  message text not null,
  created_at timestamptz default now()
);

-- SEED DEFAULT AGENTS
insert into agents (name, initials, color, role, status, system_prompt) values
('Jarvis', 'JV', '#7C6AF7', 'Chief Orchestrator', 'active',
'You are Jarvis — Chief Orchestrator of Clawbot HQ. You coordinate all agents, maintain system stability, prevent task conflicts, enforce deliverable standards, and prioritize strategic leverage. No task without deliverable. No execution without logic. No scaling without validation. Respond concisely and decisively as a command intelligence.'),
('Scout', 'SC', '#22C55E', 'Intelligence Agent', 'active',
'You are Scout — Intelligence Agent of Clawbot HQ. You focus on competitor research, market intelligence, performance monitoring, and data analysis. Your outputs are strategy reports, angle analysis, and actionable intelligence briefs. Always be specific, data-driven, and concise.'),
('Quill', 'QL', '#F59E0B', 'Creative Strategist', 'active',
'You are Quill — Creative Strategist of Clawbot HQ. You focus on hooks, emotional triggers, ad scripts, persuasion frameworks, and narrative structures. Your outputs are creative briefs, ad scripts, and content directions. Be imaginative, punchy, and conversion-focused.'),
('Henry', 'HN', '#EC4899', 'Performance Agent', 'idle',
'You are Henry — Performance Agent of Clawbot HQ. You focus on campaign structuring, budget logic, scaling decisions, and KPI monitoring. Your outputs are campaign setups, optimization logic, and kill/scale signals. Be analytical, ROI-focused, and decisive.')
on conflict (name) do nothing;

-- ============================================================
-- IGNITE OS V1 — Schema additions
-- ============================================================

-- OSSIA METRICS (ad performance snapshot)
create table if not exists ossia_metrics (
  id uuid default gen_random_uuid() primary key,
  roas numeric default 0,
  revenue_week numeric default 0,
  ad_spend numeric default 0,
  cpm numeric default 0,
  ctr numeric default 0,
  created_at timestamptz default now()
);

-- MAKE SCENARIOS (cached state from Make.com API)
create table if not exists make_scenarios (
  id uuid default gen_random_uuid() primary key,
  scenario_id bigint unique,
  name text not null,
  status text default 'active',
  last_run timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SENTINEL REPORTS (nightly security + intel reports)
create table if not exists sentinel_reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  run_type text default 'scheduled',
  created_at timestamptz default now()
);

-- Add Sentinel to agents seed
insert into agents (name, initials, color, role, status, system_prompt) values
('Sentinel', 'SN', '#EF4444', 'Security & Growth Intel', 'idle',
'You are Sentinel — Security & Internal Growth Intel agent at Clawbot HQ. You conduct nightly audits of MCP configurations, credential hygiene, and transcript scrubbing. You also search for new Claude skills, plugins, and AI tools relevant to the agency stack. Your outputs are security audit reports and intelligence briefings on emerging AI capabilities. Be thorough, precise, and proactive. Structure your report with: 1) Security Audit Summary, 2) Credential Hygiene Check, 3) New AI Tools & Claude Plugins Discovered, 4) Recommended Actions.')
on conflict (name) do nothing;

-- Enable realtime on key tables
alter publication supabase_realtime add table activity;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table approvals;
alter publication supabase_realtime add table council_messages;
alter publication supabase_realtime add table sentinel_reports;
