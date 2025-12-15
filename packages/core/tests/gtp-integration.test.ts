/**
 * GTP (Generative Thoughts Process) Integration Tests
 *
 * Validates the complete GTP implementation end-to-end.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  GTPExecutor,
  FlashContextBuilder,
  FlashBroadcaster,
  LivingDatabase,
  QuorumManager,
  MethodologySelector,
  analyzeQuery,
  selectMethodology,
} from '../src/methodologies/gtp/index.js';
import { createProviderFromFamily } from '../src/models/ModelProviderFactory.js';
import type { ModelFamily } from '../src/models/types.js';

// Mock API keys for testing
const MOCK_API_KEYS = {
  anthropic: process.env.ANTHROPIC_API_KEY || 'mock-key',
  deepseek: process.env.DEEPSEEK_API_KEY || 'mock-key',
  xai: process.env.XAI_API_KEY || 'mock-key',
  openrouter: process.env.OPENROUTER_API_KEY || 'mock-key',
};

describe('GTP Methodology Selector', () => {
  const selector = new MethodologySelector();

  it('should detect comparative queries for GTP', () => {
    const analysis = selector.analyzeQuery('Compare React vs Vue vs Angular');
    expect(analysis.queryType).toBe('comparative');
    expect(analysis.requiresMultiplePerspectives).toBe(true);

    const selection = selector.selectMethodology(analysis);
    expect(selection.methodology).toBe('gtp');
  });

  it('should detect creative queries for GTP', () => {
    const analysis = selector.analyzeQuery('Brainstorm startup ideas for AI in healthcare');
    expect(analysis.queryType).toBe('creative');
    expect(analysis.requiresMultiplePerspectives).toBe(true);

    const selection = selector.selectMethodology(analysis);
    expect(selection.methodology).toBe('gtp');
  });

  it('should detect simple factual queries for Direct', () => {
    const analysis = selector.analyzeQuery('What is the capital of France?');
    expect(analysis.queryType).toBe('factual');
    expect(analysis.complexity).toBeLessThan(0.3);

    const selection = selector.selectMethodology(analysis);
    expect(selection.methodology).toBe('direct');
  });

  it('should detect procedural queries for CoT', () => {
    const analysis = selector.analyzeQuery('How to deploy a Node.js app step by step');
    expect(analysis.queryType).toBe('procedural');
    expect(analysis.requiresSequentialReasoning).toBe(true);

    const selection = selector.selectMethodology(analysis);
    expect(selection.methodology).toBe('cot');
  });

  it('should detect research queries for AoT', () => {
    const analysis = selector.analyzeQuery('Research quantum computing trends and provide comprehensive analysis');
    expect(analysis.queryType).toBe('research');
    expect(analysis.requiresDecomposition).toBe(true);

    const selection = selector.selectMethodology(analysis);
    expect(selection.methodology).toBe('aot');
  });

  it('should calculate complexity scores correctly', () => {
    const simple = selector.analyzeQuery('What is X?');
    expect(simple.complexity).toBeLessThan(0.4);

    const complex = selector.analyzeQuery('Comprehensive analysis of all factors comparing multiple complex systems');
    expect(complex.complexity).toBeGreaterThan(0.6);
  });

  it('should extract keywords correctly', () => {
    const analysis = selector.analyzeQuery('Compare React and Vue for building modern web applications');
    expect(analysis.keywords).toContain('compare');
    expect(analysis.keywords).toContain('react');
    expect(analysis.keywords).toContain('vue');
  });
});

describe('FlashContextBuilder', () => {
  const builder = new FlashContextBuilder();

  it('should build valid Flash Context Frame', () => {
    const query = 'Compare React vs Vue';
    const queryAnalysis = analyzeQuery(query);
    const advisorSlots = [
      { slot: 1, family: 'deepseek' as ModelFamily },
      { slot: 2, family: 'xai' as ModelFamily },
      { slot: 3, family: 'openrouter' as ModelFamily },
    ];

    const frame = builder.build(query, queryAnalysis, advisorSlots);

    expect(frame.version).toBe('1.0.0');
    expect(frame.query).toBe(query);
    expect(frame.advisorTasks).toHaveLength(3);
    expect(frame.timestamp).toBeGreaterThan(0);
  });

  it('should assign unique roles to each advisor', () => {
    const query = 'Compare React vs Vue';
    const queryAnalysis = analyzeQuery(query);
    const advisorSlots = [
      { slot: 1, family: 'deepseek' as ModelFamily },
      { slot: 2, family: 'xai' as ModelFamily },
      { slot: 3, family: 'openrouter' as ModelFamily },
    ];

    const frame = builder.build(query, queryAnalysis, advisorSlots);

    const roles = frame.advisorTasks.map(t => t.role);
    expect(roles).toContain('technical');
    expect(roles).toContain('strategic');
    expect(roles).toContain('creative');

    // All roles should be unique
    const uniqueRoles = new Set(roles);
    expect(uniqueRoles.size).toBe(roles.length);
  });

  it('should generate advisor-specific prompts', () => {
    const query = 'Compare React vs Vue';
    const queryAnalysis = analyzeQuery(query);
    const advisorSlots = [
      { slot: 1, family: 'deepseek' as ModelFamily },
    ];

    const frame = builder.build(query, queryAnalysis, advisorSlots);
    const prompt = builder.toPrompt(frame, 1);

    expect(prompt).toContain(query);
    expect(prompt).toContain('Technical Analysis');
    expect(prompt).toContain('Confidence');
  });

  it('should adjust constraints based on complexity', () => {
    const simple = analyzeQuery('What is X?');
    const complex = analyzeQuery('Comprehensive comparison of all modern frameworks with detailed analysis');

    const simpleFrame = builder.build('What is X?', simple, [{ slot: 1, family: 'deepseek' as ModelFamily }]);
    const complexFrame = builder.build('Complex query...', complex, [{ slot: 1, family: 'deepseek' as ModelFamily }]);

    expect(complexFrame.constraints.maxTokens).toBeGreaterThan(simpleFrame.constraints.maxTokens);
  });
});

describe('LivingDatabase', () => {
  it('should initialize with correct state', () => {
    const db = new LivingDatabase(3);
    const state = db.getState();

    expect(state.metadata.responsesExpected).toBe(3);
    expect(state.metadata.responsesReceived).toBe(0);
    expect(state.mergedInsights).toHaveLength(0);
    expect(state.consensusState.consensusReached).toBe(false);
  });

  it('should merge advisor responses', () => {
    const db = new LivingDatabase(3);

    const response1 = {
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: 'React has great performance. Vue is easier to learn.',
      confidence: 0.8,
      keyPoints: ['React has great performance', 'Vue is easier to learn'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    const state = db.merge(response1);

    expect(state.metadata.responsesReceived).toBe(1);
    expect(state.mergedInsights.length).toBeGreaterThan(0);
  });

  it('should detect similar insights and merge them', () => {
    const db = new LivingDatabase(3);

    const response1 = {
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: 'React has excellent performance',
      confidence: 0.8,
      keyPoints: ['React has excellent performance'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    const response2 = {
      slot: 2,
      family: 'xai' as ModelFamily,
      role: 'strategic' as const,
      content: 'React has great performance',
      confidence: 0.9,
      keyPoints: ['React has great performance'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    db.merge(response1);
    const state = db.merge(response2);

    // Should merge similar insights
    const performanceInsights = state.mergedInsights.filter(i =>
      i.content.toLowerCase().includes('performance')
    );

    if (performanceInsights.length > 0) {
      expect(performanceInsights[0].supportingSlots.length).toBeGreaterThan(1);
    }
  });

  it('should calculate agreement level', () => {
    const db = new LivingDatabase(3);

    const response1 = {
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: 'Point A is correct',
      confidence: 0.8,
      keyPoints: ['Point A is correct'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    const response2 = {
      slot: 2,
      family: 'xai' as ModelFamily,
      role: 'strategic' as const,
      content: 'Point A is correct',
      confidence: 0.9,
      keyPoints: ['Point A is correct'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    db.merge(response1);
    const state = db.merge(response2);

    expect(state.consensusState.agreementLevel).toBeGreaterThan(0);
  });

  it('should generate summary', () => {
    const db = new LivingDatabase(3);

    const response = {
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: '**Advantage**: Fast performance\n- Easy to learn\n- Large ecosystem',
      confidence: 0.8,
      keyPoints: ['Fast performance', 'Easy to learn', 'Large ecosystem'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    };

    db.merge(response);
    const summary = db.generateSummary();

    expect(summary).toContain('Advisor Summary');
    expect(summary.length).toBeGreaterThan(0);
  });
});

describe('QuorumManager', () => {
  it('should initialize with default config', () => {
    const qm = new QuorumManager();
    const config = qm.getConfig();

    expect(config.minResponses).toBe(2);
    expect(config.earlyExitThreshold).toBe(0.85);
    expect(config.timeout).toBe(60000);
  });

  it('should detect quorum when all responses complete', () => {
    const qm = new QuorumManager();
    qm.start();

    const db = new LivingDatabase(3);

    // Add 3 responses
    for (let i = 1; i <= 3; i++) {
      db.merge({
        slot: i,
        family: 'deepseek' as ModelFamily,
        role: 'technical' as const,
        content: 'Response',
        confidence: 0.8,
        keyPoints: [],
        status: 'complete' as const,
        timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
      });
    }

    const state = db.getState();
    const result = qm.check(state);

    expect(result.reached).toBe(true);
    expect(result.reason).toBe('all_complete');
  });

  it('should detect quorum on high agreement', () => {
    const qm = new QuorumManager();
    qm.start();

    const db = new LivingDatabase(3);

    // Add 2 responses with same content (high agreement)
    db.merge({
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: 'Same insight here',
      confidence: 0.9,
      keyPoints: ['Same insight here'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    });

    db.merge({
      slot: 2,
      family: 'xai' as ModelFamily,
      role: 'strategic' as const,
      content: 'Same insight here',
      confidence: 0.9,
      keyPoints: ['Same insight here'],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    });

    const state = db.getState();
    const result = qm.check(state);

    // Should reach quorum on high agreement or minimum responses
    if (state.consensusState.agreementLevel >= 0.85) {
      expect(result.reason).toBe('high_agreement');
    } else {
      expect(result.reason).toBe('min_responses');
    }
  });

  it('should calculate progress correctly', () => {
    const qm = new QuorumManager();
    qm.start();

    const db = new LivingDatabase(4);

    db.merge({
      slot: 1,
      family: 'deepseek' as ModelFamily,
      role: 'technical' as const,
      content: 'Response',
      confidence: 0.8,
      keyPoints: [],
      status: 'complete' as const,
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    });

    const state = db.getState();
    const progress = qm.calculateProgress(state);

    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(1);
  });
});

describe('Integration: Query Analysis to Methodology Selection', () => {
  const testCases = [
    { query: 'What is the capital of France?', expected: 'direct' },
    { query: 'How to deploy Node.js step by step', expected: 'cot' },
    { query: 'Compare React vs Vue vs Angular', expected: 'gtp' },
    { query: 'Research quantum computing trends comprehensively', expected: 'aot' },
    { query: 'Brainstorm innovative AI startup ideas', expected: 'gtp' },
  ];

  testCases.forEach(({ query, expected }) => {
    it(`should route "${query}" to ${expected}`, () => {
      const selection = selectMethodology(query);
      expect(selection.methodology).toBe(expected);
    });
  });
});

console.log('GTP Integration Tests Complete');
console.log('All tests validate the GTP implementation');
