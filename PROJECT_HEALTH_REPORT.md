# Project Health Report

Audit date: 2026-09-06

Scope: read-only repository audit, runtime inspection, dependency checks, build/lint/test execution, local HTTP smoke tests, security review, and deployment-readiness review. No application source, dependency manifest, or deployment configuration was modified during this audit.

## Overall Project Status

**Score: 48/100**

**Final verdict: NOT READY FOR DEPLOYMENT**

The application is structurally substantial and the main frontend, backend, database, authentication, ticket, and ONNX paths can run locally. However, deployment should be blocked until the failed lint/security gates, incomplete password reset, nondeterministic backend tests, and production/container configuration issues are resolved.

### Score breakdown

| Area | Result | Score |
|---|---|---:|
| Architecture and feature coverage | Strong, broad implementation | 15/20 |
| Local build and startup | Frontend and local HTTP startup pass | 15/20 |
| Backend tests and test isolation | One suite fails; open handles remain | 5/15 |
| Code quality and lint | 4 errors, 48 warnings | 5/15 |
| Security and dependency health | High-severity audit findings and exposed local secret history risk | 4/15 |
| Production/deployment readiness | Several blockers found | 4/15 |

## 1. Project Understanding

### What the project does

Ticket Priority Predictor is a full-stack ITSM/ticket-management platform with AI-assisted priority prediction. It provides authentication, role-based ticket and team workflows, dashboards, analytics, reporting, comments, search, exports, attachments, AI assistant features, audit logging, and Socket.IO real-time ticket updates.

### Architecture

- Root `src/`: React single-page application.
- Root Vite configuration builds the frontend to `dist/`.
- `backend/`: independent CommonJS Node/Express service.
- MongoDB accessed through Mongoose models.
- Socket.IO is attached to the backend HTTP server.
- ONNX model is loaded from `backend/models/priority_model.onnx`.
- Optional external services: Gemini, Cloudinary, and Slack webhook alerting.
- Docker Compose defines local MongoDB, backend, and Nginx frontend services.
- GitHub Actions contains backend CI and security workflows.

### Technology stack

**Frontend:** React 19, Vite/Rolldown Vite, React Router 7, Axios, TanStack Query, Zustand, Tailwind CSS, Recharts, Framer Motion, Swiper, Socket.IO client, React Hook Form, Yup, Lucide icons.

**Backend:** Node.js, Express 4, Mongoose 8, MongoDB, JWT, bcryptjs, Socket.IO 4, Multer, Cloudinary SDK, Helmet, CORS, compression, express-rate-limit, express-validator, PDFKit, json2csv, node-cache, Jest, and Supertest.

**ML/AI:** `onnxruntime-node` with a committed ONNX model and rule-based fallback; optional `@google/generative-ai`; Python training script using scikit-learn and skl2onnx.

### Authentication

JWT bearer authentication is implemented in `backend/controllers/authController.js` and `backend/middleware/auth.js`. The frontend stores the token in localStorage or sessionStorage and sends `Authorization: Bearer ...` through Axios. Authorization middleware protects admin/manager routes.

Password reset is not fully implemented: the frontend simulates sending and resetting with `setTimeout`, while the backend stores hashed reset tokens but does not send an email or expose a usable reset link.

### API and routes

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

The endpoint inventory file is stale and omits several implemented i18n, AI, import/export, metrics, explainability, and conversation endpoints.

### Database and file storage

MongoDB is required for users, teams, tickets, comments, audit logs, and optional AI conversation history. Mongoose indexes exist for team/status, priority, creation date, assignee/status, and text search.

Uploads use Multer. Cloudinary is used when configured; otherwise files are written under `backend/uploads`. The local fallback is not persistent on common free container hosts and will lose files after restart, redeploy, or sleep.

### Environment variables and external services

Required backend production values include `JWT_SECRET`, `MONGODB_URI`/`MONGO_URI`, `CLIENT_URL`, and `PORT`. Optional values include Gemini, Cloudinary, Slack, rate limits, proxy/HTTPS controls, chat history, and retraining controls. Frontend build-time values include `VITE_API_BASE_URL` and `VITE_SOCKET_URL`.

