import {
  ModelFamily,
  CompletionRequest,
  CompletionResponse,
  ConsensusResult,
  FlowAResult,
  FlowBResult,
  ResolvedAdvisorLayer,
  ExecutionCallbacks,
} from './models/types.js';
import { ModelAlignmentManager, FIXED_BRAINSTORMER_SLOT_3 } from './models/ModelAlignment.js';
import { ModelProviderFactory, IModelProvider } from './models/ModelProviderFactory.js';
import { CostTracker } from './utils/CostTracker.js';
import { WebSearch } from './tools/WebSearch.js';
import { getSystemPrompt } from './prompts/system-prompts.js';
import { GroundingGuard, type GroundingAlert, type GroundingConfig } from './grounding/index.js';
import { ConversationMemory, type Message } from './memory/ConversationMemory.js';

/**
 * AkhAISystem
 *
 * Super Research Engine with Multi-AI Consensus
 *
 * Features:
 * - Multi-AI consensus with 4 advisors + Mother Base
 * - Automated verification loops (max 3 rounds, 2 min each)
 * - Flow A: Mother Base Decision
 * - Flow B: Sub-Agent Execution (Direct)
 *
 * Architecture:
 * ```
 * Mother Base (Your choice)
 *      │
 *      ▼
 * Advisor Layer (4 AIs)
 * ├── Slot 1: Configurable (Technical)
 * ├── Slot 2: Configurable (Strategic)
 * ├── Slot 3: OpenRouter (Fixed)
 * └── Slot 4: Redactor (= Mother Base)
 *      │
 *      ▼
 * Sub-Agents (= Mother Base)
 * ```
 *
 * Usage:
 * ```typescript
 * const akhai = new AkhAISystem('anthropic');
 *
 * // Set API keys
 * akhai.setApiKeys({
 *   anthropic: 'sk-ant-...',
 *   deepseek: 'sk-...',
 *   openrouter: 'sk-or-...'
 * });
 *
 * // Setup Mother Base
 * akhai.setupMotherBase('claude-sonnet-4-20250514');
 *
 * // Setup Advisor Layer (Slots 1-2, Slot 3 is always OpenRouter, Slot 4 is Mother Base)
 * akhai.setupAdvisorLayer('deepseek', 'qwen');
 *
 * // Register sub-agents
 * akhai.registerSubAgent('CodingAgent');
 * akhai.registerSubAgent('ResearchAgent');
 *
 * // Flow A: Mother Base Decision
 * const result = await akhai.executeMotherBaseFlow('Analyze system architecture');
 *
 * // Flow B: Sub-Agent Execution
 * const agentResult = await akhai.executeSubAgentFlow('Build feature', 'CodingAgent');
 * ```
 */
export class AkhAISystem {
  private alignmentManager: ModelAlignmentManager;
  private providerFactory: ModelProviderFactory;
  private costTracker: CostTracker;
  private webSearch: WebSearch | null = null;

  // Mother Base
  private motherBaseProvider: IModelProvider | null = null;
  private motherBaseModel: string | null = null;

  // Advisor Layer (4 slots)
  private advisorProviders: Map<number, IModelProvider> = new Map();
  private redactorProvider: IModelProvider | null = null;
  private advisorLayerConfig: ResolvedAdvisorLayer | null = null;

  // Sub-Agents
  private subAgentProviders: Map<string, IModelProvider> = new Map();

  // Conversation Memory & Grounding
  private conversationMemory: ConversationMemory;
  private groundingGuard: GroundingGuard;

  /**
   * Create a new AkhAI system
   *
   * @param motherBaseFamily - Model family for Mother Base (any of 10 families)
   */
  constructor(motherBaseFamily: ModelFamily) {
    this.alignmentManager = new ModelAlignmentManager(motherBaseFamily);
    this.providerFactory = new ModelProviderFactory();
    this.costTracker = new CostTracker();
    this.conversationMemory = new ConversationMemory();
    this.groundingGuard = new GroundingGuard();

    console.log(`\n🧠 AkhAI System Initialized`);
    console.log(`   Mother Base Family: ${motherBaseFamily}`);
    console.log(`   Available for Advisor Slots 1-2: ${this.alignmentManager.getAvailableBrainstormerFamilies().join(', ')}`);
    console.log(`   Fixed Slot 3: ${FIXED_BRAINSTORMER_SLOT_3}`);
  }

  /**
   * Set API keys for model providers
   *
   * @param keys - Map of model family to API key
   *
   * @example
   * ```typescript
   * akhai.setApiKeys({
   *   anthropic: 'sk-ant-...',
   *   openai: 'sk-...',
   *   deepseek: 'sk-...',
   *   openrouter: 'sk-or-...'
   * });
   * ```
   */
  setApiKeys(keys: Partial<Record<ModelFamily, string>>): void {
    Object.entries(keys).forEach(([family, key]) => {
      if (key) {
        this.providerFactory.setApiKey(family as ModelFamily, key);
      }
    });

    const keysSet = Object.keys(keys).length;
    console.log(`\n🔑 API Keys Configured: ${keysSet} provider(s)`);
  }

