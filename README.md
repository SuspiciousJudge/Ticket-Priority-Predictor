# Ticket Priority Predictor

A full-stack ITSM-style ticket management platform with AI-assisted priority prediction.

## Overview

This project includes:

- A React frontend for ticket workflows, dashboards, analytics, team views, and settings.
- A Node.js + Express backend for auth, ticket APIs, team/user management, uploads, and AI routes.
- MongoDB with Mongoose for data persistence.
- ONNX model inference in backend for local priority prediction.
- Optional Gemini integration for assistant/chat behavior.
- Socket.IO for real-time ticket updates.

## Architecture

### Frontend (root + src)

- React 19 + Vite (rolldown-vite)
- React Router for page navigation
- React Query for server-state fetching/caching
- Zustand for global app state
- Tailwind CSS for styling
- Recharts for analytics visualizations
- Axios API client in src/services/api.js

### Backend (backend)

- Node.js runtime + Express framework
- MongoDB via Mongoose
- JWT auth + bcryptjs password hashing
- Security middleware: helmet, cors, compression, express-rate-limit
- Upload stack: multer + Cloudinary integration
- Socket.IO server for realtime events

### AI/ML

- Local inference with onnxruntime-node
- ONNX model artifact at backend/models/priority_model.onnx
- Inference module in backend/utils/mlPredict.js
- Fallback heuristic classifier when model/runtime is unavailable
- Model health endpoint: GET /api/ai/model-health (auth protected)

## Repository Structure

- src/: frontend source
- backend/: backend API, DB, model, scripts
- public/: static frontend assets
- dist/: frontend production build output
- revision.txt: detailed file-by-file architecture notes
- ai model.txt: detailed ML methodology and model behavior notes

## API Surface

Base backend URL (default): http://localhost:5000/api

Dev origin compatibility:

- Frontend can run on either http://localhost:5173 or http://127.0.0.1:5173
- Backend CORS allowlist supports localhost and 127.0.0.1 dev origins

Main route groups:

- /api/auth
- /api/tickets
- /api/teams
- /api/users
- /api/upload
- /api/ai
- /api/health

AI routes:

- POST /api/ai/chat
- POST /api/ai/suggest-priority
- GET /api/ai/model-health (requires auth)

## Environment Variables

Create backend/.env with the following keys as needed:

- PORT=5000
- MONGODB_URI=mongodb://localhost:27017/ticketpro
- CLIENT_URL=http://localhost:5173
- JWT_SECRET=replace_with_strong_secret
- JWT_EXPIRE=7d
- GEMINI_API_KEY=optional_for_chat_features
- CLOUDINARY_CLOUD_NAME=optional_if_using_cloud_upload
- CLOUDINARY_API_KEY=optional_if_using_cloud_upload
- CLOUDINARY_API_SECRET=optional_if_using_cloud_upload
- RESET_EMAIL_MODE=console
- PASSWORD_RESET_URL_BASE=http://localhost:5173/reset-password
- RESEND_API_KEY=required_for_production_password_reset_email
- MAIL_FROM=verified_sender@example.com
- TRUST_PROXY=false
- ENFORCE_HTTPS=false
- ENABLE_PUBLIC_UPLOADS=false
- ENABLE_AUTO_RETRAIN=false
- ALLOW_MANUAL_RETRAIN=false

For split frontend/backend hosting, configure these frontend build variables:

- VITE_API_BASE_URL=https://your-backend.example.com/api
- VITE_SOCKET_URL=https://your-backend.example.com

Notes:

- If GEMINI_API_KEY is missing, AI suggest-priority falls back to local predictor.
- If ONNX runtime/model is unavailable, backend falls back to heuristic scoring.
- In production, MONGODB_URI and CLIENT_URL are required at startup.
- In production, uploads require all Cloudinary variables; the backend rejects uploads instead of using ephemeral local storage.
- Development reset requests use console delivery and may return a local reset URL. Production requires RESET_EMAIL_MODE=resend, RESEND_API_KEY, MAIL_FROM, and PASSWORD_RESET_URL_BASE.
- Automatic retraining is disabled by default because the training worker requires a separate Python/job environment.

## Runtime Requirements

- Node.js 22.12.0 or later within the Node 22 release line. See `.nvmrc`.
- MongoDB for local development and production persistence.
- Cloudinary for persistent production attachments.
- Optional Resend, Gemini, and Slack credentials for their respective features.

## Setup

### 1) Install dependencies

Frontend/root:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

### 2) Start backend

```bash
cd backend
npm run dev
```

or

```bash
cd backend
npm run start
```

### 3) Start frontend

```bash
npm run dev
```

Frontend default: http://localhost:5173

### Docker Compose

Copy `.env.example` to `.env`, replace the placeholder `JWT_SECRET`, then run:

```bash
docker compose up --build
```

The Nginx frontend is available at http://localhost:3000 and proxies `/api` and `/socket.io` to the backend. The Compose stack includes MongoDB, backend, frontend, and health checks. Do not use the seed script against a database containing real data.

## Development Quickstart

Follow these steps for a local development environment and quick testing using seeded accounts.

