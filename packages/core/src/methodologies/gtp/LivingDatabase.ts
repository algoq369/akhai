/**
 * Living Database
 *
 * Real-time merge system for advisor responses in GTP methodology.
 * Maintains causal ordering via vector clocks, detects conflicts,
 * and tracks consensus as responses arrive.
 *
 * Key responsibilities:
 * - Merge responses in real-time
 * - Extract and deduplicate insights
 * - Detect conflicts and opposing positions
 * - Track agreement levels for quorum detection
 * - Generate synthesis summaries
 */

import type {
  AdvisorResponse,
  LivingDatabaseState,
  MergedInsight,
  InsightCategory,
  ConsensusState,
} from '../types.js';

/**
 * Insight extraction result from a single response
 */
interface ExtractedInsight {
  content: string;
  category: InsightCategory;
  confidence: number;
}

export class LivingDatabase {
  private state: LivingDatabaseState;

  constructor(expectedResponses: number) {
    this.state = {
      vectorClock: {},
      responses: new Map(),
      mergedInsights: [],
      consensusState: {
        agreementLevel: 0,
        consensusReached: false,
        agreements: [],
        disagreements: [],
        confidence: 0,
      },
      metadata: {
        responsesReceived: 0,
        responsesExpected: expectedResponses,
        startTime: Date.now(),
        lastUpdate: Date.now(),
      },
    };
  }

  /**
   * Merge a new advisor response into the living database
   *
   * @param response - Advisor response to merge
   * @returns Updated state
   */
  merge(response: AdvisorResponse): LivingDatabaseState {
    console.log(`[LivingDatabase] Merging response from Slot ${response.slot} (${response.family}/${response.role})`);

    // Update vector clock (causal ordering)
    this.state.vectorClock[response.slot] = (this.state.vectorClock[response.slot] || 0) + 1;

    // Store response
    this.state.responses.set(response.slot, response);

    // Update metadata
    this.state.metadata.responsesReceived = this.state.responses.size;
    this.state.metadata.lastUpdate = Date.now();

    // Extract insights from this response
    const insights = this.extractInsights(response);
    console.log(`[LivingDatabase] Extracted ${insights.length} insights from Slot ${response.slot}`);

    // Merge insights (dedup + aggregate)
    insights.forEach(insight => {
      this.mergeInsight(insight, response.slot);
    });

    // Update consensus state
    this.updateConsensusState();

    // Detect conflicts
    this.detectConflicts();

    const duration = Date.now() - this.state.metadata.startTime;
    console.log(`[LivingDatabase] State updated: ${this.state.metadata.responsesReceived}/${this.state.metadata.responsesExpected} responses, ${this.state.mergedInsights.length} insights, agreement ${(this.state.consensusState.agreementLevel * 100).toFixed(1)}% (${(duration / 1000).toFixed(1)}s)`);

    return this.getState();
  }

  /**
   * Extract insights from a single advisor response
   *
   * @param response - Advisor response
   * @returns Array of extracted insights
   */
  private extractInsights(response: AdvisorResponse): ExtractedInsight[] {
    const insights: ExtractedInsight[] = [];
    const { content, role, keyPoints } = response;

    // Use key points if available (already extracted by FlashBroadcaster)
    if (keyPoints && keyPoints.length > 0) {
      keyPoints.forEach(point => {
        insights.push({
          content: point,
          category: this.categorizeInsight(point, role),
          confidence: response.confidence,
        });
      });
      return insights;
    }

    // Fallback: extract from content
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    lines.forEach(line => {
      // Skip very short lines
      if (line.length < 15) return;

      // Extract bullet points
      if (/^[•\-\*]\s+/.test(line)) {
        const point = line.replace(/^[•\-\*]\s+/, '').trim();
        insights.push({
          content: point,
          category: this.categorizeInsight(point, role),
          confidence: response.confidence,
        });
        return;
      }

      // Extract numbered points
      if (/^\d+\.\s+/.test(line)) {
        const point = line.replace(/^\d+\.\s+/, '').trim();
        insights.push({
          content: point,
          category: this.categorizeInsight(point, role),
          confidence: response.confidence,
        });
        return;
      }

      // Extract bold statements
      const boldMatches = line.match(/\*\*([^*]+)\*\*/g);
      if (boldMatches) {
        boldMatches.forEach(match => {
          const point = match.replace(/\*\*/g, '').trim();
          if (point.length > 10) {
            insights.push({
              content: point,
              category: this.categorizeInsight(point, role),
              confidence: response.confidence,
            });
          }
        });
      }
    });

    // If no insights extracted, create one from first substantial sentence
    if (insights.length === 0) {
      const sentences = content.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length > 0) {
        const firstSubstantial = sentences.find(s => s.trim().length > 20);
        if (firstSubstantial) {
          insights.push({
            content: firstSubstantial.trim(),
            category: this.categorizeInsight(firstSubstantial, role),
            confidence: response.confidence,
          });
        }
      }
    }