  /**
   * Set Brave Search API key for web search capabilities
   *
   * @param key - Brave Search API key
   *
   * @example
   * ```typescript
   * akhai.setWebSearchKey('BSA...');
   * ```
   */
  setWebSearchKey(key: string): void {
    this.webSearch = new WebSearch(key);
    console.log(`\n🔍 Web Search Configured (Brave API)`);
  }

  /**
   * Search the web for live information
   *
   * @param query - Search query
   * @param count - Number of results (default: 5)
   * @returns Formatted search results string for AI context
   */
  async searchWeb(query: string, count: number = 5): Promise<string> {
    if (!this.webSearch) {
      return '[Web search not configured. Set API key with setWebSearchKey()]';
    }

    try {
      const results = await this.webSearch.search(query, count);
      return this.webSearch.formatForContext(results);
    } catch (error) {
      console.error('Web search error:', error);
      return `[Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }

  /**
   * Setup Mother Base
   *
   * Mother Base is the primary decision-maker and final authority.
   * It uses the family specified in the constructor.
   *
   * @param model - Optional specific model to use (default: provider's default)
   *
   * @example
   * ```typescript
   * akhai.setupMotherBase('claude-sonnet-4-20250514');
   * ```
   */
  setupMotherBase(model?: string): void {
    const family = this.alignmentManager.getMotherBaseFamily();
    const config = this.providerFactory.getProviderConfig(family);

    const selectedModel = model || config.defaultModel;
    this.motherBaseModel = selectedModel;

    this.motherBaseProvider = this.providerFactory.createProvider({
      family,
      model: selectedModel,
    });

    console.log(`\n🏢 Mother Base Ready`);
    console.log(`   Family: ${family}`);
    console.log(`   Model: ${selectedModel}`);
  }

  /**
   * Setup Advisor Layer
   *
   * The Advisor Layer consists of 4 slots:
   * - Slot 1: User-configured brainstormer (must differ from Mother Base)
   * - Slot 2: User-configured brainstormer (must differ from Mother Base)
   * - Slot 3: OpenRouter (FIXED - ensures diversity)
   * - Slot 4: Redactor using Mother Base family (synthesizes advisor outputs)
   *
   * @param slot1Family - Model family for slot 1 (technical perspective)
   * @param slot2Family - Model family for slot 2 (strategic perspective)
   * @returns Resolved advisor layer configuration
   *
   * @example
   * ```typescript
   * // Mother Base: anthropic
   * akhai.setupAdvisorLayer('deepseek', 'qwen');
   * // Result:
   * // Slot 1: deepseek (brainstormer)
   * // Slot 2: qwen (brainstormer)
   * // Slot 3: openrouter (brainstormer, fixed)
   * // Slot 4: anthropic (redactor, aligned with Mother Base)
   * ```
   */
  setupAdvisorLayer(slot1Family: ModelFamily, slot2Family: ModelFamily): ResolvedAdvisorLayer {
    // Get advisor layer configuration (validates rules)
    const config = this.alignmentManager.getAdvisorLayerConfig(slot1Family, slot2Family);
    this.advisorLayerConfig = config;

    // Create providers for slots 1-3 (brainstormers)
    this.advisorProviders.set(1, this.providerFactory.createProvider({ family: config.slot1.family }));
    this.advisorProviders.set(2, this.providerFactory.createProvider({ family: config.slot2.family }));
    this.advisorProviders.set(3, this.providerFactory.createProvider({ family: config.slot3.family }));

    // Create provider for slot 4 (redactor, uses Mother Base family)
    this.redactorProvider = this.providerFactory.createProvider({ family: config.slot4.family });

    console.log(`\n👥 Advisor Layer Ready`);
    console.log(`   Slot 1 (Brainstormer): ${config.slot1.family}`);
    console.log(`   Slot 2 (Brainstormer): ${config.slot2.family}`);
    console.log(`   Slot 3 (Brainstormer): ${config.slot3.family} (fixed)`);
    console.log(`   Slot 4 (Redactor): ${config.slot4.family} (aligned with Mother Base)`);

    return config;
  }

  /**
   * Register a Sub-Agent
   *
   * Sub-Agents are specialized workers that execute tasks.
   * They always use the same family as Mother Base (aligned).
   *
   * @param name - Unique name for the sub-agent
   *
   * @example
   * ```typescript
   * akhai.registerSubAgent('CodingAgent');
   * akhai.registerSubAgent('ResearchAgent');
   * akhai.registerSubAgent('AnalysisAgent');
   * ```
   */
  registerSubAgent(name: string): void {
    if (this.subAgentProviders.has(name)) {
      console.warn(`⚠️  Sub-Agent '${name}' already registered, skipping`);
      return;
    }

    const family = this.alignmentManager.getSubAgentFamily();
    this.subAgentProviders.set(name, this.providerFactory.createProvider({ family }));

    console.log(`\n🤖 Sub-Agent Registered: ${name}`);
    console.log(`   Family: ${family} (aligned with Mother Base)`);
  }

  /**
   * List all registered sub-agents
   *
   * @returns Array of sub-agent names
   */
  listSubAgents(): string[] {
    return Array.from(this.subAgentProviders.keys());
  }

  /**
   * Get system status
   *
   * @returns Status object with initialization state
   */
  getStatus(): {
    motherBase: { initialized: boolean; family: ModelFamily; model: string | null };
    advisorLayer: { initialized: boolean; config: ResolvedAdvisorLayer | null };
    subAgents: { count: number; agents: string[] };
  } {
    return {
      motherBase: {
        initialized: this.motherBaseProvider !== null,
        family: this.alignmentManager.getMotherBaseFamily(),
        model: this.motherBaseModel,
      },
      advisorLayer: {
        initialized: this.advisorLayerConfig !== null,
        config: this.advisorLayerConfig,
      },
      subAgents: {
        count: this.subAgentProviders.size,
        agents: this.listSubAgents(),
      },
    };
  }

  /**
   * Ask Mother Base directly
   *
   * Utility method for direct Mother Base queries without consensus.
   *
   * @param request - Completion request
   * @returns Mother Base response
   * @throws Error if Mother Base not initialized
   */
  async askMotherBase(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.motherBaseProvider) {
      throw new Error('Mother Base not initialized. Call setupMotherBase() first.');
    }

    const response = await this.motherBaseProvider.complete(request);

    // Track usage
    if (response.usage) {
      this.costTracker.addUsage(
        response.family,
        response.model,
        response.usage.inputTokens,
        response.usage.outputTokens
      );
    }

    return response;
  }

  /**
   * Get cost tracking report
   *
   * Returns detailed information about API usage and costs.
   *
   * @returns Cost tracking data including total cost, token usage, and per-provider breakdown
   */
  getCostReport() {
    const providerUsage = this.costTracker.getUsageByProvider();
    const totalTokens = this.costTracker.getTotalTokens();
    const totalCost = this.costTracker.getTotalCost();

    return {
      totalCost,
      totalTokens,
      providerUsage: Array.from(providerUsage.values()),
      formattedReport: this.costTracker.getReport(),
    };
  }

  /**
   * Reset cost tracking
   *
   * Clears all usage history and resets cost counters to zero.
   */
  resetCostTracking(): void {
    this.costTracker.reset();
  }

  /**
   * Print system summary
   */
  printSummary(): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🧠 AkhAI System Summary');
    console.log('='.repeat(60));

    const status = this.getStatus();

    console.log(`\n🏢 Mother Base:`);
    console.log(`   Status: ${status.motherBase.initialized ? '✅ Ready' : '❌ Not initialized'}`);
    console.log(`   Family: ${status.motherBase.family}`);
    console.log(`   Model: ${status.motherBase.model || 'Not set'}`);

    console.log(`\n👥 Advisor Layer:`);
    console.log(`   Status: ${status.advisorLayer.initialized ? '✅ Ready' : '❌ Not initialized'}`);
    if (status.advisorLayer.config) {
      const cfg = status.advisorLayer.config;
      console.log(`   Slot 1: ${cfg.slot1.family} (${cfg.slot1.role})`);
      console.log(`   Slot 2: ${cfg.slot2.family} (${cfg.slot2.role})`);
      console.log(`   Slot 3: ${cfg.slot3.family} (${cfg.slot3.role}, fixed)`);
      console.log(`   Slot 4: ${cfg.slot4.family} (${cfg.slot4.role}, aligned)`);
    }

    console.log(`\n🤖 Sub-Agents:`);
    console.log(`   Count: ${status.subAgents.count}`);
    if (status.subAgents.count > 0) {
      status.subAgents.agents.forEach((agent, i) => {
        console.log(`   ${i + 1}. ${agent}`);
      });
    }

    console.log(`\n${'='.repeat(60)}\n`);
  }

  // ============================================================================
  // CONSENSUS METHODS
  // ============================================================================

  /**
   * Execute internal consensus among brainstormers (max 3 rounds, 2 min each)
   *
   * The advisor layer (slots 1-3) debates the query until consensus is reached
   * or maximum rounds are exhausted. The redactor (slot 4) checks consensus.
   *
   * @param query - The query to reach consensus on
   * @param context - Optional context (feedback from Mother Base or Sub-Agent)
   * @returns Consensus result with all rounds and final positions
   *
   * @example
   * ```typescript
   * const consensus = await akhai.executeInternalConsensus(
   *   'What is the best database for real-time chat?',
   *   { fromMotherBase: 'Consider scalability' }
   * );
   * ```
   */
  async executeInternalConsensus(
    query: string,
    context?: { fromMotherBase?: string; fromSubAgent?: { agent: string; feedback: string } },
    callbacks?: ExecutionCallbacks
  ): Promise<ConsensusResult> {
    if (this.advisorProviders.size === 0 || !this.redactorProvider) {
      throw new Error('Advisor Layer not initialized. Call setupAdvisorLayer() first.');
    }

    // Search the web for latest information (only on first round)
    let webContext = '';
    if (this.webSearch) {
      console.log('\n   🔍 Searching web for latest information...');
      try {
        const searchResults = await this.searchWeb(query, 5);
        webContext = `\n\n=== Latest Web Research (${new Date().toISOString().split('T')[0]}) ===\n${searchResults}\n`;
        console.log(`   ✅ Web search complete`);
      } catch (error) {
        console.log(`   ⚠️  Web search failed: ${error}`);
      }
    }

    const maxRounds = 3;
    const rounds: ConsensusResult['rounds'] = [];
    let consensusReachedAt: number | null = null;

    console.log('\n   🔄 Internal Consensus (max 3 rounds, 2 min each)...');

    for (let round = 1; round <= maxRounds; round++) {
      console.log(`\n   Round ${round}/${maxRounds}`);
      const responses: ConsensusResult['rounds'][0]['responses'] = [];

      // Get responses from all 3 brainstormer slots
      for (const [slot, provider] of this.advisorProviders) {
        // Notify advisor start
        callbacks?.onAdvisorStart?.(slot, provider.family, round);

        const prompt = this.buildRoundPrompt(
          round,
          query + webContext,
          rounds.length > 0 ? rounds[rounds.length - 1].responses.map(r => `[Slot ${r.slot}]: ${r.response}`).join('\n') : '',
          context?.fromMotherBase
            ? `Mother Base feedback: ${context.fromMotherBase}`
            : context?.fromSubAgent
            ? `${context.fromSubAgent.agent} feedback: ${context.fromSubAgent.feedback}`
            : ''
        );

        // Get appropriate system prompt based on slot
        const systemPrompt = slot === 1 ? getSystemPrompt('slot1') : slot === 2 ? getSystemPrompt('slot2') : getSystemPrompt('slot3');

        // Graceful fallback: If advisor fails, use fallback response instead of failing entire query
        let response;
        try {
          response = await provider.complete({
            messages: [{ role: 'user', content: prompt }],
            systemPrompt
          });

          // Track usage
          if (response.usage) {
            this.costTracker.addUsage(
              response.family,
              response.model,
              response.usage.inputTokens,
              response.usage.outputTokens
            );
          }

          responses.push({ slot, family: response.family, response: response.content });

          // Notify advisor complete
          callbacks?.onAdvisorComplete?.(slot, response.family, round, response.content);

          console.log(`      Slot ${slot} (${response.family}): ${response.content.substring(0, 60)}...`);
        } catch (error: any) {
          console.error(`      ⚠️  Slot ${slot} (${provider.family}) failed:`, error.message);
          console.log(`      Using fallback response for slot ${slot}`);

          // Use fallback response - still include in consensus
          const fallbackContent = `[${provider.family} temporarily unavailable - skipped this round due to: ${error.message}]`;
          responses.push({
            slot,
            family: provider.family,
            response: fallbackContent
          });

          // Notify with fallback
          callbacks?.onAdvisorComplete?.(slot, provider.family, round, fallbackContent);
        }
      }

      // Check if consensus reached
      const consensusReached = await this.checkConsensus(responses);

      // Notify consensus check
      callbacks?.onConsensusCheck?.(round, consensusReached);

      rounds.push({ round, responses, consensusReached });

      // Notify round complete
      callbacks?.onRoundComplete?.(round, maxRounds);

      if (consensusReached) {
        consensusReachedAt = round;
        console.log(`   ✅ Consensus reached at round ${round}`);
        break;
      }

      if (round === maxRounds) {
        console.log('   ⚠️  Max rounds reached - forcing conclusion');
      }
    }

    return {
      rounds,
      totalRounds: rounds.length,
      consensusReachedAt,
      finalConsensus: rounds[rounds.length - 1].responses.map(r => ({
        slot: r.slot,
        family: r.family,
        finalPosition: r.response,
      })),
    };
  }

  /**
   * Check if consensus is reached among responses
   *
   * Uses the redactor to analyze responses and determine if there's agreement.
   *
   * @param responses - Array of responses from brainstormers
   * @returns true if consensus reached, false otherwise
   * @private
   */
  private async checkConsensus(
    responses: Array<{ slot: number; family: string; response: string }>
  ): Promise<boolean> {
    if (!this.redactorProvider) {
      return false;
    }

    const input = responses.map(r => `[Slot ${r.slot}]:\n${r.response}`).join('\n\n');

    const check = await this.redactorProvider.complete({
      messages: [{ role: 'user', content: input }],
      systemPrompt: 'Analyze the responses. Reply ONLY "CONSENSUS" if they agree on the core recommendation, or "NO_CONSENSUS" if they fundamentally disagree.',
    });

    // Track usage
    if (check.usage) {
      this.costTracker.addUsage(
        check.family,
        check.model,
        check.usage.inputTokens,
        check.usage.outputTokens
      );
    }

    return check.content.trim().toUpperCase() === 'CONSENSUS';
  }

  /**
   * Build prompt for a consensus round
   *
   * Constructs the prompt based on round number and previous context.
   *
   * @param round - Current round number
   * @param query - Original query
   * @param prevContext - Previous round responses
   * @param extContext - External context (Mother Base or Sub-Agent feedback)
   * @returns Prompt string
   * @private
   */
  private buildRoundPrompt(round: number, query: string, prevContext: string, extContext: string): string {
    let prompt = `Query: ${query}`;

    if (extContext) {
      prompt += `\n\n${extContext}`;
    }

    if (round === 1) {
      return (
        prompt +
        '\n\nThis is round 1. Provide your initial perspective and end with [AGREE] if you support the conclusion or [DISAGREE] if you have concerns.'
      );
    }

    return (
      `${prompt}\n\nPrevious responses:\n${prevContext}\n\n` +
      `This is round ${round}. Refine your position considering others' views. End with [AGREE] or [DISAGREE].`
    );
  }

