import { useState } from 'react';
import Card from '../components/common/Card';

const TOOLS = [
  { key: 'slack', name: 'Slack', desc: 'Send updates and slash-command actions.' },
  { key: 'jira', name: 'Jira', desc: 'Sync incidents with engineering backlogs.' },
  { key: 'teams', name: 'Microsoft Teams', desc: 'Publish critical alerts to channels.' },
  { key: 'email', name: 'Email SMTP', desc: 'Outbound notifications and digests.' },
  { key: 'webhook', name: 'Webhooks', desc: 'Custom event delivery for automations.' },
  { key: 'calendar', name: 'Google Calendar', desc: 'Schedule follow-ups and SLA checkpoints.' },
];

export default function Integrations() {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('integration-state') || '{}'); } catch { return {}; }
  });

  const toggle = (key) => {
    const next = { ...state, [key]: { connected: !state[key]?.connected, updatedAt: new Date().toISOString() } };
    setState(next);
    localStorage.setItem('integration-state', JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect communication, issue-tracking, and scheduling tools.</p>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {TOOLS.map((tool) => {
          const connected = Boolean(state[tool.key]?.connected);
          return (
            <div key={tool.key} className="p-4 rounded-lg border bg-white dark:bg-dark-surface">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tool.desc}</p>
                  <p className="text-xs text-gray-500 mt-2">Last changed: {state[tool.key]?.updatedAt ? new Date(state[tool.key].updatedAt).toLocaleString() : 'Never'}</p>
                </div>
                <button onClick={() => toggle(tool.key)} className={`px-3 py-1.5 text-xs rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {connected ? 'Connected' : 'Not Connected'}
                </button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
