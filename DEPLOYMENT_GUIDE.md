# Ticket Priority Predictor: Free Deployment Guide

> Analysis date: 2026-09-05
>
> This guide is based on the repository contents, package manifests, runtime code, Docker files, CI workflows, and local validation. It does not apply the production changes described below.

## Executive Summary

This is a full-stack IT service management application. The React/Vite frontend provides dashboards, ticket workflows, analytics, teams, reports, authentication screens, AI assistant UI, and real-time updates. The Node/Express backend provides JWT authentication, MongoDB persistence, ticket/team/user APIs, uploads, AI routes, Socket.IO events, exports, audit logging, rate limiting, and local ONNX priority prediction.

Recommended zero-cost architecture:

| Component | Recommendation | Reason |
|---|---|---|
| Frontend | Cloudflare Pages | Static Vite output, HTTPS, Git-based deployment, free static requests |
| Backend | Render Free Web Service | Runs the existing long-lived Node/Express/Socket.IO process and supports WebSockets |
| Database | MongoDB Atlas M0 free shared cluster | Matches the existing Mongoose/MongoDB data model |
| Attachments | Cloudinary Free | The backend already supports Cloudinary and free persistent object storage/CDN |
| AI chat | Optional Gemini API key | The app has a local fallback for priority suggestion and reply drafting; chat requires Gemini |
| Source/CI | GitHub + existing Actions workflows | Automatic deployments and existing backend/security checks |

**Monthly cost: ₹0 / $0**, assuming usage remains inside each provider's free quota. No custom domain is included; provider subdomains are free. A credit card is not needed for Cloudflare Pages or Cloudinary Free. Render and MongoDB Atlas account-verification requirements can vary by country, account risk checks, and current signup flow; verify the signup page before committing to the provider. Do not add a payment method if the requirement is a hard zero-cost ceiling.

## Repository Findings

### 1. What the project does

The application is a TicketPro-style ITSM platform with AI-assisted ticket priority prediction. It supports:

- User registration, login, JWT bearer authentication, logout, and password reset storage.
- Ticket creation, editing, deletion, comments, assignment, filtering, search, similar-ticket lookup, statistics, CSV/JSON/PDF exports, and import.
- Admin/manager/agent/viewer roles and team membership.
- Dashboards, analytics, reports, SLA views, activity/audit logs, knowledge base, notifications, and settings.
- AI chat, priority suggestion, reply drafting, explainability, model health/metrics, and optional retraining.
- Socket.IO notifications for ticket and team events.
- Attachments with Multer and Cloudinary upload support, plus a local filesystem fallback.
- English and Spanish locale files served by the backend.

### 2. Technology stack

**Frontend**

- React 19
- Vite using `rolldown-vite`
- React Router 7
- TanStack React Query
- Zustand
- Axios
- Tailwind CSS, PostCSS, Autoprefixer
- Recharts, Framer Motion, Swiper
- Socket.IO client
- React Hook Form and Yup

**Backend**

- Node.js, CommonJS
- Express 4
- Mongoose 8
- MongoDB
- JWT and bcryptjs
- Socket.IO 4
- Helmet, CORS, compression, express-rate-limit, express-validator
- Multer for multipart uploads
- Cloudinary SDK
- PDFKit and json2csv for exports
- Node Cache for in-memory caching
- Jest and Supertest for tests

**AI/ML**

- `onnxruntime-node` loads `backend/models/priority_model.onnx`.
- A rule-based heuristic fallback works when the ONNX runtime/model is unavailable.
- Optional Google Gemini integration is used by chat and can be used for priority suggestions/replies.
- `backend/scripts/train.py` is a separate development/training path and requires Python/scikit-learn/skl2onnx; it is not a suitable production scheduler on the free Node service.

### 3. Frontend and backend requirements

The frontend is a static SPA. `npm run build` produces `dist/` and succeeds locally. It can be deployed independently.

The backend must remain a long-running Node process because it:

- Listens for HTTP requests.
- Hosts Socket.IO WebSockets.
- Connects to MongoDB.
- Loads an ONNX model from the repository.
- Handles uploads and exports.
- Optionally schedules work in-process.

The backend can therefore be deployed separately from the frontend, but the frontend must receive the public backend URL at build time and the backend must allow the final frontend origin through CORS.

### 4. Database and storage requirements

MongoDB is required for users, teams, tickets, comments, audit logs, and optional AI conversations. The connection is read from `MONGODB_URI` or `MONGO_URI`.

Attachments are stored in one of two ways:

