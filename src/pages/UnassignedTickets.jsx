import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsAPI, usersAPI } from '../services/api';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function UnassignedTickets() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState('priority');
  const [selectedUser, setSelectedUser] = useState('');
  const [bulkIds, setBulkIds] = useState([]);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['unassigned-source'],
    queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-unassigned'],
    queryFn: () => usersAPI.getAll().then((r) => r.data.data || []),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignee }) => ticketsAPI.update(id, { assignee }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-source'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const tickets = useMemo(() => {
    const all = ticketsData?.tickets || [];
    const unassigned = all.filter((t) => !t.assignee);
    return [...unassigned].sort((a, b) => {
      if (sortBy === 'priority') {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      if (sortBy === 'category') return String(a.category || '').localeCompare(String(b.category || ''));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [ticketsData, sortBy]);

  const toggleBulk = (id) => {
    setBulkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const bulkAssign = () => {
    if (!selectedUser || bulkIds.length === 0) return;
    Promise.all(bulkIds.map((id) => assignMutation.mutateAsync({ id, assignee: selectedUser }))).then(() => setBulkIds([]));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unassigned Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">Needs attention: {tickets.length}</p>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
          <option value="priority">Sort: Priority</option>
          <option value="date">Sort: Created Date</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg min-w-[220px]">
            <option value="">Select assignee for bulk action</option>
            {(usersData || []).map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
          </select>
          <button onClick={bulkAssign} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Bulk Assign ({bulkIds.length})</button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-gray-500">No unassigned tickets.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t._id} className="p-3 rounded-xl border bg-white dark:bg-dark-surface flex items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={bulkIds.includes(t._id)} onChange={() => toggleBulk(t._id)} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.ticketId} · {t.category || 'Support'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type="priority" value={t.priority}>{t.priority}</Badge>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">Needs Attention</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
