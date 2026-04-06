import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authAPI, ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function Performance() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => authAPI.getMe().then((r) => r.data.data) });
  const { data: ticketsData } = useQuery({ queryKey: ['performance-source'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data) });

  const mine = useMemo(() => {
    const all = ticketsData?.tickets || [];
    const myId = String(me?._id || me?.id || '');
    return all.filter((t) => String(t?.assignee?._id || t?.assignee || '') === myId);
  }, [ticketsData, me]);

  const now = new Date();
  const today = mine.filter((t) => new Date(t.updatedAt || t.createdAt).toDateString() === now.toDateString());
  const week = mine.filter((t) => (now - new Date(t.updatedAt || t.createdAt)) / (1000 * 60 * 60 * 24) <= 7);
  const month = mine.filter((t) => (now - new Date(t.updatedAt || t.createdAt)) / (1000 * 60 * 60 * 24) <= 30);
  const resolvedToday = today.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;
  const resolvedWeek = week.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;
  const resolvedMonth = month.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length;
  const avgResolution = mine.reduce((s, t) => s + Number(t.resolutionTime || 0), 0) / Math.max(1, mine.length);

  const trend = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const count = mine.filter((t) => new Date(t.updatedAt || t.createdAt).toDateString() === d.toDateString() && ['Resolved', 'Closed'].includes(t.status)).length;
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, resolved: count };
  });

  const byPriority = ['Critical', 'High', 'Medium', 'Low'].map((p) => ({ name: p, value: mine.filter((t) => t.priority === p).length, color: p === 'Critical' ? '#ef4444' : p === 'High' ? '#f97316' : p === 'Medium' ? '#eab308' : '#10b981' }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance / Metrics</h1>
        <p className="text-gray-600 dark:text-gray-400">Personal performance dashboard and trend insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Resolved Today', resolvedToday],
          ['This Week', resolvedWeek],
          ['This Month', resolvedMonth],
          ['Avg Resolution', `${Math.round(avgResolution * 10) / 10}h`],
          ['Response Time', '15 min'],
          ['Customer Rating', '4.8/5'],
        ].map(([k, v]) => (
          <Card key={k} className="p-4"><p className="text-xs text-gray-500">{k}</p><p className="text-xl font-bold">{v}</p></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Performance Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" hide />
              <YAxis />
              <Tooltip />
              <Line dataKey="resolved" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">Tickets by Priority</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byPriority} dataKey="value" innerRadius={55} outerRadius={95}>
                {byPriority.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-2">Goals and Targets</h3>
        <div className="space-y-3 text-sm">
          {[['Weekly target (40)', resolvedWeek, 40], ['Monthly target (160)', resolvedMonth, 160]].map(([label, current, total]) => {
            const pct = Math.min(100, Math.round((current / total) * 100));
            return (
              <div key={label}>
                <div className="flex justify-between mb-1"><span>{label}</span><span>{pct}%</span></div>
                <div className="h-2 rounded-full bg-gray-200"><div className="h-2 rounded-full bg-primary-600" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
