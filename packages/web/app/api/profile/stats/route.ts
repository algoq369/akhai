import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = getUserFromSession(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user points and stats
    const userPoints = db.prepare(`
      SELECT * FROM user_points WHERE user_id = ?
    `).get(user.id) as any

    // Get methodology breakdown
    const methodologyStats = db.prepare(`
      SELECT flow as methodology, COUNT(*) as count, SUM(tokens_used) as tokens, SUM(cost) as cost
      FROM queries
      WHERE user_id = ?
      GROUP BY flow
      ORDER BY count DESC
    `).all(user.id) as any[]

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
    const recentActivity = db.prepare(`
      SELECT
        DATE(created_at, 'unixepoch') as date,
        COUNT(*) as queries,
        SUM(tokens_used) as tokens,
        SUM(cost) as cost
      FROM queries
      WHERE user_id = ? AND created_at > ?
      GROUP BY DATE(created_at, 'unixepoch')
      ORDER BY date DESC
      LIMIT 30
    `).all(user.id, thirtyDaysAgo) as any[]

    // Calculate development level based on points
    let developmentLevel = 1
    let pointsForNextLevel = 100

    if (userPoints) {
      const totalPoints = userPoints.total_points || 0
      // Level system: 100 points for level 2, 250 for level 3, 500 for level 4, etc.
      if (totalPoints >= 5000) developmentLevel = 10
      else if (totalPoints >= 2500) developmentLevel = 9
      else if (totalPoints >= 1000) developmentLevel = 8
      else if (totalPoints >= 500) developmentLevel = 7
      else if (totalPoints >= 250) developmentLevel = 6
      else if (totalPoints >= 100) developmentLevel = 5
      else if (totalPoints >= 50) developmentLevel = 4
      else if (totalPoints >= 25) developmentLevel = 3
      else if (totalPoints >= 10) developmentLevel = 2
      else developmentLevel = 1

      // Calculate points needed for next level
      const levelThresholds = [0, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
      pointsForNextLevel = levelThresholds[developmentLevel] || 10000
    }

    // Update development level in database
    if (userPoints && userPoints.development_level !== developmentLevel) {
      db.prepare(`
        UPDATE user_points
        SET development_level = ?, updated_at = strftime('%s', 'now')
        WHERE user_id = ?
      `).run(developmentLevel, user.id)
    }

    return NextResponse.json({
      stats: userPoints || {
        user_id: user.id,
        total_points: 0,
        development_level: 1,
        queries_completed: 0,
        tokens_consumed: 0,
        cost_spent: 0,
      },
      developmentLevel,
      pointsForNextLevel,
      methodologyStats,
      recentActivity,
    })
  } catch (error) {
    console.error('[Profile Stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