  /**
   * Redact (synthesize) advisor outputs into a single recommendation
   *
   * The redactor (slot 4, uses Mother Base family) synthesizes the
   * brainstormers' outputs into a coherent recommendation.
   *
   * @param inputs - Array of advisor outputs with slot and family info
   * @returns Redacted output with family and synthesized content
   *
   * @example
   * ```typescript
   * const redacted = await akhai.redact([
   *   { slot: 1, family: 'deepseek', response: 'Use PostgreSQL for reliability' },
   *   { slot: 2, family: 'qwen', response: 'Consider Redis for speed' },
   *   { slot: 3, family: 'openrouter', response: 'Hybrid approach with both' }
   * ]);
   * ```
   */
  async redact(
    inputs: Array<{ slot: number; family: string; response: string }>,
    callbacks?: ExecutionCallbacks
  ): Promise<{ family: string; synthesizedOutput: string }> {
    if (!this.redactorProvider) {
      throw new Error('Redactor not initialized. Call setupAdvisorLayer() first.');
    }

    // Notify redactor start
    callbacks?.onRedactorStart?.();

    const content = inputs.map(i => `[Slot ${i.slot} - ${i.family}]:\n${i.response}`).join('\n\n---\n\n');

    const result = await this.redactorProvider.complete({
      messages: [{ role: 'user', content }],
      systemPrompt: getSystemPrompt('redactor'),
    });

    // Track usage
    if (result.usage) {
      this.costTracker.addUsage(
        result.family,
        result.model,
        result.usage.inputTokens,
        result.usage.outputTokens
      );
    }

    console.log(`\n   📋 Redactor (${result.family}): ${result.content.substring(0, 80)}...`);

    // Notify redactor complete
    callbacks?.onRedactorComplete?.(result.content, result.family);

    return { family: result.family, synthesizedOutput: result.content };
  }