1. Cloudinary when `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_KEY` are set.
2. The local `backend/uploads` directory otherwise.

The local fallback is not safe for hosted free services because Render has an ephemeral filesystem: files disappear after restart, redeploy, or spin-down. Configure Cloudinary for production and do not depend on local uploads.

The ONNX model is packaged with the backend and can remain in the image/deployment. It is not database storage.

### 5. Authentication

Authentication is JWT bearer authentication. The browser stores the token in localStorage or sessionStorage and Axios sends `Authorization: Bearer ...`. `withCredentials: true` is enabled, but the current auth implementation does not use an auth cookie.

Production requires a randomly generated `JWT_SECRET` of at least 32 characters. The seeded development passwords must never be reused publicly.

Password-reset records are saved in MongoDB, but the backend does not send an email. The forgot-password endpoint intentionally returns a generic success message and therefore cannot complete a real user-facing reset flow until an email provider and delivery implementation are added.

### 6. External services and APIs

- MongoDB Atlas: required production database.
- Cloudinary: required for persistent attachments.
- Gemini: optional for AI chat. Priority suggestion and reply drafting have local fallbacks when the key is absent.
- Slack incoming webhook: optional alerting through `SLACK_ALERT_WEBHOOK`.
- Browser clients connect to the backend Socket.IO endpoint.
- No OAuth provider or authentication callback integration was found.

### 7. API surface

The backend mounts:

- `GET /api/health`
- `/api/auth`
- `/api/tickets`
- `/api/teams`
- `/api/users`
- `/api/upload`
- `/api/ai`
- `/api/i18n`
- Socket.IO at `/socket.io`

Most business routes require a JWT. Admin/manager authorization is enforced on administrative routes.

## Deployment Problems Found Before Deployment

### A. A real secret exists in the local `backend/.env`

The local file contains a JWT secret and a Gemini-looking API key. They are not reproduced here. Although `.env` is ignored by Git, treat the key as compromised if it has ever been shared, committed, uploaded, or pasted into logs. Rotate the Gemini key and replace the JWT secret before deployment. Never commit `backend/.env`.

Files: `backend/.env`, `.gitignore`

### B. Frontend API URL is build-time configuration

`src/services/api.js` uses `VITE_API_BASE_URL || '/api'`. A separately hosted Cloudflare Pages frontend will not have a same-origin `/api` unless a proxy is added. Set:

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

`VITE_*` values are public and must never contain secrets.

### C. Socket.IO currently defaults to the frontend origin

`src/components/layout/Layout.jsx` defaults `VITE_SOCKET_URL` to `window.location.origin`. That works only when frontend and backend share an origin. Set `VITE_SOCKET_URL` explicitly for split hosting.

### D. Backend CORS must use the exact Pages URL

`backend/server.js` allows `CLIENT_URL` plus local development origins. Configure `CLIENT_URL` to the exact production Cloudflare Pages URL, including `https://` and without a trailing slash. If a custom domain is later added, update this variable to that origin and redeploy.

### E. Local upload storage is ephemeral

`backend/routes/upload.js` writes temporary/local files to `backend/uploads` when Cloudinary is not configured. Configure all three Cloudinary variables in Render. Do not set `ENABLE_PUBLIC_UPLOADS=true` in production.

### F. Password reset is incomplete in production

`backend/controllers/authController.js` hashes and stores reset tokens but never sends an email or reset URL. The frontend has reset pages, but users cannot obtain the token through the current backend. Either document password reset as unavailable, or add a transactional email provider and safe reset-link delivery. Do not put a secret email credential in the frontend.

### G. Retraining is not deployable as currently configured

The optional scheduler attempts to require `node-cron`, but `node-cron` is not in `backend/package.json`. Retraining invokes Python and the repository does not include a production Python dependency manifest. Keep `ENABLE_AUTO_RETRAIN=false`, `ALLOW_MANUAL_RETRAIN=false` on the free service. Use the committed ONNX artifact and run training manually in a controlled environment, then commit a reviewed model update.

### H. Backend test suite has a pre-existing environment-dependent failure

`npm test` in `backend` runs, but `tests/aiRoutes.test.js` currently receives HTTP 503 because the test depends on MongoDB readiness; the ML tests pass. The test also leaves a database connection open. This must be fixed before using CI as a deployment gate, but it is not caused by the hosting architecture.

### I. Root test command is absent

The root `package.json` has no `test` script. Use `npm run build` and `npm run lint` at the root, and `npm test` inside `backend`.

