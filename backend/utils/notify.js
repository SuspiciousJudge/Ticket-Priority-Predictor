const https = require('https');
const url = require('url');

function sendSlackWebhook(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    if (!webhookUrl) return resolve({ ok: false, reason: 'no_webhook' });
    try {
      const u = url.parse(webhookUrl);
      const data = JSON.stringify(payload);
      const opts = {
        hostname: u.hostname,
        path: u.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };
      const req = https.request(opts, (res) => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: buf }));
      });
      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    } catch (e) { reject(e); }
  });
}

async function sendAlert({ title, description, priority, confidence, extra }) {
  const webhook = process.env.SLACK_ALERT_WEBHOOK;
  if (!webhook) return;
  const text = `*Ticket Priority Alert*\n*Title:* ${title}\n*Priority:* ${priority} (${confidence})\n*Description:* ${description || 'N/A'}\n${extra || ''}`;
  try {
    await sendSlackWebhook(webhook, { text });
  } catch (e) { console.warn('Failed to send Slack alert:', e && e.message); }
}

module.exports = { sendAlert, sendSlackWebhook };
