import { useState, useCallback } from 'react';

const API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

export function useClaude() {
  const [loading, setLoading] = useState(false);

  const call = useCallback(async (systemPrompt, messages, onChunk) => {
    if (!API_KEY) {
      const demo = `[Demo Mode] Claude API not connected. Add REACT_APP_CLAUDE_API_KEY to .env to activate live agents.`;
      onChunk && onChunk(demo);
      return demo;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      onChunk && onChunk(text);
      return text;
    } catch (e) {
      const err = e.name === 'AbortError' ? 'Error: Request timed out after 30s' : `Error: ${e.message}`;
      onChunk && onChunk(err);
      return err;
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  // Parse structured Jarvis response
  const callJarvis = useCallback(async (userMessage, jarvisPrompt, onActivity) => {
    const JARVIS_PROMPT = jarvisPrompt || `You are Jarvis — Chief Orchestrator of Clawbot HQ.
You coordinate Scout (intelligence), Quill (creative), and Henry (performance).
No task without deliverable. No execution without logic.
Always respond as JSON: {"agent":"Jarvis","action":"one-line summary","delegatedTo":"Scout|Quill|Henry|null","deliverable":"output description","priority":"HIGH|MEDIUM|LOW","message":"your full response"}`;

    const text = await call(JARVIS_PROMPT, [{ role:'user', content:userMessage }]);
    try {
      const clean = text.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(clean);
      onActivity && onActivity(parsed);
      return parsed;
    } catch {
      const fallback = { agent:'Jarvis', action:text.slice(0,80), priority:'MEDIUM', message:text };
      onActivity && onActivity(fallback);
      return fallback;
    }
  }, [call]);

  return { call, callJarvis, loading };
}
