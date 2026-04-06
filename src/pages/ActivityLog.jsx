import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatRelativeTime } from '../lib/utils';

export default function ActivityLog() {
  const [actionType, setActionType] = useState('All');
  const [query, setQuery] = useState('');
  const { data: ticketsData } = useQuery({ queryKey: ['activity-source'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data.tickets || []), refetchInterval: 5000 });

  const activities = useMemo(() => {
    const all = (ticketsData || []).flatMap((t) => {
      const list = [];
      list.push({ id: `${t._id}-created`, type: 'created', text: `Ticket ${t.ticketId} created`, at: t.createdAt, ticketId: t._id, user: t.createdBy?.name || 'System' });
      list.push({ id: `${t._id}-updated`, type: 'updated', text: `Ticket ${t.ticketId} status: ${t.status}`, at: t.updatedAt || t.createdAt, ticketId: t._id, user: t.assignee?.name || 'System' });
      return list;
    }).sort((a, b) => new Date(b.at) - new Date(a.at));

    return all.filter((a) => {
      const matchType = actionType === 'All' || a.type === actionType;
      const matchQ = `${a.text} ${a.user} ${a.ticketId}`.toLowerCase().includes(query.toLowerCase());
      return matchType && matchQ;
    });
  }, [ticketsData, actionType, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Feed / Audit Log</h1>
        <p className="text-gray-600 dark:text-gray-400">Who did what and when with filtering and export-ready structure.</p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activities" className="px-3 py-2 border rounded-lg min-w-[240px] bg-white dark:bg-dark-bg" />
          <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['All', 'created', 'updated', 'deleted', 'commented'].map((x) => <option key={x}>{x}</option>)}
          </select>
          <button className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Export Log</button>
        </div>

        <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
          {activities.slice(0, 300).map((a) => (
            <div key={a.id} className="p-3 rounded-lg border bg-white dark:bg-dark-surface flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{a.text}</p>
                <p className="text-xs text-gray-500">{a.user} · {formatRelativeTime(a.at)}</p>
              </div>
              <a href={`/tickets/${a.ticketId}`} className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700">Open</a>
            </div>
          ))}
          {activities.length === 0 && <p className="text-sm text-gray-500">No activities found.</p>}
        </div>
      </Card>
    </div>
  );
}