    return insights.slice(0, 5); // Limit to top 5 per response
  }

  /**
   * Categorize an insight based on content and role
   *
   * @param content - Insight content
   * @param role - Advisor role
   * @returns Insight category
   */
  private categorizeInsight(content: string, role: string): InsightCategory {
    const lower = content.toLowerCase();

    // Role-based categorization
    if (role === 'critical') {
      if (lower.includes('risk') || lower.includes('danger') || lower.includes('threat')) {
        return 'risk';
      }
      if (lower.includes('weakness') || lower.includes('problem') || lower.includes('issue')) {
        return 'disadvantage';
      }
    }

    if (role === 'creative') {
      if (lower.includes('could') || lower.includes('might') || lower.includes('potential')) {
        return 'opportunity';
      }
      if (lower.includes('should') || lower.includes('recommend') || lower.includes('suggest')) {
        return 'recommendation';
      }
    }

    // Content-based categorization
    if (lower.includes('advantage') || lower.includes('benefit') || lower.includes('strength') || lower.includes('pro')) {
      return 'advantage';
    }

    if (lower.includes('disadvantage') || lower.includes('drawback') || lower.includes('con') || lower.includes('limitation')) {
      return 'disadvantage';
    }

    if (lower.includes('risk') || lower.includes('threat') || lower.includes('vulnerability')) {
      return 'risk';
    }

    if (lower.includes('opportunity') || lower.includes('potential') || lower.includes('could enable')) {
      return 'opportunity';
    }

    if (lower.includes('require') || lower.includes('need') || lower.includes('must have')) {
      return 'requirement';
    }

    if (lower.includes('recommend') || lower.includes('should') || lower.includes('suggest')) {
      return 'recommendation';
    }

    if (lower.includes('?') || lower.includes('unclear') || lower.includes('unknown')) {
      return 'question';
    }

    // Default
    return 'finding';
  }

  /**
   * Merge an extracted insight into the merged insights list
   *
   * @param insight - Extracted insight
   * @param slot - Advisor slot number
   */
  private mergeInsight(insight: ExtractedInsight, slot: number): void {
    // Find similar existing insight (deduplication)
    const similar = this.findSimilarInsight(insight.content);

    if (similar) {
      // Add this slot as supporting evidence
      if (!similar.supportingSlots.includes(slot)) {
        similar.supportingSlots.push(slot);
        // Update confidence (weighted average)
        const totalSlots = similar.supportingSlots.length;
        similar.confidence = ((similar.confidence * (totalSlots - 1)) + insight.confidence) / totalSlots;
        console.log(`[LivingDatabase]   📌 Merged with existing insight (${similar.supportingSlots.length} slots agree)`);
      }
    } else {
      // Create new merged insight
      const mergedInsight: MergedInsight = {
        id: this.generateInsightId(),
        content: insight.content,
        category: insight.category,
        confidence: insight.confidence,
        supportingSlots: [slot],
        relatedInsights: [],
      };

      this.state.mergedInsights.push(mergedInsight);
      console.log(`[LivingDatabase]   ✨ New insight: ${insight.content.substring(0, 60)}...`);
    }
  }

  /**
   * Find similar insight using Jaccard similarity
   *
   * @param content - Insight content to match
   * @returns Similar merged insight if found
   */
  private findSimilarInsight(content: string): MergedInsight | undefined {
    const tokens = this.tokenize(content);
    const threshold = 0.5; // 50% similarity threshold

    for (const insight of this.state.mergedInsights) {
      const existingTokens = this.tokenize(insight.content);
      const similarity = this.jaccardSimilarity(tokens, existingTokens);

      if (similarity >= threshold) {
        return insight;
      }
    }

    return undefined;
  }

  /**
   * Calculate Jaccard similarity between two token sets
   *
   * @param setA - First token set
   * @param setB - Second token set
   * @returns Similarity score (0-1)
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Tokenize text for similarity comparison
   *
   * @param text - Text to tokenize
   * @returns Set of normalized tokens
   */
  private tokenize(text: string): Set<string> {
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(t => t.length > 2); // Filter short words

    return new Set(normalized);
  }

  /**
   * Generate unique insight ID
   *
   * @returns Unique ID
   */
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update consensus state based on merged insights
   */
  private updateConsensusState(): void {
    const responses = Array.from(this.state.responses.values());

    if (responses.length === 0) {
      return;
    }

    // Calculate agreement level based on insight support
    const supportCounts = this.state.mergedInsights.map(i => i.supportingSlots.length);
    const avgSupport = supportCounts.reduce((sum, count) => sum + count, 0) / this.state.mergedInsights.length || 0;
    const agreementLevel = Math.min(avgSupport / responses.length, 1);

    // Find agreements (insights with 2+ supporters)
    const agreements = this.state.mergedInsights
      .filter(i => i.supportingSlots.length >= 2)
      .map(i => `${i.content} (${i.supportingSlots.length} agree)`);

    // Calculate consensus confidence (average of all response confidences)
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

    // Consensus reached if 85% agreement or 2+ responses with strong agreement
    const consensusReached = agreementLevel >= 0.85 || (responses.length >= 2 && agreementLevel >= 0.6);

    this.state.consensusState = {
      agreementLevel,
      consensusReached,
      agreements,
      disagreements: this.state.consensusState.disagreements, // Preserved from detectConflicts()
      confidence: avgConfidence,
    };
  }

  /**
   * Detect conflicts and opposing positions
   */
  private detectConflicts(): void {
    const disagreements: ConsensusState['disagreements'] = [];

    // Look for opposing insights by category
    const advantageInsights = this.state.mergedInsights.filter(i => i.category === 'advantage');
    const disadvantageInsights = this.state.mergedInsights.filter(i => i.category === 'disadvantage');

    // Check for potential conflicts
    for (const adv of advantageInsights) {
      for (const disadv of disadvantageInsights) {
        const similarity = this.jaccardSimilarity(
          this.tokenize(adv.content),
          this.tokenize(disadv.content)
        );

        // If they mention similar topics but have opposing categories
        if (similarity > 0.3 && similarity < 0.7) {
          const positions = [
            ...adv.supportingSlots.map(slot => ({
              slot,
              stance: `Pro: ${adv.content.substring(0, 50)}...`,
            })),
            ...disadv.supportingSlots.map(slot => ({
              slot,
              stance: `Con: ${disadv.content.substring(0, 50)}...`,
            })),
          ];

          disagreements.push({
            point: `Conflicting views on: ${this.extractCommonTopic(adv.content, disadv.content)}`,
            positions,
          });
        }
      }
    }

    this.state.consensusState.disagreements = disagreements;

    if (disagreements.length > 0) {
      console.log(`[LivingDatabase] 🔀 Detected ${disagreements.length} potential conflicts`);
    }
  }

  /**
   * Extract common topic from two pieces of text
   *
   * @param textA - First text
   * @param textB - Second text
   * @returns Common topic string
   */
  private extractCommonTopic(textA: string, textB: string): string {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);
    const common = [...tokensA].filter(t => tokensB.has(t));

    if (common.length > 0) {
      return common.slice(0, 3).join(' ');
    }

    return 'related topics';
  }

  /**
   * Generate summary for Mother Base synthesis
   *
   * @returns Summary string
   */
  generateSummary(): string {
    const responses = Array.from(this.state.responses.values());

    if (responses.length === 0) {
      return 'No responses received yet.';
    }

    const lines: string[] = [];

    lines.push(`# Advisor Summary (${responses.length}/${this.state.metadata.responsesExpected} responses)`);
    lines.push('');

    // Group insights by category
    const categories: Record<InsightCategory, MergedInsight[]> = {
      advantage: [],
      disadvantage: [],
      risk: [],
      opportunity: [],
      requirement: [],
      recommendation: [],
      finding: [],
      question: [],
    };

    this.state.mergedInsights.forEach(insight => {
      categories[insight.category].push(insight);
    });

    // Sort insights by support count (most agreed upon first)
    Object.keys(categories).forEach(cat => {
      categories[cat as InsightCategory].sort((a, b) => b.supportingSlots.length - a.supportingSlots.length);
    });

    // Emit key findings
    const categoryLabels: Record<InsightCategory, string> = {
      advantage: 'Advantages',
      disadvantage: 'Disadvantages',
      risk: 'Risks',
      opportunity: 'Opportunities',
      requirement: 'Requirements',
      recommendation: 'Recommendations',
      finding: 'Key Findings',
      question: 'Open Questions',
    };

    Object.entries(categories).forEach(([cat, insights]) => {
      if (insights.length > 0) {
        lines.push(`## ${categoryLabels[cat as InsightCategory]}`);
        insights.forEach(insight => {
          const support = insight.supportingSlots.length > 1
            ? ` (${insight.supportingSlots.length} advisors agree)`
            : '';
          lines.push(`- ${insight.content}${support}`);
        });
        lines.push('');
      }
    });

    // Consensus state
    lines.push(`## Consensus: ${(this.state.consensusState.agreementLevel * 100).toFixed(0)}% agreement`);
    if (this.state.consensusState.agreements.length > 0) {
      lines.push('**Strong agreements:**');
      this.state.consensusState.agreements.slice(0, 5).forEach(agreement => {
        lines.push(`- ${agreement}`);
      });
    }

    if (this.state.consensusState.disagreements.length > 0) {
      lines.push('');
      lines.push('**Conflicting views:**');
      this.state.consensusState.disagreements.forEach(conflict => {
        lines.push(`- ${conflict.point}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get current state (immutable copy)
   *
   * @returns Current state
   */
  getState(): LivingDatabaseState {
    return {
      ...this.state,
      responses: new Map(this.state.responses),
      mergedInsights: [...this.state.mergedInsights],
      consensusState: { ...this.state.consensusState },
      metadata: { ...this.state.metadata },
    };
  }

  /**
   * Get response count
   *
   * @returns Number of responses received
   */
  getResponseCount(): number {
    return this.state.metadata.responsesReceived;
  }

  /**
   * Get agreement level
   *
   * @returns Agreement level (0-1)
   */
  getAgreementLevel(): number {
    return this.state.consensusState.agreementLevel;
  }

  /**
   * Check if consensus reached
   *
   * @returns True if consensus reached
   */
  isConsensusReached(): boolean {
    return this.state.consensusState.consensusReached;
  }
}
