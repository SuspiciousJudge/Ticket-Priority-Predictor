import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatRelativeTime } from '../lib/utils';

export default function Inbox() {
  const [activeTab, setActiveTab] = useState('Inbox');
  const [selectedId, setSelectedId] = useState(null);

  const { data: tickets } = useQuery({
    queryKey: ['inbox-tickets'],
    queryFn: () => ticketsAPI.getAll({ sortBy: 'createdAt', sortOrder: 'desc', limit: 500 }).then((r) => r.data.data.tickets || []),
    refetchInterval: 5000,
  });

  const list = useMemo(() => {
    const all = tickets || [];
    if (activeTab === 'Mentions') return all.filter((t) => /@|mention/i.test(`${t.description || ''}`));
    if (activeTab === 'Assigned') return all.filter((t) => Boolean(t.assignee));
    if (activeTab === 'Unread') return all.filter((t) => t.status === 'Open');
    return all;
  }, [tickets, activeTab]);

  const selected = list.find((t) => t._id === selectedId) || list[0] || null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inbox / Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400">Centralized stream of ticket updates and actionable items.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Inbox', 'Unread', 'Assigned', 'Mentions'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1.5 rounded-full text-sm ${activeTab === t ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-3 space-y-2 max-h-[70vh] overflow-y-auto">
          {list.map((t) => (
            <button key={t._id} onClick={() => setSelectedId(t._id)} className={`w-full text-left p-3 rounded-lg border ${selected?._id === t._id ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-dark-surface'}`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.ticketId} · {t.title}</p>
              <p className="text-xs text-gray-500 mt-1">{t.priority} · {formatRelativeTime(t.updatedAt || t.createdAt)}</p>
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-500 px-2 py-1">No messages.</p>}
        </Card>

        <Card className="lg:col-span-2 p-4">
          {!selected ? <p className="text-sm text-gray-500">Select an item to view details.</p> : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selected.ticketId} · {selected.title}</h2>
                <a href={`/tickets/${selected._id}`} className="px-3 py-1.5 text-xs rounded bg-primary-100 text-primary-700">Open Ticket</a>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selected.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="px-2 py-1 rounded bg-gray-100">Status: {selected.status}</div>
                <div className="px-2 py-1 rounded bg-gray-100">Priority: {selected.priority}</div>
                <div className="px-2 py-1 rounded bg-gray-100">Category: {selected.category}</div>
                <div className="px-2 py-1 rounded bg-gray-100">Assignee: {selected.assignee?.name || 'Unassigned'}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
