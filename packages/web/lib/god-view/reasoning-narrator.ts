/**
 * Reasoning Narrator
 *
 * Transforms dry metadata into human-readable narrative that explains
 * WHY the AI made each decision, not just WHAT it decided.
 * Runs client-side — no extra API calls.
 */

export interface NarrativeEntry {
  sigil: string;
  category: string;
  text: string;
}

interface ResponseMetadata {
  fusion?: {
    methodology?: string;
    confidence?: number;
    layerActivations?: Array<{ name: string; effectiveWeight: number; keywords?: string[] }>;
    dominantLayers?: string[];
    guardRecommendation?: string;
    processingMode?: string;
    activeLenses?: string[];
    processingTimeMs?: number;
  } | null;
  guardResult?: {
    passed?: boolean;
    scores?: Record<string, number>;
    issues?: string[];
  } | null;
  provider?: {
    model?: string;
    family?: string;
    reasoning?: string;
  } | null;
  metrics?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    cost?: number;
  } | null;
  sideCanal?: {
    topicsExtracted?: boolean;
    suggestions?: Array<{ topicName?: string }>;
    topics?: Array<{ name?: string }>;
  } | null;
  gnostic?: {
    progressState?: { currentLevel?: number };
    intent?: string;
    boundary?: string;
  } | null;
  query?: string;
}

const METHODOLOGY_EXPLANATIONS: Record<string, string> = {
  direct: 'a straightforward factual answer',
  cod: 'step-by-step reasoning to walk through the logic',
  sc: 'structured analysis to break down the components',
  react: 'a multi-step agent approach with tool integration',
  pas: 'mathematical computation to solve this precisely',
  tot: 'multi-AI consensus to cross-reference viewpoints',
  auto: 'automatic classification to pick the best approach',
};

const LAYER_INSIGHTS: Record<string, string> = {
  reception: 'parsing your input for structure and intent',
  comprehension: 'understanding the deeper semantic meaning',
  context: 'retrieving relevant knowledge and facts',
  articulation: 'crafting a clear, well-structured response',
  synthesis: 'integrating multiple perspectives into a coherent view',
  analysis: 'applying critical thinking and evaluation',
  expansion: 'exploring creative possibilities and novel angles',
  knowledge: 'accessing factual knowledge and verified data',
  reasoning: 'decomposing the problem into logical steps',
  output: 'orchestrating the final response assembly',
  verification: 'self-checking for accuracy and consistency',
};