### J. Existing Docker Compose is local-only

`docker-compose.yml` runs MongoDB, backend, and an Nginx frontend locally. Its internal `mongodb://mongo:27017/ticketdb` URI is not usable on Render or Atlas. It is useful for local smoke testing, not the recommended free cloud deployment.

### K. No database migration system is present

The project uses Mongoose model definitions and seed/import scripts, not versioned migrations. Production data should be migrated using a deliberate backup/export and `importData.js` or a one-time seed against the Atlas URI. Do not run `seed` against a database containing real data: it deletes users, teams, and tickets first.

### L. Free-host operational limitations affect real-time behavior

Render Free sleeps after 15 minutes without inbound traffic, including WebSocket activity, and wakes on a later request/connection. The first request can take roughly a minute. Socket.IO reconnect behavior should be tested after wake-up. Do not add a ping service solely to bypass provider limits; it can violate platform policies and consume quotas.

### M. Node version consistency should be improved

The Dockerfiles use Node 22, CI uses Node 18/20, and `package.json` has no `engines` field. Pin the deployment runtime to Node 22 (or test and standardize on Node 20) so native `onnxruntime-node` behavior is predictable.

## Ranked Free Architectures

### 1. Cloudflare Pages + Render Free + MongoDB Atlas M0 + Cloudinary Free: recommended

Best compatibility with the existing code. Pages serves the static SPA. Render runs the unchanged Express/Socket.IO server. Atlas supplies MongoDB. Cloudinary supplies persistent attachments.

Limitations: Render sleeps, free compute is small, free usage is capped, Atlas M0 is shared/limited, and Cloudinary has monthly credits. This is suitable for a demo, portfolio, or low-traffic hobby deployment, not a production SLA.

### 2. Cloudflare Pages + a free always-on container/VM provider + Atlas + Cloudinary

Potentially better for WebSockets if a genuinely free container/VM offer is available in the user's region. It is not selected because current availability, card requirements, quotas, and regional eligibility vary and can change. Re-verify the provider's official pricing before use.

### 3. Cloudflare Pages + serverless backend rewrite + Atlas + object storage

Not recommended without a substantial rewrite. The current backend uses a persistent Express process, Socket.IO, native ONNX runtime, filesystem temporary files, and optional in-process scheduling. Vercel/Cloudflare serverless deployment would require adapting routes, WebSockets, model loading, and uploads. It would not be the smallest or most reliable free deployment for this codebase.

### 1. Recommended Architecture

```text
Browser
  |
  | HTTPS static assets
  v
Cloudflare Pages (React/Vite dist)
  |
  | HTTPS REST: VITE_API_BASE_URL
  | WSS/HTTPS Socket.IO: VITE_SOCKET_URL
  v
Render Free Web Service (Node/Express/Socket.IO + ONNX)
  |
  +--> MongoDB Atlas M0 (MONGODB_URI)
  +--> Cloudinary Free (persistent ticket attachments)
  +--> Gemini API (optional, GEMINI_API_KEY)
  +--> Slack webhook (optional, SLACK_ALERT_WEBHOOK)
```

### 2. Why This Is the Best Free Option

- The frontend is already a static Vite build and needs no server-side rendering.
- Render runs a normal Node process and supports Socket.IO/WebSockets, unlike a pure static host.
- Atlas matches Mongoose without a data-model rewrite.
- Cloudinary is already implemented and avoids ephemeral-host storage loss.
- HTTPS is provided by the hosts on their default subdomains.
- GitHub integration can trigger automatic builds for both frontend and backend.
- The architecture preserves the ONNX model and local fallback classifier.

Vercel and Netlify are excellent for the static frontend, but neither is the right place for this current backend without a serverless rewrite. Cloudflare Workers/Pages Functions are also not a drop-in runtime for this Express/Socket.IO/native-ONNX process. Render's own documentation warns that its Free instances are for testing/hobby use, so the recommendation is explicitly for a zero-cost demo or learning deployment.

### 3. Required Code Changes

These are the changes to make before a public deployment. They are intentionally not applied by this guide.

### Required

1. `src/components/layout/Layout.jsx`
   - Keep `VITE_SOCKET_URL` support and require it for split deployment, or add a clearer production fallback.
   - Confirm the Socket.IO client connects to the Render origin and reconnects after a free-service wake-up.

2. `backend/server.js`
   - Use the exact `CLIENT_URL` production origin in the CORS allowlist.
   - Keep `TRUST_PROXY=true` on Render so rate limiting and forwarded HTTPS are interpreted correctly.
   - Keep `ENFORCE_HTTPS=true` only after confirming the proxy headers in the deployed service.

