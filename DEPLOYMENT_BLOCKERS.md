# Deployment Blockers

Audit/remediation date: 2026-09-06

## Critical Blockers

No unresolved code-level critical blockers remain for controlled staging.

## Must Resolve Before Public Production

1. **Rotate credentials before deployment.** Rotate any JWT, Gemini, database, Cloudinary, Slack, or email credential that may have been exposed. Never copy local `.env` values into a repository or report.
2. **Configure production password-reset delivery.** Set `RESET_EMAIL_MODE=resend`, `RESEND_API_KEY`, `MAIL_FROM`, and `PASSWORD_RESET_URL_BASE`; verify sender/domain configuration and a real inbox.
3. **Configure persistent storage.** Set all Cloudinary variables in production. Uploads intentionally return 503 without them.
4. **Run the Docker runtime smoke test.** Execute `docker compose --env-file .env up --build`, confirm Mongo/backend/frontend health, login, REST, Socket.IO, and nested routes.
5. **Complete browser manual testing.** Use `MANUAL_TESTING_CHECKLIST.md` and record results for protected routes, reset flow, ticket workflows, uploads, exports, and realtime events.
6. **Resolve residual dependency advisories.** Root retains a high transitive PostCSS advisory under Vite; backend retains moderate `qs` advisories through Express 4/body-parser. Upgrade to compatible patched chains or formally accept the risk for a non-public staging deployment.
7. **Run CI on GitHub.** Confirm Node 22, tests, security scans, and the updated lockfiles work on Linux.

## Known Non-Blockers for Staging

- Gemini is optional; local AI fallback remains available for priority prediction and reply drafting.
- Auto-retraining is disabled by default and should remain disabled until a separate worker/job environment exists.
- Eighteen lint warnings remain, primarily React compiler compatibility and hook-dependency warnings. They do not currently prevent build or tests but should be reviewed before a strict quality gate.
- Provider-specific limits, cold starts, and free-tier behavior remain deployment concerns rather than code failures.

## Verdict

**Do not deploy publicly until the seven must-resolve items above are addressed or explicitly accepted by the release owner.**
