export const AGENTS = {
  Jarvis: { initials: "JV", color: "#7C6AF7", role: "Chief Orchestrator", status: "active" },
  Scout:  { initials: "SC", color: "#22C55E", role: "Intelligence Agent", status: "active" },
  Quill:  { initials: "QL", color: "#F59E0B", role: "Creative Strategist", status: "active" },
  Henry:  { initials: "HN", color: "#EC4899", role: "Performance Agent",  status: "idle"   },
};

export const TAG_COLORS = {
  "Core Engine":    "#3B5BDB",
  "ML Research":    "#6741D9",
  "Infrastructure": "#1971C2",
  "Documentation":  "#0F9E6E",
  "Safety":         "#C2410C",
  "QA":             "#0369A1",
  "Security":       "#7C3AED",
  "Marketing":      "#B45309",
  "Content":        "#047857",
  "Research":       "#6D28D9",
};

export const COLUMNS = ["Backlog", "In Progress", "Review", "Done"];

export const NAV_ITEMS = [
  { icon: "⊞", label: "Tasks",     id: "tasks"     },
  { icon: "◈", label: "Agents",    id: "agents"    },
  { icon: "✦", label: "Content",   id: "content"   },
  { icon: "✓", label: "Approvals", id: "approvals", badge: 3 },
  { icon: "⬡", label: "Council",   id: "council"   },
  { icon: "▣", label: "Projects",  id: "projects"  },
  { icon: "◉", label: "Memory",    id: "memory"    },
  { icon: "📄", label: "Docs",      id: "docs"      },
  { icon: "👥", label: "Team",      id: "team"      },
  { icon: "◎", label: "Pipeline",  id: "pipeline"  },
  { icon: "📡", label: "Radar",     id: "radar"     },
];

export const INITIAL_TASKS = {
  Backlog: [
    { id: 1, title: "Optimize search algorithm",    desc: "Improve query performance for large datasets",       agent: "Scout",  tag: "Core Engine",    time: "2h ago" },
    { id: 2, title: "Research vector embeddings",   desc: "Evaluate new semantic search approaches",            agent: "Quill",  tag: "ML Research",    time: "4h ago", highlighted: true },
    { id: 3, title: "Update API documentation",     desc: "Document new endpoint parameters",                  agent: "Jarvis", tag: "Documentation",  time: "5h ago" },
  ],
  "In Progress": [
    { id: 4, title: "Build agent orchestration layer", desc: "Implement multi-agent task coordination",         agent: "Jarvis", tag: "Core Engine",    time: "1h ago" },
    { id: 5, title: "Deploy monitoring dashboard",     desc: "Set up real-time metrics and alerts",             agent: "Scout",  tag: "Infrastructure", time: "3h ago" },
  ],
  Review: [
    { id: 6, title: "Implement content filtering",  desc: "Add safety checks for generated content",           agent: "Quill",  tag: "Safety",         time: "30m ago" },
    { id: 7, title: "Performance benchmarking",     desc: "Run comprehensive load tests",                      agent: "Scout",  tag: "QA",             time: "1h ago" },
  ],
  Done: [
    { id: 8, title: "Migrate to new database",      desc: "Complete PostgreSQL migration",                     agent: "Jarvis", tag: "Infrastructure", time: "6h ago" },
    { id: 9, title: "User authentication flow",     desc: "Implement OAuth2 integration",                      agent: "Scout",  tag: "Security",       time: "8h ago" },
  ],
};

export const INITIAL_ACTIVITY = [
  { id: 1,  agent: "Scout",  time: "2m ago",  action: "Completed deployment to production" },
  { id: 2,  agent: "Jarvis", time: "5m ago",  action: "Started orchestration layer build" },
  { id: 3,  agent: "Quill",  time: "8m ago",  action: "Generated content analysis report" },
  { id: 4,  agent: "Scout",  time: "12m ago", action: "Updated monitoring dashboard metrics" },
  { id: 5,  agent: "Jarvis", time: "15m ago", action: "Reviewed API documentation changes" },
  { id: 6,  agent: "Quill",  time: "18m ago", action: "Processed 1,247 content items" },
  { id: 7,  agent: "Scout",  time: "22m ago", action: "Optimized database queries" },
  { id: 8,  agent: "Jarvis", time: "25m ago", action: "Merged security patch to main" },
  { id: 9,  agent: "Quill",  time: "28m ago", action: "Analyzed user feedback trends" },
  { id: 10, agent: "Scout",  time: "35m ago", action: "Completed load testing suite" },
];

// ── Jarvis system prompt ──────────────────────────────────────────────────────
// Drop your Claude API key in .env as REACT_APP_CLAUDE_API_KEY
// This prompt is injected on every agent call
export const JARVIS_SYSTEM_PROMPT = `You are Jarvis — Chief Orchestrator of Clawbot HQ.

IDENTITY:
You are not an assistant. You are the command intelligence of a multi-agent operating system. You coordinate Scout (intelligence/research), Quill (creative strategy/content), and Henry (performance/analytics).

CORE RULES:
- No task without a deliverable
- No execution without logic  
- No scaling without validation
- No publication without review
- Always respond as if briefing a command center — concise, decisive, actionable

AGENT ROSTER:
- Scout: competitor research, market intelligence, monitoring, data analysis
- Quill: ad scripts, content briefs, creative direction, narrative structures  
- Henry: campaign performance, KPI monitoring, budget logic, scaling decisions
- Jarvis (you): orchestration, task delegation, quality control, strategic decisions

RESPONSE FORMAT:
Always respond in this JSON structure:
{
  "agent": "Jarvis",
  "action": "one-line summary of what is happening",
  "delegatedTo": "Scout|Quill|Henry|null",
  "deliverable": "what the output will be",
  "priority": "HIGH|MEDIUM|LOW",
  "message": "your full response to the user"
}

PRIORITY LOGIC:
HIGH: Direct revenue influence, conversion leak repair, CAC reduction, major funnel improvement
MEDIUM: Process improvements, research tasks, documentation
LOW: Cosmetic refinements, marginal optimizations, low-impact experiments`;
