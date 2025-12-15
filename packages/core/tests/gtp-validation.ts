#!/usr/bin/env node
/**
 * GTP Implementation Validation Script
 *
 * Validates that all GTP components are properly exported and functional
 * without making actual API calls.
 */

import {
  GTPExecutor,
  FlashContextBuilder,
  FlashBroadcaster,
  LivingDatabase,
  QuorumManager,
} from '../src/methodologies/gtp/index.js';

import {
  MethodologySelector,
  selectMethodology,
  analyzeQuery,
} from '../src/methodologies/selector.js';

import {
  createProviderFromFamily,
  ModelProviderFactory,
} from '../src/models/ModelProviderFactory.js';

import type {
  GTPResult,
  FlashContextFrame,
  QueryAnalysis,
  MethodologySelection,
  AdvisorResponse,
  LivingDatabaseState,
  QuorumResult,
} from '../src/methodologies/types.js';

console.log('='.repeat(70));
console.log('GTP IMPLEMENTATION VALIDATION');
console.log('='.repeat(70));
console.log('');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

// Test 1: Exports
console.log('Testing exports...');
test('GTPExecutor class exported', () => {
  if (typeof GTPExecutor !== 'function') throw new Error('GTPExecutor not a constructor');
});

test('FlashContextBuilder class exported', () => {
  if (typeof FlashContextBuilder !== 'function') throw new Error('FlashContextBuilder not a constructor');
});

test('FlashBroadcaster class exported', () => {
  if (typeof FlashBroadcaster !== 'function') throw new Error('FlashBroadcaster not a constructor');
});

test('LivingDatabase class exported', () => {
  if (typeof LivingDatabase !== 'function') throw new Error('LivingDatabase not a constructor');
});

test('QuorumManager class exported', () => {
  if (typeof QuorumManager !== 'function') throw new Error('QuorumManager not a constructor');
});

test('MethodologySelector class exported', () => {
  if (typeof MethodologySelector !== 'function') throw new Error('MethodologySelector not a constructor');
});

test('selectMethodology function exported', () => {
  if (typeof selectMethodology !== 'function') throw new Error('selectMethodology not a function');
});

test('analyzeQuery function exported', () => {
  if (typeof analyzeQuery !== 'function') throw new Error('analyzeQuery not a function');
});

console.log('');

// Test 2: Query Analysis
console.log('Testing Query Analysis...');

test('Analyze comparative query', () => {
  const analysis = analyzeQuery('Compare React vs Vue vs Angular');
  if (analysis.queryType !== 'comparative') throw new Error(`Expected comparative, got ${analysis.queryType}`);
  if (!analysis.requiresMultiplePerspectives) throw new Error('Should require multiple perspectives');
});

test('Analyze factual query', () => {
  const analysis = analyzeQuery('What is the capital of France?');
  if (analysis.queryType !== 'factual') throw new Error(`Expected factual, got ${analysis.queryType}`);
  if (analysis.complexity >= 0.3) throw new Error('Should be low complexity');
});

test('Analyze procedural query', () => {
  const analysis = analyzeQuery('How to deploy Node.js step by step');
  if (analysis.queryType !== 'procedural') throw new Error(`Expected procedural, got ${analysis.queryType}`);
  if (!analysis.requiresSequentialReasoning) throw new Error('Should require sequential reasoning');
});

test('Extract keywords', () => {
  const analysis = analyzeQuery('Compare React and Vue for web development');
  if (!analysis.keywords.includes('compare')) throw new Error('Should extract "compare"');
  if (!analysis.keywords.includes('react')) throw new Error('Should extract "react"');
});

console.log('');

// Test 3: Methodology Selection
console.log('Testing Methodology Selection...');

test('Select GTP for comparative', () => {
  const selection = selectMethodology('Compare React vs Vue vs Angular');
  if (selection.methodology !== 'gtp') throw new Error(`Expected gtp, got ${selection.methodology}`);
});

test('Select Direct for factual', () => {
  const selection = selectMethodology('What is X?');
  if (selection.methodology !== 'direct') throw new Error(`Expected direct, got ${selection.methodology}`);
});

test('Select CoT for procedural', () => {
  const selection = selectMethodology('How to do X step by step');
  if (selection.methodology !== 'cot') throw new Error(`Expected cot, got ${selection.methodology}`);
});

console.log('');

// Test 4: Flash Context Builder
console.log('Testing FlashContextBuilder...');

const builder = new FlashContextBuilder();

test('Build Flash Context Frame', () => {
  const query = 'Compare React vs Vue';
  const analysis = analyzeQuery(query);
  const slots = [
    { slot: 1, family: 'deepseek' as const },
    { slot: 2, family: 'xai' as const },
    { slot: 3, family: 'openrouter' as const },
  ];

  const frame = builder.build(query, analysis, slots);

  if (frame.query !== query) throw new Error('Query mismatch');
  if (frame.advisorTasks.length !== 3) throw new Error('Should have 3 advisor tasks');
  if (!frame.version) throw new Error('Missing version');
  if (!frame.timestamp) throw new Error('Missing timestamp');
});

test('Assign unique roles', () => {
  const query = 'Test query';
  const analysis = analyzeQuery(query);
  const slots = [
    { slot: 1, family: 'deepseek' as const },
    { slot: 2, family: 'xai' as const },
    { slot: 3, family: 'openrouter' as const },
  ];

  const frame = builder.build(query, analysis, slots);
  const roles = frame.advisorTasks.map(t => t.role);
  const uniqueRoles = new Set(roles);

  if (uniqueRoles.size !== roles.length) throw new Error('Roles should be unique');
});

