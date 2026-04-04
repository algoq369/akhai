import { generateUUID } from '@/lib/uuid';
/**
 * IMPLEMENTATION TRACKER
 *
 * Tracks all features, tools, and enhancements for validation workflow.
 * Ensures nothing is lost and every implementation is validated before proceeding.
 */

import { db } from './database';

export interface Implementation {
  id: number;
  featureName: string;
  featureType: 'function' | 'tool' | 'app' | 'methodology' | 'enhancement' | 'fix' | 'integration';
  description: string;
  filesCreated: string[];
  filesModified: string[];
  linesAdded: number;
  linesModified: number;
  status: 'pending' | 'testing' | 'validated' | 'reverted';
  validationMessage?: string;
  validatedAt?: number;
  createdAt: number;
  sessionId: string;
  commandUsed?: string;
}

interface ImplementationRow {
  id: number;
  feature_name: string;
  feature_type: Implementation['featureType'];
  description: string;
  files_created: string | null;
  files_modified: string | null;
  lines_added: number;
  lines_modified: number;
  status: Implementation['status'];
  validation_message: string | null;
  validated_at: number | null;
  created_at: number;
  session_id: string;
  command_used: string | null;
}

class ImplementationTracker {
  /**
   * Start tracking a new implementation
   */
  async start(data: {
    featureName: string;
    featureType: Implementation['featureType'];
    description: string;
    sessionId?: string;
    commandUsed?: string;
  }): Promise<number> {
    const sessionId = data.sessionId || generateUUID();
    const stmt = db.prepare(
      'INSERT INTO implementation_log (feature_name, feature_type, description, session_id, command_used) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.featureName,
      data.featureType,
      data.description,
      sessionId,
      data.commandUsed || null
    );
    return result.lastInsertRowid as number;
  }

  /**
   * Update file changes for an implementation
   */
  async updateFiles(
    id: number,
    data: {
      filesCreated?: string[];
      filesModified?: string[];
      linesAdded?: number;
      linesModified?: number;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.filesCreated) {
      updates.push('files_created = ?');
      values.push(JSON.stringify(data.filesCreated));
    }
    if (data.filesModified) {
      updates.push('files_modified = ?');
      values.push(JSON.stringify(data.filesModified));
    }
    if (data.linesAdded !== undefined) {
      updates.push('lines_added = ?');
      values.push(data.linesAdded);
    }
    if (data.linesModified !== undefined) {
      updates.push('lines_modified = ?');
      values.push(data.linesModified);
    }

    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(
        'UPDATE implementation_log SET ' + updates.join(', ') + ' WHERE id = ?'
      );
      stmt.run(...values);
    }
  }

  /**
   * Mark implementation as testing
   */
  async markTesting(id: number): Promise<void> {
    const stmt = db.prepare('UPDATE implementation_log SET status = ? WHERE id = ?');
    stmt.run('testing', id);
  }

  /**
   * Validate an implementation
   */
  async validate(id: number, message: string = 'Validated'): Promise<void> {
    const stmt = db.prepare(
      "UPDATE implementation_log SET status = ?, validation_message = ?, validated_at = strftime('%s', 'now') WHERE id = ?"
    );
    stmt.run('validated', message, id);
  }

  /**
   * Revert an implementation
   */
  async revert(id: number, reason: string): Promise<void> {
    const stmt = db.prepare(
      'UPDATE implementation_log SET status = ?, validation_message = ? WHERE id = ?'
    );
    stmt.run('reverted', reason, id);
  }

  /**
   * Get a specific implementation
   */
  async get(id: number): Promise<Implementation | null> {
    const stmt = db.prepare('SELECT * FROM implementation_log WHERE id = ?');
    const row = stmt.get(id) as ImplementationRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get the latest implementation
   */
  async getLatest(): Promise<Implementation | null> {
    const stmt = db.prepare('SELECT * FROM implementation_log ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get() as ImplementationRow | undefined;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all pending implementations
   */
  async getPending(): Promise<Implementation[]> {
    const stmt = db.prepare(
      "SELECT * FROM implementation_log WHERE status IN ('pending', 'testing') ORDER BY created_at DESC"
    );
    const rows = stmt.all() as ImplementationRow[];
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get session progress
   */
  async getSessionProgress(sessionId: string): Promise<Implementation[]> {
    const stmt = db.prepare(
      'SELECT * FROM implementation_log WHERE session_id = ? ORDER BY created_at'
    );
    const rows = stmt.all(sessionId) as ImplementationRow[];
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get progress statistics
   */
  async getProgress(): Promise<{
    total: number;
    validated: number;
    pending: number;
    testing: number;
    reverted: number;
    byType: Record<string, number>;
  }> {
    const statsStmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'testing' THEN 1 ELSE 0 END) as testing,
        SUM(CASE WHEN status = 'reverted' THEN 1 ELSE 0 END) as reverted
      FROM implementation_log
    `);
    const stats = statsStmt.get() as
      | { total: number; validated: number; pending: number; testing: number; reverted: number }
      | undefined;

    const byTypeStmt = db.prepare(`
      SELECT feature_type, COUNT(*) as count
      FROM implementation_log
      WHERE status = 'validated'
      GROUP BY feature_type
    `);
    const byTypeRows = byTypeStmt.all() as Array<{ feature_type: string; count: number }>;
    const byType: Record<string, number> = {};
    byTypeRows.forEach((row) => {
      byType[row.feature_type] = row.count;
    });

    return {
      total: stats?.total || 0,
      validated: stats?.validated || 0,
      pending: stats?.pending || 0,
      testing: stats?.testing || 0,
      reverted: stats?.reverted || 0,
      byType,
    };
  }

  /**
   * Get all implementations (limited)
   */
  async getAll(limit: number = 50): Promise<Implementation[]> {
    const stmt = db.prepare('SELECT * FROM implementation_log ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as ImplementationRow[];
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Map database row to Implementation interface
   */
  private mapRow(row: ImplementationRow): Implementation {
    return {
      id: row.id,
      featureName: row.feature_name,
      featureType: row.feature_type,
      description: row.description,
      filesCreated: JSON.parse(row.files_created || '[]'),
      filesModified: JSON.parse(row.files_modified || '[]'),
      linesAdded: row.lines_added || 0,
      linesModified: row.lines_modified || 0,
      status: row.status,
      validationMessage: row.validation_message ?? undefined,
      validatedAt: row.validated_at ?? undefined,
      createdAt: row.created_at,
      sessionId: row.session_id,
      commandUsed: row.command_used ?? undefined,
    };
  }
}

export const tracker = new ImplementationTracker();
