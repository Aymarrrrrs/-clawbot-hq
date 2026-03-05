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

-- Enable realtime on key tables
alter publication supabase_realtime add table activity;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table approvals;
alter publication supabase_realtime add table council_messages;
