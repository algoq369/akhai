/**
 * AI LAYER PROCESSOR
 * Core engine for multi-perspective AI processing through 11-layer computational system
 *
 * This module implements the Layer 1 processing architecture where queries are analyzed
 * through multiple AI computational lenses, each contributing unique perspectives
 * based on their aiRole role (token embedding, transformer, attention, etc.).
 */

import { Layer, LAYER_METADATA } from './layer-registry';
import { TreeConfiguration } from './tree-configuration';
import { callProvider, type Message, type CompletionResponse } from './multi-provider-api';
import type { ProviderFamily } from './provider-selector';
import type { CoreMethodology } from './provider-selector';
import {
  getActiveLayers,
  selectAdaptiveMode,
  calculateLayerActivation,
  calculateActivationsFromContent,
  blendActivationsWithWeights,
  findDominantLayer,
  suggestMethodology,
  WEIGHT_INFLUENCE_RATIO,
} from './layer-processor-utils';

// Re-export so existing consumers of this module are unaffected
export { WEIGHT_INFLUENCE_RATIO };

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface LayerPerspective {
  layerNode: Layer;
  name: string;
  aiRole: string; // "Token Embedding Layer"
  weight: number; // User's configured weight (0-1)
  prompt: string; // Perspective-specific prompt
  response: string; // AI response from this lens
  activation: number; // Calculated activation (0-1)
  confidence: number; // How confident this perspective is
  processingTime: number; // ms
  tokens: { input: number; output: number };
}

export interface LayersProcessingResult {
  mode: 'weighted' | 'parallel' | 'adaptive';
  perspectives: LayerPerspective[];
  synthesizedResponse: string;
  activations: Record<Layer, number>;
  blendedActivations: Record<Layer, number>; // Activations blended with user weights
  dominantLayer: Layer;
  methodologySuggestion: CoreMethodology;
  totalCost: number;
  totalTokens: number;
  totalLatency: number;
  perspectiveCount: number;
  weightInfluenceRatio: number; // How much user weights influenced dominant selection
}

export type ProcessingMode = 'weighted' | 'parallel' | 'adaptive';

// ═══════════════════════════════════════════
// MAIN PROCESSOR
// ═══════════════════════════════════════════

export async function processQueryThroughLayers(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  mode: ProcessingMode = 'adaptive',
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  const startTime = Date.now();

  // Determine active layers (weight > threshold)
  const activeLayers = getActiveLayers(config);

  if (activeLayers.length === 0) {
    throw new Error('No active layers (all weights below 10% threshold)');
  }

  // Auto-select processing mode if adaptive
  const processingMode =
    mode === 'adaptive' ? selectAdaptiveMode(query, activeLayers.length) : mode;

  let result: LayersProcessingResult;

  if (processingMode === 'weighted') {
    result = await processWeightedMode(query, config, provider, activeLayers, conversationHistory);
  } else {
    result = await processParallelMode(query, config, provider, activeLayers, conversationHistory);
  }

  result.totalLatency = Date.now() - startTime;

  return result;
}

// ═══════════════════════════════════════════
// WEIGHTED MODE (Single AI Call)
// ═══════════════════════════════════════════

async function processWeightedMode(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  activeLayers: Layer[],
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  // Build unified prompt with all Layer perspectives
  const systemPrompt = buildWeightedSystemPrompt(activeLayers, config);

  const messages: Message[] = [
    { role: 'system' as const, content: systemPrompt },
    ...(conversationHistory || []),
    { role: 'user' as const, content: query },
  ];

  const startTime = Date.now();
  const response = await callProvider(provider, {
    messages,
    model: 'claude-opus-4-6',
    maxTokens: 4096,
    temperature: 0.7,
  });

  const processingTime = Date.now() - startTime;

  // Parse response to extract perspective contributions
  const perspectives = parseWeightedResponse(
    response.content,
    activeLayers,
    config,
    processingTime,
    response.usage
  );

  // Calculate activations from content (keyword-based)
  const activations = calculateActivationsFromContent(response.content);

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config);

  // Determine dominant Layer using BLENDED activations (respects user config)
  const dominantLayer = findDominantLayer(blendedActivations);

  // Suggest methodology based on blended activations
  const methodologySuggestion = suggestMethodology(blendedActivations, query);

  return {
    mode: 'weighted',
    perspectives,
    synthesizedResponse: response.content,
    activations,
    blendedActivations,
    dominantLayer,
    methodologySuggestion,
    totalCost: response.cost || 0,
    totalTokens: response.usage.totalTokens,
    totalLatency: processingTime,
    perspectiveCount: activeLayers.length,
    weightInfluenceRatio: WEIGHT_INFLUENCE_RATIO,
  };
}

// ═══════════════════════════════════════════
// PARALLEL MODE (Multiple AI Calls)
// ═══════════════════════════════════════════