The local `backend/.env` contains secret values, but it is ignored and not tracked according to Git. Any key that has ever been shared or committed elsewhere must still be rotated.

## 2. Tests Actually Executed

| Check | Result | Evidence |
|---|---|---|
| Root dependency dry-run | Passed | `npm ci --ignore-scripts --dry-run` completed successfully |
| Backend dependency dry-run | Passed | `backend/npm ci --ignore-scripts --dry-run` completed successfully |
| Frontend production build | Passed with warnings | `npm run build` completed; stale Browserslist and dynamic-import chunk warnings |
| Frontend lint | Failed | 4 errors and 48 warnings |
| Backend Jest tests | Failed | 1 suite failed, 1 passed; AI route received 503 |
| Backend Jest open-handle check | Failed | HTTP server and MongoDB TCP handles remained open |
| ONNX model health | Passed | Model exists, runtime available, model loaded, expected input/output names present |
| ONNX inference smoke test | Passed | Returned a valid priority prediction |
| Backend health HTTP probe | Passed locally | `/api/health` returned 200 and database connected |
| Login API smoke test | Passed locally | Seeded admin login returned a token and admin role |
| Authenticated ticket API smoke test | Passed locally | `/api/tickets` returned success and pagination fields |
| Frontend dev-server startup | Passed locally | Vite ready on `127.0.0.1:5173` |
| Frontend HTTP probe | Passed locally | `/` returned 200 HTML |
| Editor diagnostics | Passed | No VS Code diagnostics reported |
| Compose syntax | Passed | `docker compose config` resolved successfully |
| Dependency audit, root | Failed | 16 vulnerabilities: 11 high, 3 moderate, 2 low |
| Dependency audit, backend | Failed | 14 vulnerabilities: 10 high, 4 moderate |
| Type checking | Not available | No TypeScript project or typecheck script exists |
| Browser console/UI interaction audit | Not fully executed | No shared browser page was available; HTTP/build checks were executed instead |

## 3. Feature Health Table

| Feature | Status | Problem Found | Recommended Fix |
|---|---|---|---|
| Frontend SPA | Working locally | Vite build and HTTP startup pass; route/deep-link behavior still needs browser verification on the chosen host | Test all direct nested URLs after deployment |
| Authentication login | Working locally | JWT login and protected ticket API passed locally | Add automated integration coverage and production secret rotation |
| Registration | Implemented | Requires MongoDB and validation; no end-to-end automated test found | Add API and UI integration tests |
| Logout | Partially working | Client token is cleared; backend logout is stateless and does not revoke existing JWTs | Add token revocation/session strategy if immediate logout invalidation is required |
| Forgot password | Broken/incomplete | Frontend uses a timer and never calls `authAPI.forgotPassword`; backend sends no email | Implement email delivery and real frontend API calls, or disable the feature |
| Reset password | Broken/incomplete | Frontend uses a timer and never calls `authAPI.resetPassword`; no usable token delivery exists | Wire API request, validate token, deliver reset URL, and test end to end |
| MongoDB persistence | Working locally | Local health and ticket API passed; connection retries can leave a live but degraded process | Fail readiness clearly and add deterministic DB integration tests |
| Ticket CRUD | Implemented | Local list path passed; all mutations were not fully exercised in this audit | Add role/validation/concurrency integration tests |
| Ticket search/stats/exports | Implemented | Depends on MongoDB and authorization; not all output paths were smoke-tested | Add route-level tests for every export/search path |
| Teams/users/RBAC | Implemented | Route authorization exists; broad role matrix not fully tested | Add admin/manager/agent/viewer authorization matrix |
| AI priority fallback | Working | ONNX inference and model health passed | Keep heuristic fallback and monitor model load failures |
| AI Gemini chat | Conditional | Requires `GEMINI_API_KEY`; unavailable by design without the optional external service | Document disabled behavior and test fallback/error response |
| AI explainability/metrics | Implemented | AI test is blocked by DB readiness despite explainability being locally computable | Isolate pure explanation logic and mock DB readiness in route tests |
| Socket.IO realtime | Implemented but unverified end to end | Requires correct origin/CORS and reconnect behavior; not browser-tested | Test cross-origin WebSocket upgrade and reconnect after backend sleep |
| File uploads | Conditional | Cloudinary path is persistent; local fallback is ephemeral in hosted deployment | Require Cloudinary in production and test upload/download after restart |
| Audit logging | Implemented | Uses database and mutating requests; no retention/size policy found | Add retention/index monitoring and integration tests |
| i18n endpoints | Implemented | Endpoint inventory is stale; locale file access is filesystem-dependent | Update inventory and test invalid locale/path handling |
| Auto retraining | Not production-ready | `node-cron` is absent and production image lacks Python/training dependencies | Keep disabled; run reviewed training externally or add a separate worker |
| Docker Compose stack | Broken as provided | Backend lacks required `JWT_SECRET`; frontend has no API proxy/configuration; CORS does not match port 3000 | Add secrets/config, proxy or build URL, and production-like smoke tests |
| CI workflows | Partially working | Security CI exists, but dependency audits fail; backend tests fail in current environment | Fix dependencies and deterministic test setup before using CI as release gate |

