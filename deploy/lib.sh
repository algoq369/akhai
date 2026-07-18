#!/usr/bin/env bash
# ============================================================
# AkhAI deploy — shared configuration + helpers (B7 deploy-harden)
#
# Every deploy script sources this file. Resolution order (last wins):
#   1. Defaults below            — today's FlokiNET deploy, unchanged
#   2. deploy/deploy.env         — gitignored, one file to edit for a host move
#   3. Environment variables     — DEPLOY_HOST=1.2.3.4 ./quick-deploy-standalone.sh
#   4. CLI flags                 — --host=1.2.3.4 --app-dir=/srv/akhai --dry-run
#
# A migration (e.g. FlokiNET -> Hetzner) = copy deploy.env.example to
# deploy.env, edit values, run the same scripts with zero code edits.
# ============================================================

DEPLOY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DEPLOY_LIB_DIR/.." && pwd)"

# ---- 2. optional per-host config file (gitignored) ----
# shellcheck disable=SC1091
[ -f "$DEPLOY_LIB_DIR/deploy.env" ] && . "$DEPLOY_LIB_DIR/deploy.env"

# ---- 1+3. defaults (today's working FlokiNET values), env-overridable ----
: "${DEPLOY_HOST:=82.221.101.3}"          # VPS IP or hostname
: "${DEPLOY_USER:=akhai}"                 # ssh + app user on the VPS
: "${APP_DIR:=/home/akhai/app}"           # legacy pnpm tree (holds env + data today)
: "${STANDALONE_DIR:=/home/akhai/app-standalone}"  # standalone runtime target
: "${DATA_DIR:=/home/akhai/app/packages/web/data}" # sqlite data — NEVER wiped by a deploy
: "${CACHE_DIR:=/home/akhai/app/packages/web/.cache}" # transformers model cache — persisted
: "${HOST_ENV_FILE:=/home/akhai/app/packages/web/.env.local}" # the host's real secrets file
: "${APP_PORT:=3000}"                     # production port (Caddy proxies to this)
: "${VERIFY_PORT:=3001}"                  # side-by-side boot-verify port
: "${PM2_NAME:=akhai}"                    # production PM2 app name
: "${PM2_VERIFY_NAME:=akhai-next}"        # staging/verify PM2 app name
: "${DOMAIN:=}"                           # e.g. akhai.app (setup-domain.sh)
: "${NODE_MAJOR:=20}"                     # Node major installed by setup-vps.sh
: "${PNPM_VERSION:=8.15.0}"               # pnpm pinned by setup-vps.sh
: "${MIN_FREE_MB:=1024}"                  # preflight: minimum free disk on the VPS
: "${DRY_RUN:=0}"

# ---- 4. CLI flags (call: parse_deploy_flags "$@"; set -- "${DEPLOY_ARGS[@]}") ----
DEPLOY_ARGS=()
parse_deploy_flags() {
  DEPLOY_ARGS=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --host=*) DEPLOY_HOST="${1#*=}" ;;
      --user=*) DEPLOY_USER="${1#*=}" ;;
      --app-dir=*) APP_DIR="${1#*=}" ;;
      --standalone-dir=*) STANDALONE_DIR="${1#*=}" ;;
      --data-dir=*) DATA_DIR="${1#*=}" ;;
      --cache-dir=*) CACHE_DIR="${1#*=}" ;;
      --env-file=*) HOST_ENV_FILE="${1#*=}" ;;
      --port=*) APP_PORT="${1#*=}" ;;
      --verify-port=*) VERIFY_PORT="${1#*=}" ;;
      --pm2-name=*) PM2_NAME="${1#*=}" ;;
      --domain=*) DOMAIN="${1#*=}" ;;
      --dry-run) DRY_RUN=1 ;;
      *) DEPLOY_ARGS+=("$1") ;;
    esac
    shift
  done
}

SSH_TARGET() { printf '%s@%s' "$DEPLOY_USER" "$DEPLOY_HOST"; }

print_config() {
  cat <<CFG
── deploy config (defaults ← deploy.env ← env ← flags) ──
  DEPLOY_HOST=$DEPLOY_HOST  DEPLOY_USER=$DEPLOY_USER
  APP_DIR=$APP_DIR
  STANDALONE_DIR=$STANDALONE_DIR
  DATA_DIR=$DATA_DIR
  CACHE_DIR=$CACHE_DIR
  HOST_ENV_FILE=$HOST_ENV_FILE
  APP_PORT=$APP_PORT  VERIFY_PORT=$VERIFY_PORT  PM2_NAME=$PM2_NAME  PM2_VERIFY_NAME=$PM2_VERIFY_NAME
  DRY_RUN=$DRY_RUN
CFG
}

# run <cmd...>       — local command; printed always, executed unless dry-run
run() {
  printf 'RUN  %s\n' "$*"
  [ "$DRY_RUN" = "1" ] && return 0
  "$@"
}

# run_ssh <script-string> — remote script over ssh; printed resolved, executed unless dry-run
run_ssh() {
  printf 'SSH  %s <<REMOTE\n%s\nREMOTE\n' "$(SSH_TARGET)" "$1"
  [ "$DRY_RUN" = "1" ] && return 0
  ssh -o StrictHostKeyChecking=no "$(SSH_TARGET)" bash -s <<<"$1"
}

die() { printf '✗ %s\n' "$*" >&2; exit 1; }
