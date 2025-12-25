/**
 * Geometric Shape Encoder for Mind Map Topics
 * Encodes topic properties into geometric shapes (circles, triangles, stars)
 * Uses grey tones only for minimalist aesthetic
 */

import { Node } from '../components/MindMap'

export type ShapeType = 'circle' | 'triangle' | 'star'

export interface ShapeConfig {
  type: ShapeType
  size: number
  color: string // Grey tone hex color
}

/**
 * Get shape type for a topic based on its properties
 * Simplified: all topics use circles for clean, simple visualization
 */
export function getShapeForTopic(topic: Node): ShapeType {
  // Simple approach: all topics are circles
  return 'circle'
}

/**
 * Get shape color based on topic properties and insights
 * Uses grey tones: lighter = positive, darker = negative/important
 */
export function getShapeColor(topic: Node, insights?: { sentiment?: number; bias?: number }): string {
  // If insights available, use sentiment to determine shade
  if (insights?.sentiment !== undefined) {
    // Sentiment: -1 to 1, map to grey shades
    // Positive (1) = lighter grey, Negative (-1) = darker grey
    const sentiment = insights.sentiment
    if (sentiment > 0.3) {
      return '#D1D5DB' // light grey (positive)
    } else if (sentiment < -0.3) {
      return '#4B5563' // dark grey (negative)
    } else {
      return '#6B7280' // medium grey (neutral)
    }
  }
  
  // Default: use topic color if set, otherwise medium grey
  return topic.color || '#6B7280'
}

/**
 * Get shape size based on query count and importance
 */
export function getShapeSize(topic: Node): number {
  const baseSize = 20
  const queryMultiplier = Math.min(topic.queryCount / 5, 2) // Max 2x size
  const pinnedMultiplier = topic.pinned ? 1.2 : 1
  
  return baseSize * (1 + queryMultiplier * 0.3) * pinnedMultiplier
}

/**
 * Get complete shape configuration for a topic
 */
export function getShapeConfig(topic: Node, insights?: { sentiment?: number; bias?: number }): ShapeConfig {
  return {
    type: getShapeForTopic(topic),
    size: getShapeSize(topic),
    color: getShapeColor(topic, insights),
  }
}

