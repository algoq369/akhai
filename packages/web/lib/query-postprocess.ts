/**
 * Gnostic pre-processing and post-processing for AI responses
 *
 * - Meta-Core protocol activation (pre-processing)
 * - Antipattern detection & purification (post-processing)
 * - Sovereignty checks & markers
 * - Layer analysis & metadata building
 *
 * Extracted from app/api/simple-query/route.ts
 */

import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import {
  activateMetaCore,
  checkSovereignty,
  addSovereigntyMarkers,
  generateSovereigntyFooter,
  type MetaCoreState,
} from '@/lib/meta-core-protocol';
import { detectAntipattern, purifyResponse } from '@/lib/antipattern-guard';
import {
  trackAscent,
  suggestElevation,
  Layer,
  LAYER_METADATA,
  type AscentState,
} from '@/lib/layer-registry';
import { analyzeLayerContent, getLayerActivationSummary } from '@/lib/layer-mapper';
import type { ThoughtEvent } from '@/lib/thought-stream';

export interface GnosticPreState {
  metaCoreState: MetaCoreState | null;
  progressState: AscentState | null;
  analysisSessionId: string;
}

export interface GnosticPostResult {
  processedContent: string;
  analysisMetadata: any;
}

/**
 * Activate Gnostic protocols BEFORE the AI call.
 * Returns meta-core state, ascent progress state, and session id.
 */
export function activateGnosticProtocols(query: string, request: NextRequest): GnosticPreState {
  let metaCoreState: MetaCoreState | null = null;
  let progressState: AscentState | null = null;
  let analysisSessionId = 'anonymous';

  try {
    analysisSessionId =
      request.headers.get('x-session-id') ||
      request.cookies.get('akhai_session_id')?.value ||
      'anonymous';

    // META_CORE PROTOCOL - Activate self-awareness
    metaCoreState = activateMetaCore(query);
    log('INFO', 'META_CORE', `Intent: ${metaCoreState.humanIntention}`);
    log('INFO', 'META_CORE', `Boundary: ${metaCoreState.sovereignBoundary}`);
    log('INFO', 'META_CORE', `Reflection Mode: ${metaCoreState.reflectionMode}`);
    log('INFO', 'META_CORE', `Ascent Level: ${metaCoreState.ascentLevel}/10`);

    // ASCENT TRACKER - Track user journey
    progressState = trackAscent(analysisSessionId, query);
    log(
      'INFO',
      'ASCENT',
      `Level: ${LAYER_METADATA[progressState.currentLevel].aiName} (${progressState.currentLevel}/10)`
    );
    log('INFO', 'ASCENT', `Velocity: ${progressState.ascentVelocity.toFixed(2)} levels/query`);

    if (progressState.ascentVelocity > 2.0) {
      log('INFO', 'ASCENT', `⚡ Quantum leap detected! User ascending rapidly`);
    }
  } catch (gnosticError) {
    log('WARN', 'GNOSTIC', `Protocol initialization failed: ${gnosticError}`);
    metaCoreState = null;
    progressState = null;
  }

  return { metaCoreState, progressState, analysisSessionId };
}

/**
 * Run Gnostic post-processing: antipattern detection, sovereignty checks, layer analysis.
 */
