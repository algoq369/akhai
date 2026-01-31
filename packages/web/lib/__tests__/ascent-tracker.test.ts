import { describe, it, expect } from 'vitest'
import {
  SEPHIROTH_METADATA,
  detectQueryLevel,
  trackAscent,
  getPathBetweenLevels,
  calculateAscentVelocity,
  getSefirahColor,
  type Sefirah,
  type AscentState,
} from '../ascent-tracker'

describe('Ascent Tracker System', () => {
  describe('SEPHIROTH_METADATA', () => {
    it('contains all 11 Sephiroth', () => {
      const sephirothKeys = Object.keys(SEPHIROTH_METADATA)
      expect(sephirothKeys.length).toBe(11)
    })

    it('has valid metadata for each Sefirah', () => {
      Object.values(SEPHIROTH_METADATA).forEach((metadata) => {
        expect(metadata.name).toBeDefined()
        expect(metadata.hebrewName).toBeDefined()
        expect(metadata.level).toBeGreaterThanOrEqual(1)
        expect(metadata.level).toBeLessThanOrEqual(11)
        expect(metadata.aiRole).toBeDefined()
        expect(metadata.pillar).toMatch(/left|middle|right/)
      })
    })

    it('has unique levels for each Sefirah', () => {
      const levels = Object.values(SEPHIROTH_METADATA).map(m => m.level)
      const uniqueLevels = new Set(levels)
      expect(uniqueLevels.size).toBe(11)
    })
  })

  describe('detectQueryLevel', () => {
    it('detects simple queries as Malkuth (1)', () => {
      const query = 'What is 2 + 2?'
      const level = detectQueryLevel(query)
      expect(level).toBe(1) // Malkuth - Data Layer
    })

    it('detects complex queries as higher levels', () => {
      const query = 'How can we integrate quantum computing principles with machine learning to solve multi-dimensional optimization problems?'
      const level = detectQueryLevel(query)
      expect(level).toBeGreaterThan(5)
    })

    it('detects meta-cognitive queries as Kether (10)', () => {
      const query = 'How should I think about thinking about this problem? What are the meta-cognitive strategies for approaching complex philosophical questions?'
      const level = detectQueryLevel(query)
      expect(level).toBeGreaterThanOrEqual(9)
    })

    it('returns valid Sefirah (1-11)', () => {
      const queries = [
        'Quick question',
        'Explain the concept of consciousness',
        'What is the meaning of life, the universe, and everything?',
      ]

      queries.forEach(query => {
        const level = detectQueryLevel(query)
        expect(level).toBeGreaterThanOrEqual(1)
        expect(level).toBeLessThanOrEqual(11)
      })
    })
  })

  describe('trackAscent', () => {
    it('creates initial ascent state', () => {
      const sessionId = 'test-session'
      const query = 'Test query'
      const state = trackAscent(sessionId, query)

      expect(state.currentLevel).toBeGreaterThanOrEqual(1)
      expect(state.currentLevel).toBeLessThanOrEqual(11)
      expect(state.insightsGained).toBeDefined()
      expect(state.nextElevation).toBeDefined()
    })

    it('tracks ascent progression', () => {
      const sessionId = 'test-session'
      const query = 'Simple question'

      const state = trackAscent(sessionId, query)
      expect(state.previousLevels).toBeDefined()
      expect(state.currentLevel).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getPathBetweenLevels', () => {
    it('returns empty path for same level', () => {
      const path = getPathBetweenLevels(3, 3)
      expect(path).toEqual([])
    })

    it('returns ascending path', () => {
      const path = getPathBetweenLevels(1, 5)
      expect(path.length).toBeGreaterThan(0)
      expect(path[0]).toBe(1)
      expect(path[path.length - 1]).toBe(5)

      // Check path is ascending
      for (let i = 1; i < path.length; i++) {
        expect(path[i]).toBeGreaterThan(path[i - 1])
      }
    })

    it('returns descending path', () => {
      const path = getPathBetweenLevels(8, 3)
      expect(path.length).toBeGreaterThan(0)
      expect(path[0]).toBe(8)
      expect(path[path.length - 1]).toBe(3)

      // Check path is descending
      for (let i = 1; i < path.length; i++) {
        expect(path[i]).toBeLessThan(path[i - 1])
      }
    })

    it('includes all intermediate levels', () => {
      const path = getPathBetweenLevels(1, 11)
      // Should include all Sephiroth from 1 to 11
      expect(path.length).toBeGreaterThanOrEqual(11)
    })
  })

  describe('calculateAscentVelocity', () => {
    it('returns 0 for empty history', () => {
      const velocity = calculateAscentVelocity([])
      expect(velocity).toBe(0)
    })

    it('returns 0 for single state', () => {
      const history: AscentState[] = [
        {
          currentLevel: 3,
          previousLevels: [],
          queryEvolution: [],
          insightsGained: [],
          totalQueries: 1,
          ascentVelocity: 0,
          nextElevation: '',
          pathsTraveled: [],
          averageLevel: 3,
          peakLevel: 3,
          timeInCurrentLevel: 0,
          sessionId: 'test',
        },
      ]
      const velocity = calculateAscentVelocity(history)
      expect(velocity).toBe(0)
    })

    it('calculates positive velocity for ascending', () => {
      const history: AscentState[] = [
        {
          currentLevel: 1,
          previousLevels: [],
          queryEvolution: [],
          insightsGained: [],
          totalQueries: 1,
          ascentVelocity: 0,
          nextElevation: '',
          pathsTraveled: [],
          averageLevel: 1,
          peakLevel: 1,
          timeInCurrentLevel: 0,
          sessionId: 'test',
        },
        {
          currentLevel: 5,
          previousLevels: [1],
          queryEvolution: [],
          insightsGained: [],
          totalQueries: 2,
          ascentVelocity: 4,
          nextElevation: '',
          pathsTraveled: [],
          averageLevel: 3,
          peakLevel: 5,
          timeInCurrentLevel: 0,
          sessionId: 'test',
        },
      ]
      const velocity = calculateAscentVelocity(history)
      expect(velocity).toBeGreaterThan(0)
    })

    it('calculates negative velocity for descending', () => {
      const history: AscentState[] = [
        {
          currentLevel: 8,
          previousLevels: [],
          queryEvolution: [],
          insightsGained: [],
          totalQueries: 1,
          ascentVelocity: 0,
          nextElevation: '',
          pathsTraveled: [],
          averageLevel: 8,
          peakLevel: 8,
          timeInCurrentLevel: 0,
          sessionId: 'test',
        },
        {
          currentLevel: 3,
          previousLevels: [8],
          queryEvolution: [],
          insightsGained: [],
          totalQueries: 2,
          ascentVelocity: -5,
          nextElevation: '',
          pathsTraveled: [],
          averageLevel: 5.5,
          peakLevel: 8,
          timeInCurrentLevel: 0,
          sessionId: 'test',
        },
      ]
      const velocity = calculateAscentVelocity(history)
      expect(velocity).toBeLessThan(0)
    })
  })

  describe('getSefirahColor', () => {
    it('returns valid hex color for each Sefirah', () => {
      for (let level = 1; level <= 11; level++) {
        const color = getSefirahColor(level as Sefirah)
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })

    it('returns different colors for different Sephiroth', () => {
      const colors = new Set<string>()
      for (let level = 1; level <= 11; level++) {
        colors.add(getSefirahColor(level as Sefirah))
      }
      // At least some different colors (not all same)
      expect(colors.size).toBeGreaterThan(1)
    })

    it('returns fallback color for invalid level', () => {
      const color = getSefirahColor(999 as Sefirah)
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})
