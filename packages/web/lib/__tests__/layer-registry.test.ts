import { describe, it, expect } from 'vitest';
import {
  LAYER_METADATA,
  detectQueryLevel,
  trackAscent,
  getPathBetweenLevels,
  calculateAscentVelocity,
  getLayerColor,
  type Layer,
  type AscentState,
} from '../layer-registry';

describe('Ascent Tracker System', () => {
  describe('LAYER_METADATA', () => {
    it('contains all 11 Layers', () => {
      const layerKeys = Object.keys(LAYER_METADATA);
      expect(layerKeys.length).toBe(11);
    });

    it('has valid metadata for each Layer', () => {
      Object.values(LAYER_METADATA).forEach((metadata) => {
        expect(metadata.name).toBeDefined();
        expect(metadata.hebrewName).toBeDefined();
        expect(metadata.level).toBeGreaterThanOrEqual(1);
        expect(metadata.level).toBeLessThanOrEqual(11);
        expect(metadata.aiRole).toBeDefined();
        expect(metadata.pillar).toMatch(/left|middle|right/);
      });
    });

    it('has unique levels for each Layer', () => {
      const levels = Object.values(LAYER_METADATA).map((m) => m.level);
      const uniqueLevels = new Set(levels);
      expect(uniqueLevels.size).toBe(11);
    });
  });

  describe('detectQueryLevel', () => {
    it('detects simple queries as Embedding (1)', () => {
      const query = 'What is 2 + 2?';
      const level = detectQueryLevel(query);
      expect(level).toBe(1); // Embedding - Data Layer
    });

    it('detects complex queries as higher levels', () => {
      const query =
        'How can we integrate quantum computing principles with machine learning to solve multi-dimensional optimization problems?';
      const level = detectQueryLevel(query);
      expect(level).toBeGreaterThan(1);
    });

    it('detects meta-cognitive queries as Meta-Core (10)', () => {
      const query =
        'How should I think about thinking about this problem? What are the meta-cognitive strategies for approaching complex philosophical questions?';
      const level = detectQueryLevel(query);
      expect(level).toBeGreaterThanOrEqual(9);
    });

    it('returns valid Layer (1-11)', () => {
      const queries = [
        'Quick question',
        'Explain the concept of consciousness',
        'What is the meaning of life, the universe, and everything?',
      ];

      queries.forEach((query) => {
        const level = detectQueryLevel(query);
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(11);
      });
    });
  });

  describe('trackAscent', () => {
    it('creates initial ascent state', () => {
      const sessionId = 'test-session';
      const query = 'Test query';
      const state = trackAscent(sessionId, query);

      expect(state.currentLevel).toBeGreaterThanOrEqual(1);
      expect(state.currentLevel).toBeLessThanOrEqual(11);
      expect(state.insightsGained).toBeDefined();
      expect(state.nextElevation).toBeDefined();
    });

    it('tracks ascent progression', () => {
      const sessionId = 'test-session';
      const query = 'Simple question';

      const state = trackAscent(sessionId, query);
      expect(state.previousLevels).toBeDefined();
      expect(state.currentLevel).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getPathBetweenLevels', () => {
    it('returns empty path for same level', () => {
      const path = getPathBetweenLevels(3, 3);
      expect(path).toEqual([]);
    });

    it('returns path ID for connected levels', () => {
      // getPathBetweenLevels returns path IDs, not level sequences
      const path = getPathBetweenLevels(1, 2); // Embedding → Executor (path #1)
      expect(path.length).toBe(1);
      expect(path[0]).toBe(1);
    });

    it('returns path ID for reverse direction', () => {
      // Bidirectional — same path ID returned for reverse
      const pathForward = getPathBetweenLevels(2, 5); // Executor → Attention
      const pathReverse = getPathBetweenLevels(5, 2);
      expect(pathForward.length).toBe(1);
      expect(pathReverse.length).toBe(1);
      expect(pathForward[0]).toBe(pathReverse[0]);
    });

    it('returns empty for non-connected levels', () => {
      // No direct path between level 1 and 11
      const path = getPathBetweenLevels(1, 11);
      expect(path).toEqual([]);
    });
  });

  describe('calculateAscentVelocity', () => {
    it('returns 0 for empty history', () => {
      const velocity = calculateAscentVelocity([]);
      expect(velocity).toBe(0);
    });

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
      ];
      const velocity = calculateAscentVelocity(history);
      expect(velocity).toBe(0);
    });

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
      ];
      const velocity = calculateAscentVelocity(history);
      expect(velocity).toBeGreaterThan(0);
    });

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
      ];
      const velocity = calculateAscentVelocity(history);
      expect(velocity).toBeLessThan(0);
    });
  });

  describe('getLayerColor', () => {
    it('returns valid color for each Layer', () => {
      for (let level = 1; level <= 11; level++) {
        const color = getLayerColor(level as Layer);
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      }
    });

    it('returns different colors for different Layers', () => {
      const colors = new Set<string>();
      for (let level = 1; level <= 11; level++) {
        colors.add(getLayerColor(level as Layer));
      }
      // At least some different colors (not all same)
      expect(colors.size).toBeGreaterThan(1);
    });

    it('throws for invalid level', () => {
      expect(() => getLayerColor(999 as Layer)).toThrow();
    });
  });
});
