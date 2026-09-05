# Manual Testing Checklist

Use this checklist against a running local or staging deployment. Record PASS, FAIL, or BLOCKED beside each item and capture the URL/environment used.

## Setup

1. Start MongoDB and backend with a non-production test database.
2. Configure `JWT_SECRET` and `PASSWORD_RESET_URL_BASE`.
3. Configure Cloudinary for upload tests.
4. Configure Resend only for a real email-delivery test; never paste secrets into source files.
5. Start the frontend with `VITE_API_BASE_URL` and `VITE_SOCKET_URL` pointing to the backend.
6. Use seeded admin and agent accounts only in a private test environment.

## Authentication

- [ ] Open `/login`; confirm the form loads without console errors.
- [ ] Log in with valid admin credentials; confirm redirect to dashboard.
- [ ] Refresh a protected route; confirm the session remains valid.
- [ ] Log out; confirm token removal and redirect behavior.
- [ ] Attempt login with a wrong password; confirm a generic error.
- [ ] Register a new user with a valid password; confirm account creation.
- [ ] Register with a weak password; confirm field-level validation.
- [ ] Request a password reset for an unknown email; confirm generic response.
- [ ] Request a reset for a known email in development; open the displayed development link.
- [ ] Request a reset for a known email in production; confirm the email arrives and contains the correct frontend URL.
- [ ] Submit a weak reset password; confirm it is rejected.
- [ ] Submit a valid reset password; confirm login works with the new password.
- [ ] Reuse the same reset token; confirm it is rejected.
- [ ] Use an expired token; confirm it is rejected.

## Authorization

- [ ] Agent can read allowed tickets.
- [ ] Agent cannot access admin-only user/team/model routes.
- [ ] Manager can access manager-authorized routes.
- [ ] Viewer restrictions match the intended product policy.
- [ ] An unauthenticated request to a protected endpoint returns 401.
- [ ] A request from an unauthorized frontend origin is rejected by CORS.

## Tickets

- [ ] Create a ticket with required fields.
- [ ] Submit an invalid ticket; confirm validation feedback.
- [ ] Confirm priority prediction appears and fallback works with Gemini disabled.
- [ ] Open ticket details directly and refresh the nested URL.
- [ ] Edit title, description, priority, status, assignee, and team.
- [ ] Add a comment and confirm it persists after refresh.
- [ ] Search tickets and confirm results are scoped correctly.
- [ ] Filter by status, priority, team, and assignee.
- [ ] Open similar tickets.
- [ ] Export CSV and executive PDF; confirm files download correctly.
- [ ] Delete a ticket only with an authorized account.
- [ ] Confirm audit activity is created for mutating actions.

## Uploads

- [ ] Upload each supported valid file type below 10 MB.
- [ ] Attempt an unsupported extension or MIME type; confirm rejection.
- [ ] Attempt a file over 10 MB; confirm rejection.
- [ ] With Cloudinary unset in production, confirm upload returns a clear 503 and no local file is accepted.
- [ ] With Cloudinary configured, upload an attachment and confirm a secure Cloudinary URL is stored.
- [ ] Restart the backend and confirm the attachment remains retrievable.
- [ ] Attempt path traversal in a retrieval filename; confirm rejection or not-found behavior.

## AI and model

- [ ] Open model health as admin/manager; confirm loaded model status.
- [ ] Run priority suggestion with Gemini disabled; confirm local fallback.
- [ ] Run draft reply with Gemini disabled; confirm fallback response.
- [ ] Run chat without Gemini configured; confirm clear configuration error.
- [ ] Run chat with Gemini configured and verify no secrets appear in logs/UI.
- [ ] Run explainability and metrics with an authorized role.
- [ ] Verify unauthorized roles cannot trigger retraining or model administration.

## Realtime

- [ ] Open two authenticated browser sessions in the same team.
- [ ] Create/update a ticket in one session.
- [ ] Confirm the other session receives the Socket.IO update.
- [ ] Confirm the browser connects to the configured backend origin, not the frontend origin in split deployment.
- [ ] Stop/restart the backend and confirm the client reconnects.
- [ ] Test after a free-host cold start and confirm the UI recovers from the initial delay.

## Health and deployment

- [ ] `GET /api/health` returns 200 with `ready: true` when MongoDB is connected.
- [ ] Stop MongoDB and confirm health returns 503 with no sensitive details.
- [ ] Confirm backend startup logs do not print secrets or tokens.
- [ ] Confirm HTTPS enforcement works behind the configured proxy.
- [ ] Run `docker compose config` with `.env`.
- [ ] Run `docker compose up --build`.
- [ ] Confirm MongoDB, backend, and frontend health checks pass.
- [ ] Open `http://localhost:3000`, log in, call REST APIs, and test Socket.IO.
- [ ] Refresh `/tickets`, `/settings`, and `/tickets/<id>` directly.
- [ ] Confirm browser console has no CORS, mixed-content, or WebSocket errors.

## Sign-off

Environment: ____________________

Tester/date: ____________________

Result: PASS / FAIL / BLOCKED

Open issues: ____________________