- **Backend (dev)**: start the backend dev server (it may fallback to the next free port if 5000 is busy):

```bash
cd backend
npm run dev
```

- **Frontend (dev)**: start the Vite dev server (Vite will pick the next free port if 5173 is busy):

```bash
npm run dev
```

- **Seed the database** (creates admin and agent accounts used for local testing):

```bash
cd backend
npm run seed
```

Seeded test accounts (development only):

- Admin: admin@example.com / Admin1234
- Admin (alternate): admin@gmail.com / Admin1234
- Agent: alice@example.com / Password1
- Agent: bob@example.com / Password1

Notes:
- These credentials are intended for local/dev use only. Change passwords before any public or production deployment.
- If the backend starts on a non-default port (e.g. 5001) the frontend dev server proxy may need updating or requests will be routed to that port automatically when configured via `CLIENT_URL`.

## Scripts

### Root scripts

- npm run dev: start frontend dev server
- npm run build: build production frontend bundle
- npm run preview: serve built frontend locally
- npm run lint: run ESLint across project scopes

### Backend scripts

- npm run start: start backend server
- npm run dev: start backend with nodemon
- npm run seed: seed database
- npm run check:model: run model inference smoke test
- npm run import:data: import real ticket dataset (JSON or CSV) into MongoDB
- node scripts/checkModelHealth.js: print model runtime health details

## Dataset Import (Real Data)

Importer file:

- backend/scripts/importData.js

Supports input formats:

- JSON: tickets array or top-level array
- CSV: flexible header aliases (including ITSM-style columns)

Run importer:

```bash
cd backend
npm run import:data -- --file=C:/absolute/path/to/tickets.json
```

or

```bash
cd backend
npm run import:data -- --file=C:/absolute/path/to/training_data.csv
```

Importer behavior:

- Clears existing tickets collection
- Normalizes priority/status/category/tier fields
- Maps assignees to existing users or creates imported agent users
- Inserts tickets and syncs indexes
- Prints import totals, priority distribution, and top categories

## Real-Time Events

Backend emits Socket.IO events:

- ticket_created
- ticket_updated
- team-scoped events via rooms named team_<teamId>

This enables dashboard/list updates without full page refreshes.

## Security and Reliability

- JWT-protected routes for sensitive operations
- Password reset tokens are hashed, expire after 30 minutes, and are invalidated after use.
- Production upload requests require persistent Cloudinary storage.
- `/api/health` reports database readiness with HTTP 503 when MongoDB is unavailable.
- Express app construction is separated from server startup so route tests do not open network or database handles.

## Validation

```bash
npm ci
npm run lint
npm run build

cd backend
npm ci
npm test -- --detectOpenHandles
npm run check:model
node scripts/checkModelHealth.js
```

Dependency audits are run separately from the root and backend. See [FINAL_PRE_DEPLOYMENT_REPORT.md](FINAL_PRE_DEPLOYMENT_REPORT.md) for the latest evidence, remaining advisory, external-service status, and deployment requirements.

## Project Reports

- [Final pre-deployment report](FINAL_PRE_DEPLOYMENT_REPORT.md)
- [Production readiness report](PRODUCTION_READINESS_REPORT.md)
- [Deployment blockers](DEPLOYMENT_BLOCKERS.md)
- [Deployment guide](DEPLOYMENT_GUIDE.md)
- [Manual testing checklist](MANUAL_TESTING_CHECKLIST.md)
- [Project fix report](PROJECT_FIX_REPORT.md)

## Recent additions

See [docs/FEATURES.md](docs/FEATURES.md) for a summary of new endpoints and operational features (model metrics, retraining, explainability, exports/imports, alerts, caching, audit logs, tests & CI).
- CORS allowlist and credentials handling
- Helmet security headers
- Request rate limiting
- Centralized error handling middleware
- Model fallback path to prevent AI-related downtime

### April 2026 Security Hardening Update

- Removed insecure JWT fallback behavior and enforced startup env validation for JWT secret quality.
- Implemented route-level and controller-level RBAC/BOLA protections for users, teams, tickets, and AI routes.
- Added endpoint-specific rate limiting policies:
	- General API: 1000 requests/hour/IP
	- Auth routes: 100 requests/15 minutes/IP
	- AI routes: 30 requests/5 minutes/IP
	- Export routes: 30 requests/15 minutes/IP
- Hardened forgot-password flow to avoid reset token disclosure.
- Reduced error leakage by making stack traces opt-in for explicit local debugging.
- Hardened upload security:
	- stricter extension + MIME validation
	- authenticated file retrieval endpoint (/api/upload/files/:filename)
	- disabled public upload static serving by default
- Added endpoint inventory snapshot:
	- backend/endpoint-inventory.txt
- Added security CI workflow:
	- .github/workflows/security-ci.yml
	- Includes npm audit gates, Semgrep SAST, and OWASP ZAP baseline DAST.

Dependency audit status after remediation:

- Root/frontend: 0 vulnerabilities (npm audit --audit-level=high)
- Backend: 0 vulnerabilities (npm audit --audit-level=high)

