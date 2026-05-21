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
        <p className="text-gray-600 dark:text-gray-400">Step-by-step onboarding, support contacts, and escalation paths for new joiners.</p>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Joiner Checklist</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>Sign in, confirm your team, and open the dashboard.</li>
          <li>Review Knowledge Base articles for workflow, priority, and SLA basics.</li>
          <li>Set up your inbox, notifications, and calendar preferences.</li>
          <li>Use Create Ticket or Saved Views to start working on assigned queues.</li>
          <li>Escalate blocker tickets through Help & Support or the ticket detail page.</li>
        </ol>
      </Card>

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
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border bg-white dark:bg-dark-bg p-3"><p className="font-medium">Helpdesk</p><p className="text-gray-500">helpdesk@ticketiq.com</p></div>
          <div className="rounded-lg border bg-white dark:bg-dark-bg p-3"><p className="font-medium">Support</p><p className="text-gray-500">support@ticketiq.com</p></div>
          <div className="rounded-lg border bg-white dark:bg-dark-bg p-3"><p className="font-medium">Administrator</p><p className="text-gray-500">admin@ticketiq.com</p></div>
        </div>
      </Card>
    </div>
  );
}
