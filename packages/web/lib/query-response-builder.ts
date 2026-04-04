/**
 * Response builder — Side Canal topic extraction, response assembly,
 * PostHog tracking, and final thought-stream emit.
 *
 * Extracted from app/api/simple-query/route.ts
 */

import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { LAYER_METADATA } from '@/lib/layer-registry';
import type { IntelligenceFusionResult } from '@/lib/intelligence-fusion';
import type { ThoughtEvent } from '@/lib/thought-stream';
import { formatDuration } from '@/lib/thought-stream';
import {
  trackServerQuerySubmitted,
  trackServerGuardTriggered,
  getAnonymousDistinctId,
} from '@/lib/posthog-events';

export interface ResponseBuilderInput {
  queryId: string;
  query: string;
  selectedMethod: { id: string; reason?: string };
  processedContent: string;
  content: string;
  selectedProvider: string;
  providerSpec: { model: string; reasoning: string };
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  latency: number;
  cost: number;
  guardResult: any;
  sideCanalContext: string | null;
  urlsFetched: { url: string; type: string; success: boolean; title?: string }[];
  urlContext: string;
  analysisMetadata: any;
  fusionResult: IntelligenceFusionResult | null;
  weights: Record<number, number>;
  userId: string | null;
  legendMode: boolean;
  methodology: string;
}

/**
 * Extract Side Canal topics from query + response asynchronously.
 */
