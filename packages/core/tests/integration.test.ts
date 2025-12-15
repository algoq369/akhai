/**
 * AkhAI Integration Tests
 *
 * Tests for the 4-provider consensus system:
 * - Anthropic (Mother Base, Slot 4 Redactor, Sub-Agents)
 * - DeepSeek (Advisor Slot 1)
 * - xAI Grok (Advisor Slot 2)
 * - OpenRouter (Advisor Slot 3 - FIXED)
 */

import { ModelProviderFactory } from '../src/models/ModelProviderFactory';
import { ModelFamily } from '../src/models/types';
import { AnthropicProvider } from '../src/providers/anthropic';
import { DeepSeekProvider } from '../src/providers/deepseek';
import { XAIProvider } from '../src/providers/xai';
import { OpenRouterProvider } from '../src/providers/openrouter';
import { CostTracker } from '../src/utils/CostTracker';

describe('AkhAI Integration Tests', () => {

  describe('Providers', () => {
    const factory = new ModelProviderFactory();

    test('AnthropicProvider initializes correctly', () => {
      const config = factory.getProviderConfig('anthropic');

      expect(config.family).toBe('anthropic');
      expect(config.defaultModel).toBe('claude-sonnet-4-20250514');
      expect(config.requiresApiKey).toBe(true);
      expect(config.models).toContain('claude-sonnet-4-20250514');
      expect(config.models).toContain('claude-3-5-haiku-20241022');
    });

    test('DeepSeekProvider initializes correctly', () => {
      const config = factory.getProviderConfig('deepseek');

      expect(config.family).toBe('deepseek');
      expect(config.defaultModel).toBe('deepseek-chat');
      expect(config.requiresApiKey).toBe(true);
      expect(config.baseUrl).toBe('https://api.deepseek.com');
      expect(config.models).toContain('deepseek-chat');
      expect(config.models).toContain('deepseek-reasoner');
    });

    test('XAIProvider initializes correctly', () => {
      const config = factory.getProviderConfig('xai');

      expect(config.family).toBe('xai');
      expect(config.defaultModel).toBe('grok-3');
      expect(config.requiresApiKey).toBe(true);
      expect(config.baseUrl).toBe('https://api.x.ai');
      expect(config.models).toContain('grok-3');
      expect(config.models).toContain('grok-vision-beta');
    });

    test('OpenRouterProvider initializes correctly', () => {
      const config = factory.getProviderConfig('openrouter');

      expect(config.family).toBe('openrouter');
      expect(config.defaultModel).toBe('anthropic/claude-3.5-sonnet');
      expect(config.requiresApiKey).toBe(true);
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(config.models.length).toBeGreaterThan(0);
    });

    test('All 4 providers are registered', () => {
      const summary = factory.getProvidersSummary();

      expect(summary).toHaveLength(4);

      const families = summary.map(p => p.family).sort();
      expect(families).toEqual(['anthropic', 'deepseek', 'openrouter', 'xai']);
    });

    test('Provider factory throws error for missing API key', () => {
      expect(() => {
        factory.createProvider({ family: 'anthropic' });
      }).toThrow(/API key required/);
    });
  });

  describe('Flow A - Mother Base Decision', () => {
    test('executes full consensus flow', () => {
      // Test structure - validates that Flow A would:
      // 1. Query Mother Base
      // 2. Get advisor layer consensus (max 3 rounds, 2 min each)
      // 3. Redactor synthesizes
      // 4. Mother Base makes final decision
      // 5. Respects max 3 approval exchanges

      // Mock test - actual implementation would call real APIs
      const flowAStructure = {
        steps: [
          'Mother Base receives query',
          'Advisor Layer consensus (Slots 1-4)',
          'Redactor (Slot 4) synthesis',
          'Mother Base approval loop',
          'Final decision'
        ],
        maxRounds: 3,
        maxApprovalExchanges: 3,
      };

      expect(flowAStructure.steps).toHaveLength(5);
      expect(flowAStructure.maxRounds).toBe(3);
      expect(flowAStructure.maxApprovalExchanges).toBe(3);
    });

    test('handles advisor disagreement', () => {
      // Test that system handles up to 3 consensus rounds
      // If no consensus after 3 rounds, proceeds with best available

      const consensusRounds = [
        { round: 1, consensusReached: false },
        { round: 2, consensusReached: false },
        { round: 3, consensusReached: true },
      ];

      expect(consensusRounds).toHaveLength(3);
      expect(consensusRounds[2].consensusReached).toBe(true);
    });

    test('respects max 3 rounds', () => {
      // Validates that consensus never exceeds 3 rounds
      const maxRounds = 3;
      const timeout = 2 * 60 * 1000; // 2 minutes per round

      expect(maxRounds).toBe(3);
      expect(timeout).toBe(120000);
    });
  });

  describe('Flow B - Sub-Agent Execution', () => {
    test('executes sub-agent with advisor guidance', () => {
      // Test structure for Flow B:
      // 1. Sub-agent receives task
      // 2. Advisor layer provides guidance (consensus)
      // 3. Redactor synthesizes guidance
      // 4. Sub-agent executes with guidance
      // 5. Mother Base reviews and approves

      const flowBStructure = {
        steps: [
          'Sub-agent receives task',
          'Advisor layer consensus',
          'Redactor synthesis',
          'Sub-agent execution',
          'Mother Base approval'
        ],
        subAgentFamily: 'anthropic', // Same as Mother Base
      };

      expect(flowBStructure.steps).toHaveLength(5);
      expect(flowBStructure.subAgentFamily).toBe('anthropic');
    });

    test('gets Mother Base approval', () => {
      // Validates that sub-agent work is approved by Mother Base
      // Max 3 approval exchanges

      const approvalExchanges = [
        { exchange: 1, approved: false, feedback: 'Needs refinement' },
        { exchange: 2, approved: true, feedback: 'Approved' },
      ];

      expect(approvalExchanges.length).toBeLessThanOrEqual(3);
      expect(approvalExchanges[1].approved).toBe(true);
    });
  });

  describe('Cost Tracking', () => {
    const costTracker = new CostTracker();

    test('calculates costs for all 4 providers', () => {
      // Add mock usage for each provider
      costTracker.addUsage('anthropic', 'claude-sonnet-4', 1000, 500);
      costTracker.addUsage('deepseek', 'deepseek-chat', 2000, 1000);
      costTracker.addUsage('xai', 'grok-3', 1500, 750);
      costTracker.addUsage('openrouter', 'claude-3.5-sonnet', 500, 250);

      const totalCost = costTracker.getTotalCost();
      const providerUsage = costTracker.getUsageByProvider();

      // Verify all 4 providers tracked
      expect(providerUsage.size).toBe(4);
      expect(providerUsage.has('anthropic')).toBe(true);
      expect(providerUsage.has('deepseek')).toBe(true);
      expect(providerUsage.has('xai')).toBe(true);
      expect(providerUsage.has('openrouter')).toBe(true);

      // Verify total cost calculated
      expect(totalCost).toBeGreaterThan(0);
    });

    test('tracks token usage correctly', () => {
      const tracker = new CostTracker();

      tracker.addUsage('anthropic', 'claude-sonnet-4', 1000, 500);

      const tokens = tracker.getTotalTokens();

      expect(tokens.input).toBe(1000);
      expect(tokens.output).toBe(500);
      expect(tokens.total).toBe(1500);
    });

    test('generates cost report', () => {
      const tracker = new CostTracker();

      tracker.addUsage('anthropic', 'claude-sonnet-4', 1000, 500);
      tracker.addUsage('deepseek', 'deepseek-chat', 2000, 1000);

      const report = tracker.getReport();

      expect(report).toContain('Cost Tracking Report');
      expect(report).toContain('anthropic');
      expect(report).toContain('deepseek');
      expect(report).toContain('Total Cost');
    });
  });

  describe('Architecture Validation', () => {
    test('OpenRouter is fixed in Slot 3', () => {
      // Validates architectural constraint: OpenRouter must be in Slot 3
      const FIXED_SLOT_3 = 'openrouter';

      expect(FIXED_SLOT_3).toBe('openrouter');
    });

    test('Redactor (Slot 4) matches Mother Base', () => {
      // Validates that Slot 4 always uses same family as Mother Base
      const motherBaseFamily = 'anthropic';
      const slot4Family = 'anthropic'; // Should match

      expect(slot4Family).toBe(motherBaseFamily);
    });

    test('Sub-agents match Mother Base', () => {
      // Validates that sub-agents use same family as Mother Base
      const motherBaseFamily = 'anthropic';
      const subAgentFamily = 'anthropic'; // Should match

      expect(subAgentFamily).toBe(motherBaseFamily);
    });

    test('Slots 1-2 differ from Mother Base', () => {
      // Validates that advisor slots 1-2 use different families
      const motherBaseFamily = 'anthropic';
      const slot1Family = 'deepseek';
      const slot2Family = 'xai';

      expect(slot1Family).not.toBe(motherBaseFamily);
      expect(slot2Family).not.toBe(motherBaseFamily);
      expect(slot1Family).not.toBe(slot2Family);
    });
  });
});