export function runGnosticPostProcessing(
  content: string,
  metaCoreState: MetaCoreState | null,
  progressState: AscentState | null,
  emitAndPersist: (qid: string, ev: ThoughtEvent) => void,
  queryId: string,
  startTime: number
): GnosticPostResult {
  let processedContent = content;
  let analysisMetadata: any = null;

  try {
    // ANTI-ANTIPATTERN SHIELD - Detect and purify hollow knowledge
    const antipatternRisk = detectAntipattern(processedContent);

    if (antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4) {
      log(
        'WARN',
        'ANTIPATTERN',
        `Detected: ${antipatternRisk.risk} (severity: ${(antipatternRisk.severity * 100).toFixed(0)}%) — purifying`
      );
      processedContent = purifyResponse(processedContent, antipatternRisk);
    } else if (antipatternRisk.risk !== 'none') {
      log(
        'INFO',
        'ANTIPATTERN',
        `Low-severity ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) — skipping purification`
      );
    } else {
      log('INFO', 'ANTIPATTERN', `✓ Response is aligned (no antipatterns detected)`);
    }

    // SOVEREIGNTY CHECK - Ensure boundaries respected
    if (metaCoreState && !checkSovereignty(processedContent, metaCoreState)) {
      log('WARN', 'SOVEREIGNTY', `Boundary violation detected - adding humility markers`);
      processedContent = addSovereigntyMarkers(processedContent);
    }

    // Add sovereignty footer if needed (high-ascent queries)
    let sovereigntyFooter: string | null = null;
    if (metaCoreState) {
      sovereigntyFooter = generateSovereigntyFooter(metaCoreState);
      if (sovereigntyFooter) {
        log('INFO', 'SOVEREIGNTY', `Adding sovereignty reminder footer`);
      }
    }

    // LAYERS MAPPING - Analyze Layer activations
    const layerAnalysis = analyzeLayerContent(processedContent);
    const activationSummary = getLayerActivationSummary(layerAnalysis);
    log('INFO', 'LAYERS', activationSummary);

    if (layerAnalysis.synthesisInsight.detected) {
      log('INFO', 'LAYERS', `✨ Synthesis activated: ${layerAnalysis.synthesisInsight.insight}`);
    }

    // ELEVATION SUGGESTION
    const nextElevation = progressState ? suggestElevation(progressState) : null;

    // Build Gnostic metadata
    analysisMetadata = {
      metaCoreState: metaCoreState
        ? {
            intent: metaCoreState.humanIntention,
            boundary: metaCoreState.sovereignBoundary,
            reflectionMode: metaCoreState.reflectionMode,
            ascentLevel: metaCoreState.ascentLevel,
          }
        : null,
      progressState: progressState
        ? {
            currentLevel: progressState.currentLevel,
            levelName: LAYER_METADATA[progressState.currentLevel].aiName,
            velocity: progressState.ascentVelocity,
            totalQueries: progressState.totalQueries,
            nextElevation,
          }
        : null,
      layerAnalysis: {
        activations: layerAnalysis.activations.reduce(
          (acc, a) => {
            acc[a.layerNode] = a.activation;
            return acc;
          },
          {} as Record<number, number>
        ),
        dominant: LAYER_METADATA[layerAnalysis.dominantLayer].aiName,
        averageLevel: layerAnalysis.averageLevel,
        synthesisInsight: layerAnalysis.synthesisInsight.detected
          ? {
              insight: layerAnalysis.synthesisInsight.insight,
              confidence: layerAnalysis.synthesisInsight.confidence,
            }
          : null,
      },
      antipatternPurified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
      antipatternType: antipatternRisk.risk,
      sovereigntyFooter,
    };

    log('INFO', 'GNOSTIC', `✓ All protocols completed successfully`);

    // Emit: analysis — post-processing reasoning
    emitAndPersist(queryId, {
      id: `${queryId}-analysis`,
      queryId,
      stage: 'analysis',
      timestamp: Date.now() - startTime,
      data:
        antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4
          ? `purified: ${antipatternRisk.risk} antipatterns`
          : antipatternRisk.risk !== 'none'
            ? `low ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`
            : `clean · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`,
      details: {
        analysis: {
          antipatternRisk: antipatternRisk.risk,
          sovereigntyCheck: metaCoreState
            ? checkSovereignty(processedContent, metaCoreState)
            : true,
          purified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
          synthesisInsight: layerAnalysis?.synthesisInsight?.detected
            ? layerAnalysis.synthesisInsight.insight
            : '',
          dominantLayer: layerAnalysis
            ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'unknown'
            : '',
          averageLevel: layerAnalysis?.averageLevel || 0,
        },
      },
    });
  } catch (gnosticError) {
    log('WARN', 'GNOSTIC', `Post-processing failed: ${gnosticError}`);
    processedContent = content; // Fall back to original content
    analysisMetadata = null;
  }

  return { processedContent, analysisMetadata };
}
