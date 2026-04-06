import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';

export default function CalendarSchedule() {
  const [mode, setMode] = useState('Month');
  const [filter, setFilter] = useState('All');
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));

  const { data: ticketsData } = useQuery({ queryKey: ['calendar-source'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data.tickets || []) });

  const events = useMemo(() => {
    const t = ticketsData || [];
    return t.flatMap((x) => {
      const list = [];
      if (x.slaDeadline) list.push({ id: `${x._id}-deadline`, date: new Date(x.slaDeadline).toISOString().slice(0, 10), type: 'Deadline', color: 'red', title: `Deadline: ${x.title}`, ticketId: x._id });
      list.push({ id: `${x._id}-followup`, date: new Date(x.createdAt).toISOString().slice(0, 10), type: 'Follow-up', color: 'blue', title: `Follow-up: ${x.title}`, ticketId: x._id });
      return list;
    });
  }, [ticketsData]);

  const dayEvents = events.filter((e) => e.date === selectedDay && (filter === 'All' || e.type === filter));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar / Schedule</h1><p className="text-gray-600 dark:text-gray-400">Deadlines, follow-ups, schedules and day/week/month views.</p></div>
        <div className="flex gap-2">
          {['Day', 'Week', 'Month'].map((m) => <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-sm ${mode === m ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{m}</button>)}
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['All', 'Deadline', 'Follow-up'].map((f) => <option key={f}>{f}</option>)}
          </select>
          <button className="px-3 py-2 rounded-lg bg-gray-100 text-sm" onClick={() => setSelectedDay(new Date().toISOString().slice(0, 10))}>Today</button>
          <button className="px-3 py-2 rounded-lg bg-green-100 text-green-700 text-sm">Sync Google Calendar</button>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-border/30 text-sm">
          <p className="font-semibold mb-2">{mode} view · {selectedDay}</p>
          {dayEvents.length === 0 ? <p className="text-gray-500">No events on this date.</p> : (
            <div className="space-y-2">
              {dayEvents.map((e) => (
                <Link key={e.id} to={`/tickets/${e.ticketId}`} className="block p-2 rounded border bg-white dark:bg-dark-surface">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-gray-500">{e.type}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
