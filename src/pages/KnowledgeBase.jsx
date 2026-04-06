import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const ARTICLES = [
  { id: 1, category: 'Technical', title: 'Fixing Login Loop Issues', summary: 'Common causes for SSO/login redirect loops.', content: 'Check SSO callback URL, cookie domain, and token expiry mismatch.' },
  { id: 2, category: 'Billing', title: 'Payment Failure Troubleshooting', summary: 'How to validate duplicate charge and callback mismatch.', content: 'Validate gateway signatures, idempotency keys, and retry policies.' },
  { id: 3, category: 'Product', title: 'Slow Dashboard Guide', summary: 'Performance checks for dashboard latency.', content: 'Inspect heavy aggregates, caching, and index usage.' },
  { id: 4, category: 'FAQ', title: 'How Ticket Priorities Work', summary: 'Critical/High/Medium/Low logic and SLA impact.', content: 'Priority affects SLA targets, escalation, and assignment order.' },
];

const STACK_LINKS = [
  { label: 'Node.js MongoDB reconnect best practices', url: 'https://stackoverflow.com/questions/19552719/mongodb-mongoose-and-node-js-best-practice-for-connection-retry' },
  { label: 'React Query refetch and realtime patterns', url: 'https://stackoverflow.com/questions/74730103/react-query-best-practice-for-realtime-updates' },
  { label: 'Socket.IO rooms and event architecture', url: 'https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender' },
  { label: 'Mongoose enum validation issues', url: 'https://stackoverflow.com/questions/19047296/mongoose-validation-using-enum' },
  { label: 'Express API error handling patterns', url: 'https://stackoverflow.com/questions/29700005/express-4-middleware-error-handler-not-being-called' },
];

export default function KnowledgeBase() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(ARTICLES[0]);
  const [aiPrompt, setAiPrompt] = useState('');

  const aiMutation = useMutation({
    mutationFn: (prompt) => aiAPI.chat(prompt, []),
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter((a) => `${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
        <p className="text-gray-600 dark:text-gray-400">Docs + AI assistant + Stack Overflow common solution references.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-1 space-y-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles..." className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((a) => (
              <button key={a.id} onClick={() => setSelected(a)} className={`w-full text-left p-3 rounded-lg border ${selected?.id === a.id ? 'bg-primary-50 border-primary-300' : 'bg-white dark:bg-dark-surface'}`}>
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-gray-500 mt-1">{a.category}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">{selected?.category}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selected?.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{selected?.summary}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-border/30 text-sm text-gray-700 dark:text-gray-200">{selected?.content}</div>

          <div className="pt-2 border-t">
            <h4 className="font-semibold mb-2">Ask AI for Solution</h4>
            <div className="flex gap-2">
              <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your issue for AI guidance" className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-dark-bg" />
              <Button onClick={() => aiPrompt.trim() && aiMutation.mutate(`Knowledge Base question: ${aiPrompt}. Give actionable steps.`)} loading={aiMutation.isPending}>Ask AI</Button>
            </div>
            {aiMutation.data?.data?.data?.message && (
              <div className="mt-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/10 text-sm whitespace-pre-wrap">{aiMutation.data.data.data.message}</div>
            )}
          </div>

          <div className="pt-2 border-t">
            <h4 className="font-semibold mb-2">Stack Overflow References</h4>
            <ul className="space-y-1 text-sm">
              {STACK_LINKS.map((l) => (
                <li key={l.url}><a className="text-primary-600 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