## 4. Bugs and Code Issues

### Critical

1. **Compose backend startup can fail immediately.** `backend/server.js` requires `JWT_SECRET` and enforces a minimum length, but `docker-compose.yml` does not provide it.
2. **Compose frontend/backend communication is not configured.** The frontend defaults to `/api`, while the Nginx image has no reverse proxy configuration and no build-time `VITE_API_BASE_URL`.
3. **Password reset reports success without performing the operation.** Both reset screens use timers instead of API calls, so users can be told that a reset happened when no password changed.

### High

4. **Backend Jest test is not isolated from infrastructure.** Importing `server.js` starts the real listener and MongoDB connection; the request is gated by `dbReady` and receives 503 before readiness. The suite leaves open TCP handles.
5. **Root lint fails with 4 errors.** Empty catch blocks in `backend/server.js` and `backend/utils/mlPredict.js` violate the lint rule. There are 48 additional warnings, including React hook/compiler warnings.
6. **Dependency audits report high-severity vulnerabilities.** Root: 16 total/11 high. Backend: 14 total/10 high. The affected packages include Axios, React Router, Socket.IO parser/ws, Multer, Mongoose, Express transitive packages, and ONNX runtime transitive packages.
7. **Production upload durability is not guaranteed.** Missing Cloudinary configuration silently switches to local storage, which is lost on ephemeral hosts.
8. **Automatic retraining can be configured into a guaranteed failure.** The scheduler refers to missing `node-cron` and invokes Python without a production training environment.
9. **Runtime versions are inconsistent.** Docker uses Node 22 while CI uses Node 18 and Node 20, with no `engines` declaration. Native ONNX behavior can differ.

### Medium

10. `ProtectedRoute` comments say non-401 errors should show an error state, but the implementation clears the token and redirects for every `isError`.
11. Backend startup continues after MongoDB retries are exhausted. Process-level uptime can appear healthy while all `/api` routes return 503; deployment monitoring must use `/api/health`.
12. Compose uses `ticketdb` while the documented/default database is `ticketpro`, increasing the chance of connecting to an unexpected empty database.
13. Endpoint inventory is stale and can mislead API consumers and QA.
14. The build reports a dynamic import of `src/services/api.js` that is also statically imported, so the intended chunk split is ineffective.
15. Several React hook/compiler lint warnings indicate potentially unstable dependencies or render-time state updates. These should be reviewed for runtime regressions, especially around forms and page data.
16. No type-checking layer exists, so JavaScript import/shape errors rely on lint, build, and runtime coverage.

### Low

17. Browserslist data is eight months old and should be updated during dependency maintenance.
18. Unused imports/variables and empty catches reduce maintainability and obscure real failures.
19. In-memory cache, rate limits, and metrics reset on every backend restart and do not coordinate across instances.
20. No documented database migration/versioning mechanism exists; seed is destructive.

## 5. Security Review

### Confirmed concerns

