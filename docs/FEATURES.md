# Implemented Features (summary)

This file summarizes features added or improved by the recent updates.

## Model & AI

- `/api/ai/model-health` — basic model health info (model presence, runtime).
- `/api/ai/model-metrics` — runtime metrics (prediction counts, latencies, model load attempts).
- `/api/ai/model-metrics` — protected (admin/manager).
- `/api/ai/model-metrics` — returns metrics useful for monitoring and alerting.
- `/api/ai/retrain` — trigger retraining (admin-only). Controlled by `ENABLE_AUTO_RETRAIN` / `ALLOW_MANUAL_RETRAIN`.
- Auto-retraining scheduler: enable with `ENABLE_AUTO_RETRAIN=true` and either `RETRAIN_CRON` or `RETRAIN_INTERVAL_HOURS`.
- `/api/ai/explain` — returns feature-level explainability using saved model metadata.
- `/api/ai/explain` — protected (admin/manager).
- Conversation persistence (optional): set `SAVE_CHAT_HISTORY=true` to save chat messages and use `/api/ai/conversation` to fetch.

## Export / Import

- `/api/tickets/export-json` — admin/manager export all tickets as JSON.
- `/api/tickets/import-json` — admin-only bulk import tickets from JSON payload.

## Monitoring & Alerts

- Slack alerting for critical predictions and model inference failures via `SLACK_ALERT_WEBHOOK`.

## Operational

- Basic in-memory caching for ticket detail (`/api/tickets/:id`) to reduce DB read load.
- Audit logging: POST/PUT/DELETE requests are recorded to an `AuditLog` collection.
- Improved startup checks: `MONGO_URI` and `JWT_SECRET` are required; production warnings for optional secrets.
- Basic Jest tests for utilities and a GitHub Actions CI workflow at `.github/workflows/nodejs-ci.yml`.

## Env vars (new / important)

- `ENABLE_AUTO_RETRAIN` — set to `true` to enable scheduled retraining.
- `RETRAIN_CRON` — optional cron expression (requires `node-cron` to be installed) to schedule retrain.
- `RETRAIN_INTERVAL_HOURS` — fallback interval in hours when `RETRAIN_CRON` not set.
- `ALLOW_MANUAL_RETRAIN` — set to `true` to allow manual retrain via API.
- `SAVE_CHAT_HISTORY` — set to `true` to persist AI chat history per user.
- `SLACK_ALERT_WEBHOOK` — Slack incoming webhook URL for alerts.

## Tests

- Run backend tests:

```bash
cd backend
npm ci
npm test
```


