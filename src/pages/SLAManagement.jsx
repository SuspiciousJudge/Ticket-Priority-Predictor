import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { calculateSLAStatus, formatRelativeTime } from '../lib/utils';

export default function SLAManagement() {
  const [policy, setPolicy] = useState('Default SLA');
  const { data: ticketsData } = useQuery({
    queryKey: ['sla-tickets'],
    queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data.tickets || []),
    refetchInterval: 8000,
  });

  const items = useMemo(() => {
    const list = ticketsData || [];
    const atRisk = list.filter((t) => calculateSLAStatus(t).status === 'at_risk');
    const breached = list.filter((t) => calculateSLAStatus(t).status === 'breached');
    return { total: list.length, atRisk, breached, met: list.length - atRisk.length - breached.length, list };
  }, [ticketsData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SLA Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Track SLA compliance and monitor at-risk or breached tickets.</p>
      </div>

      <Card className="p-4 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">Policy</div>
        <select value={policy} onChange={(e) => setPolicy(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
          <option>Default SLA</option>
          <option>Enterprise SLA</option>
          <option>Critical Incident SLA</option>
        </select>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold">{items.total}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Met</p><p className="text-2xl font-bold text-green-600">{items.met}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">At Risk</p><p className="text-2xl font-bold text-yellow-600">{items.atRisk.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500">Breached</p><p className="text-2xl font-bold text-red-600">{items.breached.length}</p></Card>
      </div>

      <Card className="p-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600 dark:text-gray-400">Open cohort in Saved Views:</span>
        <Link to="/saved-views?filter=sla:at_risk" className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-xs">At Risk</Link>
        <Link to="/saved-views?filter=sla:breached" className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs">Breached</Link>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">At Risk / Breached Tickets</h3>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {[...items.breached, ...items.atRisk].map((t) => {
            const sla = calculateSLAStatus(t);
            return (
              <div key={t._id} className="p-3 rounded-lg border bg-white dark:bg-dark-surface flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.ticketId} · {t.title}</p>
                  <p className="text-xs text-gray-500">{t.priority} · Due {formatRelativeTime(t.slaDeadline)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/saved-views?filter=${sla.status === 'breached' ? 'sla:breached' : 'sla:at_risk'}`} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                    View Cohort
                  </Link>
                  <Link to={`/tickets/${t._id}`} className={`text-xs px-2 py-1 rounded ${sla.status === 'breached' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {sla.status}
                  </Link>
                </div>
              </div>
            );
          })}
          {items.atRisk.length + items.breached.length === 0 && <p className="text-sm text-gray-500">No at-risk tickets currently.</p>}
        </div>
      </Card>
    </div>
  );
}
