#!/bin/bash
# ============================================================
# AkhAI — Configure Caddy for HTTPS (run on VPS as root)
# Usage: ./setup-domain.sh akhai.dev
# ============================================================
set -e

DOMAIN="${1:?Usage: ./setup-domain.sh <domain>}"

echo "━━━ Setting up HTTPS for $DOMAIN ━━━"

# Write Caddy config
cat > /etc/caddy/Caddyfile << EOF
$DOMAIN {
    reverse_proxy localhost:3000

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    }

    encode gzip

    log {
        output file /var/log/caddy/akhai.log
        format json
    }
}
EOF

mkdir -p /var/log/caddy
systemctl restart caddy
systemctl enable caddy

echo ""
echo "━━━ Done! ━━━"
echo "Caddy will auto-provision SSL for $DOMAIN"
echo "Make sure DNS A record points $DOMAIN → $(curl -s ifconfig.me)"