3. `backend/routes/upload.js`
   - Make Cloudinary mandatory when `NODE_ENV=production`, or return a clear configuration error instead of silently accepting ephemeral local storage.
   - Keep local fallback only for development.

4. `backend/controllers/authController.js`
   - Add real reset-link delivery before advertising forgot-password in production, or disable/hide the feature until an email path exists.
   - Do not return reset tokens in API responses.

5. `backend/package.json` and runtime configuration
   - Add an `engines.node` declaration matching the chosen runtime.
   - Do not enable auto-retraining unless `node-cron`, Python, and all training dependencies are intentionally supplied.

6. `backend/tests/aiRoutes.test.js`
   - Mock or provision MongoDB deterministically for the test.
   - Close the Mongoose connection after tests.
   - Make the test expect the intended health/readiness behavior rather than relying on a race with database startup.

### Strongly recommended

- Add a root `test` script that delegates to the backend, or document the two test locations clearly.
- Add a production `/api/health` smoke test that checks both HTTP status and database connectivity.
- Add a startup check for Cloudinary variables in production.
- Add a backup/export procedure for Atlas before importing or reseeding data.
- Add a `render.yaml` and deployment notes only after the environment variable names are finalized.
- Add frontend SPA fallback configuration if the selected static host does not automatically serve `index.html` for client-side routes. Cloudflare Pages serves SPA fallback when no `404.html` is present, but verify deep links after deployment.

### 4. Environment Variables

### Cloudflare Pages build variables

Configure these in Pages for Production and Preview as appropriate:

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

These values are bundled into browser JavaScript. They are URLs only, not secrets.

Build settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 22, if the platform setting is available
```

### Render backend variables

Required:

```text
NODE_ENV=production
PORT=10000
MONGODB_URI=<MongoDB Atlas connection string; secret>
JWT_SECRET=<new random secret of at least 32 characters; secret>
JWT_EXPIRE=7d
CLIENT_URL=https://YOUR-PAGES-SITE.pages.dev
TRUST_PROXY=true
ENFORCE_HTTPS=true
ENABLE_PUBLIC_UPLOADS=false
```

Optional AI and storage:

```text
GEMINI_API_KEY=<rotated Gemini key; secret>
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key; secret>
CLOUDINARY_API_SECRET=<Cloudinary API secret; secret>
SLACK_ALERT_WEBHOOK=<Slack webhook URL; secret>
SAVE_CHAT_HISTORY=false
```

Keep disabled on the free deployment:

```text
ENABLE_AUTO_RETRAIN=false
ALLOW_MANUAL_RETRAIN=false
RETRAIN_CRON=
RETRAIN_INTERVAL_HOURS=0
```

Optional tuning variables can remain at defaults: `MONGODB_MAX_POOL_SIZE`, `MONGODB_MIN_POOL_SIZE`, connection timeout variables, and the `RATE_LIMIT_*` variables. Render's 512 MB free instance makes a modest MongoDB pool preferable; consider `MONGODB_MAX_POOL_SIZE=5` and `MONGODB_MIN_POOL_SIZE=0` if Atlas connection usage becomes a problem.

Never put `JWT_SECRET`, MongoDB credentials, Cloudinary API secret, Gemini key, or Slack webhook in the frontend, Git repository, Docker image, or guide.

### 5. Database Deployment

1. Create a MongoDB Atlas account and a free M0 shared cluster in a region near the Render service.
2. Create a database user with a strong password.
3. Allow the backend to connect. Atlas network access rules may require `0.0.0.0/0` for a dynamic free-host egress IP; use a least-privilege database user and accept that this is a hosting limitation. Do not expose MongoDB credentials.
4. Copy the SRV connection string and set its database name, for example `ticketpro`.
5. Set it as Render's `MONGODB_URI`.
6. Deploy the backend and verify `GET https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns HTTP 200 with `database.connected: true`.
7. For a new demo database only, run the seed script once from a trusted machine with the production URI loaded in the shell environment:

```powershell
Push-Location backend
$env:MONGODB_URI = "<Atlas URI>"
$env:JWT_SECRET = "<temporary local value only if needed by the script>"
npm ci
npm run seed
Pop-Location
```

The seed script deletes existing users, teams, and tickets. Do not run it against an existing production database.

8. For existing data, export a backup from the current MongoDB and use `backend/scripts/importData.js` or a controlled `mongodump`/`mongorestore` process. Test the import on a separate Atlas database first.

