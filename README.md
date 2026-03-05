# 🤖 Clawbot HQ — Mission Control Dashboard

A live, interactive AI agent command center. Built with React. Powered by Claude.

---

## 🚀 Quick Start (3 steps)

### 1. Install
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.example .env
```
Open `.env` and replace `your_claude_api_key_here` with your key from [console.anthropic.com](https://console.anthropic.com).

> **No API key yet?** The dashboard runs in Demo Mode automatically — all features work with simulated agent activity.

### 3. Run
```bash
npm start
```
Opens at `http://localhost:3000`

---

## 🌐 Deploy to Vercel (free, 2 minutes)

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```
When prompted, set environment variable:
```
REACT_APP_CLAUDE_API_KEY = your_key_here
```

### Option B — GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable `REACT_APP_CLAUDE_API_KEY` in the Vercel dashboard
4. Deploy → get your live URL

---

## 🧠 How Jarvis Works

When you create a task with "Ask Jarvis" enabled:
1. Task is added to Backlog
2. Jarvis (Claude Sonnet) receives the task context + full system prompt
3. Jarvis responds with priority assessment, delegation plan, and deliverable
4. Response appears in the Live Activity Feed in real time

The Jarvis system prompt is in `src/data/constants.js` — edit it to customize his behavior, add agents, or change priority logic.

---

## 📁 Project Structure

```
clawbot-hq/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AgentAvatar.jsx    # Agent avatar with color coding
│   │   ├── KanbanColumn.jsx   # Drag & drop column
│   │   ├── LiveFeed.jsx       # Real-time activity panel
│   │   ├── NewTaskModal.jsx   # Task creation with Jarvis toggle
│   │   ├── Sidebar.jsx        # Navigation
│   │   └── TagPill.jsx        # Colored tag badges
│   ├── data/
│   │   └── constants.js       # All data + Jarvis system prompt
│   ├── hooks/
│   │   └── useClaudeAgent.js  # Claude API integration
│   ├── App.jsx                # Main app + state
│   └── index.js
├── .env.example               # Copy to .env and add your key
├── .gitignore
└── package.json
```

---

## ⚡ Features

- **Kanban Board** — Drag & drop tasks between Backlog → In Progress → Review → Done
- **Jarvis Integration** — Every new task can be routed through Jarvis for orchestration
- **Live Activity Feed** — Real-time agent actions with priority badges and deliverable tracking
- **Agent Status Panel** — See which agents are active at a glance
- **Demo Mode** — Works without API key, simulates agent activity automatically

---

## 🔌 Phase 2 — Connect Make (optional)

Once deployed, you can wire Make (make.com) to:
- Trigger Jarvis when tasks are created externally
- Store deliverables in Notion/Airtable
- Send Slack notifications when agents complete tasks
- Schedule periodic agent polling

Webhook endpoint pattern:
```
POST https://your-vercel-url.vercel.app/api/webhook
Body: { "event": "task_created", "task": { ... } }
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `REACT_APP_CLAUDE_API_KEY` | Your Anthropic API key |

---

Built with React · Powered by Claude Sonnet · Deployed on Vercel