## AI Model Notes

Current ML method:

- Supervised multiclass classification
- RandomForestClassifier trained in Python
- Exported to ONNX and served in Node.js

Inference inputs (engineered features):

- sentiment score
- enterprise flag
- critical-keyword flag
- text length

Detailed docs:

- See revision.txt for architecture and file mapping.
- See ai model.txt for model internals, examples, and limitations.

## Health Checks

- Backend health: GET /api/health
- Model health: GET /api/ai/model-health (requires auth)

## Recent Important Updates

- Added ONNX runtime integration and model health endpoint.
- Expanded the support console UI with faster ticket navigation from Saved Views, clearer ticket selection controls, direct per-user assignment in Unassigned, richer reports templates, deeper activity details, and a team chat side panel.
- Updated the calendar, SLA, help/support, teammates, and ticket detail screens to expose scheduling, policy, onboarding, and tool-shortcut workflows directly in the UI.
- Improved dark-mode readability across the floating chat surface and several dashboard-facing cards and panels.
- Added frontend settings card to monitor model health.
- Added model validation scripts.
- Removed deprecated MongoDB connection options.
- Added frontend chunk-splitting strategy in Vite config.
- Updated ESLint config for mixed frontend/backend repository setup.
- Improved env-file security handling and removed backend/.env from tracked history.
- Fixed CORS sign-in issue by allowing 127.0.0.1 dev origins in backend allowlist.
- Added real-data importer supporting JSON and CSV schema aliases.
- Reworked analytics/dashboard stats to be MongoDB-backed and team-scoped.
- Added cosine-similarity based similar tickets endpoint.
- Added Similar Tickets section in Ticket Detail with clickable navigation.
- Removed active frontend mock-data dependencies from analytics/team/ticket creation flows.
- Added realistic ticket corpus tooling:
	- backend/scripts/feedGenuineTickets.js
	- backend/scripts/cleanupJunkTickets.js
	- backend/scripts/assignTicketsToDefaultTeam.js
- Added database resilience hardening:
	- retry/backoff MongoDB startup
	- DB readiness middleware for API stability
	- health endpoint DB readiness reporting
- Fixed ticket create failures from empty customerTier payloads with safe normalization.
- Strengthened hybrid priority prediction with weighted severity keywords and ONNX-aware escalation.
- Added AI draft reply endpoint: POST /api/ai/draft-reply.
- Added executive PDF export endpoint: GET /api/tickets/executive-snapshot.
- Added advanced analytics modules:
	- SLA risk predictor
	- auto-triage queue
	- team workload heatmap
	- agent performance cards
	- reopen analytics
	- priority override audit metrics
- Added ticket-level operations intelligence:
	- escalation assistant
	- incident war room checklist
	- customer impact score
	- root-cause timeline
	- resolution playbooks
	- knowledge-base suggestions in create flow
- Added schema-backed lifecycle tracking:
	- impactScore
	- priorityOverrideAudit[]
	- statusHistory[]
	- reopenCount

## Newly Added APIs (April 2026)

- GET /api/tickets/executive-snapshot
	- Downloads executive snapshot PDF with key operational metrics.

- POST /api/ai/draft-reply
	- Generates customer-facing update drafts with tone control.

## Product Feature Set (Current)

- Smart SLA risk prediction for active tickets.
- Auto-triage queue for unassigned incidents.
- Natural language semantic ticket search from the knowledge base.
- Similar ticket resolver with likely fix suggestions.
- Priority override auditing and analytics.
- In-app feedback loop that captures prediction corrections and model accuracy responses.
- Team workload balancing insights.
- Escalation assistant and incident war-room mode.
- Offline draft sync for ticket comments and agent updates.
- Customer impact scoring and explainable prioritization.
- Resolution playbooks and KB-assisted creation flow.
- Root-cause timeline and reopen-quality analytics.
- Executive reporting export for leadership views.

## Recommended Next Steps

- Add CI workflow for lint/build/smoke tests.
- Add integration tests for auth and ticket creation flows.
- Add model evaluation metrics tracking for retraining decisions.

## April 2026 Navigation and Module Rollout Update

- Implemented expanded operations/platform pages and connected them to production data paths:
	- My Tickets, Unassigned, Urgent Queue
	- Reports, Performance, Activity Log
	- Notifications Center, Saved Views
	- Customers, Calendar/Schedule, Knowledge Base
	- Templates, Automations, Integrations
	- SLA Management, Help & Support, Inbox
- Added role-aware sidebar visibility by user role (`admin`, `manager`, `agent`, `viewer`).
- Added live sidebar badges for unread or queue counts (Inbox, Notifications, Unassigned, Urgent).
- Added SLA to Saved Views deep-linking (`sla:at_risk`, `sla:breached`) with URL-based filter sync.
- Improved navigation reliability:
	- Added route aliases for implementation-plan naming variants.
	- Hardened protected route behavior so section paths resolve to intended pages.
	- Updated help navigation in profile dropdown to open Help & Support page directly.
- Improved sidebar usability:
	- Fixed full-height scroll behavior for long menu lists.
