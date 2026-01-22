/**
 * Living Tree Integration Test
 *
 * Comprehensive end-to-end test of the Living Hermetic Intelligence Tree system
 */

import { db } from './lib/database'
import {
  analyzeWithOpus,
  saveLivingTreeAnalysis,
  getActiveTopics,
} from './lib/living-tree-analyzer'
import {
  getAllTreeConfigurations,
  getActiveTreeConfiguration,
  saveTreeConfiguration,
  setActiveTreeConfiguration,
  getDefaultConfiguration,
} from './lib/tree-configuration'

console.log('🌳 Living Tree Integration Test\n')
console.log('═'.repeat(60))

// Test 1: Database Schema Verification
console.log('\n📊 TEST 1: Database Schema Verification')
console.log('─'.repeat(60))

try {
  // Check if tables exist
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'living_%' OR name LIKE 'topic_evolution_%' OR name = 'hermetic_analysis' OR name = 'tree_configurations') ORDER BY name`
    )
    .all() as Array<{ name: string }>

  console.log(`✓ Found ${tables.length} Living Tree tables:`)
  tables.forEach((t) => console.log(`  - ${t.name}`))

  const requiredTables = ['living_topics', 'living_topic_edges', 'topic_evolution_events', 'hermetic_analysis', 'tree_configurations']
  const missingTables = requiredTables.filter(rt => !tables.find(t => t.name === rt))

  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`)
  }

  // Check preset configurations
  const presets = db
    .prepare('SELECT id, name FROM tree_configurations WHERE user_id IS NULL')
    .all() as Array<{ id: number; name: string }>

  console.log(`\n✓ Found ${presets.length} preset configurations:`)
  presets.forEach((p) => console.log(`  - ${p.name} (ID: ${p.id})`))

  if (presets.length < 4) {
    throw new Error('Missing preset configurations')
  }

  console.log('\n✅ Database Schema: PASSED')
} catch (error) {
  console.error('❌ Database Schema: FAILED')
  console.error(error)
  process.exit(1)
}

// Test 2: Configuration System
console.log('\n⚙️  TEST 2: Configuration System')
console.log('─'.repeat(60))

try {
  // Get all configurations
  const allConfigs = getAllTreeConfigurations()
  console.log(`✓ Retrieved ${allConfigs.length} configurations`)

  // Get default configuration
  const defaultConfig = getDefaultConfiguration()
  console.log(`✓ Default config: ${defaultConfig.name}`)

  // Save a custom configuration
  const customConfigId = saveTreeConfiguration(
    null, // anonymous user
    'Test Configuration',
    'Test configuration for integration testing',
    { 1: 0.7, 2: 0.8, 3: 0.9, 4: 0.6, 5: 0.5, 6: 0.7, 7: 0.6, 8: 0.7, 9: 0.8, 10: 0.5, 11: 0.4 },
    { 1: 0.8, 2: 0.5, 3: 0.9, 4: 0.6, 5: 0.7, 6: 0.5, 7: 0.6, 8: 0.8, 9: 0.5, 10: 0.6, 11: 0.5, 12: 0.4 },
    { left: 0.3, middle: 0.5, right: 0.2 }
  )
  console.log(`✓ Saved custom configuration (ID: ${customConfigId})`)

  // Activate the custom configuration
  setActiveTreeConfiguration(customConfigId, null)
  console.log(`✓ Activated configuration ${customConfigId}`)

  // Verify it's active
  const activeConfig = getActiveTreeConfiguration()
  if (!activeConfig || activeConfig.id !== customConfigId) {
    throw new Error('Failed to activate configuration')
  }
  console.log(`✓ Active config verified: ${activeConfig.name}`)

  // Clean up - delete test config
  db.prepare('DELETE FROM tree_configurations WHERE id = ?').run(customConfigId)
  console.log(`✓ Cleaned up test configuration`)

  console.log('\n✅ Configuration System: PASSED')
} catch (error) {
  console.error('❌ Configuration System: FAILED')
  console.error(error)
  process.exit(1)
}

