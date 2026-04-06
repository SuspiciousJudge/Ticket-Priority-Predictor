require('dotenv').config();

const connectDB = require('../config/db');
const Ticket = require('../models/Ticket');

const PRIORITY_TO_RESOLUTION_HOURS = {
  Critical: 8,
  High: 24,
  Medium: 72,
  Low: 120,
};

function estimateTimeLabel(priority) {
  if (priority === 'Critical') return '4h-12h';
  if (priority === 'High') return '12h-48h';
  if (priority === 'Medium') return '2d-5d';
  return '1w';
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const TICKET_BLUEPRINTS = [
  // Authentication / SSO
  { title: 'SSO login redirect loop for Azure AD users', description: 'Users are sent back to sign-in page repeatedly after successful Azure AD authentication callback.', category: 'Authentication', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['sso', 'auth', 'login'] },
  { title: 'MFA code rejected for valid time-based token', description: 'Time-based OTP is verified by authenticator app but portal returns invalid verification code.', category: 'Authentication', priority: 'High', status: 'In Progress', customerTier: 'Business', tags: ['mfa', 'auth', 'login'] },
  { title: 'Password reset succeeds but login still fails', description: 'Reset flow confirms success but account cannot sign in until cache is cleared from auth service.', category: 'Authentication', priority: 'Medium', status: 'Open', customerTier: 'Professional', tags: ['password', 'login', 'auth'] },
  { title: 'Session expires immediately after login on Safari', description: 'Users on Safari are logged out in under one minute because secure cookie is not persisted.', category: 'Authentication', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['session', 'cookie', 'login'] },
  { title: 'Service account lockout after failed API token rotations', description: 'Automated integrations trigger lockout policy due to stale token retries against auth endpoint.', category: 'Authentication', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['api', 'token', 'auth'] },
  { title: 'Role sync from identity provider delayed by 30 minutes', description: 'Newly assigned users cannot access dashboards until delayed role sync job catches up.', category: 'Authentication', priority: 'Medium', status: 'In Progress', customerTier: 'Business', tags: ['sso', 'rbac', 'sync'] },

  // Notifications / Email
  { title: 'Ticket assignment emails not delivered to support queue', description: 'SMTP accepted message but support queue mailbox never receives assignment notifications.', category: 'Notifications', priority: 'High', status: 'Open', customerTier: 'Business', tags: ['email', 'smtp', 'notifications'] },
  { title: 'Duplicate email alerts sent for each status update', description: 'Users receive three duplicate emails whenever ticket status changes from Open to In Progress.', category: 'Notifications', priority: 'Medium', status: 'Open', customerTier: 'Professional', tags: ['email', 'notifications', 'duplicate'] },
  { title: 'Password reset email delayed by 20 minutes', description: 'Reset links arrive too late and expire quickly for users in APAC region.', category: 'Notifications', priority: 'Medium', status: 'In Progress', customerTier: 'Premium', tags: ['email', 'password', 'latency'] },
  { title: 'Webhook notifications fail with 403 from partner endpoint', description: 'Outbound webhook retries are exhausted when partner endpoint rejects requests with forbidden.', category: 'Notifications', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['webhook', 'integration', 'notifications'] },
  { title: 'Closure confirmation email missing for resolved tickets', description: 'Customers report no closure notice when ticket is moved to Resolved by agents.', category: 'Notifications', priority: 'Low', status: 'Open', customerTier: 'Basic', tags: ['email', 'closure', 'ticket'] },
  { title: 'In-app notification bell count out of sync', description: 'Badge count remains stale after reading all updates and requires manual refresh.', category: 'Notifications', priority: 'Low', status: 'In Progress', customerTier: 'Professional', tags: ['ui', 'notifications', 'badge'] },

  // Performance
  { title: 'Dashboard load time exceeds 12 seconds during peak hours', description: 'Main analytics dashboard stalls due to heavy aggregate queries and missing cache hit.', category: 'Performance', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['performance', 'dashboard', 'query'] },
  { title: 'Ticket search API times out for common keywords', description: 'Search requests for words like login and payment hit timeout when result set is large.', category: 'Performance', priority: 'High', status: 'Open', customerTier: 'Business', tags: ['search', 'api', 'timeout'] },
  { title: 'Report export freezes browser at 80 percent progress', description: 'CSV export task blocks UI thread and browser tab becomes unresponsive.', category: 'Performance', priority: 'Medium', status: 'In Progress', customerTier: 'Professional', tags: ['export', 'performance', 'reports'] },
  { title: 'SLA chart widget causes memory spike in frontend', description: 'Rendering large timeline dataset leads to memory spike and degraded scrolling performance.', category: 'Performance', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['frontend', 'memory', 'chart'] },
  { title: 'Bulk ticket update endpoint slows down after 500 records', description: 'Throughput drops sharply when bulk update payload exceeds 500 ticket IDs.', category: 'Performance', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['api', 'bulk', 'performance'] },
  { title: 'Kanban board drag and drop lag on large teams', description: 'Dragging cards is delayed by 2 to 3 seconds when board has more than 400 active cards.', category: 'Performance', priority: 'Medium', status: 'Open', customerTier: 'Business', tags: ['ui', 'kanban', 'latency'] },

  // Database
  { title: 'MongoDB connection pool saturation under concurrent load', description: 'Connection pool reaches max and incoming requests queue for several seconds.', category: 'Database', priority: 'Critical', status: 'Open', customerTier: 'Enterprise', tags: ['database', 'mongodb', 'pool'] },
  { title: 'Duplicate key errors while creating new tickets', description: 'Concurrent ticket creation occasionally fails with duplicate key on generated ticketId.', category: 'Database', priority: 'High', status: 'In Progress', customerTier: 'Business', tags: ['database', 'ticket', 'index'] },
  { title: 'Slow query on ticket list filtered by assignee and status', description: 'Missing compound index causes list view to take more than 7 seconds.', category: 'Database', priority: 'High', status: 'Open', customerTier: 'Professional', tags: ['database', 'index', 'query'] },
  { title: 'Replica set secondary lag impacts read consistency', description: 'Read preference set to secondary returns stale ticket status values during peak ingest.', category: 'Database', priority: 'Medium', status: 'Open', customerTier: 'Enterprise', tags: ['database', 'replica', 'consistency'] },
  { title: 'Intermittent transaction abort in comment posting flow', description: 'Comment writes occasionally abort due to write conflict when multiple agents update same ticket.', category: 'Database', priority: 'Medium', status: 'Open', customerTier: 'Business', tags: ['database', 'transaction', 'comments'] },
  { title: 'Nightly backup job misses attachments collection', description: 'Backup snapshots include tickets but skip attachment metadata collection intermittently.', category: 'Database', priority: 'High', status: 'In Progress', customerTier: 'Enterprise', tags: ['backup', 'database', 'attachments'] },

  // API / Integrations
  { title: 'Third-party CRM sync fails with 429 rate limit', description: 'Outbound sync to CRM exceeds vendor quota and retries are not backoff-aware.', category: 'Integration', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['api', 'crm', 'rate-limit'] },
  { title: 'Payment gateway callback signature validation failing', description: 'Webhook callback signature mismatch after provider key rotation.', category: 'Integration', priority: 'Critical', status: 'Open', customerTier: 'Enterprise', tags: ['payment', 'webhook', 'security'] },
  { title: 'Slack integration posts malformed ticket links', description: 'Markdown payload escapes URL incorrectly and links open as plain text.', category: 'Integration', priority: 'Medium', status: 'Open', customerTier: 'Business', tags: ['slack', 'integration', 'links'] },
  { title: 'REST API returns 500 when optional filters are empty', description: 'Server throws on undefined filter arrays when query parameter is present but blank.', category: 'Integration', priority: 'High', status: 'In Progress', customerTier: 'Professional', tags: ['api', 'backend', 'validation'] },
  { title: 'GraphQL resolver omits assignee field for team tickets', description: 'Team-scoped queries return null assignee despite existing assignment in database.', category: 'Integration', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['graphql', 'api', 'assignee'] },
  { title: 'Webhook retries continue after endpoint returns 200', description: 'Retry worker does not clear successful delivery state and floods partner endpoint.', category: 'Integration', priority: 'High', status: 'Open', customerTier: 'Business', tags: ['webhook', 'retry', 'queue'] },

  // Uploads / Attachments
  { title: 'Attachment upload fails for files larger than 10MB', description: 'Large PDF uploads return network error though server should accept up to 25MB.', category: 'Attachments', priority: 'High', status: 'Open', customerTier: 'Business', tags: ['upload', 'attachments', 'pdf'] },
  { title: 'Image previews broken after cloud storage migration', description: 'Legacy image URLs point to old bucket and preview thumbnails fail to load.', category: 'Attachments', priority: 'Medium', status: 'In Progress', customerTier: 'Professional', tags: ['upload', 'cloudinary', 'images'] },
  { title: 'Virus scan queue delays attachment availability', description: 'Uploaded files remain in scanning state for more than 25 minutes.', category: 'Attachments', priority: 'Medium', status: 'Open', customerTier: 'Enterprise', tags: ['attachments', 'security', 'queue'] },
  { title: 'Drag-and-drop upload fails on Firefox ESR', description: 'Dropzone does not trigger upload event in Firefox ESR for multiple files.', category: 'Attachments', priority: 'Low', status: 'Open', customerTier: 'Basic', tags: ['upload', 'firefox', 'ui'] },
  { title: 'Attachment metadata missing content type header', description: 'Downloaded files have generic binary MIME type and cannot open directly in browser.', category: 'Attachments', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['attachments', 'download', 'metadata'] },
  { title: 'Deleted attachments still visible in activity timeline', description: 'Timeline renders stale attachment records due to cache invalidation bug.', category: 'Attachments', priority: 'Low', status: 'In Progress', customerTier: 'Professional', tags: ['attachments', 'cache', 'timeline'] },

  // Billing / Payment
  { title: 'Invoice PDF generation fails for annual enterprise plans', description: 'Invoice service throws template error when line items exceed 100 entries.', category: 'Billing', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['billing', 'invoice', 'pdf'] },
  { title: 'Duplicate charge reported after payment retry', description: 'Customer card charged twice when first authorization timed out and user retried.', category: 'Billing', priority: 'Critical', status: 'Open', customerTier: 'Enterprise', tags: ['payment', 'billing', 'duplicate'] },
  { title: 'Tax calculation incorrect for EU customers', description: 'VAT is not applied correctly for certain country codes in checkout service.', category: 'Billing', priority: 'High', status: 'In Progress', customerTier: 'Business', tags: ['billing', 'tax', 'checkout'] },
  { title: 'Subscription downgrade not reflected in entitlement', description: 'Customer switched to lower plan but premium features remain enabled after billing cycle.', category: 'Billing', priority: 'Medium', status: 'Open', customerTier: 'Professional', tags: ['subscription', 'billing', 'entitlement'] },
  { title: 'Failed payment email contains wrong renewal date', description: 'Notification template shows previous cycle date causing customer confusion.', category: 'Billing', priority: 'Low', status: 'Open', customerTier: 'Premium', tags: ['billing', 'email', 'renewal'] },
  { title: 'Credit note not generated after refund completion', description: 'Refund API confirms success but accounting module does not issue credit note.', category: 'Billing', priority: 'Medium', status: 'Open', customerTier: 'Business', tags: ['billing', 'refund', 'accounting'] },

  // Mobile app
  { title: 'Android app crashes on ticket detail screen', description: 'Crash occurs when opening tickets with more than 20 comments and images.', category: 'Mobile', priority: 'High', status: 'Open', customerTier: 'Professional', tags: ['android', 'crash', 'mobile'] },
  { title: 'iOS push notifications stop after app reinstall', description: 'Device token not refreshed correctly, resulting in no push alerts after reinstall.', category: 'Mobile', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['ios', 'push', 'mobile'] },
  { title: 'Offline ticket drafts not syncing when connection returns', description: 'Draft queue remains pending and requires manual app restart to upload.', category: 'Mobile', priority: 'Medium', status: 'In Progress', customerTier: 'Business', tags: ['mobile', 'offline', 'sync'] },
  { title: 'App login hangs on biometric prompt timeout', description: 'Face unlock fallback to password does not appear after biometric timeout.', category: 'Mobile', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['mobile', 'auth', 'biometric'] },
  { title: 'Camera attachment orientation incorrect on iPhone', description: 'Captured images appear rotated 90 degrees in ticket preview and download.', category: 'Mobile', priority: 'Low', status: 'Open', customerTier: 'Basic', tags: ['mobile', 'attachments', 'ios'] },
  { title: 'Mobile app consumes excessive battery in background', description: 'Background sync worker wakes too frequently and drains battery on Android 14.', category: 'Mobile', priority: 'Medium', status: 'Open', customerTier: 'Professional', tags: ['mobile', 'performance', 'battery'] },

  // Access / Permissions
  { title: 'Agent cannot view assigned ticket due to access denied', description: 'RBAC policy incorrectly blocks read access for assigned agent role.', category: 'Authorization', priority: 'High', status: 'Open', customerTier: 'Business', tags: ['rbac', 'permissions', 'agent'] },
  { title: 'Team lead unable to update ticket priority field', description: 'Edit permission removed accidentally in latest role policy deployment.', category: 'Authorization', priority: 'Medium', status: 'In Progress', customerTier: 'Professional', tags: ['rbac', 'permissions', 'priority'] },
  { title: 'Cross-team ticket visibility exposed to unauthorized users', description: 'Users can view ticket metadata from other teams via direct URL access.', category: 'Authorization', priority: 'Critical', status: 'Open', customerTier: 'Enterprise', tags: ['security', 'rbac', 'authorization'] },
  { title: 'Newly invited users miss default support role assignment', description: 'Invitation flow creates account without team role resulting in blank dashboard.', category: 'Authorization', priority: 'Medium', status: 'Open', customerTier: 'Business', tags: ['onboarding', 'rbac', 'users'] },
  { title: 'Audit logs missing permission change entries', description: 'Role change actions are applied but not logged in audit trail.', category: 'Authorization', priority: 'High', status: 'Open', customerTier: 'Enterprise', tags: ['audit', 'permissions', 'security'] },
  { title: 'Custom role cannot access analytics widgets', description: 'Widget endpoint enforces hardcoded admin check instead of role capability.', category: 'Authorization', priority: 'Medium', status: 'Open', customerTier: 'Premium', tags: ['rbac', 'analytics', 'access'] },

  // Analytics / Reporting
  { title: 'Monthly resolution report omits closed tickets', description: 'Closed status is excluded from aggregation causing underreported closure rates.', category: 'Reporting', priority: 'Medium', status: 'In Progress', customerTier: 'Business', tags: ['reports', 'analytics', 'resolved'] },
  { title: 'Priority distribution chart shows stale data after filters', description: 'Chart component does not re-fetch after team filter changes in dashboard.', category: 'Reporting', priority: 'Low', status: 'Open', customerTier: 'Professional', tags: ['analytics', 'dashboard', 'cache'] },
  { title: 'CSV export includes escaped HTML in descriptions', description: 'Rich-text descriptions are exported with raw HTML tags instead of plain text.', category: 'Reporting', priority: 'Low', status: 'Open', customerTier: 'Premium', tags: ['reports', 'export', 'csv'] },
  { title: 'SLA breach widget counts weekends incorrectly', description: 'Business-hours calculation includes weekends and inflates breach percentage.', category: 'Reporting', priority: 'Medium', status: 'Open', customerTier: 'Enterprise', tags: ['sla', 'analytics', 'time'] },
  { title: 'Trending issues carousel repeats same ticket category', description: 'Trending algorithm overweights a single category and hides other issue types.', category: 'Reporting', priority: 'Low', status: 'Open', customerTier: 'Basic', tags: ['analytics', 'trending', 'ui'] },
  { title: 'Heatmap fails to render when no tickets exist for day', description: 'Visualization crashes on empty day bucket due to null value handling.', category: 'Reporting', priority: 'Medium', status: 'In Progress', customerTier: 'Professional', tags: ['heatmap', 'analytics', 'frontend'] },
];

function buildTickets() {
  return TICKET_BLUEPRINTS.map((item, index) => {
    const priorityHours = PRIORITY_TO_RESOLUTION_HOURS[item.priority] || 72;
    const age = (index % 45) + 1;

    return {
      ticketId: `GNT-${String(index + 1).padStart(4, '0')}`,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      customerTier: item.customerTier,
      tags: item.tags,
      estimatedResolutionTime: priorityHours,
      resolutionTime: item.status === 'Resolved' || item.status === 'Closed' ? priorityHours - 2 : undefined,
      estimatedTime: estimateTimeLabel(item.priority),
      affectedUsers: item.customerTier === 'Enterprise' ? 100 : item.customerTier === 'Business' ? 40 : 10,
      createdAt: daysAgo(age),
      updatedAt: daysAgo(Math.max(0, age - 1)),
    };
  });
}

async function run() {
  await connectDB();

  const tickets = buildTickets();
  if (tickets.length < 50) {
    throw new Error(`Ticket feed must contain at least 50 records. Found ${tickets.length}`);
  }

  const operations = tickets.map((ticket) => ({
    updateOne: {
      filter: { ticketId: ticket.ticketId },
      update: { $set: ticket },
      upsert: true,
    },
  }));

  const result = await Ticket.bulkWrite(operations, { ordered: false });
  await Ticket.syncIndexes();

  const total = await Ticket.countDocuments();
  const feedCount = await Ticket.countDocuments({ ticketId: { $regex: /^GNT-/ } });

  console.log('Genuine ticket feed complete.');
  console.log(`Feed records prepared: ${tickets.length}`);
  console.log(`Inserted: ${result.upsertedCount || 0}, Updated: ${result.modifiedCount || 0}`);
  console.log(`Feed records in DB (GNT-*): ${feedCount}`);
  console.log(`Total tickets in DB: ${total}`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Feed failed:', err);
  process.exit(1);
});
