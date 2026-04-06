import { useMemo, useState } from 'react';
import Card from '../components/common/Card';

const tabs = ['Ticket Templates', 'Response Templates', 'Email Templates'];

export default function TemplatesPage() {
  const [tab, setTab] = useState(tabs[0]);
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('templates-store') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState({ name: '', content: '', category: 'General' });

  const filtered = useMemo(() => items.filter((i) => i.type === tab), [items, tab]);

  const save = () => {
    if (!form.name || !form.content) return;
    const next = [{ id: Date.now(), type: tab, ...form, usage: 0, updatedAt: new Date().toISOString() }, ...items];
    setItems(next);
    localStorage.setItem('templates-store', JSON.stringify(next));
    setForm({ name: '', content: '', category: 'General' });
  };

  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem('templates-store', JSON.stringify(next));
  };

  const duplicate = (item) => {
    const next = [{ ...item, id: Date.now(), name: `${item.name} (Copy)` }, ...items];
    setItems(next);
    localStorage.setItem('templates-store', JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Templates</h1><p className="text-gray-600 dark:text-gray-400">Manage reusable ticket, response and email templates.</p></div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{t}</button>)}
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Create New Template</h3>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Template name" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
        <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Template content with variables like {customer_name}" rows={4} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
        <div className="flex justify-end"><button onClick={save} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Save Template</button></div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">{tab}</h3>
        {filtered.length === 0 ? <p className="text-sm text-gray-500">No templates yet.</p> : (
          <div className="space-y-2">
            {filtered.map((i) => (
              <div key={i.id} className="p-3 border rounded-lg bg-white dark:bg-dark-surface flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{i.category} · Last modified {new Date(i.updatedAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{i.content}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicate(i)} className="px-2 py-1 text-xs rounded bg-gray-100">Duplicate</button>
                  <button onClick={() => remove(i.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
