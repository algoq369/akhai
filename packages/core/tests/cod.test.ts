/**
 * Chain of Draft (CoD) Tests
 *
 * Validates the CoD methodology implementation and verifies:
 * - Concise reasoning generation
 * - Token usage reduction vs CoT (92% savings target)
 * - Answer extraction from various formats
 * - Cost calculation accuracy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeChainOfDraft, type CoDConfig } from '../src/methodologies/cod';
import type { BaseProvider } from '../src/providers/base';

describe('Chain of Draft (CoD) Methodology', () => {
  let mockProvider: BaseProvider;

  beforeEach(() => {
    mockProvider = {
      name: 'test-provider',
      family: 'deepseek',
      generate: vi.fn(),
      complete: vi.fn(),
    } as unknown as BaseProvider;
  });

  describe('Concise Reasoning', () => {
    it('should produce concise reasoning with numbered steps', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Given: 5+3\n2. Add: 5+3=8\n3. Final Answer: 8'
      );

      const result = await executeChainOfDraft('What is 5+3?', mockProvider);

      expect(result.methodology).toBe('cod');
      expect(result.answer).toBe('8');
      expect(result.reasoning).toContain('1.');
      expect(result.reasoning).toContain('2.');
      expect(result.metadata.actualSteps).toBeGreaterThanOrEqual(2);
    });

    it('should use significantly fewer tokens than CoT', async () => {
      // CoD response: concise
      (mockProvider.generate as any).mockResolvedValue(
        '1. Identify: 2x+3=13\n2. Subtract 3: 2x=10\n3. Divide: x=5\n4. Answer: 5'
      );

      const result = await executeChainOfDraft(
        'Solve for x: 2x + 3 = 13',
        mockProvider
      );

      // CoD should use < 100 output tokens
      expect(result.tokens.output).toBeLessThan(100);
      
      // Verify 92% savings claim
      expect(result.metadata.tokenSavings).toBe('~92% vs CoT');
      expect(result.metadata.comparisonToCoT.savingsPercent).toBeGreaterThan(85);
    });

    it('should respect maxWordsPerStep configuration', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Parse query\n2. Identify type\n3. Route to methodology\n4. Execute\n5. Final Answer: success'
      );

      const config: Partial<CoDConfig> = {
        maxWordsPerStep: 3,
        maxSteps: 5,
      };

      const result = await executeChainOfDraft(
        'How does routing work?',
        mockProvider,
        config
      );

      expect(result.metadata.wordsPerStep).toBe(3);
      expect(result.metadata.actualSteps).toBeLessThanOrEqual(5);
    });
  });

  describe('Answer Extraction', () => {
    it('should extract answer from "Final Answer:" format', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Calculate sum\n2. Verify result\nFinal Answer: 42'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('42');
    });

    it('should extract answer from markdown heading format', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Step one\n2. Step two\n#### 42'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('42');
    });

    it('should extract answer from "Therefore:" format', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Analyze problem\n2. Apply formula\nTherefore: 42'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('42');
    });

    it('should extract answer from "Result:" format', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Input: 10\n2. Process: x2\nResult: 20'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('20');
    });

    it('should fallback to last line if no explicit marker', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. First step\n2. Second step\n3. The answer is 42'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('The answer is 42');
    });

    it('should remove step numbering from extracted answer', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Calculate\n2. Verify\n3. 42'
      );

      const result = await executeChainOfDraft('test query', mockProvider);
      expect(result.answer).toBe('42');
      expect(result.answer).not.toContain('3.');
    });
  });

  describe('Token Usage & Cost', () => {
    it('should calculate token usage accurately', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Parse\n2. Analyze\n3. Answer: test'
      );

      const result = await executeChainOfDraft('test query', mockProvider);

      expect(result.tokens.input).toBeGreaterThan(0);
      expect(result.tokens.output).toBeGreaterThan(0);
      expect(result.tokens.total).toBe(result.tokens.input + result.tokens.output);
    });

    it('should provide CoT comparison metrics', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Step\n2. Step\n3. Answer: result'
      );

      const result = await executeChainOfDraft('test query', mockProvider);

      expect(result.metadata.comparisonToCoT).toBeDefined();
      expect(result.metadata.comparisonToCoT.estimatedCoTTokens).toBeGreaterThan(
        result.metadata.comparisonToCoT.actualCoDTokens
      );
      expect(result.metadata.comparisonToCoT.savingsPercent).toBeGreaterThan(0);
    });

    it('should calculate cost based on provider rates', async () => {
      mockProvider.name = 'deepseek';
      (mockProvider.generate as any).mockResolvedValue(
        '1. Brief\n2. Answer: 42'
      );

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.cost).toBeGreaterThan(0);
      expect(result.cost).toBeLessThan(0.01); // Should be very cheap
    });
  });

  describe('Configuration Options', () => {
    it('should respect maxTokens configuration', async () => {
      (mockProvider.generate as any).mockResolvedValue('1. Short\n2. Answer: 42');

      const config: Partial<CoDConfig> = {
        maxTokens: 50,
      };

      await executeChainOfDraft('test', mockProvider, config);

      expect(mockProvider.generate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ maxTokens: 50 })
      );
    });

    it('should respect temperature configuration', async () => {
      (mockProvider.generate as any).mockResolvedValue('1. Answer: 42');

      const config: Partial<CoDConfig> = {
        temperature: 0.1,
      };

      await executeChainOfDraft('test', mockProvider, config);

      expect(mockProvider.generate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ temperature: 0.1 })
      );
    });

    it('should use default config when no overrides provided', async () => {
      (mockProvider.generate as any).mockResolvedValue('1. Answer: 42');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.metadata.wordsPerStep).toBe(5); // default
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution latency', async () => {
      (mockProvider.generate as any).mockResolvedValue('1. Answer: 42');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.latencyMs).toBeLessThan(10000); // Should be fast
    });

    it('should count reasoning steps accurately', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. First\n2. Second\n3. Third\n4. Fourth\n5. Answer: done'
      );

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.metadata.actualSteps).toBe(5);
    });

    it('should handle zero steps gracefully', async () => {
      (mockProvider.generate as any).mockResolvedValue('Direct answer: 42');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.metadata.actualSteps).toBe(0);
      expect(result.answer).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      (mockProvider.generate as any).mockResolvedValue('');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.answer).toBe('');
      expect(result.methodology).toBe('cod');
    });

    it('should handle response with only whitespace', async () => {
      (mockProvider.generate as any).mockResolvedValue('   \n\n   ');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.answer).toBe('');
    });

    it('should handle very long queries', async () => {
      const longQuery = 'What is ' + 'X'.repeat(1000) + '?';
      (mockProvider.generate as any).mockResolvedValue('1. Too complex\n2. Answer: unclear');

      const result = await executeChainOfDraft(longQuery, mockProvider);

      expect(result.methodology).toBe('cod');
      expect(result.tokens.input).toBeGreaterThan(200);
    });

    it('should handle special characters in answer', async () => {
      (mockProvider.generate as any).mockResolvedValue(
        '1. Calculate\nFinal Answer: $1,234.56 (USD)'
      );

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.answer).toBe('$1,234.56 (USD)');
    });
  });

  describe('Provider Integration', () => {
    it('should work with different provider names', async () => {
      const providers = ['deepseek', 'anthropic', 'mistral', 'xai'];

      for (const providerName of providers) {
        mockProvider.name = providerName;
        (mockProvider.generate as any).mockResolvedValue('1. Answer: 42');

        const result = await executeChainOfDraft('test', mockProvider);

        expect(result.provider).toBe(providerName);
        expect(result.cost).toBeGreaterThan(0);
      }
    });

    it('should fallback to deepseek rates for unknown providers', async () => {
      mockProvider.name = 'unknown-provider';
      (mockProvider.generate as any).mockResolvedValue('1. Answer: 42');

      const result = await executeChainOfDraft('test', mockProvider);

      expect(result.cost).toBeGreaterThan(0);
      // Should use deepseek rates as fallback
    });
  });
});
