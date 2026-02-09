/**
 * Tree Configuration Database Functions
 *
 * Handles loading, saving, and managing tree configurations
 * for both Layers and Antipatterns weight settings
 */

import { db } from './database'
import { Layer } from './layer-registry'

export interface TreeConfiguration {
  id: number
  user_id: string | null
  name: string
  description: string
  is_active: boolean
  layer_weights: Record<number, number>
  antipattern_suppression: Record<number, number>
  pillar_balance: {
    left: number
    middle: number
    right: number
  }
  processing_mode?: 'weighted' | 'parallel' | 'adaptive' // Layers processing mode
  created_at: number
  updated_at: number
}

/**
 * Get all available tree configurations (presets + user custom)
 */
export function getAllTreeConfigurations(userId?: string | null): TreeConfiguration[] {
  let stmt
  let params: any[] = []

  if (userId) {
    // Get both preset configs (user_id IS NULL) and user's custom configs
    stmt = db.prepare(`
      SELECT *
      FROM tree_configurations
      WHERE user_id IS NULL OR user_id = ?
      ORDER BY user_id IS NULL DESC, name ASC
    `)
    params = [userId]
  } else {
    // Only get preset configs for anonymous users
    stmt = db.prepare(`
      SELECT *
      FROM tree_configurations
      WHERE user_id IS NULL
      ORDER BY name ASC
    `)
  }

  const configs = stmt.all(...params) as Array<{
    id: number
    user_id: string | null
    name: string
    description: string
    is_active: number
    layer_weights: string
    antipattern_suppression: string
    pillar_balance: string
    created_at: number
    updated_at: number
  }>

  return configs.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    name: c.name,
    description: c.description,
    is_active: Boolean(c.is_active),
    layer_weights: JSON.parse(c.layer_weights),
    antipattern_suppression: JSON.parse(c.antipattern_suppression || '{}'),
    pillar_balance: JSON.parse(c.pillar_balance || '{"left":0.33,"middle":0.34,"right":0.33}'),
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))
}

/**
 * Get active tree configuration for a user
 */
export function getActiveTreeConfiguration(userId?: string | null): TreeConfiguration | null {
  let stmt
  let params: any[] = []

  if (userId) {
    stmt = db.prepare(`
      SELECT *
      FROM tree_configurations
      WHERE (user_id IS NULL OR user_id = ?) AND is_active = 1
      ORDER BY user_id IS NOT NULL DESC
      LIMIT 1
    `)
    params = [userId]
  } else {
    // For anonymous users, check if there's a default active config
    stmt = db.prepare(`
      SELECT *
      FROM tree_configurations
      WHERE user_id IS NULL AND is_active = 1
      LIMIT 1
    `)
  }

  const config = stmt.get(...params) as
    | {
        id: number
        user_id: string | null
        name: string
        description: string
        is_active: number
        layer_weights: string
        antipattern_suppression: string
        pillar_balance: string
        created_at: number
        updated_at: number
      }
    | undefined

  if (!config) return null

  return {
    id: config.id,
    user_id: config.user_id,
    name: config.name,
    description: config.description,
    is_active: Boolean(config.is_active),
    layer_weights: JSON.parse(config.layer_weights),
    antipattern_suppression: JSON.parse(config.antipattern_suppression || '{}'),
    pillar_balance: JSON.parse(config.pillar_balance || '{"left":0.33,"middle":0.34,"right":0.33}'),
    created_at: config.created_at,
    updated_at: config.updated_at,
  }
}

/**
 * Get a specific tree configuration by ID
 */
export function getTreeConfiguration(configId: number): TreeConfiguration | null {
  const stmt = db.prepare(`
    SELECT *
    FROM tree_configurations
    WHERE id = ?
  `)

  const config = stmt.get(configId) as
    | {
        id: number
        user_id: string | null
        name: string
        description: string
        is_active: number
        layer_weights: string
        antipattern_suppression: string
        pillar_balance: string
        created_at: number
        updated_at: number
      }
    | undefined

  if (!config) return null

  return {
    id: config.id,
    user_id: config.user_id,
    name: config.name,
    description: config.description,
    is_active: Boolean(config.is_active),
    layer_weights: JSON.parse(config.layer_weights),
    antipattern_suppression: JSON.parse(config.antipattern_suppression || '{}'),
    pillar_balance: JSON.parse(config.pillar_balance || '{"left":0.33,"middle":0.34,"right":0.33}'),
    created_at: config.created_at,
    updated_at: config.updated_at,
  }
}

/**
 * Save a new custom tree configuration
 */
