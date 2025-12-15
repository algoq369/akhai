import { ModelFamily } from '../models/types.js';

/**
 * Pricing information per 1M tokens (input/output)
 * Pricing as of December 2024
 */
const PRICING: Record<ModelFamily, { input: number; output: number }> = {
  anthropic: { input: 3.0, output: 15.0 },      // Claude Sonnet 4
  deepseek: { input: 0.14, output: 0.28 },      // DeepSeek Chat
  mistral: { input: 0.2, output: 0.6 },         // Mistral Small
  xai: { input: 5.0, output: 15.0 },            // Grok Beta
};

/**
 * Usage record for a single API call
 */
export interface UsageRecord {
  family: ModelFamily;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

/**
 * Usage summary by provider
 */
export interface ProviderUsage {
  family: ModelFamily;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
}

/**
 * Cost tracking for AkhAI API usage
 *
 * Tracks token usage and calculates costs across all providers.
 */
export class CostTracker {
  private usageHistory: UsageRecord[] = [];

  /**
   * Add usage from an API call
   */
  addUsage(
    family: ModelFamily,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const pricing = PRICING[family];

    // Calculate cost: (tokens / 1M) * price_per_1M
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const record: UsageRecord = {
      family,
      model,
      inputTokens,
      outputTokens,
      cost: totalCost,
      timestamp: Date.now(),
    };

    this.usageHistory.push(record);

    console.log(
      `[CostTracker] ${family}/${model}: ${inputTokens} in + ${outputTokens} out = $${totalCost.toFixed(6)}`
    );
  }

  /**
   * Get total cost across all providers
   */
  getTotalCost(): number {
    return this.usageHistory.reduce((sum, record) => sum + record.cost, 0);
  }

  /**
   * Get usage summary grouped by provider
   */
  getUsageByProvider(): Map<ModelFamily, ProviderUsage> {
    const usageMap = new Map<ModelFamily, ProviderUsage>();

    for (const record of this.usageHistory) {
      let usage = usageMap.get(record.family);

      if (!usage) {
        usage = {
          family: record.family,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          requestCount: 0,
        };
        usageMap.set(record.family, usage);
      }

      usage.totalInputTokens += record.inputTokens;
      usage.totalOutputTokens += record.outputTokens;
      usage.totalCost += record.cost;
      usage.requestCount += 1;
    }

    return usageMap;
  }

  /**
   * Get total token count
   */
  getTotalTokens(): { input: number; output: number; total: number } {
    const input = this.usageHistory.reduce((sum, r) => sum + r.inputTokens, 0);
    const output = this.usageHistory.reduce((sum, r) => sum + r.outputTokens, 0);

    return {
      input,
      output,
      total: input + output,
    };
  }

  /**
   * Get all usage records
   */
  getHistory(): UsageRecord[] {
    return [...this.usageHistory];
  }

  /**
   * Reset all usage data
   */
  reset(): void {
    this.usageHistory = [];
    console.log('[CostTracker] Usage history cleared');
  }

  /**
   * Get formatted cost report
   */
  getReport(): string {
    const providerUsage = this.getUsageByProvider();
    const totalTokens = this.getTotalTokens();
    const totalCost = this.getTotalCost();

    let report = '## Cost Tracking Report\n\n';

    // Overall summary
    report += '### Overall Summary\n';
    report += `- **Total Requests**: ${this.usageHistory.length}\n`;
    report += `- **Total Tokens**: ${totalTokens.total.toLocaleString()} (${totalTokens.input.toLocaleString()} in + ${totalTokens.output.toLocaleString()} out)\n`;
    report += `- **Total Cost**: $${totalCost.toFixed(4)}\n\n`;

    // By provider
    if (providerUsage.size > 0) {
      report += '### By Provider\n\n';

      for (const [family, usage] of providerUsage) {
        report += `**${family}**:\n`;
        report += `  - Requests: ${usage.requestCount}\n`;
        report += `  - Tokens: ${(usage.totalInputTokens + usage.totalOutputTokens).toLocaleString()} (${usage.totalInputTokens.toLocaleString()} in + ${usage.totalOutputTokens.toLocaleString()} out)\n`;
        report += `  - Cost: $${usage.totalCost.toFixed(4)}\n\n`;
      }
    }

    return report;
  }
}
