# Security checklist

Use before real company deployment.

- Use strong admin password.
- Change `NEXTAUTH_SECRET` to a long random value.
- Keep database private; do not expose it publicly.
- Use HTTPS only in production.
- Use roles: ADMIN, MANAGER, WORKER, VIEWER.
- Do not delete movements; keep history.
- Back up PostgreSQL daily.
- Validate all stock changes on the server.
- Never allow negative stock.
- Do not commit `.env` to GitHub.
