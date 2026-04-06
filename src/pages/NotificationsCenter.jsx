import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authAPI, ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatRelativeTime } from '../lib/utils';

const TYPES = ['All', 'Unread', 'Assigned', 'Mentions', 'Updates', 'Alerts'];

export default function NotificationsCenter() {
  const [tab, setTab] = useState('All');
  const [readSet, setReadSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif-read') || '[]')); } catch { return new Set(); }
  });

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => authAPI.getMe().then((r) => r.data.data) });
  const { data: ticketsData } = useQuery({ queryKey: ['notif-source'], queryFn: () => ticketsAPI.getAll({ limit: 200 }).then((r) => r.data.data), refetchInterval: 5000 });

  const notifications = useMemo(() => {
    const all = ticketsData?.tickets || [];
    const myId = String(me?._id || me?.id || '');
    const generated = [];

    all.forEach((t) => {
      const isMine = String(t?.assignee?._id || t?.assignee || '') === myId;
      if (isMine) generated.push({ id: `${t._id}-assigned`, type: 'Assigned', text: `Ticket ${t.ticketId} assigned to you`, ticketId: t._id, at: t.updatedAt || t.createdAt });
      if (t.priority === 'Critical') generated.push({ id: `${t._id}-alert`, type: 'Alerts', text: `Critical ticket created: ${t.title}`, ticketId: t._id, at: t.createdAt });
      if (t.status === 'Resolved') generated.push({ id: `${t._id}-update`, type: 'Updates', text: `Ticket ${t.ticketId} was resolved`, ticketId: t._id, at: t.updatedAt || t.createdAt });
    });

    return generated.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 200);
  }, [ticketsData, me]);

  const filtered = notifications.filter((n) => {
    if (tab === 'All') return true;
    if (tab === 'Unread') return !readSet.has(n.id);
    return n.type === tab;
  });

  const markAll = () => {
    const next = new Set(notifications.map((n) => n.id));
    setReadSet(next);
    localStorage.setItem('notif-read', JSON.stringify(Array.from(next)));
  };

  const markOne = (id) => {
    const next = new Set(readSet);
    next.add(id);
    setReadSet(next);
    localStorage.setItem('notif-read', JSON.stringify(Array.from(next)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Unread: {notifications.filter((n) => !readSet.has(n.id)).length}</p>
        </div>
        <button onClick={markAll} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Mark all as read</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <Card className="p-4">
        {filtered.length === 0 ? <p className="text-sm text-gray-500">No notifications in this filter.</p> : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${readSet.has(n.id) ? 'bg-white dark:bg-dark-surface' : 'bg-primary-50/40 dark:bg-primary-900/10'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(n.at)}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/tickets/${n.ticketId}`} className="px-2 py-1 text-xs rounded bg-gray-100">View</Link>
                  {!readSet.has(n.id) && <button onClick={() => markOne(n.id)} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Read</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
