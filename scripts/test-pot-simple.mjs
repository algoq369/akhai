/**
 * Simple PoT Test - Direct Provider Usage
 */

import { executeProgramOfThought, createProviderFromFamily } from './packages/core/dist/index.js';

async function testPoT() {
  console.log('🧪 Testing Program of Thought (PoT) Methodology\n');
  console.log('═'.repeat(60));

  // Create provider directly
  const provider = createProviderFromFamily('anthropic', {
    anthropic: process.env.ANTHROPIC_API_KEY,
  });

  // Test Problem: Simple Math
  const problem = `
Calculate the compound interest using the formula:
A = P(1 + r/n)^(nt)

Where:
- P = $10,000 (principal)
- r = 0.05 (annual rate)
- n = 12 (compounds per year)
- t = 10 (years)

Calculate A (final amount) and then Interest = A - P
  `.trim();

  console.log('\n📝 Problem:');
  console.log(problem);
  console.log('\n' + '═'.repeat(60));
  console.log('💻 Executing PoT (Code-Based Reasoning)...\n');

  try {
    const result = await executeProgramOfThought(
      problem,
      provider,
      {
        verbose: true,
        language: 'javascript',
        maxIterations: 5,
        temperature: 0.2,
      }
    );

    console.log('\n' + '═'.repeat(60));
    console.log('✅ PoT Execution Complete!\n');

    // Display results
    console.log('📊 RESULTS:');
    console.log('─'.repeat(60));
    console.log(`\nFinal Answer:\n${result.answer}`);
    console.log(`\nIterations: ${result.iterations}`);
    console.log(`Execution Time: ${result.latencyMs}ms`);
    console.log(`Tokens Used: ${result.tokens.total}`);
    console.log(`Estimated Cost: $${result.cost.toFixed(4)}`);
    console.log(`Success: ${result.executionSucceeded ? '✅' : '❌'}`);

    if (result.finalCode) {
      console.log('\n💻 GENERATED CODE:');
      console.log('─'.repeat(60));
      console.log(result.finalCode);
    }

    console.log('\n📝 REASONING STEPS:');
    console.log('─'.repeat(60));
    result.steps.forEach((step, i) => {
      console.log(`\n${i + 1}. [${step.type.toUpperCase()}] (Iteration ${step.iteration})`);

      if (step.type === 'reasoning') {
        console.log(`   💭 ${step.content.substring(0, 150)}${step.content.length > 150 ? '...' : ''}`);
      }

      if (step.type === 'code-generation' && step.code) {
        console.log(`   📝 Generated code (${step.code.length} chars)`);
        console.log('   ' + step.code.split('\n').slice(0, 5).join('\n   '));
        if (step.code.split('\n').length > 5) console.log('   ...');
      }

      if (step.type === 'execution' && step.executionResult) {
        console.log(`   ✅ Result: ${step.executionResult}`);
      }

      if (step.error) {
        console.log(`   ❌ Error: ${step.error}`);
      }
    });

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 PoT Test Complete! Code-based computation works!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run test
testPoT().catch(console.error);