test('Generate advisor-specific prompt', () => {
  const query = 'Test query';
  const analysis = analyzeQuery(query);
  const slots = [{ slot: 1, family: 'deepseek' as const }];
  const frame = builder.build(query, analysis, slots);

  const prompt = builder.toPrompt(frame, 1);

  if (!prompt.includes(query)) throw new Error('Prompt should include query');
  if (!prompt.includes('Confidence')) throw new Error('Prompt should include confidence instruction');
});

console.log('');

// Test 5: Living Database
console.log('Testing LivingDatabase...');

test('Initialize Living Database', () => {
  const db = new LivingDatabase(3);
  const state = db.getState();

  if (state.metadata.responsesExpected !== 3) throw new Error('Should expect 3 responses');
  if (state.metadata.responsesReceived !== 0) throw new Error('Should start with 0 responses');
  if (state.mergedInsights.length !== 0) throw new Error('Should start with no insights');
});

test('Merge advisor response', () => {
  const db = new LivingDatabase(3);

  const response: AdvisorResponse = {
    slot: 1,
    family: 'deepseek',
    role: 'technical',
    content: 'Test response with important insight',
    confidence: 0.8,
    keyPoints: ['Important insight'],
    status: 'complete',
    timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
  };

  const state = db.merge(response);

  if (state.metadata.responsesReceived !== 1) throw new Error('Should have 1 response');
  if (state.mergedInsights.length === 0) throw new Error('Should have extracted insights');
});

test('Calculate agreement level', () => {
  const db = new LivingDatabase(2);

  const response1: AdvisorResponse = {
    slot: 1,
    family: 'deepseek',
    role: 'technical',
    content: 'Point A is valid',
    confidence: 0.8,
    keyPoints: ['Point A is valid'],
    status: 'complete',
    timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
  };

  const response2: AdvisorResponse = {
    slot: 2,
    family: 'xai',
    role: 'strategic',
    content: 'Point A is valid',
    confidence: 0.9,
    keyPoints: ['Point A is valid'],
    status: 'complete',
    timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
  };

  db.merge(response1);
  const state = db.merge(response2);

  if (state.consensusState.agreementLevel <= 0) throw new Error('Should have non-zero agreement');
});

test('Generate summary', () => {
  const db = new LivingDatabase(1);

  const response: AdvisorResponse = {
    slot: 1,
    family: 'deepseek',
    role: 'technical',
    content: '**Advantage**: Good performance',
    confidence: 0.8,
    keyPoints: ['Good performance'],
    status: 'complete',
    timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
  };

  db.merge(response);
  const summary = db.generateSummary();

  if (!summary.includes('Advisor Summary')) throw new Error('Summary should have header');
  if (summary.length === 0) throw new Error('Summary should not be empty');
});

console.log('');

// Test 6: Quorum Manager
console.log('Testing QuorumManager...');

test('Initialize Quorum Manager', () => {
  const qm = new QuorumManager();
  const config = qm.getConfig();

  if (config.minResponses !== 2) throw new Error('Default minResponses should be 2');
  if (config.earlyExitThreshold !== 0.85) throw new Error('Default threshold should be 0.85');
  if (config.timeout !== 60000) throw new Error('Default timeout should be 60000ms');
});

test('Detect quorum on all complete', () => {
  const qm = new QuorumManager();
  qm.start();

  const db = new LivingDatabase(2);

  for (let i = 1; i <= 2; i++) {
    db.merge({
      slot: i,
      family: 'deepseek',
      role: 'technical',
      content: 'Response',
      confidence: 0.8,
      keyPoints: [],
      status: 'complete',
      timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
    });
  }

  const state = db.getState();
  const result = qm.check(state);

  if (!result.reached) throw new Error('Quorum should be reached');
  if (result.reason !== 'all_complete' && result.reason !== 'min_responses') {
    throw new Error(`Unexpected reason: ${result.reason}`);
  }
});

test('Calculate progress', () => {
  const qm = new QuorumManager();
  qm.start();

  const db = new LivingDatabase(4);
  db.merge({
    slot: 1,
    family: 'deepseek',
    role: 'technical',
    content: 'Response',
    confidence: 0.8,
    keyPoints: [],
    status: 'complete',
    timing: { startTime: Date.now(), endTime: Date.now(), duration: 1000 },
  });

  const state = db.getState();
  const progress = qm.calculateProgress(state);

  if (progress <= 0 || progress > 1) throw new Error('Progress should be between 0 and 1');
});

console.log('');

// Test 7: Model Provider Factory
console.log('Testing Model Provider Factory...');

test('ModelProviderFactory exists', () => {
  const factory = new ModelProviderFactory();
  if (!factory) throw new Error('Failed to create factory');
});

test('Get provider config', () => {
  const factory = new ModelProviderFactory();
  const config = factory.getProviderConfig('anthropic');
  if (!config) throw new Error('Failed to get config');
  if (config.family !== 'anthropic') throw new Error('Wrong family');
});

console.log('');

// Summary
console.log('='.repeat(70));
console.log('VALIDATION RESULTS');
console.log('='.repeat(70));
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
console.log('');

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! GTP implementation is ready.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Set API keys in environment variables');
  console.log('  2. Start the web server: cd packages/web && pnpm dev');
  console.log('  3. Test GTP execution with a comparative query');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the errors above.');
  console.log('');
  process.exit(1);
}
