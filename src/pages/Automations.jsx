import { useMemo, useState } from 'react';
import Card from '../components/common/Card';

const PRESETS = [
  'Auto-assign based on category',
  'Auto-escalate overdue tickets',
  'Auto-close resolved tickets after X days',
  'Send reminders for unassigned tickets',
];

export default function Automations() {
  const [rules, setRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('automation-rules') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', trigger: 'Ticket created', condition: 'Priority is Critical', action: 'Assign to specific team', active: true });

  const addRule = () => {
    if (!form.name.trim()) return;
    const next = [{ id: Date.now(), ...form, success: 0, lastRun: null }, ...rules];
    setRules(next);
    localStorage.setItem('automation-rules', JSON.stringify(next));
    setForm({ name: '', trigger: 'Ticket created', condition: 'Priority is Critical', action: 'Assign to specific team', active: true });
  };

  const updateRule = (id, updates) => {
    const next = rules.map((r) => r.id === id ? { ...r, ...updates } : r);
    setRules(next);
    localStorage.setItem('automation-rules', JSON.stringify(next));
  };

  const removeRule = (id) => {
    const next = rules.filter((r) => r.id !== id);
    setRules(next);
    localStorage.setItem('automation-rules', JSON.stringify(next));
  };

  const logs = useMemo(() => rules.slice(0, 10).map((r) => ({ id: r.id, text: `Rule \"${r.name}\" ${r.active ? 'is active' : 'is paused'}`, at: r.lastRun || new Date().toISOString() })), [rules]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automation / Workflows</h1><p className="text-gray-600 dark:text-gray-400">Build trigger-condition-action rules and monitor execution logs.</p></div>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Create Automation</h3>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Rule name" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['Ticket created', 'Status changed', 'Priority changed', 'Time-based', 'Keyword detected'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['Priority is Critical', 'Category is Bug', 'Unassigned > 1 hour', 'Customer tier is Enterprise'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['Assign to specific user/team', 'Change status', 'Send email notification', 'Add comment', 'Add tag', 'Escalate ticket'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />Active</label>
          <button onClick={addRule} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Create Rule</button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Pre-built Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {PRESETS.map((p) => <div key={p} className="px-3 py-2 rounded-lg border bg-gray-50 dark:bg-dark-border/30">{p}</div>)}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Automation Rules</h3>
        {rules.length === 0 ? <p className="text-sm text-gray-500">No rules configured yet.</p> : rules.map((r) => (
          <div key={r.id} className="p-3 border rounded-lg bg-white dark:bg-dark-surface flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{r.name}</p>
              <p className="text-gray-500">WHEN {r.trigger} IF {r.condition} THEN {r.action}</p>
              <p className="text-xs text-gray-500 mt-1">Success count: {r.success} · Last run: {r.lastRun ? new Date(r.lastRun).toLocaleString() : 'Never'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateRule(r.id, { active: !r.active })} className={`px-2 py-1 text-xs rounded ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{r.active ? 'Active' : 'Inactive'}</button>
              <button onClick={() => updateRule(r.id, { lastRun: new Date().toISOString(), success: Number(r.success || 0) + 1 })} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Test</button>
              <button onClick={() => removeRule(r.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Automation Logs</h3>
        <div className="space-y-1 text-sm">
          {logs.map((l) => <div key={l.id} className="px-3 py-2 rounded bg-gray-50 dark:bg-dark-border/30">{l.text} · {new Date(l.at).toLocaleString()}</div>)}
        </div>
      </Card>
    </div>
  );
}