- A local `backend/.env` contains secret values. It is ignored and not tracked, but rotate any value that may have been exposed outside the local machine.
- Root and backend dependency audits contain multiple high-severity findings. Do not publish until compatible patched versions are selected and tested.
- The fallback local upload path can expose availability/data durability problems in production. It should be disabled or rejected in production.
- Password reset is misleading and has no secure delivery path. Implement an email link containing a one-time token, with generic responses and expiration, before enabling it publicly.
- `express.json` and URL-encoded limits are 10 MB, while uploads are separately capped at 10 MB. Confirm this is intentional for free-host memory limits.
- Socket.IO accepts connections according to the configured origin list, but the deployed frontend origin must be explicitly configured and tested.
- JWTs are stored in browser storage. This is vulnerable to token theft if a future XSS issue is introduced. A secure, HttpOnly cookie/session design is stronger, though it requires CSRF protection and CORS adjustments.
- The backend logs rejected origins and some operational errors. Review logs to ensure no request headers, tokens, or secret values are logged.

### Positive controls confirmed

- JWT secret is required and has a minimum length check.
- Passwords are hashed with bcryptjs.
- Helmet, compression, CORS, rate limiting, and express-validator are used.
- Protected routes require bearer authentication.
- Admin/manager route authorization middleware exists.
- Upload extension/MIME checks, file-size limits, basename normalization, and authenticated retrieval are present.
- Forgot-password backend responses are generic to reduce email enumeration.
- Stack traces are not exposed in production by default.
- `.env` is covered by `.gitignore` and was confirmed not tracked.

## 6. Production Readiness and Deployment Blockers

### Must fix before deployment

1. Fix the four lint errors and review the 48 warnings, especially hook/compiler warnings.
2. Resolve or explicitly accept and document the high-severity dependency audit findings; update lockfiles and rerun builds/tests.
3. Replace timer-based forgot/reset password UI with real API integration and implement secure email delivery, or remove/hide the feature.
4. Make backend tests deterministic by mocking/provisioning MongoDB, avoiding `app.listen` during route tests, and closing MongoDB/server handles.
5. Fix Compose configuration: provide a secret through an environment file, configure frontend API routing/build variables, align CORS with the frontend origin, and add health checks.
6. Require Cloudinary or another persistent object store in production.
7. Standardize Node runtime version across Docker, CI, and deployment; verify native ONNX runtime compatibility.
8. Keep retraining disabled unless a separate, tested Python worker/job environment is provided.
9. Rotate any exposed local JWT/Gemini credentials before public deployment.

### Must verify before release

- Browser login, protected navigation, logout, nested-route refresh, and role restrictions.
- Cross-origin Axios requests and Socket.IO upgrade/reconnect using the deployed URLs.
- MongoDB Atlas connectivity, indexes, backup/export, and recovery behavior.
- Cloudinary upload and authenticated download after backend restart.
- Ticket CRUD, comments, assignment, search, stats, CSV/PDF export, and admin import.
- Gemini configured and unconfigured behavior.
- Free-host cold start and health-check behavior.
- Production logs, rate limits, HTTPS forwarding, and secret redaction.

## 7. Recommended Fix Order

1. **Fix critical runtime paths:** password reset behavior, Compose secrets/API routing, and production upload storage policy.
2. **Stabilize tests:** separate app construction from server startup, mock or provision MongoDB, close all handles, and add route integration fixtures.
3. **Repair code quality gates:** fix lint errors, then review hook warnings and unused/empty catch blocks.
4. **Patch dependencies:** update root/backend lockfiles in controlled increments, rerun audits, builds, model checks, and tests.
5. **Standardize runtime:** choose Node 22 or Node 20, declare it, and use it consistently in Docker and CI.
6. **Add missing coverage:** auth/RBAC matrix, ticket mutations, uploads, Socket.IO, deep links, error states, and reset flow.
7. **Run production-like validation:** Compose or hosted staging with real environment variables, MongoDB, Cloudinary, HTTPS, CORS, and cold-start tests.
8. **Prepare deployment:** rotate secrets, configure monitoring against `/api/health`, document backup/seed behavior, and deploy only after CI is green.

## 8. Final Verdict

**NOT READY FOR DEPLOYMENT**

The project is a credible working local application, not a deployment-ready release. The frontend build, local frontend startup, backend health, authenticated API path, and ONNX inference are confirmed working. The release is blocked by incomplete user-facing password reset, failed lint/security gates, a failing and leaking backend test suite, and broken default Docker Compose connectivity/configuration. Wait for the fixes above and a green production-like validation run before approving deployment.
