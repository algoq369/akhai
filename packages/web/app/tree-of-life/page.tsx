'use client'

/**
 * AI CONFIG PAGE - Entry Point
 * 
 * Uses the unified AIConfigUnified component which merges:
 * - Configuration tab with compact settings and dual trees
 * - History tab with descent tree history and chat connections
 */

import AIConfigUnified from '@/components/AIConfigUnified'

export default function TreeOfLifePage() {
  return <AIConfigUnified />
}
