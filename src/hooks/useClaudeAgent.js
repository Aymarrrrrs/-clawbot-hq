import { useState, useCallback } from 'react';
import { JARVIS_SYSTEM_PROMPT } from '../data/constants';

const API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

export function useClaudeAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const callJarvis = useCallback(async (userMessage, onActivity) => {
    if (!API_KEY) {
      // Demo mode — simulate Jarvis without API key
      const demo = {
        agent: "Jarvis",
        action: `Processing: "${userMessage.slice(0, 40)}..."`,
        delegatedTo: ["Scout", "Quill", "Henry"][Math.floor(Math.random() * 3)],
        deliverable: "Task analysis and delegation report",
        priority: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)],
        message: `[DEMO MODE] Jarvis received: "${userMessage}". Add REACT_APP_CLAUDE_API_KEY to .env to activate live agents.`,
      };
      onActivity && onActivity(demo);
      return demo;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: JARVIS_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      const raw  = data.content?.[0]?.text || '{}';

      let parsed;
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = { agent: 'Jarvis', action: 'Responded', deliverable: 'Message', priority: 'MEDIUM', message: raw };
      }

      onActivity && onActivity(parsed);
      return parsed;

    } catch (err) {
      setError(err.message);
      const fallback = { agent: 'Jarvis', action: 'Error occurred', message: err.message, priority: 'LOW' };
      onActivity && onActivity(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callJarvis, loading, error };
}