export async function extractSideCanalTopics(
  queryId: string,
  query: string,
  content: string,
  userId: string | null,
  legendMode: boolean
): Promise<any[]> {
  let suggestions: any[] = [];
  try {
    const { extractTopics, getSuggestions, linkQueryToTopics, updateTopicRelationships } =
      await import('@/lib/side-canal');

    log(
      'INFO',
      'SIDE_CANAL',
      `Starting topic extraction for queryId: ${queryId}, userId: ${userId || 'anonymous'}`
    );

    const topics = await extractTopics(query, content, userId, legendMode);

    log('INFO', 'SIDE_CANAL', `Extracted ${topics.length} topics`);

    if (topics.length > 0) {
      const topicIds = topics.map((t) => t.id);
      linkQueryToTopics(queryId, topicIds);
      updateTopicRelationships(topicIds, userId);
      suggestions = getSuggestions(topicIds, userId);

      log('INFO', 'SIDE_CANAL', `Got ${suggestions.length} suggestions from relationships`);

      if (suggestions.length === 0 && topics.length > 1) {
        suggestions = topics.slice(1).map((topic) => ({
          topicId: topic.id,
          topicName: topic.name,
          reason: 'Topic discovered in this conversation',
          relevance: 1.0,
        }));
        log('INFO', 'SIDE_CANAL', `Using ${suggestions.length} extracted topics as suggestions`);
      }

      // Generate synopsis asynchronously (don't wait)
      const { generateSynopsis } = await import('@/lib/side-canal');
      generateSynopsis(topicIds[0], [queryId], userId).catch((err) => {
        log('WARN', 'SIDE_CANAL', `Synopsis generation error: ${err}`);
      });

      log(
        'INFO',
        'SIDE_CANAL',
        `Success: ${topics.length} topics extracted, ${suggestions.length} suggestions to show`
      );
    } else {
      log(
        'INFO',
        'SIDE_CANAL',
        'No topics extracted - this might be due to API key or extraction failure'
      );
    }
  } catch (err) {
    log(
      'ERROR',
      'SIDE_CANAL',
      `Topic extraction error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  return suggestions;
}

/**
 * Assemble the final JSON response payload.
 */
export function buildResponseData(
  input: ResponseBuilderInput,
  suggestions: any[]
): Record<string, any> {
  const {
    queryId,
    query,
    selectedMethod,
    processedContent,
    selectedProvider,
    providerSpec,
    tokens,
    latency,
    cost,
    guardResult,
    sideCanalContext,
    urlsFetched,
    urlContext,
    analysisMetadata,
    fusionResult,
  } = input;

  return {
    id: queryId,
    queryId,
    query,
    methodology: selectedMethod.id,
    methodologyUsed: selectedMethod.id,
    selectionReason: selectedMethod.reason,
    response: processedContent,
    provider: {
      family: selectedProvider,
      model: providerSpec.model,
      reasoning: providerSpec.reasoning,
    },
    metrics: {
      tokens,
      latency,
      cost,
    },
    guardResult,
    sideCanal: {
      contextInjected: !!sideCanalContext,
      suggestions,
      topicsExtracted: suggestions.length > 0,
    },
    urlVisitor: {
      urlsDetected: urlsFetched.length,
      urlsFetched: urlsFetched.filter((u) => u.success).length,
      urls: urlsFetched,
      contextInjected: !!urlContext,
    },
    gnostic: analysisMetadata,
    fusion: fusionResult
      ? {
          methodology: selectedMethod.id,
          confidence: fusionResult.confidence,
          layerActivations: fusionResult.layerActivations.slice(0, 5).map((s) => ({
            name: s.name,
            effectiveWeight: s.effectiveWeight,
            keywords: s.keywords,
          })),
          dominantLayers: fusionResult.dominantLayers.map((s) => LAYER_METADATA[s]?.aiName),
          guardRecommendation: fusionResult.guardRecommendation,
          extendedThinkingBudget: fusionResult.extendedThinkingBudget,
          processingMode: fusionResult.processingMode,
          activeLenses: fusionResult.activeLenses,
          processingTimeMs: fusionResult.processingTimeMs,
        }
      : null,
  };
}

/**
 * Track PostHog events (server-side) — non-blocking, catches errors internally.
 */
export function trackPostHogEvents(input: ResponseBuilderInput, request: NextRequest): void {
  try {
    const {
      userId,
      query,
      selectedMethod,
      methodology,
      tokens,
      cost,
      latency,
      selectedProvider,
      providerSpec,
      guardResult,
      sideCanalContext,
      legendMode,
    } = input;

    const distinctId = userId || getAnonymousDistinctId(request);
    trackServerQuerySubmitted(distinctId, {
      query,
      methodology: selectedMethod.id,
      methodology_selected: methodology,
      methodology_used: selectedMethod.id,
      tokens,
      cost,
      latency_ms: latency,
      provider: selectedProvider,
      model: providerSpec.model,
      guard_active: !!guardResult,
      side_canal_enabled: !!sideCanalContext,
      legend_mode: legendMode || false,
    });

    if (guardResult && !guardResult.passed) {
      const guardType = guardResult.issues[0]?.toLowerCase().includes('hype')
        ? 'hype'
        : guardResult.issues[0]?.toLowerCase().includes('echo')
          ? 'echo'
          : guardResult.issues[0]?.toLowerCase().includes('drift')
            ? 'drift'
            : 'factuality';

      trackServerGuardTriggered(distinctId, {
        guard_type: guardType,
        action: 'pending',
        query,
        methodology: selectedMethod.id,
        scores: guardResult.scores || { hype: 0, echo: 0, drift: 0, fact: 0 },
        issues: guardResult.issues || [],
      });
    }
  } catch (trackError) {
    log('WARN', 'POSTHOG', `Tracking failed: ${trackError}`);
  }
}

/**
 * Emit the final "complete" thought-stream event.
 */
export function emitCompleteEvent(
  input: ResponseBuilderInput,
  emitAndPersist: (qid: string, ev: ThoughtEvent) => void,
  startTime: number
): void {
  const {
    queryId,
    selectedMethod,
    selectedProvider,
    providerSpec,
    tokens,
    inputTokens,
    outputTokens,
    cost,
  } = input;

  emitAndPersist(queryId, {
    id: `${queryId}-complete`,
    queryId,
    stage: 'complete',
    timestamp: Date.now() - startTime,
    data: `Complete · ${formatDuration(Date.now() - startTime)} · ${tokens} tokens · $${cost.toFixed(4)}`,
    details: {
      duration: Date.now() - startTime,
      tokens: { input: inputTokens, output: outputTokens, total: tokens },
      cost,
      model: providerSpec.model,
      provider: selectedProvider,
      methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
    },
  });
}
