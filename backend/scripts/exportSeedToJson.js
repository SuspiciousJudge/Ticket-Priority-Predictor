const fs = require('fs');
const path = require('path');

const domains = [
  { category: 'Authentication', tag: 'auth', component: 'SSO gateway' },
  { category: 'Notifications', tag: 'email', component: 'notification worker' },
  { category: 'Performance', tag: 'latency', component: 'ticket query service' },
  { category: 'Integration', tag: 'api', component: 'partner webhook adapter' },
  { category: 'Attachments', tag: 'upload', component: 'file scanner pipeline' },
  { category: 'Billing', tag: 'payment', component: 'invoice processor' },
  { category: 'Authorization', tag: 'rbac', component: 'access policy engine' },
  { category: 'Reporting', tag: 'analytics', component: 'dashboard aggregator' },
  { category: 'Database', tag: 'mongodb', component: 'replica cluster' },
  { category: 'Mobile', tag: 'mobile', component: 'sync service' },
];

const issues = [
  { title: 'request timeout spike', desc: 'API requests exceed SLA under peak traffic.', priority: 'High' },
  { title: 'intermittent crash on retry', desc: 'Service crashes when retry queue grows suddenly.', priority: 'Critical' },
  { title: 'stale cache after status update', desc: 'Updated ticket data is not reflected immediately in UI.', priority: 'Medium' },
  { title: 'duplicate event delivery', desc: 'Event processor emits duplicated updates for same ticket.', priority: 'Low' },
  { title: 'unauthorized access window', desc: 'Unauthorized users can briefly access restricted records.', priority: 'Critical' },
  { title: 'background job backlog', desc: 'Asynchronous worker backlog increases continuously.', priority: 'High' },
  { title: 'failed attachment validation', desc: 'Valid files are rejected during MIME validation.', priority: 'Medium' },
  { title: 'incorrect priority assignment', desc: 'Tickets with outage keywords are sometimes downgraded.', priority: 'High' },
  { title: 'search index drift', desc: 'Search results miss recently created tickets.', priority: 'Medium' },
  { title: 'report export formatting bug', desc: 'Exported reports include malformed columns in CSV output.', priority: 'Low' },
];

const contexts = [
  'Affects all users in one enterprise account.',
  'Observed by multiple teams during release window.',
  'Issue reproduced on staging and production clusters.',
  "Happens after token refresh and role sync.",
  'First noticed after last deployment rollout.',
  'Customer escalation mentions data loss risk.',
  'Regression appears only on high load periods.',
  'Impacts SLA reporting and operational dashboards.',
  'Intermittent but high customer impact when it occurs.',
  'Temporary workaround exists but not reliable.',
];

const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
const tiers = ['Enterprise', 'Business', 'Professional', 'Premium', 'Basic'];

function buildTickets(count = 60) {
  const tickets = [];
  for (let idx = 0; idx < count; idx += 1) {
    const domain = domains[idx % domains.length];
    const issue = issues[Math.floor(idx / domains.length) % issues.length];
    const context = contexts[(idx * 3) % contexts.length];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - (idx % 40));

    tickets.push({
      ticketId: `TICK-${String(1001 + idx)}`,
      title: `${domain.component}: ${issue.title}`,
      description: `${issue.desc} ${context}`,
      priority: issue.priority,
      status: statuses[idx % statuses.length],
      category: domain.category,
      customerTier: tiers[idx % tiers.length],
      assignee: null,
      team: 'Support',
      createdBy: 'seed-script',
      sentiment: issue.priority === 'Critical' || issue.priority === 'High' ? 'Frustrated' : 'Neutral',
      confidence: issue.priority === 'Critical' ? 94 : issue.priority === 'High' ? 86 : 78,
      estimatedTime: issue.priority === 'Critical' ? '4-8h' : issue.priority === 'High' ? '8-24h' : issue.priority === 'Medium' ? '1-3d' : '3-5d',
      tags: [domain.tag, 'support', ...(issue.priority === 'Critical' ? ['urgent'] : [])],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }
  return tickets;
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote', filePath);
}

const tickets = buildTickets(60);
const outPath = path.join(__dirname, '..', 'data', 'tickets.json');
writeJson(outPath, { tickets });

// Usage: `node backend/scripts/exportSeedToJson.js` creates `backend/data/tickets.json`
