#!/bin/bash
# ============================================================
# AkhAI — Database Backup (runs daily via cron)
# Setup: crontab -e → 0 3 * * * /home/akhai/app/scripts/backup-db.sh
# ============================================================

BACKUP_DIR="/home/akhai/backups"
DB_PATH="/home/akhai/app/packages/web/data/akhai.db"
DATE=$(date +%Y-%m-%d_%H%M)
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

# SQLite safe backup (handles WAL mode)
if [ -f "$DB_PATH" ]; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/akhai_$DATE.db'"
  
  if [ $? -eq 0 ]; then
    gzip "$BACKUP_DIR/akhai_$DATE.db"
    echo "[$(date)] Backup OK: akhai_$DATE.db.gz"
  else
    echo "[$(date)] ERROR: Backup failed"
    exit 1
  fi
  
  # Delete backups older than KEEP_DAYS
  find "$BACKUP_DIR" -name "akhai_*.db.gz" -mtime +$KEEP_DAYS -delete
  echo "[$(date)] Cleanup: removed backups older than $KEEP_DAYS days"
else
  echo "[$(date)] ERROR: Database not found at $DB_PATH"
  exit 1
fi
