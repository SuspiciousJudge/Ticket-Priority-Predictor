import { Link } from 'react-router-dom';
import Card from '../components/common/Card';

export default function HelpSupport() {
  const resources = [
    { title: 'Getting Started Guide', href: '/dashboard', type: 'Internal' },
    { title: 'Knowledge Base', href: '/knowledge-base', type: 'Internal' },
    { title: 'Create Ticket Workflow', href: '/create', type: 'Internal' },
    { title: 'Stack Overflow - IT Support', href: 'https://stackoverflow.com/questions/tagged/it-support', type: 'External' },
    { title: 'Stack Overflow - React', href: 'https://stackoverflow.com/questions/tagged/reactjs', type: 'External' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-600 dark:text-gray-400">Find support resources, guides, and frequently asked questions.</p>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Resource Center</h3>
        <div className="space-y-2">
          {resources.map((r) => {
            const external = r.href.startsWith('http');
            if (external) {
              return (
                <a key={r.title} href={r.href} target="_blank" rel="noreferrer" className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white dark:bg-dark-surface hover:border-primary-300 transition-colors">
                  <span className="text-sm text-gray-900 dark:text-white">{r.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{r.type}</span>
                </a>
              );
            }
            return (
              <Link key={r.title} to={r.href} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white dark:bg-dark-surface hover:border-primary-300 transition-colors">
                <span className="text-sm text-gray-900 dark:text-white">{r.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{r.type}</span>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Quick Contact</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">For platform issues, raise a ticket tagged with category "Technical Support" and priority based on impact. Critical outages should be escalated immediately through the Ticket Detail escalation assistant.</p>
      </Card>
    </div>
  );
}
