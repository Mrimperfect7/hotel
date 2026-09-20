# Admin Setup & Security Runbook

## Creating the first admin (production)

Admin accounts are **never** seeded from the web UI. On the server:

```bash
ADMIN_EMAIL=admin@yourdomain.com \
ADMIN_PASSWORD='use-a-password-manager' \
ADMIN_NAME='Platform Admin' \
npm run admin:create -w @gsv/database
```

- Password must be ≥ 12 characters; stored as bcrypt (cost 12).
- The command promotes the user to `SUPER_ADMIN` (idempotent — safe to re-run).
- Create per-human ADMIN accounts; reserve `SUPER_ADMIN` for break-glass access.

## Development demo admin

In development only, `npm run db:seed` creates an admin from env vars:

```
DEMO_ADMIN_EMAIL=admin@nammaguruvayoor.test
DEMO_ADMIN_PASSWORD=Admin@12345
```

These variables are placeholders. If they are set in a production environment the
seed is still not run automatically — but delete the env vars anyway to avoid accidents.

## Admin surface

- Web: `https://yourdomain.com/admin` (role-guarded client + server side).
- Separate login? The admin panel sits behind the same auth API but every
  `/api/admin/*` route independently re-checks the role from the **JWT**, so a
  stolen customer token grants nothing. Admin actions additionally require
  `WWW-Authenticate`-proof? — no: they require the `ADMIN`/`SUPER_ADMIN` role claim,
  which is only minted at login for those users.

## What admins can do (and what gets audited)

| Action | Audit entry |
| --- | --- |
| Start review / approve / reject / request changes | `HOTEL_UNDER_REVIEW` / `HOTEL_APPROVED` / `HOTEL_REJECTED` / `HOTEL_CHANGES_REQUESTED` |
| Suspend / deactivate / reactivate | `HOTEL_SUSPENDED` / `HOTEL_DEACTIVATED` / `HOTEL_REACTIVATED` |
| Edit hotel (name, distance, commission, featured) | in the same audit entry metadata |
| Cancel any booking | `BOOKING_CANCELLED` (with `from→to`) |
| Issue full/partial refund | `REFUND_ISSUED` (+ amount, reason) |
| Block/unblock users | `USER_BLOCKED` / `USER_UNBLOCKED` |
| Moderate reviews | `REVIEW_MODERATED` |
| Change platform settings (commission…) | `SETTINGS_UPDATED` (+ patch) |

Every entry stores actor id + role, entity, entity id, IP and timestamp.

## Hardening checklist

- [ ] Rotate `JWT_SECRET` quarterly (invalidates all access tokens; refresh flow recovers sessions).
- [ ] Review `/admin/audit` weekly; alert on `USER_BLOCKED` or `REFUND_ISSUED` spikes.
- [ ] Give admins MFA at the Vercel/infra level (email OTP via identity provider proxy if required).
- [ ] Never share demo credentials from `.env.example`.
