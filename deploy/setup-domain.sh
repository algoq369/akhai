#!/bin/bash
# ============================================================
# AkhAI — Configure Caddy for HTTPS (run on VPS as root)
# Usage: ./setup-domain.sh <domain> [--port=P] [--dry-run]
# Config: deploy/lib.sh defaults ← deploy/deploy.env ← env ← flags
# ============================================================
set -e

# shellcheck source=deploy/lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
parse_deploy_flags "$@"
[ ${#DEPLOY_ARGS[@]} -ge 1 ] && DOMAIN="${DEPLOY_ARGS[0]}"
[ -n "$DOMAIN" ] || die "Usage: ./setup-domain.sh <domain> (or set DOMAIN in deploy/deploy.env)"

echo "━━━ Setting up HTTPS for $DOMAIN (→ localhost:$APP_PORT) ━━━"

CADDYFILE_CONTENT="$DOMAIN {
    reverse_proxy localhost:$APP_PORT

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Permissions-Policy \"camera=(), microphone=(), geolocation=()\"
        Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\"
    }

    encode gzip

    log {
        output file /var/log/caddy/$PM2_NAME.log
        format json
    }
}"

if [ "$DRY_RUN" = "1" ]; then
  echo "RUN  write /etc/caddy/Caddyfile:"
  echo "$CADDYFILE_CONTENT"
else
  echo "$CADDYFILE_CONTENT" > /etc/caddy/Caddyfile
fi

run mkdir -p /var/log/caddy
run systemctl restart caddy
run systemctl enable caddy

echo ""
echo "━━━ Done! ━━━"
echo "Caddy will auto-provision SSL for $DOMAIN"
echo "Make sure DNS A record points $DOMAIN → $(curl -s ifconfig.me)"
