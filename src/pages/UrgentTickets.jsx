import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsAPI, usersAPI } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

function urgencyScore(ticket) {
  const pr = ticket.priority === 'Critical' ? 100 : 70;
  const sla = ticket.slaDeadline ? Math.max(0, 48 - ((new Date(ticket.slaDeadline) - new Date()) / (1000 * 60 * 60))) : 0;
  return pr + sla;
}

export default function UrgentTickets() {
  const queryClient = useQueryClient();

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['urgent-source'],
    queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data),
  });

  const { data: users } = useQuery({
    queryKey: ['urgent-users'],
    queryFn: () => usersAPI.getAll().then((r) => r.data.data || []),
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => ticketsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgent-source'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const urgent = useMemo(() => {
    const all = ticketsData?.tickets || [];
    return all
      .filter((t) => t.priority === 'Critical' || t.priority === 'High')
      .map((t) => ({ ...t, urgency: urgencyScore(t) }))
      .sort((a, b) => b.urgency - a.urgency);
  }, [ticketsData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">High Priority / Urgent</h1>
        <p className="text-gray-600 dark:text-gray-400">Critical and High tickets sorted by urgency score.</p>
      </div>

      <Card className="p-4 space-y-3">
        {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : urgent.length === 0 ? <p className="text-sm text-gray-500">No urgent tickets.</p> : urgent.map((t) => {
          const hoursLeft = t.slaDeadline ? Math.ceil((new Date(t.slaDeadline) - new Date()) / (1000 * 60 * 60)) : null;
          return (
            <div key={t._id} className="p-3 rounded-xl border bg-white dark:bg-dark-surface">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.ticketId} · Urgency Score: {Math.round(t.urgency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type="priority" value={t.priority}>{t.priority}</Badge>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {t.priority === 'Critical' ? 'Escalated' : 'Priority'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  SLA: {hoursLeft === null ? 'N/A' : hoursLeft > 0 ? `${hoursLeft}h remaining` : 'Breached'}
                </span>
                <div className="flex items-center gap-2">
                  {!t.assignee && (
                    <select onChange={(e) => e.target.value && mutation.mutate({ id: t._id, payload: { assignee: e.target.value } })} className="px-2 py-1 border rounded text-xs bg-white dark:bg-dark-bg">
                      <option value="">Assign</option>
                      {(users || []).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => mutation.mutate({ id: t._id, payload: { status: 'Resolved' } })} className="px-2 py-1 text-xs rounded bg-green-600 text-white">Resolve</button>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
