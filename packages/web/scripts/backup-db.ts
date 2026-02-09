#!/usr/bin/env tsx
/**
 * Database Backup Script
 *
 * Creates timestamped backups of the AkhAI SQLite database.
 * Keeps last 7 backups by default (configurable).
 *
 * Usage:
 *   pnpm tsx scripts/backup-db.ts
 *   # or
 *   npx tsx scripts/backup-db.ts
 *
 * Environment:
 *   BACKUP_KEEP_COUNT=7  # Number of backups to retain (default: 7)
 *
 * For daily backups, add to crontab:
 *   0 2 * * * cd /path/to/akhai/packages/web && npx tsx scripts/backup-db.ts
 */

import fs from 'fs';
import path from 'path';

// Configuration
const KEEP_COUNT = parseInt(process.env.BACKUP_KEEP_COUNT || '7', 10);
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'akhai.db');
const WAL_FILE = path.join(DATA_DIR, 'akhai.db-wal');
const SHM_FILE = path.join(DATA_DIR, 'akhai.db-shm');

// Generate timestamp for backup filename
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Create backup
function createBackup(): string | null {
  // Check if database exists
  if (!fs.existsSync(DB_FILE)) {
    console.log('[Backup] No database found at:', DB_FILE);
    return null;
  }

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('[Backup] Created backup directory:', BACKUP_DIR);
  }

  const timestamp = getTimestamp();
  const backupName = `akhai-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    // Copy main database file
    fs.copyFileSync(DB_FILE, backupPath);
    console.log(`[Backup] Created: ${backupName}`);

    // Copy WAL file if exists (for consistency)
    if (fs.existsSync(WAL_FILE)) {
      fs.copyFileSync(WAL_FILE, `${backupPath}-wal`);
      console.log(`[Backup] Included WAL file`);
    }

    // Get backup size
    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[Backup] Size: ${sizeMB} MB`);

    return backupPath;
  } catch (error) {
    console.error('[Backup] Error creating backup:', error);
    return null;
  }
}

// Clean old backups (keep most recent KEEP_COUNT)
function cleanOldBackups(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }

  try {
    // Get all backup files sorted by modification time
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('akhai-') && f.endsWith('.db') && !f.includes('-wal') && !f.includes('-shm'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    console.log(`[Backup] Found ${backups.length} existing backups`);

    // Remove old backups beyond KEEP_COUNT
    if (backups.length > KEEP_COUNT) {
      const toDelete = backups.slice(KEEP_COUNT);
      console.log(`[Backup] Removing ${toDelete.length} old backups (keeping ${KEEP_COUNT})`);

      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        // Also remove associated WAL/SHM files
        const walPath = `${backup.path}-wal`;
        const shmPath = `${backup.path}-shm`;
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
        console.log(`[Backup] Deleted: ${backup.name}`);
      }
    }
  } catch (error) {
    console.error('[Backup] Error cleaning old backups:', error);
  }
}

// List current backups
function listBackups(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('[Backup] No backups found');
    return;
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('akhai-') && f.endsWith('.db') && !f.includes('-wal') && !f.includes('-shm'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        date: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  console.log(`\n[Backup] Current backups (${backups.length}):`);
  for (const backup of backups) {
    console.log(`  ${backup.date.slice(0, 19)} | ${backup.size.padStart(8)} MB | ${backup.name}`);
  }
}

// Main
console.log('=== AkhAI Database Backup ===');
console.log(`[Backup] Database: ${DB_FILE}`);
console.log(`[Backup] Backup dir: ${BACKUP_DIR}`);
console.log(`[Backup] Retention: ${KEEP_COUNT} backups\n`);

const backupPath = createBackup();

if (backupPath) {
  cleanOldBackups();
  listBackups();
  console.log('\n[Backup] Backup completed successfully');
} else {
  console.log('\n[Backup] Backup failed or skipped');
  process.exit(1);
}
