/**
 * XP SYSTEM — DATABASE OPERATIONS
 *
 * Persistence layer for Wisdom Points: profile CRUD, transaction log,
 * and leaderboard queries.
 *
 * @module xp-system-db
 */

import { db } from './database';
import type { WisdomProfile, PointTransaction } from './xp-system';
import { WisdomLevel } from './xp-system';

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export async function loadWisdomProfile(userId: string): Promise<WisdomProfile | null> {
  try {
    const row = (await db
      .prepare(
        `
      SELECT * FROM user_wisdom_points WHERE user_id = ?
    `
      )
      .get(userId)) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      totalPoints: row.total_points || 0,
      currentLevel: row.current_level || WisdomLevel.EMBEDDING_SEEKER,

      discovery: JSON.parse(row.discovery_points || '{}'),
      contribution: JSON.parse(row.contribution_points || '{}'),
      research: JSON.parse(row.research_points || '{}'),
      tournament: JSON.parse(row.tournament_points || '{}'),
      exploration: JSON.parse(row.exploration_points || '{}'),

      dailyPoints: row.daily_points || 0,
      weeklyPoints: row.weekly_points || 0,
      monthlyPoints: row.monthly_points || 0,

      currentStreak: row.current_streak || 0,
      longestStreak: row.longest_streak || 0,
      lastActiveDate: row.last_active_date ? new Date(row.last_active_date) : null,

      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } catch (error) {
    console.warn('[WisdomPoints] Failed to load profile:', error);
    return null;
  }
}

export async function saveWisdomProfile(profile: WisdomProfile): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO user_wisdom_points (
        id, user_id, total_points, current_level,
        discovery_points, contribution_points, research_points,
        tournament_points, exploration_points,
        daily_points, weekly_points, monthly_points,
        current_streak, longest_streak, last_active_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        total_points = excluded.total_points,
        current_level = excluded.current_level,
        discovery_points = excluded.discovery_points,
        contribution_points = excluded.contribution_points,
        research_points = excluded.research_points,
        tournament_points = excluded.tournament_points,
        exploration_points = excluded.exploration_points,
        daily_points = excluded.daily_points,
        weekly_points = excluded.weekly_points,
        monthly_points = excluded.monthly_points,
        current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_active_date = excluded.last_active_date,
        updated_at = excluded.updated_at
    `
      )
      .run(
        profile.id,
        profile.userId,
        profile.totalPoints,
        profile.currentLevel,
        JSON.stringify(profile.discovery),
        JSON.stringify(profile.contribution),
        JSON.stringify(profile.research),
        JSON.stringify(profile.tournament),
        JSON.stringify(profile.exploration),
        profile.dailyPoints,
        profile.weeklyPoints,
        profile.monthlyPoints,
        profile.currentStreak,
        profile.longestStreak,
        profile.lastActiveDate?.toISOString() || null,
        profile.createdAt.toISOString(),
        profile.updatedAt.toISOString()
      );
  } catch (error) {
    console.warn('[WisdomPoints] Failed to save profile:', error);
  }
}

export async function savePointTransaction(transaction: PointTransaction): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO point_transactions (
        id, user_id, points, category, action, description,
        multiplier, streak_bonus, related_entity_type, related_entity_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        transaction.id,
        transaction.userId,
        transaction.points,
        transaction.category,
        transaction.action,
        transaction.description,
        transaction.multiplier,
        transaction.streakBonus,
        transaction.relatedEntityType || null,
        transaction.relatedEntityId || null,
        transaction.createdAt.toISOString()
      );
  } catch (error) {
    console.warn('[WisdomPoints] Failed to save transaction:', error);
  }
}

export async function getPointTransactions(
  userId: string,
  limit: number = 50
): Promise<PointTransaction[]> {
  try {
    const rows = (await db
      .prepare(
        `
      SELECT * FROM point_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(userId, limit)) as any[];

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      points: row.points,
      category: row.category,
      action: row.action,
      description: row.description,
      multiplier: row.multiplier,
      streakBonus: row.streak_bonus,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    console.warn('[WisdomPoints] Failed to get transactions:', error);
    return [];
  }
}

export async function getLeaderboard(
  type: 'global' | 'weekly' | 'monthly' = 'global',
  limit: number = 100
): Promise<{ userId: string; points: number; level: WisdomLevel; rank: number }[]> {
  try {
    let orderColumn = 'total_points';
    if (type === 'weekly') orderColumn = 'weekly_points';
    if (type === 'monthly') orderColumn = 'monthly_points';

    const rows = (await db
      .prepare(
        `
      SELECT user_id, ${orderColumn} as points, current_level
      FROM user_wisdom_points
      ORDER BY ${orderColumn} DESC
      LIMIT ?
    `
      )
      .all(limit)) as any[];

    return rows.map((row, index) => ({
      userId: row.user_id,
      points: row.points,
      level: row.current_level,
      rank: index + 1,
    }));
  } catch (error) {
    console.warn('[WisdomPoints] Failed to get leaderboard:', error);
    return [];
  }
}