### 6. Frontend Deployment

1. Push the repository to GitHub without `backend/.env`, `node_modules`, `dist`, or secrets.
2. Open Cloudflare Pages and choose **Create a project** and **Connect to Git**.
3. Select the repository and production branch.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Add `VITE_API_BASE_URL` and `VITE_SOCKET_URL` using the actual Render URL.
7. Deploy.
8. Open the Pages URL and directly test `/login`, `/dashboard`, and a ticket detail URL. Confirm refreshes do not fall back to a host 404.
9. After adding a custom domain, update `CLIENT_URL`, `VITE_API_BASE_URL` if needed, and redeploy.

### 7. Backend Deployment

1. Create a Render **Web Service** from the GitHub repository.
2. Set the root directory to `backend`.
3. Runtime: Node.
4. Build command: `npm ci`.
5. Start command: `npm start`.
6. Select the Free instance.
7. Add all Render variables from the environment section above. Render supplies its own port; the application already reads `PORT`.
8. Deploy and inspect logs for `MongoDB connected` and `Server running on port ...`.
9. Check `/api/health`.
10. Confirm `GET /api/health` remains public and all protected routes return 401 without a bearer token.
11. Configure Cloudinary before testing uploads.
12. Do not run the Dockerfile on Render unless deliberately choosing a Docker web service. The native Node build is simpler and keeps the ONNX model in the deployment.

### 8. Connecting Frontend and Backend

Set the frontend build variables before every production build:

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
VITE_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Set the backend origin:

```text
CLIENT_URL=https://YOUR-PAGES-SITE.pages.dev
```

The browser will call REST through the full Render URL. Axios bearer tokens continue to work. Socket.IO must connect to the Render origin, not `window.location.origin`.

CORS checklist:

- Use `https://` for both public URLs.
- Do not add a trailing slash to `CLIENT_URL`.
- Add the custom domain as a second allowed origin only if it is actually used.
- Keep `credentials: true`; it is harmless for the current bearer-token flow and supports future cookie work.
- Test the browser preflight and the WebSocket upgrade in DevTools.

### 9. Testing Checklist

### Build and source

- [ ] `npm ci` succeeds at the root.
- [ ] `npm run build` succeeds.
- [ ] `npm run lint` is reviewed and deployment-relevant findings are resolved.
- [ ] `Push-Location backend; npm ci; npm test; Pop-Location` passes deterministically.
- [ ] `backend/npm run check:model` succeeds in the deployment image.
- [ ] No `.env`, API key, password, JWT, webhook, or database URI is tracked by Git.

### Backend

- [ ] `/api/health` returns 200 and reports database connected.
- [ ] Server starts with only the documented production variables.
- [ ] CORS accepts the Pages origin and rejects an unrelated origin.
- [ ] Login works with a newly seeded or migrated account.
- [ ] Invalid and expired JWTs are rejected.
- [ ] Admin/manager/agent permissions behave as expected.
- [ ] Ticket CRUD, comments, assignment, filters, search, stats, exports, and imports work.
- [ ] ONNX prediction works and fallback prediction is acceptable if the model cannot load.
- [ ] AI chat fails clearly when Gemini is intentionally disabled.
- [ ] Priority suggestion and draft reply fallback work without Gemini.
- [ ] Uploads reach Cloudinary and remain available after a backend restart.
- [ ] Local upload fallback is not used in production.
- [ ] Rate limits and forwarded HTTPS behavior are correct.
- [ ] Socket.IO connects, joins a team room, receives ticket events, and reconnects after wake-up.

### Frontend

- [ ] Landing, login, signup, forgot-password, and protected routes load.
- [ ] Refreshing a nested route works.
- [ ] REST requests target Render, not localhost.
- [ ] Socket.IO target is Render, not the Pages origin.
- [ ] Browser console has no CORS, mixed-content, or failed WebSocket errors.
- [ ] Dashboard and ticket lists load after the backend cold start.
- [ ] File attachment upload and authenticated retrieval work.
- [ ] CSV/PDF downloads work.
- [ ] Mobile layout and provider-hosted HTTPS work.

### Security and operations

- [ ] Rotated the locally exposed Gemini key and JWT secret.
- [ ] Production seed passwords were changed immediately.
- [ ] Atlas backup/export procedure is documented.
- [ ] No public upload directory is enabled.
- [ ] Stack traces are not exposed.
- [ ] Render logs do not contain secrets or authorization headers.
- [ ] Usage dashboards are checked monthly.
- [ ] Free-service sleep and cold-start behavior is accepted by users.

