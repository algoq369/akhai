/**
 * Tree Configuration API
 *
 * GET /api/tree-config - Get all configurations for user
 * POST /api/tree-config - Save new configuration
 * PATCH /api/tree-config - Update existing configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/database'
import {
  getAllTreeConfigurations,
  getActiveTreeConfiguration,
  saveTreeConfiguration,
  updateTreeConfiguration,
  setActiveTreeConfiguration,
  getDefaultConfiguration,
} from '@/lib/tree-configuration'

export const runtime = 'nodejs'

/**
 * GET - Fetch all tree configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session token (optional)
    const token = request.cookies.get('session_token')?.value
    const user = token ? validateSession(token) : null
    const userId = user?.id || null

    // Get all available configurations
    const configs = getAllTreeConfigurations(userId)

    // Get active configuration
    const activeConfig = getActiveTreeConfiguration(userId)

    return NextResponse.json({
      configurations: configs,
      active: activeConfig || getDefaultConfiguration(),
    })
  } catch (error) {
    console.error('[Tree Config API] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch configurations',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Save new configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, layerWeights, antipatternSuppression, pillarBalance, processingMode } = body

    // Validate required fields
    if (!name || !layerWeights) {
      return NextResponse.json(
        { error: 'Missing required fields: name, layerWeights' },
        { status: 400 }
      )
    }

    // Get user from session token (optional)
    const token = request.cookies.get('session_token')?.value
    const user = token ? validateSession(token) : null
    const userId = user?.id || null

    // Save configuration
    const configId = saveTreeConfiguration(
      userId,
      name,
      description || '',
      layerWeights,
      antipatternSuppression || {},
      pillarBalance || { left: 0.33, middle: 0.34, right: 0.33 },
      processingMode || 'weighted'
    )

    return NextResponse.json({
      success: true,
      configId,
      message: 'Configuration saved successfully',
    })
  } catch (error) {
    console.error('[Tree Config API] POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update existing configuration or set as active
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { configId, action, updates } = body

    if (!configId) {
      return NextResponse.json({ error: 'Missing configId' }, { status: 400 })
    }

    // Get user from session token (optional)
    const token = request.cookies.get('session_token')?.value
    const user = token ? validateSession(token) : null
    const userId = user?.id || null

    if (action === 'activate') {
      // Set configuration as active
      setActiveTreeConfiguration(configId, userId)
      return NextResponse.json({
        success: true,
        message: 'Configuration activated',
      })
    } else if (action === 'update') {
      // Update configuration fields
      if (!updates) {
        return NextResponse.json({ error: 'Missing updates object' }, { status: 400 })
      }

      updateTreeConfiguration(configId, {
        name: updates.name,
        description: updates.description,
        layerWeights: updates.layerWeights,
        antipatternSuppression: updates.antipatternSuppression,
        pillarBalance: updates.pillarBalance,
        processingMode: updates.processingMode,
      })

      return NextResponse.json({
        success: true,
        message: 'Configuration updated',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "activate" or "update"' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Tree Config API] PATCH error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
