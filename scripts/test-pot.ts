/**
 * Test Program of Thought (PoT) Methodology
 *
 * Demonstrates code-based computation for mathematical problems
 */

import { executeProgramOfThought, createAkhAI } from './packages/core/src/index.js';

async function testPoT() {
  console.log('🧪 Testing Program of Thought (PoT) Methodology\n');
  console.log('═'.repeat(60));

  // Create AkhAI instance
  const akhai = createAkhAI('anthropic');

  // Set API keys
  akhai.setApiKeys({
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    xai: process.env.XAI_API_KEY,
  });

  // Setup Mother Base
  akhai.setupMotherBase();

  // Test Problem: Compound Interest Calculation
  const problem = `
Calculate the compound interest on an initial investment of $10,000
at an annual interest rate of 5% compounded monthly for 10 years.
Show the final amount and the total interest earned.
  `.trim();

  console.log('\n📝 Problem:');
  console.log(problem);
  console.log('\n' + '═'.repeat(60));
  console.log('💻 Executing PoT (Code-Based Reasoning)...\n');

  try {
    const result = await executeProgramOfThought(
      problem,
      akhai.motherBase,
      {
        verbose: true,
        language: 'javascript',
        maxIterations: 5,
        temperature: 0.2, // Lower temperature for precise code generation
      }
    );

    console.log('\n' + '═'.repeat(60));
    console.log('✅ PoT Execution Complete!\n');

    // Display results
    console.log('📊 RESULTS:');
    console.log('─'.repeat(60));
    console.log(`Final Answer: ${result.answer}`);
    console.log(`\nIterations: ${result.iterations}`);
    console.log(`Execution Time: ${result.latencyMs}ms`);
    console.log(`Tokens Used: ${result.tokens.total} (input: ${result.tokens.input}, output: ${result.tokens.output})`);
    console.log(`Estimated Cost: $${result.cost.toFixed(4)}`);
    console.log(`Success: ${result.executionSucceeded ? '✅' : '❌'}`);

    console.log('\n💻 GENERATED CODE:');
    console.log('─'.repeat(60));
    console.log(result.finalCode);

    console.log('\n📝 REASONING STEPS:');
    console.log('─'.repeat(60));
    result.steps.forEach((step, i) => {
      console.log(`\n${i + 1}. [${step.type.toUpperCase()}] (Iteration ${step.iteration})`);
      console.log(`   ${step.content.substring(0, 200)}${step.content.length > 200 ? '...' : ''}`);
      if (step.code) {
        console.log(`   Code: ${step.code.substring(0, 100)}...`);
      }
      if (step.executionResult) {
        console.log(`   Result: ${step.executionResult}`);
      }
      if (step.error) {
        console.log(`   ❌ Error: ${step.error}`);
      }
    });

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Test Complete!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

// Run test
testPoT().catch(console.error);
