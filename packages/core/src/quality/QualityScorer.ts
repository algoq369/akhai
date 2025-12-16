/**
 * Quality Scorer
 * 
 * Multi-factor quality scoring for AI responses.
 * Enables measurement and continuous improvement.
 */

import type { ConsensusResult } from '../methodologies/types.js';

export interface QualityScore {
  coherence: number;      // 0-1: Logical consistency
  completeness: number;   // 0-1: Addresses all aspects
  consensus: number;      // 0-1: Advisor alignment
  confidence: number;     // 0-1: Answer certainty
  clarity: number;        // 0-1: Easy to understand
  actionability: number;  // 0-1: Provides clear next steps
  overall: number;        // 0-1: Weighted average
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];     // Improvement suggestions
}

export interface QualityConfig {
  weights: {
    coherence: number;
    completeness: number;
    consensus: number;
    confidence: number;
    clarity: number;
    actionability: number;
  };
  thresholds: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

const DEFAULT_CONFIG: QualityConfig = {
  weights: {
    coherence: 0.20,
    completeness: 0.20,
    consensus: 0.15,
    confidence: 0.15,
    clarity: 0.15,
    actionability: 0.15,
  },
  thresholds: {
    A: 0.85,
    B: 0.70,
    C: 0.55,
    D: 0.40,
  },
};

export class QualityScorer {
  private config: QualityConfig;

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = {
      weights: { ...DEFAULT_CONFIG.weights, ...config.weights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
    };
  }

  /**
   * Score a consensus result
   */
  scoreConsensus(result: ConsensusResult, finalAnswer: string): QualityScore {
    const scores = {
      coherence: this.scoreCoherence(finalAnswer),
      completeness: this.scoreCompleteness(result, finalAnswer),
      consensus: this.scoreConsensusLevel(result),
      confidence: this.scoreConfidence(result),
      clarity: this.scoreClarity(finalAnswer),
      actionability: this.scoreActionability(finalAnswer),
    };

    const overall = this.calculateOverall(scores);
    const grade = this.calculateGrade(overall);
    const feedback = this.generateFeedback(scores);

    return {
      ...scores,
      overall,
      grade,
      feedback,
    };
  }

