# AkhAI — Production Readiness Checklist

Last updated: 2026-04-04

## 1. Health Endpoint

- **Route:** `/api/health`
- **Status:** Active
- **Returns:** JSON with uptime, version, database connectivity

## 2. Monitoring

- **Error tracking:** Sentry (DSN configured in `.env`)
- **Uptime:** UptimeRobot pinging `/api/health` every 60s
- **Analytics:** OpenPanel (privacy-first, self-hostable)

## 3. Database Backup

- **Schedule:** Daily cron via `scripts/backup-db.ts`
- **Storage:** Local backup + rsync to secondary location
- **Retention:** Last 7 daily backups kept

## 4. Rollback Strategy

If a deploy introduces a regression:

```bash
# SSH into the VPS
ssh akhai@82.221.101.3

# Restore the previous build
cp -r /home/akhai/app/packages/web/.next.backup /home/akhai/app/packages/web/.next

# Restart the process
pm2 restart akhai
```

The deploy script automatically creates `.next.backup` before each deploy,
so the last known-good build is always available.

### Manual rollback via git

```bash
# On VPS
cd /home/akhai/app
git log --oneline -5          # find the last good commit
git checkout <commit>         # revert to it
pm2 restart akhai
```

## 5. Deploy Process

1. `pnpm build` locally (fast on M-series Mac)
2. `./deploy/quick-deploy.sh` — builds, backs up `.next`, syncs, restarts PM2
3. Verify: `curl -s https://akhai.app/api/health | jq .`

## 6. Environment Variables

All secrets in `.env.local` on VPS (never committed):
- `ANTHROPIC_API_KEY` — primary AI provider
- `DATABASE_URL` — SQLite path
- `NEXTAUTH_SECRET` — session encryption
- `SENTRY_DSN` — error reporting

## 7. Infrastructure

| Component | Location | Details |
|-----------|----------|---------|
| VPS | Reykjavik, Iceland | 82.221.101.3 |
| Domain | akhai.app | Cloudflare DNS + proxy |
| Process | PM2 | `pm2 restart akhai` |
| Runtime | Node.js 22 | via nvm |
| DB | SQLite | `/home/akhai/app/packages/web/data/akhai.db` |
