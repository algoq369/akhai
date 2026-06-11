# AkhAI Guard Service — deploy (one-time, ~10 min)
Box: any EU 2 vCPU / 4GB (Hetzner CX22 ~€4/mo). Ubuntu 24.04.

    adduser --system --group guard && mkdir -p /opt/akhai-guard && chown guard /opt/akhai-guard
    cd /opt/akhai-guard && cp main.py requirements.txt .   # rsync from repo guard-service/
    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first run downloads model (~600MB)
    cp akhai-guard.service /etc/systemd/system/ && sed -i s/CHANGE_ME/<random-64-hex>/ /etc/systemd/system/akhai-guard.service
    systemctl daemon-reload && systemctl enable --now akhai-guard
    ufw allow from <FLOKINET_VPS_IP> to any port 8731 proto tcp   # VPS-only access

Then on the FlokiNET VPS .env.local:
    GUARD_NLI_URL=http://<guard-box-ip>:8731
    GUARD_NLI_TOKEN=<same token>
No env set = feature silently off (engine emits nothing). Bench: p50 ~227ms (M3) / ~0.8s budget vCPU; async hook absorbs it.
