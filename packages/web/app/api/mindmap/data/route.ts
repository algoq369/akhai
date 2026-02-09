/**
 * Mind Map Data API
 * Returns topics with relationships for visualization
 *
 * Features:
 * - Filters out topics from large conversations (>50 messages) for performance
 * - Intelligent clustering based on topic similarity and relationships
 * - Category-based grouping
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

// Configuration
// NOTE: Removed conversation size filter - all topics should display regardless of conversation length
const MAX_TOPICS_DISPLAY = 10000  // Maximum topics to show in mind map (increased for full history)
const CLUSTER_THRESHOLD = 0.3   // Similarity threshold for clustering

// Invalid topic patterns (prompts, malformed data)
const INVALID_TOPIC_PATTERNS = [
  /^give\s+exactly/i,
  /^return\s+only/i,
  /^extract\s+\d/i,
  /brief\s+insights/i,
  /json\s+array/i,
  /example:/i,
  /^\{.*\}$/,     // Pure JSON
  /^\[.*\]$/,     // Pure array
  /^```/,         // Code blocks
]

/**
 * Check if a topic name is valid (not a prompt or malformed data)
 */
function isValidTopicName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 100) return false
  for (const pattern of INVALID_TOPIC_PATTERNS) {
    if (pattern.test(name)) return false
  }
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    const effectiveUserId = userId || 'anonymous'

    // Check if topics table exists
    const tablesCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='topics'
    `).all() as Array<{ name: string }>

    if (tablesCheck.length === 0) {
      // Topics table doesn't exist yet - return empty data
      return NextResponse.json({
        nodes: [],
        links: [],
        clusters: [],
      })
    }

    // Migrate NULL user_id topics to current user (one-time migration)
    try {
      db.prepare(`
        UPDATE topics
        SET user_id = ?, updated_at = ?
        WHERE user_id IS NULL
      `).run(effectiveUserId, Math.floor(Date.now() / 1000))
    } catch (migrationError) {
      console.error('Migration error (non-fatal):', migrationError)
    }

    // Get topics with query count, filtering out topics from large conversations
    // This prevents performance issues with very long conversation threads
    let topics: Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      ai_instructions: string | null
      created_at: number
      query_count: number
      max_conversation_size: number
    }> = []

    try {
      // Query all topics for the user (no conversation size filtering)
      topics = db.prepare(`
        SELECT
          t.id,
          t.name,
          t.description,
          t.category,
          t.color,
          t.pinned,
          t.archived,
          t.ai_instructions,
          t.created_at,
          COUNT(DISTINCT qt.query_id) as query_count,
          0 as max_conversation_size
        FROM topics t
        LEFT JOIN query_topics qt ON t.id = qt.topic_id
        WHERE (t.user_id = ? OR t.user_id IS NULL)
        GROUP BY t.id
        ORDER BY t.pinned DESC, query_count DESC, t.created_at DESC
        LIMIT ?
      `).all(effectiveUserId, MAX_TOPICS_DISPLAY) as Array<{
        id: string
        name: string
        description: string | null
        category: string | null
        color: string | null
        pinned: number
        archived: number
        ai_instructions: string | null
        created_at: number
        query_count: number
        max_conversation_size: number
      }>
    } catch (topicsError) {
      console.error('Error fetching topics:', topicsError)
      topics = []
    }

    // Get all relationships
    let relationships: Array<{
      topic_from: string
      topic_to: string
      relationship_type: string
      strength: number
    }> = []

    try {
      relationships = db.prepare(`
        SELECT 
          topic_from,
          topic_to,
          relationship_type,
          strength
        FROM topic_relationships
        WHERE (user_id = ? OR user_id IS NULL)
      `).all(effectiveUserId) as Array<{
        topic_from: string
        topic_to: string
        relationship_type: string
        strength: number
      }>
    } catch (relError) {
      console.error('Error fetching relationships:', relError)
      relationships = []
    }

    // Build nodes, filtering out invalid topic names (prompts, malformed data)
    const nodes = topics
      .filter(t => isValidTopicName(t.name))
      .map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category || 'other',
        color: t.color || '#94a3b8',
        pinned: t.pinned === 1,
        archived: t.archived === 1,
        queryCount: t.query_count,
        ai_instructions: t.ai_instructions,
        cluster: null as string | null, // Will be assigned by clustering
      }))

    // Build links
    const links = relationships.map(r => ({
      source: r.topic_from,
      target: r.topic_to,
      type: r.relationship_type,
      strength: r.strength,
    }))

    // ============================================================================
    // INTELLIGENT CLUSTERING
    // Groups related topics for better visualization
    // ============================================================================
    const clusters = generateClusters(nodes, links, relationships)

    // Assign cluster IDs to nodes
    clusters.forEach(cluster => {
      cluster.nodeIds.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          node.cluster = cluster.id
        }
      })
    })

    const responseData = {
      nodes,
      links,
      clusters,
      meta: {
        totalTopics: topics.length,
        clusterCount: clusters.length,
      },
    }

    // Debug logging
    console.log('[MindMap API] Returning:', {
      topicsReturned: topics.length,
      nodesCount: nodes.length,
      linksCount: links.length,
      clustersCount: clusters.length,
      maxTopicsLimit: MAX_TOPICS_DISPLAY
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Mind map data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mind map data' },
      { status: 500 }
    )
  }
}

// ============================================================================
// CLUSTERING ALGORITHM
// Groups related topics based on:
// 1. Category (primary grouping)
// 2. Relationships (connected topics)
// 3. Name similarity (shared keywords)
// ============================================================================

interface ClusterNode {
  id: string
  name: string
  category: string
  cluster: string | null
}

interface Cluster {
  id: string
  name: string
  category: string
  nodeIds: string[]
  size: number
  color: string
}

const CATEGORY_COLORS: Record<string, string> = {
  business: '#10B981',
  technology: '#6366F1',
  finance: '#F59E0B',
  environment: '#059669',
  psychology: '#8B5CF6',
  infrastructure: '#0EA5E9',
  regulation: '#EC4899',
  engineering: '#D97706',
  social: '#C026D3',
  science: '#0284C7',
  health: '#DB2777',
  education: '#7C3AED',
  other: '#64748B',
}

function generateClusters(
  nodes: ClusterNode[],
  links: Array<{ source: string; target: string; strength: number }>,
  relationships: Array<{ topic_from: string; topic_to: string; strength: number }>
): Cluster[] {
  if (nodes.length === 0) return []

  // Step 1: Group by category first
  const categoryGroups = new Map<string, string[]>()
  nodes.forEach(node => {
    const category = node.category || 'other'
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, [])
    }
    categoryGroups.get(category)!.push(node.id)
  })

  // Step 2: Build adjacency map from relationships
  const adjacency = new Map<string, Set<string>>()
  relationships.forEach(rel => {
    if (!adjacency.has(rel.topic_from)) {
      adjacency.set(rel.topic_from, new Set())
    }
    if (!adjacency.has(rel.topic_to)) {
      adjacency.set(rel.topic_to, new Set())
    }
    adjacency.get(rel.topic_from)!.add(rel.topic_to)
    adjacency.get(rel.topic_to)!.add(rel.topic_from)
  })

  // Step 3: Refine clusters by connectivity within categories
  const clusters: Cluster[] = []
  let clusterIndex = 0

  categoryGroups.forEach((nodeIds, category) => {
    // Find connected components within this category
    const visited = new Set<string>()
    const components: string[][] = []

    nodeIds.forEach(nodeId => {
      if (visited.has(nodeId)) return

      // BFS to find connected component
      const component: string[] = []
      const queue = [nodeId]

      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        component.push(current)

        // Add connected nodes that are in the same category
        const neighbors = adjacency.get(current) || new Set()
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor) && nodeIds.includes(neighbor)) {
            queue.push(neighbor)
          }
        })
      }

      if (component.length > 0) {
        components.push(component)
      }
    })

    // Create clusters from components
    components.forEach(component => {
      // Skip very small clusters (1 node) unless they're pinned
      if (component.length < 2 && components.length > 1) {
        // Merge into largest cluster of same category
        const largestComponent = components.reduce((a, b) =>
          a.length > b.length ? a : b
        )
        if (largestComponent !== component) {
          largestComponent.push(...component)
          return
        }
      }

      const clusterName = generateClusterName(
        component,
        nodes.filter(n => component.includes(n.id))
      )

      clusters.push({
        id: `cluster-${clusterIndex++}`,
        name: clusterName,
        category,
        nodeIds: component,
        size: component.length,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
      })
    })
  })

  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.size - a.size)

  return clusters
}

/**
 * Generate a descriptive name for a cluster based on its nodes
 */
function generateClusterName(nodeIds: string[], nodes: ClusterNode[]): string {
  if (nodes.length === 0) return 'Unnamed Cluster'
  if (nodes.length === 1) return nodes[0].name

  // Find common words in node names
  const wordCounts = new Map<string, number>()
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])

  nodes.forEach(node => {
    const words = node.name.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    uniqueWords.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    })
  })

  // Find most common meaningful word
  let bestWord = ''
  let bestCount = 0
  wordCounts.forEach((count, word) => {
    if (count > bestCount) {
      bestCount = count
      bestWord = word
    }
  })

  if (bestWord && bestCount > 1) {
    // Capitalize first letter
    return bestWord.charAt(0).toUpperCase() + bestWord.slice(1) + ' Topics'
  }

  // Fallback to category name
  const category = nodes[0]?.category || 'other'
  return category.charAt(0).toUpperCase() + category.slice(1) + ' Topics'
}