### 10. GitHub Auto Deployment

### Cloudflare Pages

Connect the Pages project to the GitHub repository and set the production branch. Each push to that branch runs the Vite build and publishes `dist`. Pull requests can use preview deployments if enabled.

### Render

Connect the Render Web Service to the same repository, set the backend root directory to `backend`, and enable automatic deploys from the production branch. Each push that changes the backend triggers `npm ci` followed by `npm start`.

### GitHub Actions

The repository already has backend CI and security workflows under `.github/workflows`. Fix the MongoDB-dependent test setup before treating a green workflow as a release gate. Add a root frontend build job if desired:

```yaml
- run: npm ci
- run: npm run build
```

Use protected branches so deployments occur only after CI passes. Keep provider secrets in Render/Cloudflare secret stores, not GitHub files, unless a workflow genuinely needs them.

### 11. Free Tier Limitations

### Cloudflare Pages

- Static asset requests are free and unlimited according to current Pages documentation.
- Pages Functions use Workers free request quotas; this architecture does not use Pages Functions.
- Builds and preview limits still apply; monitor the current dashboard.
- Provider subdomain HTTPS is free.

### Render Free Web Service

- Free web services spin down after 15 minutes without inbound traffic, including WebSocket messages.
- Wake-up can take about one minute.
- The filesystem is ephemeral; uploads and generated files are lost on restart, redeploy, or spin-down.
- Free compute is listed as 0.1 CPU and 512 MB RAM.
- Render grants 750 free instance hours per workspace per calendar month; exhausting usage can suspend free services until reset.
- Bandwidth and build-pipeline quotas apply. Without a payment method, exceeding applicable limits can suspend services or disable new builds rather than charge.
- Free services can restart at any time, do not support persistent disks, scaling beyond one instance, one-off jobs, SSH shell access, or SMTP ports.
- No production SLA should be assumed.

### MongoDB Atlas M0

- Shared free cluster resources are limited and intended for learning/small applications.
- Storage, throughput, connections, backups, regions, and features are constrained by the current Atlas free-cluster terms.
- Atlas free-cluster eligibility and account-verification requirements can change. Confirm the current M0 page during setup.
- Use indexes already defined by the project and avoid large exports or unbounded queries.

### Cloudinary Free

- Current pricing advertises a $0 free plan, no credit card required, and 25 monthly credits.
- Credits are shared across managed storage, transformations, and delivery; 1 credit is described as 1 GB managed storage, 1 GB image bandwidth, or 1,000 transformations.
- The actual allowance depends on how attachments are used. Monitor the Cloudinary console.
- It supports the project's image/document upload path, but do not assume unlimited document storage or bandwidth.

### Gemini

- Gemini is optional in this codebase, but Google's free API quota and model availability are subject to current AI Studio terms and rate limits.
- Keep it disabled if a strict ₹0 requirement must not depend on quota changes. The local priority predictor and reply fallback still work.

### 12. Final Cost

**Monthly cost: ₹0 / $0**

- Cloudflare Pages: $0 for the static frontend within free usage.
- Render: $0 for the Free web service within free usage; it sleeps and has hobby limitations.
- MongoDB Atlas: $0 for an eligible M0 free cluster within its limits.
- Cloudinary: $0 Free plan; current pricing says no credit card required.
- Gemini: $0 only if usage remains within the provider's free quota, otherwise omit it.
- Custom domain: not included. Use provider subdomains for zero cost.

**Credit card:** Cloudflare Pages and Cloudinary Free do not require one according to their current public documentation. Render and MongoDB Atlas may apply account-specific verification; check the current signup screens and do not add a payment method if a hard no-card requirement applies. If either requires a card for this account, stop and choose a currently eligible provider rather than assuming the service is free.

## Source and Verification Notes

Provider facts were checked against current official documentation on 2026-09-05:

- Render Free services: https://render.com/docs/free
- Cloudflare Pages Functions pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudinary pricing: https://cloudinary.com/pricing
- Vercel limits: https://vercel.com/docs/limits/overview
- Netlify billing FAQ: https://docs.netlify.com/accounts-and-billing/billing-faq/
- MongoDB Atlas free shared cluster limits: https://www.mongodb.com/docs/atlas/reference/free-shared-limit/

Provider pricing, quotas, signup requirements, and acceptable-use rules can change. Recheck the linked official pages immediately before deployment.