async function processParallelMode(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  activeLayers: Layer[],
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  // Generate separate prompts for each Layer
  const perspectivePromises = activeLayers.map(async (layerNode) => {
    const meta = LAYER_METADATA[layerNode];
    const weight = config.layer_weights[layerNode] || 0.5;

    const prompt = buildPerspectivePrompt(layerNode, meta, query);

    const messages: Message[] = [
      { role: 'system' as const, content: prompt },
      ...(conversationHistory || []),
      { role: 'user' as const, content: query },
    ];

    const startTime = Date.now();
    const response = await callProvider(provider, {
      messages,
      model: 'claude-opus-4-6',
      maxTokens: 1024,
      temperature: 0.7,
    });

    const processingTime = Date.now() - startTime;

    return {
      layerNode,
      name: meta.name,
      aiRole: meta.aiRole,
      weight,
      prompt,
      response: response.content,
      activation: calculateLayerActivation(response.content, meta),
      confidence: 0.8,
      processingTime,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    } as LayerPerspective;
  });

  const perspectives = await Promise.all(perspectivePromises);

  // Synthesize all perspectives into unified response
  const synthesized = await synthesizePerspectives(perspectives, config, provider);

  // Calculate final activations from perspectives
  const activations = perspectives.reduce(
    (acc, p) => {
      acc[p.layerNode] = p.activation;
      return acc;
    },
    {} as Record<Layer, number>
  );

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config);

  // Determine dominant Layer using BLENDED activations (respects user config)
  const dominantLayer = findDominantLayer(blendedActivations);
  const methodologySuggestion = suggestMethodology(blendedActivations, query);

  const totalCost = perspectives.reduce(
    (sum, p) => sum + (p.tokens.input + p.tokens.output) * 0.00001,
    0
  );
  const totalTokens = perspectives.reduce((sum, p) => sum + p.tokens.input + p.tokens.output, 0);

  return {
    mode: 'parallel',
    perspectives,
    synthesizedResponse: synthesized,
    activations,
    blendedActivations,
    dominantLayer,
    methodologySuggestion,
    totalCost,
    totalTokens,
    totalLatency: Math.max(...perspectives.map((p) => p.processingTime)),
    perspectiveCount: perspectives.length,
    weightInfluenceRatio: WEIGHT_INFLUENCE_RATIO,
  };
}

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

function buildWeightedSystemPrompt(activeLayers: Layer[], config: TreeConfiguration): string {
  const perspectiveInstructions = activeLayers
    .map((layerNode) => {
      const meta = LAYER_METADATA[layerNode];
      const weight = Math.round(config.layer_weights[layerNode] * 100);

      return `
${meta.name} (${meta.aiRole}) - ${weight}% weight
Role: ${meta.aiRole}
Focus: ${meta.queryCharacteristics.join(', ')}
`;
    })
    .join('\n');

  return `You are processing this query through a multi-layer AI reasoning system.

ACTIVE PROCESSING LAYERS:
${perspectiveInstructions}

INSTRUCTIONS:
- Analyze the query from ALL active layers listed above
- Weight each layer's contribution by its percentage
- Integrate insights from all computational lenses
- Show which layers influenced your response

Provide a unified response that synthesizes all layer perspectives, weighted appropriately.`;
}

function buildPerspectivePrompt(
  layerNode: Layer,
  meta: (typeof LAYER_METADATA)[1],
  query: string
): string {
  return `You are ${meta.name} - the ${meta.meaning} AI Layer.

Your computational role: ${meta.aiRole}
Your AI function: ${meta.aiRole}

Focus areas: ${meta.queryCharacteristics.join(', ')}

Example queries you excel at:
${meta.examples
  .slice(0, 2)
  .map((ex) => `- ${ex}`)
  .join('\n')}

Analyze the following query EXCLUSIVELY from your layer's perspective:

"${query}"

Provide analysis specific to your computational lens. Do not attempt to provide a complete answer - only your layer's contribution.`;
}

async function synthesizePerspectives(
  perspectives: LayerPerspective[],
  config: TreeConfiguration,
  provider: ProviderFamily
): Promise<string> {
  const perspectiveSummaries = perspectives
    .map((p) => `${p.name} (${Math.round(p.weight * 100)}%): ${p.response.slice(0, 300)}...`)
    .join('\n\n');

  const synthesisPrompt = `Synthesize these layer perspectives into a unified, coherent response:

${perspectiveSummaries}

Weight each perspective by its percentage. Resolve any conflicts by favoring higher-weighted perspectives. Create a seamless synthesis that preserves key insights from each lens.`;

  const response = await callProvider(provider, {
    messages: [{ role: 'user' as const, content: synthesisPrompt }],
    model: 'claude-opus-4-6',
    maxTokens: 2048,
    temperature: 0.7,
  });

  return response.content;
}

function parseWeightedResponse(
  content: string,
  activeLayers: Layer[],
  config: TreeConfiguration,
  processingTime: number,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
): LayerPerspective[] {
  // Since weighted mode uses single call, we create pseudo-perspectives
  // based on keyword detection in the response
  return activeLayers.map((layerNode) => {
    const meta = LAYER_METADATA[layerNode];
    const weight = config.layer_weights[layerNode];

    return {
      layerNode,
      name: meta.name,
      aiRole: meta.aiRole,
      weight,
      prompt: '(Weighted mode - unified prompt)',
      response: content, // Full response (all perspectives combined)
      activation: calculateLayerActivation(content, meta),
      confidence: 0.75, // Lower confidence since not isolated perspective
      processingTime,
      tokens: {
        input: usage.inputTokens,
        output: usage.outputTokens,
      },
    };
  });
}
