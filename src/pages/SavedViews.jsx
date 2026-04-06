import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { calculateSLAStatus } from '../lib/utils';

const allowedFilters = new Set([
  'priority:Critical',
  'priority:High',
  'status:Open',
  'status:In Progress',
  'unassigned',
  'sla:at_risk',
  'sla:breached',
]);

const sanitizeFilter = (value) => (allowedFilters.has(value) ? value : 'priority:Critical');

export default function SavedViews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterFromUrl = sanitizeFilter(searchParams.get('filter') || 'priority:Critical');
  const { data: tickets } = useQuery({ queryKey: ['saved-views-tickets'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data.tickets || []), refetchInterval: 10000 });
  const [views, setViews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('saved-views') || '[]'); } catch { return []; }
  });
  const [name, setName] = useState('');
  const [filter, setFilter] = useState(filterFromUrl);

  useEffect(() => {
    setFilter(filterFromUrl);
  }, [filterFromUrl]);

  const currentResult = useMemo(() => {
    const list = tickets || [];
    if (filter.startsWith('priority:')) {
      const p = filter.split(':')[1];
      return list.filter((t) => t.priority === p);
    }
    if (filter.startsWith('status:')) {
      const s = filter.split(':')[1];
      return list.filter((t) => t.status === s);
    }
    if (filter === 'unassigned') return list.filter((t) => !t.assignee);
    if (filter === 'sla:at_risk') return list.filter((t) => calculateSLAStatus(t).status === 'at_risk');
    if (filter === 'sla:breached') return list.filter((t) => calculateSLAStatus(t).status === 'breached');
    return list;
  }, [tickets, filter]);

  const applyFilter = (value) => {
    const next = sanitizeFilter(value);
    setFilter(next);
    setSearchParams({ filter: next });
  };

  const saveView = () => {
    if (!name.trim()) return;
    const next = [{ id: Date.now(), name: name.trim(), filter, createdAt: new Date().toISOString() }, ...views];
    setViews(next);
    localStorage.setItem('saved-views', JSON.stringify(next));
    setName('');
  };

  const applyView = (v) => applyFilter(v.filter);
  const removeView = (id) => {
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    localStorage.setItem('saved-views', JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Views</h1><p className="text-gray-600 dark:text-gray-400">Persist your frequently used filters for quick navigation.</p></div>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Create View</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="View name" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
        <select value={filter} onChange={(e) => applyFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
          <option value="priority:Critical">Priority: Critical</option>
          <option value="priority:High">Priority: High</option>
          <option value="status:Open">Status: Open</option>
          <option value="status:In Progress">Status: In Progress</option>
          <option value="unassigned">Unassigned</option>
          <option value="sla:at_risk">SLA: At Risk</option>
          <option value="sla:breached">SLA: Breached</option>
        </select>
        <div className="flex justify-end"><button onClick={saveView} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Save Current Filter</button></div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">My Views</h3>
        <div className="space-y-2">
          {views.map((v) => (
            <div key={v.id} className="px-3 py-2 rounded-lg border bg-white dark:bg-dark-surface flex items-center justify-between gap-2">
              <div className="text-sm">
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-gray-500">{v.filter}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => applyView(v)} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Apply</button>
                <button onClick={() => removeView(v.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
              </div>
            </div>
          ))}
          {views.length === 0 && <p className="text-sm text-gray-500">No saved views yet.</p>}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Preview Result ({currentResult.length})</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {currentResult.slice(0, 100).map((t) => (
            <a key={t._id} href={`/tickets/${t._id}`} className="block px-3 py-2 rounded border bg-white dark:bg-dark-surface text-sm hover:border-primary-300">{t.ticketId} · {t.title}</a>
          ))}
        </div>
      </Card>
    </div>
  );
}
