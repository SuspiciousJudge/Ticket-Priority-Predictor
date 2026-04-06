import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { formatRelativeTime } from '../lib/utils';

export default function MyTickets() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe().then((r) => r.data.data),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['my-tickets-source'],
    queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => ticketsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets-source'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const tickets = useMemo(() => {
    const all = ticketsData?.tickets || [];
    const mine = all.filter((t) => {
      const assigneeId = t?.assignee?._id || t?.assignee?.id || t?.assignee;
      return assigneeId && String(assigneeId) === String(me?._id || me?.id);
    });

    const byStatus = status === 'All' ? mine : mine.filter((t) => t.status === status);

    return [...byStatus].sort((a, b) => {
      if (sortBy === 'priority') {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      if (sortBy === 'deadline') {
        return new Date(a.slaDeadline || '2999-12-31') - new Date(b.slaDeadline || '2999-12-31');
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [ticketsData, me, status, sortBy]);

  const quickUpdate = (ticket, nextStatus) => {
    updateMutation.mutate({ id: ticket._id, payload: { status: nextStatus } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Assigned to you: {tickets.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            <option value="date">Sort: Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="deadline">Sort: Deadline</option>
          </select>
        </div>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-gray-500">No tickets found for selected filters.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const deadline = t.slaDeadline ? new Date(t.slaDeadline) : null;
              const remaining = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60)) : null;
              return (
                <div key={t._id} className="border rounded-xl p-3 bg-white dark:bg-dark-surface">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.ticketId} · {formatRelativeTime(t.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge type="priority" value={t.priority}>{t.priority}</Badge>
                      <Badge type="status" value={t.status}>{t.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {remaining !== null ? `Time remaining: ${remaining > 0 ? `${remaining}h` : 'Breached'}` : 'No SLA deadline'}
                    </span>
                    <div className="flex gap-2">
                      {t.status !== 'In Progress' && <Button size="sm" onClick={() => quickUpdate(t, 'In Progress')}>Start</Button>}
                      {t.status !== 'Resolved' && <Button size="sm" variant="outline" onClick={() => quickUpdate(t, 'Resolved')}>Resolve</Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