  /**
   * Score logical coherence
   */
  private scoreCoherence(text: string): number {
    let score = 0.5; // Base score

    // Check for logical connectors
    const logicalConnectors = [
      'therefore', 'because', 'however', 'thus', 'consequently',
      'as a result', 'in conclusion', 'furthermore', 'moreover'
    ];
    const connectorCount = logicalConnectors.filter(c => 
      text.toLowerCase().includes(c)
    ).length;
    score += Math.min(connectorCount * 0.1, 0.3);

    // Check for contradictions (basic)
    const contradictionPairs = [
      ['always', 'never'],
      ['all', 'none'],
      ['must', 'should not'],
      ['definitely', 'maybe'],
    ];
    for (const [word1, word2] of contradictionPairs) {
      if (text.toLowerCase().includes(word1) && text.toLowerCase().includes(word2)) {
        score -= 0.15;
      }
    }

    // Check for structured reasoning
    if (text.includes('1.') || text.includes('First')) score += 0.1;
    if (text.includes('2.') || text.includes('Second')) score += 0.05;
    if (text.includes('conclusion') || text.includes('summary')) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score completeness
   */
  private scoreCompleteness(result: ConsensusResult, finalAnswer: string): number {
    let score = 0.4; // Base score

    // Check if all advisor perspectives were considered
    const advisorCount = result.finalConsensus.length;
    if (advisorCount >= 3) score += 0.2;
    if (advisorCount >= 4) score += 0.1;

    // Check answer length (not too short, not rambling)
    const wordCount = finalAnswer.split(/\s+/).length;
    if (wordCount >= 100) score += 0.1;
    if (wordCount >= 200) score += 0.1;
    if (wordCount > 1000) score -= 0.1; // Too long might indicate rambling

    // Check for multiple perspectives mentioned
    const perspectiveIndicators = [
      'on one hand', 'alternatively', 'another view', 'however',
      'pros', 'cons', 'advantages', 'disadvantages', 'trade-off'
    ];
    const perspectiveCount = perspectiveIndicators.filter(p => 
      finalAnswer.toLowerCase().includes(p)
    ).length;
    score += Math.min(perspectiveCount * 0.05, 0.15);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score consensus level among advisors
   */
  private scoreConsensusLevel(result: ConsensusResult): number {
    // If consensus was reached naturally
    if (result.consensusReachedAt !== null) {
      // Earlier consensus = higher score
      const roundScore = 1 - ((result.consensusReachedAt - 1) * 0.15);
      return Math.max(0.7, roundScore);
    }

    // If forced (no natural consensus), analyze final positions
    const positions = result.finalConsensus.map(p => p.finalPosition.toLowerCase());
    
    // Check for agreement keywords
    let agreementScore = 0.4;
    const agreeCount = positions.filter(p => p.includes('[agree]')).length;
    agreementScore += (agreeCount / positions.length) * 0.4;

    return Math.max(0.3, Math.min(0.7, agreementScore));
  }

  /**
   * Score confidence level
   */
  private scoreConfidence(result: ConsensusResult): number {
    let score = 0.5;

    // Check rounds needed (fewer = more confident)
    if (result.totalRounds === 1) score += 0.3;
    else if (result.totalRounds === 2) score += 0.15;

    // Check if consensus was reached
    if (result.consensusReachedAt !== null) score += 0.2;

    // Check confidence markers in advisor responses
    const confidenceKeywords = ['confident', 'certain', 'clear', 'definitely', 'strongly'];
    const uncertainKeywords = ['might', 'possibly', 'uncertain', 'unclear', 'maybe'];

    for (const position of result.finalConsensus) {
      const text = position.finalPosition.toLowerCase();
      if (confidenceKeywords.some(k => text.includes(k))) score += 0.05;
      if (uncertainKeywords.some(k => text.includes(k))) score -= 0.03;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score clarity of response
   */
  private scoreClarity(text: string): number {
    let score = 0.5;

    // Sentence length check (avg should be 15-25 words)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgLength = text.split(/\s+/).length / sentences.length;
      if (avgLength >= 10 && avgLength <= 30) score += 0.2;
      else if (avgLength > 40) score -= 0.1;
    }

    // Check for clear structure
    if (text.includes('\n\n')) score += 0.1; // Paragraphs
    if (/^\d\.|^-|^\*/m.test(text)) score += 0.1; // Lists
    if (text.includes('**') || text.includes('##')) score += 0.05; // Headers

    // Check for jargon without explanation
    const jargonWords = ['paradigm', 'synergy', 'leverage', 'holistic', 'ecosystem'];
    const jargonCount = jargonWords.filter(w => text.toLowerCase().includes(w)).length;
    if (jargonCount > 3) score -= 0.1;

    // Check for clear examples
    if (text.toLowerCase().includes('for example') || 
        text.toLowerCase().includes('such as') ||
        text.toLowerCase().includes('e.g.')) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score actionability
   */
  private scoreActionability(text: string): number {
    let score = 0.3;

    // Check for action words
    const actionWords = [
      'should', 'recommend', 'suggest', 'consider', 'implement',
      'start', 'begin', 'first step', 'next', 'action'
    ];
    const actionCount = actionWords.filter(w => text.toLowerCase().includes(w)).length;
    score += Math.min(actionCount * 0.1, 0.4);

    // Check for concrete steps
    if (/step \d|first|second|third|finally/i.test(text)) score += 0.15;

    // Check for specific recommendations
    if (text.includes('specifically') || text.includes('in particular')) score += 0.1;

    // Check for timeline/deadlines
    if (/\d+ (days?|weeks?|months?)/i.test(text)) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate overall score
   */
  private calculateOverall(scores: Omit<QualityScore, 'overall' | 'grade' | 'feedback'>): number {
    const { weights } = this.config;
    
    return (
      scores.coherence * weights.coherence +
      scores.completeness * weights.completeness +
      scores.consensus * weights.consensus +
      scores.confidence * weights.confidence +
      scores.clarity * weights.clarity +
      scores.actionability * weights.actionability
    );
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(overall: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const { thresholds } = this.config;
    
    if (overall >= thresholds.A) return 'A';
    if (overall >= thresholds.B) return 'B';
    if (overall >= thresholds.C) return 'C';
    if (overall >= thresholds.D) return 'D';
    return 'F';
  }

  /**
   * Generate improvement feedback
   */
  private generateFeedback(scores: Omit<QualityScore, 'overall' | 'grade' | 'feedback'>): string[] {
    const feedback: string[] = [];

    if (scores.coherence < 0.6) {
      feedback.push('Improve logical flow with clearer transitions');
    }
    if (scores.completeness < 0.6) {
      feedback.push('Consider additional perspectives or details');
    }
    if (scores.consensus < 0.6) {
      feedback.push('Advisors showed significant disagreement');
    }
    if (scores.confidence < 0.6) {
      feedback.push('Response shows uncertainty - may need more research');
    }
    if (scores.clarity < 0.6) {
      feedback.push('Simplify language or add examples');
    }
    if (scores.actionability < 0.6) {
      feedback.push('Add concrete next steps or recommendations');
    }

    if (feedback.length === 0) {
      feedback.push('High quality response!');
    }

    return feedback;
  }

  /**
   * Format score for display
   */
  formatScore(score: QualityScore): string {
    const bars = (value: number) => {
      const filled = Math.round(value * 10);
      return '█'.repeat(filled) + '░'.repeat(10 - filled);
    };

    return `
Quality Score: ${score.grade} (${(score.overall * 100).toFixed(0)}%)

Coherence:     ${bars(score.coherence)} ${(score.coherence * 100).toFixed(0)}%
Completeness:  ${bars(score.completeness)} ${(score.completeness * 100).toFixed(0)}%
Consensus:     ${bars(score.consensus)} ${(score.consensus * 100).toFixed(0)}%
Confidence:    ${bars(score.confidence)} ${(score.confidence * 100).toFixed(0)}%
Clarity:       ${bars(score.clarity)} ${(score.clarity * 100).toFixed(0)}%
Actionability: ${bars(score.actionability)} ${(score.actionability * 100).toFixed(0)}%

Feedback:
${score.feedback.map(f => `• ${f}`).join('\n')}
    `.trim();
  }
}