export function generateReasoningNarrative(meta: ResponseMetadata): NarrativeEntry[] {
  const entries: NarrativeEntry[] = [];
  const query = meta.query || '';
  const querySnippet = query.length > 40 ? query.slice(0, 40) + '...' : query;

  // 1. QUERY UNDERSTANDING + METHOD SELECTION
  if (meta.fusion) {
    const method = meta.fusion.methodology || 'direct';
    const conf = meta.fusion.confidence ? Math.round(meta.fusion.confidence * 100) : 0;
    const why = METHODOLOGY_EXPLANATIONS[method] || method;
    const keywords = meta.fusion.layerActivations?.[0]?.keywords?.slice(0, 3);
    const keywordNote = keywords?.length
      ? ` The signals "${keywords.join('", "')}" shaped my routing.`
      : '';

    let modeNote = '';
    if (meta.fusion.processingMode) {
      modeNote = ` Processing in ${meta.fusion.processingMode} mode.`;
    }
    if (meta.fusion.activeLenses && meta.fusion.activeLenses.length > 0) {
      modeNote += ` Active lenses: ${meta.fusion.activeLenses.join(', ')}.`;
    }

    entries.push({
      sigil: '◊',
      category: 'QUERY',
      text: `Analyzing "${querySnippet}". Routing through ${method.toUpperCase()} (${conf}% confidence) for ${why}.${keywordNote}${modeNote}`,
    });
  }

  // 2. LAYER ACTIVATION
  if (meta.fusion?.layerActivations && meta.fusion.layerActivations.length > 0) {
    const top = meta.fusion.layerActivations[0];
    const topName = top.name || 'unknown';
    const topWeight = Math.round((top.effectiveWeight || 0) * 100);
    const topInsight = LAYER_INSIGHTS[topName] || 'processing your request';

    let secondLine = '';
    if (meta.fusion.layerActivations.length > 1) {
      const sec = meta.fusion.layerActivations[1];
      const secName = sec.name || 'unknown';
      const secWeight = Math.round((sec.effectiveWeight || 0) * 100);
      const secInsight = LAYER_INSIGHTS[secName] || 'secondary processing';
      secondLine = ` ${secName} (${secWeight}%) provides ${secInsight}.`;
    }

    entries.push({
      sigil: '→',
      category: 'LAYERS',
      text: `${topName} is most active (${topWeight}%) — ${topInsight}.${secondLine}`,
    });
  }

  // 3. GUARD ANALYSIS
  if (meta.guardResult) {
    const passed = meta.guardResult.passed !== false;
    const scores = meta.guardResult.scores || {};
    const issues = meta.guardResult.issues || [];

    const scoreParts: string[] = [];
    if (scores.hype != null) scoreParts.push(`hype ${Math.round(scores.hype * 100)}%`);
    if (scores.echo != null) scoreParts.push(`echo ${Math.round(scores.echo * 100)}%`);
    if (scores.drift != null) scoreParts.push(`drift ${Math.round(scores.drift * 100)}%`);
    if (scores.fact != null) scoreParts.push(`fact ${Math.round(scores.fact * 100)}%`);

    const scoreText = scoreParts.length > 0 ? scoreParts.join(', ') : 'all clear';

    // Explain what each score means
    const scoreExplanations: string[] = [];
    if (scores.hype != null && scores.hype > 0.1)
      scoreExplanations.push(
        `${Math.round(scores.hype * 100)}% hype risk (overly confident claims)`
      );
    if (scores.echo != null && scores.echo > 0.1)
      scoreExplanations.push(
        `${Math.round(scores.echo * 100)}% echo risk (repeating without adding value)`
      );
    if (scores.drift != null && scores.drift > 0.1)
      scoreExplanations.push(
        `${Math.round(scores.drift * 100)}% drift risk (straying from the question)`
      );
    if (scores.fact != null && scores.fact > 0.1)
      scoreExplanations.push(`${Math.round(scores.fact * 100)}% factual concern`);

    if (passed && issues.length === 0 && scoreExplanations.length === 0) {
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard passed cleanly — no hype patterns, no echo chamber risk, no factual drift. The response is grounded in verifiable reasoning.`,
      });
    } else if (passed) {
      const detailText =
        scoreExplanations.length > 0 ? ` Detected: ${scoreExplanations.join('; ')}.` : '';
      const issueText = issues.length > 0 ? ` Notes: ${issues.join('; ')}.` : '';
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard passed.${detailText}${issueText} Response cleared for delivery.`,
      });
    } else {
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard flagged concerns: ${issues.join('; ')}. ${scoreExplanations.join('; ')}. Response was refined before delivery.`,
      });
    }
  }

  // 4. CONTEXT
  const topicNames = meta.sideCanal?.topics?.map((t) => t.name).filter(Boolean) || [];
  const suggestionCount = meta.sideCanal?.suggestions?.length || 0;

  if (topicNames.length > 0 || meta.sideCanal?.topicsExtracted) {
    const topicText =
      topicNames.length > 0
        ? `Extracted topics: "${topicNames.slice(0, 3).join('", "')}".`
        : 'Topics extracted from conversation context.';
    const suggestionText =
      suggestionCount > 0
        ? ` Found ${suggestionCount} related suggestions for deeper exploration.`
        : '';

    entries.push({
      sigil: '◇',
      category: 'CONTEXT',
      text: `${topicText}${suggestionText}`,
    });
  }

  // 5. PERFORMANCE
  if (meta.metrics || meta.provider) {
    const tokens = meta.metrics?.totalTokens || 0;
    const latency = meta.metrics?.latencyMs ? (meta.metrics.latencyMs / 1000).toFixed(1) : null;
    const cost = meta.metrics?.cost;
    const model = meta.provider?.model || meta.fusion?.processingMode || 'unknown';
    const modelShort = model.replace(/^meta-llama\//, '').replace(/:free$/, '');

    const costText = cost && cost > 0 ? `$${cost.toFixed(4)}` : '$0.00 (free tier)';
    const latencyText = latency ? ` in ${latency}s` : '';

    entries.push({
      sigil: '○',
      category: 'PERFORMANCE',
      text: `${tokens.toLocaleString()} tokens${latencyText} at ${costText} via ${modelShort}.`,
    });
  }

  // 6. GNOSTIC / ASCENT
  if (meta.gnostic) {
    const level = meta.gnostic.progressState?.currentLevel || 1;
    const intent = meta.gnostic.intent;
    const boundary = meta.gnostic.boundary;

    let gnosticText = `Ascent level ${level}/11`;
    if (intent) gnosticText += ` — intent: ${intent}`;
    if (boundary) gnosticText += `. Boundary: ${boundary}`;
    gnosticText += '. Each query deepens your journey through the computational layers.';

    entries.push({
      sigil: '☿',
      category: 'ASCENT',
      text: gnosticText,
    });
  }

  return entries;
}

/**
 * Generate a narrative line from a single SSE thought event (live during processing).
 * Called as each SSE event arrives to build the narrative incrementally.
 */
export function narrateThoughtEvent(event: {
  stage: string;
  data?: string;
  details?: any;
  timestamp?: number;
}): NarrativeEntry | null {
  switch (event.stage) {
    case 'received':
      return { sigil: '◊', category: 'START', text: `Query received. Beginning analysis...` };
    case 'routing': {
      const d = event.details || {};
      const method = d.methodology?.selected || 'direct';
      const conf = d.confidence ? Math.round(d.confidence * 100) : 0;
      const reason = d.methodology?.reason || '';
      return {
        sigil: '→',
        category: 'ROUTE',
        text: `Routing to ${method.toUpperCase()} (${conf}%). ${reason}`,
      };
    }
    case 'layers': {
      const d = event.details || {};
      const dominant = d.dominantLayer || 'unknown';
      return {
        sigil: '⊕',
        category: 'LAYERS',
        text: `${dominant} layer activated as primary processor.`,
      };
    }
    case 'reasoning': {
      const d = event.details?.reasoning || {};
      const intent = d.intent || '';
      return intent ? { sigil: '∵', category: 'REASON', text: `Intent detected: ${intent}` } : null;
    }
    case 'generating': {
      const d = event.details || {};
      const model = (d.model || '').replace(/^meta-llama\//, '');
      return model ? { sigil: '○', category: 'GEN', text: `Generating via ${model}...` } : null;
    }
    case 'guard': {
      const g = event.details?.guard || {};
      const verdict = g.verdict === 'pass' ? 'passed' : g.verdict || 'checking';
      return { sigil: '△', category: 'GUARD', text: `Guard ${verdict}.` };
    }
    case 'complete': {
      const d = event.details || {};
      const dur = d.duration ? `${Math.round(d.duration)}ms` : '';
      const cost = d.cost ? `$${d.cost.toFixed(4)}` : '$0.00';
      return {
        sigil: '○',
        category: 'DONE',
        text: `Complete${dur ? ` in ${dur}` : ''} at ${cost}.`,
      };
    }
    default:
      return null;
  }
}