  // ============================================================================
  // FLOW METHODS
  // ============================================================================

  /**
   * Execute Flow A: Mother Base Decision
   *
   * Flow: User → Mother Base → Layer(1-3) → Redactor → Mother Base
   *
   * Process:
   * 1. Mother Base receives query
   * 2. Advisor Layer reaches consensus (max 3 rounds, 2 min each)
   * 3. Redactor synthesizes advisor outputs
   * 4. Mother Base reviews and approves or requests revision
   * 5. Repeat steps 2-4 until approval or max exchanges (3)
   *
   * @param query - The query or task for Mother Base to decide on
   * @returns Flow A result with consensus, redactor output, and Mother Base exchanges
   *
   * @example
   * ```typescript
   * const result = await akhai.executeMotherBaseFlow(
   *   'Should we use microservices or monolith for our new app?'
   * );
   * console.log(`Decision: ${result.finalDecision}`);
   * console.log(`Approved at exchange: ${result.approvedAt}`);
   * ```
   */
  async executeMotherBaseFlow(query: string, callbacks?: ExecutionCallbacks): Promise<FlowAResult> {
    if (!this.motherBaseProvider) {
      throw new Error('Mother Base not initialized. Call setupMotherBase() first.');
    }
    if (this.advisorProviders.size === 0 || !this.redactorProvider) {
      throw new Error('Advisor Layer not initialized. Call setupAdvisorLayer() first.');
    }

    console.log('\n🚀 FLOW A: Mother Base Decision');
    console.log(`   Path: User → Mother Base → Layer(1-3) → Redactor → Mother Base`);
    console.log(`   Query: ${query}`);

    const maxExchanges = 3;
    const exchanges: FlowAResult['motherBaseExchanges'] = [];
    let feedback: string | undefined;
    let approvedAt: number | null = null;
    let lastConsensus!: ConsensusResult;
    let lastRedactorOutput = '';

    for (let exchange = 1; exchange <= maxExchanges; exchange++) {
      console.log(`\n   ${'═'.repeat(60)}`);
      console.log(`   Exchange ${exchange}/${maxExchanges}`);
      console.log(`   ${'═'.repeat(60)}`);

      // Step 1: Advisor Layer consensus
      const consensus = await this.executeInternalConsensus(query, { fromMotherBase: feedback }, callbacks);
      lastConsensus = consensus;

      // Step 2: Redactor synthesizes
      const redacted = await this.redact(
        consensus.finalConsensus.map(p => ({
          slot: p.slot,
          family: p.family,
          response: p.finalPosition,
        })),
        callbacks
      );
      lastRedactorOutput = redacted.synthesizedOutput;

      // Step 3: Mother Base reviews
      console.log('\n   📤 Redactor → Mother Base');
      const mbResponse = await this.askMotherBase({
        messages: [
          {
            role: 'user',
            content:
              `Query: ${query}\n\n` +
              `Advisor Output:\n${redacted.synthesizedOutput}\n\n` +
              `Review this recommendation. Reply "APPROVE" if acceptable, or "REVISION: [feedback]" if changes needed.`,
          },
        ],
        systemPrompt: getSystemPrompt('mother-base'),
      });

      console.log(`   🏢 Mother Base: ${mbResponse.content.substring(0, 80)}...`);

      const approved = !mbResponse.content.toUpperCase().includes('REVISION');
      exchanges.push({
        advisorOutput: redacted.synthesizedOutput,
        motherBaseResponse: mbResponse.content,
        approved,
      });

      // Notify Mother Base review
      callbacks?.onMotherBaseReview?.(exchange, approved, mbResponse.content);

      if (approved) {
        approvedAt = exchange;
        console.log(`\n   ✅ APPROVED at exchange ${exchange}`);
        break;
      }

      if (exchange === maxExchanges) {
        console.log('\n   ⚠️  Max exchanges reached - forcing decision');
      } else {
        console.log('   ↩️  REVISION requested');
        feedback = mbResponse.content;
      }
    }

    console.log('\n✅ Flow A Complete');
    console.log(`   Total Exchanges: ${exchanges.length}`);
    console.log(`   Approved: ${approvedAt !== null ? 'Yes' : 'No (forced)'}`);

    // ========================================================================
    // GROUNDING GUARD CHECK
    // ========================================================================
    const finalDecision = exchanges[exchanges.length - 1].motherBaseResponse;

    // Add to conversation memory
    this.conversationMemory.addMessage('user', query);
    this.conversationMemory.addMessage('assistant', finalDecision);

    // Check if grounding should trigger
    const memoryStats = this.conversationMemory.getStats();
    const shouldTrigger = this.groundingGuard.shouldTrigger(memoryStats);

    let groundingAlerts: GroundingAlert[] = [];

    if (shouldTrigger) {
      console.log('\n🛡️  Running Grounding Guard check...');
      const conversationHistory = this.conversationMemory.getFullHistory();
      const groundingResult = await this.groundingGuard.check(conversationHistory);

      if (groundingResult.alerts.length > 0) {
        console.log(`   ⚠️  ${groundingResult.alerts.length} grounding alert(s) detected`);
        groundingAlerts = groundingResult.alerts;

        // Invoke callbacks for each alert
        for (const alert of groundingAlerts) {
          callbacks?.onGroundingAlert?.(alert);
        }
      } else {
        console.log('   ✅ No grounding issues detected');
      }
    }

    return {
      layerConsensus: lastConsensus,
      redactorOutput: lastRedactorOutput,
      motherBaseExchanges: exchanges,
      totalMotherBaseExchanges: exchanges.length,
      approvedAt,
      finalDecision,
      groundingAlerts,
    };
  }

