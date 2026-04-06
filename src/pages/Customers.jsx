import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, ticketsAPI } from '../services/api';
import Card from '../components/common/Card';

export default function Customers() {
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('All');
  const { data: users } = useQuery({ queryKey: ['customers-users'], queryFn: () => usersAPI.getAll().then((r) => r.data.data || []) });
  const { data: tickets } = useQuery({ queryKey: ['customers-tickets'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data.tickets || []) });

  const rows = useMemo(() => {
    const ts = tickets || [];
    return (users || []).map((u) => {
      const mine = ts.filter((t) => String(t?.createdBy?._id || t?.createdBy || '') === String(u._id));
      return {
        ...u,
        company: u.company || 'N/A',
        tier: mine[0]?.customerTier || 'Basic',
        totalTickets: mine.length,
        lastContact: mine[0]?.updatedAt || mine[0]?.createdAt || u.updatedAt || u.createdAt,
        status: 'Active',
      };
    });
  }, [users, tickets]);

  const filtered = rows.filter((r) => {
    const matchQ = `${r.name} ${r.email} ${r.company}`.toLowerCase().includes(q.toLowerCase());
    const matchTier = tier === 'All' || r.tier === tier;
    return matchQ && matchTier;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers / Contacts</h1><p className="text-gray-600 dark:text-gray-400">Customer database and profile references.</p></div>
        <button className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">Add Customer</button>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 flex-wrap mb-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name/email/company" className="px-3 py-2 border rounded-lg min-w-[260px] bg-white dark:bg-dark-bg" />
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['All', 'Enterprise', 'Business', 'Professional', 'Premium', 'Basic', 'Free'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Name</th><th className="text-left py-2">Email</th><th className="text-left py-2">Company</th><th className="text-left py-2">Tier</th><th className="text-left py-2">Total Tickets</th><th className="text-left py-2">Last Contact</th><th className="text-left py-2">Status</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2">{r.email}</td>
                  <td className="py-2">{r.company}</td>
                  <td className="py-2">{r.tier}</td>
                  <td className="py-2">{r.totalTickets}</td>
                  <td className="py-2">{r.lastContact ? new Date(r.lastContact).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
