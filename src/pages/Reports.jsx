import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Download, Mail, Share2 } from 'lucide-react';

const templates = [
  { name: 'Daily Summary Report', format: 'PDF', description: 'Open tickets, updates, and daily actions.' },
  { name: 'Weekly Performance Report', format: 'Excel', description: 'Team throughput, resolution, and workload.' },
  { name: 'Monthly Analytics Report', format: 'PDF', description: 'Month-over-month trends and SLA view.' },
  { name: 'Team Productivity Report', format: 'Excel', description: 'Agent output, queues, and ticket volume.' },
  { name: 'SLA Compliance Report', format: 'PDF', description: 'Targets met, risks, breaches, and policy overview.' },
  { name: 'Resolution Time Report', format: 'CSV', description: 'Average time-to-resolve by category and priority.' },
  { name: 'Priority Distribution Report', format: 'CSV', description: 'Ticket mix by priority and channel.' },
  { name: 'Customer Satisfaction Report', format: 'PDF', description: 'Feedback trends and response quality.' },
];

export default function Reports() {
  const [selectedMetrics, setSelectedMetrics] = useState(['total', 'resolved']);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [format, setFormat] = useState('PDF');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('report-history') || '[]'); } catch { return []; }
  });

  const { data: ticketsData } = useQuery({ queryKey: ['reports-source'], queryFn: () => ticketsAPI.getAll({ limit: 1000 }).then((r) => r.data.data) });
  const allTickets = ticketsData?.tickets || [];

  const preview = useMemo(() => {
    const total = allTickets.length;
    const resolved = allTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
    const critical = allTickets.filter((t) => t.priority === 'Critical').length;
    const avgResolution = allTickets.reduce((s, t) => s + Number(t.resolutionTime || 0), 0) / Math.max(1, allTickets.length);
    return { total, resolved, critical, avgResolution: Math.round(avgResolution * 10) / 10 };
  }, [allTickets]);

  const toggleMetric = (metric) => {
    setSelectedMetrics((prev) => prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]);
  };

  const generate = () => {
    const item = { id: Date.now(), template: selectedTemplate.name, selectedMetrics, fromDate, toDate, format: format || selectedTemplate.format, generatedAt: new Date().toISOString() };
    const next = [item, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem('report-history', JSON.stringify(next));
  };

  const downloadCsv = async () => {
    const res = await ticketsAPI.exportCsv();
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Templates, custom builder, scheduled and historical reports.</p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <button key={t.name} onClick={() => { setSelectedTemplate(t); setFormat(t.format); }} className={`text-left px-4 py-3 rounded-xl border transition-colors ${selectedTemplate.name === t.name ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-dark-border/30 hover:border-primary-300'}`}>
              <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              <p className="text-[11px] font-semibold text-primary-600 mt-2">Standard format: {t.format}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Create Custom Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {['total', 'resolved', 'critical', 'avgResolution'].map((m) => (
            <label key={m} className="text-sm flex items-center gap-2 rounded-lg border px-3 py-2 bg-white dark:bg-dark-bg"><input type="checkbox" checked={selectedMetrics.includes(m)} onChange={() => toggleMetric(m)} />{m}</label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg">
            {['PDF', 'Excel', 'CSV'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-border/30 text-sm">
          <p className="font-medium mb-1">Preview · {selectedTemplate.name}</p>
          {selectedMetrics.includes('total') && <p>Total tickets: {preview.total}</p>}
          {selectedMetrics.includes('resolved') && <p>Resolved tickets: {preview.resolved}</p>}
          {selectedMetrics.includes('critical') && <p>Critical tickets: {preview.critical}</p>}
          {selectedMetrics.includes('avgResolution') && <p>Avg resolution time: {preview.avgResolution}h</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generate}>Generate</Button>
          <Button variant="outline" icon={Download} onClick={downloadCsv}>Download CSV</Button>
          <Button variant="outline" onClick={() => setFormat(selectedTemplate.format)}>Use Template Format</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Scheduled Reports</h3>
        <p className="text-sm text-gray-500 mb-3">Scheduling UI is ready. Connect cron/worker to run automated generation.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['Daily at 08:00', 'Weekly on Monday', 'Monthly on day 1'].map((slot) => <div key={slot} className="rounded-lg border bg-white dark:bg-dark-bg px-3 py-2 text-sm">{slot}</div>)}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Report History</h3>
        {history.length === 0 ? <p className="text-sm text-gray-500">No reports generated yet.</p> : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="p-3 border rounded-lg flex items-center justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">{h.template || 'Custom'} · {h.format} · {new Date(h.generatedAt).toLocaleString()}</p>
                  <p className="text-gray-500">Metrics: {h.selectedMetrics.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 text-xs rounded bg-gray-100" title="Download"><Download className="w-3.5 h-3.5" /></button>
                  <button className="px-2 py-1 text-xs rounded bg-gray-100" title="Email"><Mail className="w-3.5 h-3.5" /></button>
                  <button className="px-2 py-1 text-xs rounded bg-gray-100" title="Share"><Share2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