  /**
   * Execute Flow B: Sub-Agent Execution (DIRECT)
   *
   * Flow: User → Sub-Agent → Layer(1-3) → Redactor → Sub-Agent → Mother Base
   *
   * Process:
   * Phase 1: Sub-Agent ↔ Advisor Layer (max 3 exchanges)
   *   1. Advisor Layer reaches consensus (max 3 rounds, 2 min each)
   *   2. Redactor synthesizes advisor outputs
   *   3. Sub-Agent executes based on guidance
   *   4. Repeat until Sub-Agent completes or max exchanges
   *
   * Phase 2: Sub-Agent → Mother Base Approval (max 3 exchanges)
   *   1. Sub-Agent submits work to Mother Base
   *   2. Mother Base approves or requests revision
   *   3. Repeat until approval or max exchanges
   *
   * @param query - The task for the Sub-Agent to execute
   * @param agentName - Name of the Sub-Agent to use
   * @returns Flow B result with both phases' exchanges and final output
   *
   * @example
   * ```typescript
   * const result = await akhai.executeSubAgentFlow(
   *   'Build a REST API endpoint for user registration',
   *   'CodingAgent'
   * );
   * console.log(`Final Output: ${result.finalOutput}`);
   * console.log(`Sub-Agent completed: ${result.subAgentCompletedAt !== null}`);
   * console.log(`Mother Base approved: ${result.motherBaseApproval.approvedAt !== null}`);
   * ```
   */
  async executeSubAgentFlow(query: string, agentName: string, callbacks?: ExecutionCallbacks): Promise<FlowBResult> {
    if (!this.motherBaseProvider) {
      throw new Error('Mother Base not initialized. Call setupMotherBase() first.');
    }
    if (this.advisorProviders.size === 0 || !this.redactorProvider) {
      throw new Error('Advisor Layer not initialized. Call setupAdvisorLayer() first.');
    }

    const agentProvider = this.subAgentProviders.get(agentName);
    if (!agentProvider) {
      throw new Error(
        `Sub-Agent '${agentName}' not registered. Available: ${this.listSubAgents().join(', ')}`
      );
    }

    console.log(`\n🚀 FLOW B: Sub-Agent Execution (${agentName}) - DIRECT`);
    console.log(`   Path: User → ${agentName} → Layer(1-3) → Redactor → ${agentName} → Mother Base`);
    console.log(`   Task: ${query}`);

    const maxExchanges = 3;
    const subAgentExchanges: FlowBResult['subAgentExchanges'] = [];
    let subAgentFeedback: { agent: string; feedback: string } | undefined;
    let subAgentCompletedAt: number | null = null;
    let lastConsensus!: ConsensusResult;
    let lastRedactorOutput = '';
    let lastSubAgentWork = '';

    // ========================================================================
    // PHASE 1: Sub-Agent ↔ Advisor Layer
    // ========================================================================
    console.log('\n   ═══════════════════════════════════════════════════════════');
    console.log('   PHASE 1: Sub-Agent ↔ Advisor Layer');
    console.log('   ═══════════════════════════════════════════════════════════');

    for (let exchange = 1; exchange <= maxExchanges; exchange++) {
      console.log(`\n   ─── Exchange ${exchange}/${maxExchanges} ───`);

      // Step 1: Advisor Layer consensus
      const consensus = await this.executeInternalConsensus(query, { fromSubAgent: subAgentFeedback }, callbacks);
      lastConsensus = consensus;

      // Step 2: Redactor synthesizes
      const redacted = await this.redact(
        consensus.finalConsensus.map(p => ({
          slot: p.slot,
          family: p.family,
          response: p.finalPosition,
        })),
        callbacks
      );
      lastRedactorOutput = redacted.synthesizedOutput;

      // Step 3: Sub-Agent executes
      console.log(`\n   📤 Redactor → ${agentName}`);

      // Notify sub-agent start
      callbacks?.onSubAgentStart?.(agentName, exchange);

      const agentResponse = await agentProvider.complete({
        messages: [
          {
            role: 'user',
            content: `Guidance:\n${redacted.synthesizedOutput}\n\nExecute task: ${query}\n\nReply with your work or "NEED: [clarification]" if you need more guidance.`,
          },
        ],
        systemPrompt: getSystemPrompt('mother-base'), // Sub-agents use Mother Base prompt
      });

      // Track usage
      if (agentResponse.usage) {
        this.costTracker.addUsage(
          agentResponse.family,
          agentResponse.model,
          agentResponse.usage.inputTokens,
          agentResponse.usage.outputTokens
        );
      }

      console.log(`   🤖 ${agentName}: ${agentResponse.content.substring(0, 80)}...`);

      lastSubAgentWork = agentResponse.content;

      const complete =
        !agentResponse.content.toUpperCase().includes('NEED') &&
        !agentResponse.content.toUpperCase().includes('CLARIF');

      // Notify sub-agent complete
      callbacks?.onSubAgentComplete?.(agentName, exchange, agentResponse.content, complete);

      subAgentExchanges.push({
        guidance: redacted.synthesizedOutput,
        agentResponse: agentResponse.content,
        complete,
      });

      if (complete) {
        subAgentCompletedAt = exchange;
        console.log(`\n   ✅ ${agentName} completed work`);
        break;
      }

      if (exchange === maxExchanges) {
        console.log(`\n   ⚠️  Max exchanges reached - forcing completion`);
      } else {
        console.log(`   ↩️  ${agentName} needs clarification`);
        subAgentFeedback = { agent: agentName, feedback: agentResponse.content };
      }
    }

    // ========================================================================
    // PHASE 2: Sub-Agent → Mother Base Approval
    // ========================================================================
    console.log('\n   ═══════════════════════════════════════════════════════════');
    console.log('   PHASE 2: Sub-Agent → Mother Base Approval');
    console.log('   ═══════════════════════════════════════════════════════════');

    const approvalExchanges: FlowBResult['motherBaseApproval']['exchanges'] = [];
    let approvedAt: number | null = null;
    let currentWork = lastSubAgentWork;

    for (let exchange = 1; exchange <= maxExchanges; exchange++) {
      console.log(`\n   ─── Approval ${exchange}/${maxExchanges} ───`);

      console.log(`\n   📤 ${agentName} → Mother Base`);
      const mbResponse = await this.askMotherBase({
        messages: [
          {
            role: 'user',
            content:
              `${agentName} work:\n${currentWork}\n\n` +
              `Review this work. Reply "APPROVE" if acceptable, or "REVISION: [feedback]" if changes needed.`,
          },
        ],
        systemPrompt: getSystemPrompt('mother-base'),
      });

      console.log(`   🏢 Mother Base: ${mbResponse.content.substring(0, 80)}...`);

      const approved = !mbResponse.content.toUpperCase().includes('REVISION');

      // Notify Mother Base review
      callbacks?.onMotherBaseReview?.(exchange, approved, mbResponse.content);

      approvalExchanges.push({
        subAgentWork: currentWork,
        motherBaseResponse: mbResponse.content,
        approved,
      });

      if (approved) {
        approvedAt = exchange;
        console.log('\n   ✅ Mother Base APPROVED');
        break;
      }

      if (exchange === maxExchanges) {
        console.log('\n   ⚠️  Max exchanges reached - forcing approval');
      } else {
        console.log('   ↩️  REVISION requested');
        const revision = await agentProvider.complete({
          messages: [
            {
              role: 'user',
              content: `Revise based on: ${mbResponse.content}\n\nOriginal: ${currentWork}`,
            },
          ],
          systemPrompt: getSystemPrompt('mother-base'), // Sub-agents use Mother Base prompt
        });

        // Track usage
        if (revision.usage) {
          this.costTracker.addUsage(
            revision.family,
            revision.model,
            revision.usage.inputTokens,
            revision.usage.outputTokens
          );
        }

        currentWork = revision.content;
        console.log(`   🤖 ${agentName} (revised): ${currentWork.substring(0, 80)}...`);
      }
    }

    console.log('\n✅ Flow B Complete');
    console.log(`   Phase 1 Exchanges: ${subAgentExchanges.length}`);
    console.log(`   Phase 2 Exchanges: ${approvalExchanges.length}`);
    console.log(`   Sub-Agent Completed: ${subAgentCompletedAt !== null ? 'Yes' : 'No (forced)'}`);
    console.log(`   Mother Base Approved: ${approvedAt !== null ? 'Yes' : 'No (forced)'}`);

    // ========================================================================
    // GROUNDING GUARD CHECK
    // ========================================================================
    const finalOutput = approvalExchanges[approvalExchanges.length - 1].motherBaseResponse;

    // Add to conversation memory
    this.conversationMemory.addMessage('user', query);
    this.conversationMemory.addMessage('assistant', finalOutput);

    // Check if grounding should trigger
    const memoryStats = this.conversationMemory.getStats();
    const shouldTrigger = this.groundingGuard.shouldTrigger(memoryStats);

    let groundingAlerts: GroundingAlert[] = [];

    if (shouldTrigger) {
      console.log('\n🛡️  Running Grounding Guard check...');
      const conversationHistory = this.conversationMemory.getFullHistory();
      const groundingResult = await this.groundingGuard.check(conversationHistory);

      if (groundingResult.alerts.length > 0) {
        console.log(`   ⚠️  ${groundingResult.alerts.length} grounding alert(s) detected`);
        groundingAlerts = groundingResult.alerts;

        // Invoke callbacks for each alert
        for (const alert of groundingAlerts) {
          callbacks?.onGroundingAlert?.(alert);
        }
      } else {
        console.log('   ✅ No grounding issues detected');
      }
    }

    return {
      layerConsensus: lastConsensus,
      redactorOutput: lastRedactorOutput,
      subAgentExchanges,
      totalSubAgentExchanges: subAgentExchanges.length,
      subAgentCompletedAt,
      motherBaseApproval: {
        exchanges: approvalExchanges,
        totalExchanges: approvalExchanges.length,
        approvedAt,
      },
      finalOutput,
      groundingAlerts,
    };
  }
}