export function saveTreeConfiguration(
  userId: string | null,
  name: string,
  description: string,
  layerWeights: Record<number, number>,
  antipatternSuppression: Record<number, number>,
  pillarBalance: { left: number; middle: number; right: number },
  processingMode: 'weighted' | 'parallel' | 'adaptive' = 'weighted'
): number {
  const stmt = db.prepare(`
    INSERT INTO tree_configurations (
      user_id, name, description, is_active,
      layer_weights, antipattern_suppression, pillar_balance, processing_mode
    ) VALUES (?, ?, ?, 0, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    userId,
    name,
    description,
    JSON.stringify(layerWeights),
    JSON.stringify(antipatternSuppression),
    JSON.stringify(pillarBalance),
    processingMode
  )

  return result.lastInsertRowid as number
}

/**
 * Update an existing tree configuration
 */
export function updateTreeConfiguration(
  configId: number,
  updates: {
    name?: string
    description?: string
    layerWeights?: Record<number, number>
    antipatternSuppression?: Record<number, number>
    pillarBalance?: { left: number; middle: number; right: number }
    processingMode?: 'weighted' | 'parallel' | 'adaptive'
  }
): void {
  const fields: string[] = []
  const values: any[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.layerWeights !== undefined) {
    fields.push('layer_weights = ?')
    values.push(JSON.stringify(updates.layerWeights))
  }
  if (updates.antipatternSuppression !== undefined) {
    fields.push('antipattern_suppression = ?')
    values.push(JSON.stringify(updates.antipatternSuppression))
  }
  if (updates.pillarBalance !== undefined) {
    fields.push('pillar_balance = ?')
    values.push(JSON.stringify(updates.pillarBalance))
  }
  if (updates.processingMode !== undefined) {
    fields.push('processing_mode = ?')
    values.push(updates.processingMode)
  }

  if (fields.length === 0) return

  fields.push('updated_at = strftime(\'%s\', \'now\')')
  values.push(configId)

  const stmt = db.prepare(`
    UPDATE tree_configurations
    SET ${fields.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)
}

/**
 * Set a configuration as active (deactivates all others for that user)
 */
export function setActiveTreeConfiguration(configId: number, userId: string | null): void {
  // Start transaction
  const deactivateStmt = db.prepare(`
    UPDATE tree_configurations
    SET is_active = 0
    WHERE user_id ${userId ? '= ?' : 'IS NULL'}
  `)

  const activateStmt = db.prepare(`
    UPDATE tree_configurations
    SET is_active = 1, updated_at = strftime('%s', 'now')
    WHERE id = ?
  `)

  // Deactivate all configs for this user
  if (userId) {
    deactivateStmt.run(userId)
  } else {
    deactivateStmt.run()
  }

  // Activate the selected config
  activateStmt.run(configId)
}

/**
 * Delete a custom tree configuration
 */
export function deleteTreeConfiguration(configId: number, userId: string): void {
  // Only allow deleting user's own configs (not presets)
  const stmt = db.prepare(`
    DELETE FROM tree_configurations
    WHERE id = ? AND user_id = ?
  `)

  stmt.run(configId, userId)
}

/**
 * Get default balanced configuration
 */
export function getDefaultConfiguration(): TreeConfiguration {
  return {
    id: 0,
    user_id: null,
    name: 'Balanced',
    description: 'Default balanced configuration',
    is_active: false,
    layer_weights: {
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
      6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5,
    },
    antipattern_suppression: {
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5,
      7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5, 12: 0.5,
    },
    pillar_balance: {
      left: 0.33,
      middle: 0.34,
      right: 0.33,
    },
    created_at: 0,
    updated_at: 0,
  }
}

/**
 * Common quick adjustments
 */
export const QUICK_ADJUSTMENTS = {
  reduceSatariel: {
    name: 'Reduce Info Hiding',
    description: 'Diminish Satariel (Concealers) to reveal more sources',
    changes: {
      antipatternSuppression: { 3: 0.8 },
    },
  },
  augmentEncoder: {
    name: 'Augment Understanding',
    description: 'Increase Encoder (Understanding) for deeper analysis',
    changes: {
      layerWeights: { 3: 0.9 },
    },
  },
  suppressThaumiel: {
    name: 'Reduce Overconfidence',
    description: 'Suppress Thaumiel (False Certainty)',
    changes: {
      antipatternSuppression: { 1: 0.9 },
    },
  },
  balanceLogicIntuition: {
    name: 'Logic + Intuition Balance',
    description: 'Equal weight to Reasoning (Wisdom) and Executor (Foundation)',
    changes: {
      layerWeights: { 2: 0.7, 9: 0.7 },
    },
  },
  increaseCompassion: {
    name: 'Increase Compassion',
    description: 'Boost Expansion (Mercy) for empathetic responses',
    changes: {
      layerWeights: { 4: 0.9 },
    },
  },
  suppressA8: {
    name: 'Reduce Rigidity',
    description: 'Suppress A8/Samael (Excessive Severity)',
    changes: {
      antipatternSuppression: { 8: 0.85 },
    },
  },
}

/**
 * Layers Configuration Presets
 * Re-exported from shared lib/layer-presets.ts for backwards compatibility
 */
export { LAYER_PRESETS, PRESET_NAMES, getPresetWeights, getDefaultWeights, type PresetName } from './layer-presets'