// Test 3: Living Tree Analyzer (Opus 4.5)
async function testLivingTreeAnalyzer() {
  console.log('\n🧠 TEST 3: Living Tree Analyzer (Opus 4.5)')
  console.log('─'.repeat(60))

  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - skipping Opus analysis test')
      console.log('   (This is optional but required for full functionality)')
      return
    }

    console.log('✓ Anthropic API key found')

    // Create a test conversation
    const conversationId = `test_conv_${Date.now()}`
    const queryId = `test_query_${Date.now()}`

    console.log(`\n📝 Running Opus 4.5 analysis...`)
    console.log(`   Conversation ID: ${conversationId}`)
    console.log(`   Query ID: ${queryId}`)

    // Analyze a sample conversation
    const analysis = await analyzeWithOpus({
      query: 'How can I improve my understanding of React hooks?',
      response:
        'React hooks are functions that let you use state and other React features in functional components. The most common hooks are useState for managing state and useEffect for side effects. To improve your understanding, I recommend practicing with small projects, reading the official documentation, and understanding the rules of hooks.',
      previousTopics: [],
      conversationHistory: [],
      conversationId,
      queryId,
    })

    console.log(`\n✓ Analysis completed:`)
    console.log(`  - Topics extracted: ${analysis.topics.length}`)
    analysis.topics.forEach((t, idx) => {
      console.log(`    ${idx + 1}. ${t.name} (importance: ${(t.importance_score * 100).toFixed(0)}%)`)
    })

    console.log(`  - Relationships found: ${analysis.edges.length}`)
    console.log(`  - Evolution events: ${analysis.evolutionEvents.length}`)
    console.log(`  - Instinct insight: ${analysis.instinctInsight.substring(0, 80)}...`)

    // Save to database
    await saveLivingTreeAnalysis(queryId, conversationId, analysis)
    console.log(`\n✓ Saved analysis to database`)

    // Verify retrieval
    const activeTopics = await getActiveTopics(conversationId)
    console.log(`✓ Retrieved ${activeTopics.length} active topics`)

    // Verify hermetic analysis was saved
    const hermeticData = db
      .prepare('SELECT * FROM hermetic_analysis WHERE query_id = ?')
      .get(queryId) as any
    if (!hermeticData) {
      throw new Error('Hermetic analysis not saved')
    }
    console.log(`✓ Hermetic analysis saved (7 laws + instinct)`)

    // Clean up test data
    db.prepare('DELETE FROM living_topics WHERE conversation_id = ?').run(conversationId)
    db.prepare('DELETE FROM hermetic_analysis WHERE conversation_id = ?').run(conversationId)
    console.log(`✓ Cleaned up test data`)

    console.log('\n✅ Living Tree Analyzer: PASSED')
  } catch (error) {
    console.error('❌ Living Tree Analyzer: FAILED')
    console.error(error)
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('   Note: Skipping Opus test - no API key configured')
    } else {
      process.exit(1)
    }
  }
}

testLivingTreeAnalyzer().then(() => {
  // Test 4: API Endpoints
  console.log('\n🌐 TEST 4: API Endpoints')
  console.log('─'.repeat(60))

  console.log('ℹ️  API endpoints should be tested via HTTP requests:')
  console.log('   • GET  /api/living-tree?conversationId=demo_conversation')
  console.log('   • GET  /api/tree-config')
  console.log('   • POST /api/tree-config (save configuration)')
  console.log('   • PATCH /api/tree-config (activate configuration)')
  console.log('   • POST /api/tree-chat (chat with tree)')
  console.log('\n   Run server and test manually or use curl/fetch')

  // Test 5: Summary
  console.log('\n📋 TEST SUMMARY')
  console.log('═'.repeat(60))
  console.log('✅ Database Schema: PASSED')
  console.log('✅ Configuration System: PASSED')
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ Living Tree Analyzer: PASSED')
  } else {
    console.log('⚠️  Living Tree Analyzer: SKIPPED (no API key)')
  }
  console.log('ℹ️  API Endpoints: Manual testing required')

  console.log('\n🎉 Integration Test Complete!')
  console.log('═'.repeat(60))

  console.log('\n📝 Next Steps:')
  console.log('1. Visit http://localhost:3000/living-tree to see the visualization')
  console.log('2. Visit http://localhost:3000/tree-of-life to configure the tree')
  console.log('3. Use Legend Mode in a query to trigger Opus 4.5 analysis')
  console.log('4. Check logs for Living Tree analysis results')

  process.exit(0)
})
