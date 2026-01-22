import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { SEFIROT_PRESETS, PRESET_NAMES, type PresetName } from '@/lib/sefirot-presets'

/**
 * GET /api/tree-config/presets
 *
 * Returns all available presets (built-in + user-saved)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session if available
    const sessionId = request.cookies.get('akhai_session')?.value || null

    // Built-in presets
    const builtInPresets = PRESET_NAMES.map(name => ({
      id: `builtin-${name}`,
      name,
      weights: SEFIROT_PRESETS[name],
      isBuiltIn: true,
      createdAt: null
    }))

    // User-saved presets from database
    let userPresets: any[] = []
    if (sessionId) {
      const stmt = db.prepare(`
        SELECT id, name, sephiroth_weights, created_at
        FROM tree_configurations
        WHERE user_id IS NULL AND session_id = ?
        ORDER BY created_at DESC
      `)
      const rows = stmt.all(sessionId) as any[]
      userPresets = rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        weights: JSON.parse(row.sephiroth_weights),
        isBuiltIn: false,
        createdAt: row.created_at
      }))
    }

    return NextResponse.json({
      presets: [...builtInPresets, ...userPresets],
      total: builtInPresets.length + userPresets.length
    })
  } catch (error) {
    console.error('Presets API error:', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}

/**
 * POST /api/tree-config/presets
 *
 * Create a new user preset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, weights, description } = body

    if (!name || !weights) {
      return NextResponse.json(
        { error: 'Name and weights are required' },
        { status: 400 }
      )
    }

    // Get session ID
    const sessionId = request.cookies.get('akhai_session')?.value || null
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session required to save presets' },
        { status: 401 }
      )
    }

    // Insert new preset
    const stmt = db.prepare(`
      INSERT INTO tree_configurations (
        user_id, session_id, name, description, is_active,
        sephiroth_weights, qliphoth_suppression, pillar_balance
      ) VALUES (?, ?, ?, ?, 0, ?, '{}', '{"left":0.33,"middle":0.34,"right":0.33}')
    `)

    const result = stmt.run(
      null,
      sessionId,
      name,
      description || '',
      JSON.stringify(weights)
    )

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      name,
      weights
    })
  } catch (error) {
    console.error('Presets API error:', error)
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 })
  }
}

/**
 * DELETE /api/tree-config/presets
 *
 * Delete a user preset (query param: id)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || id.startsWith('builtin-')) {
      return NextResponse.json(
        { error: 'Cannot delete built-in presets' },
        { status: 400 }
      )
    }

    const sessionId = request.cookies.get('akhai_session')?.value || null
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session required to delete presets' },
        { status: 401 }
      )
    }

    // Delete preset
    const stmt = db.prepare(`
      DELETE FROM tree_configurations
      WHERE id = ? AND session_id = ?
    `)

    stmt.run(parseInt(id), sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Presets API error:', error)
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
  }
}
