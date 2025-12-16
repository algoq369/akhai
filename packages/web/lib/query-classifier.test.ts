/**
 * Query Classifier Test - Demonstrates smart routing
 *
 * Run with: node --loader ts-node/esm lib/query-classifier.test.ts
 */

import { classifyQuery } from './query-classifier';

// Test cases
const testCases = [
  // Simple queries → DIRECT mode (5-10s)
  { query: 'btc price', expected: 'direct' },
  { query: 'what is bitcoin', expected: 'direct' },
  { query: 'define AI', expected: 'direct' },
  { query: 'eth price', expected: 'direct' },
  { query: 'who is elon musk', expected: 'direct' },

  // Comparison queries → GTP mode (25s)
  { query: 'compare react vs vue', expected: 'gtp' },
  { query: 'bitcoin vs ethereum', expected: 'gtp' },
  { query: 'which is better python or javascript', expected: 'gtp' },

  // Complex analysis → CoT or GTP
  { query: 'analyze my business strategy for the next quarter', expected: 'cot' },
  { query: 'how to implement authentication in nextjs', expected: 'gtp' },
  { query: 'should i invest in crypto', expected: 'gtp' },
];

console.log('='.repeat(80));
console.log('AKHAI QUERY CLASSIFIER TEST');
console.log('='.repeat(80));
console.log('');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = classifyQuery(testCase.query);
  const success = result.suggestedMethodology === testCase.expected;

  if (success) {
    passed++;
    console.log(`✅ "${testCase.query}"`);
  } else {
    failed++;
    console.log(`❌ "${testCase.query}"`);
  }

  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Got:      ${result.suggestedMethodology}`);
  console.log(`   Reason:   ${result.reason}`);
  console.log(`   Simple:   ${result.isSimple ? 'YES' : 'NO'}`);
  console.log('');
}

console.log('='.repeat(80));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(80));
console.log('');
console.log('ROUTING SUMMARY:');
console.log('- DIRECT mode: Simple factual queries, ~5-10 seconds');
console.log('- GTP mode: Comparisons and medium complexity, ~25 seconds');
console.log('- CoT mode: Complex analysis with many steps, ~30+ seconds');
console.log('');
