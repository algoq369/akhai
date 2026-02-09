#!/bin/bash
# Load ANTHROPIC_API_KEY from .env.local and start Next.js dev server
# Usage: ./dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "Loaded env from .env.local"
else
  echo "Warning: .env.local not found at $ENV_FILE"
fi

exec npx next dev -p 3000
