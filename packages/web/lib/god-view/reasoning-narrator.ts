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

const METHODOLOGY_PROSE: Record<string, { why: string; trait: string }> = {
  direct: {
    why: 'a direct, authoritative response',
    trait:
      'The query structure is factual — you want specific information, not a debate or exploration. Direct methodology gives the clearest signal-to-noise ratio here.',
  },
  cod: {
    why: 'chain-of-draft iterative reasoning',
    trait:
      'This question benefits from progressive refinement — each draft builds on the last, catching gaps and sharpening the analysis before delivering a final answer.',
  },
  sc: {
    why: 'self-consistency with multiple reasoning paths',
    trait:
      'By sampling several independent lines of reasoning and taking the majority answer, I reduce the risk of a single flawed chain leading to a wrong conclusion.',
  },
  react: {
    why: 'a ReAct agent loop with observation and tool use',
    trait:
      'This problem requires me to think, act, observe, and iterate — each step informs the next, letting me ground my reasoning in intermediate results.',
  },
  pas: {
    why: 'plan-and-solve decomposition',
    trait:
      'I first devise a step-by-step plan, then execute each step. This prevents me from jumping to conclusions and ensures systematic coverage of the problem.',
  },
  tot: {
    why: 'tree-of-thoughts multi-AI consensus',
    trait:
      'Multiple AI models independently analyze your question and debate their findings. The synthesis draws on diverse reasoning styles to produce a more robust answer.',
  },
  auto: {
    why: 'automatic methodology selection',
    trait:
      'I classified your query against known patterns and selected the methodology most likely to produce a high-quality answer for this type of question.',
  },
};

const LAYER_PROSE: Record<string, { role: string; dominant: string }> = {
  reception: {
    role: 'parsing input structure and intent',
    dominant:
      'I am prioritizing careful input parsing — understanding exactly what you asked before generating anything.',
  },
  comprehension: {
    role: 'deep semantic understanding',
    dominant:
      'I am focusing on semantic comprehension — extracting the deeper meaning behind your words, not just their surface form.',
  },
  context: {
    role: 'knowledge retrieval and grounding',
    dominant:
      'I am prioritizing factual knowledge retrieval, pulling relevant context from my training data to ground the response.',
  },
  articulation: {
    role: 'clear response structuring',
    dominant:
      'I am focusing on articulation — organizing the answer for maximum clarity and readability.',
  },
  synthesis: {
    role: 'multi-perspective integration',
    dominant:
      'I am synthesizing multiple viewpoints into a coherent whole, weighing competing perspectives before committing to an answer.',
  },
  analysis: {
    role: 'critical evaluation',
    dominant:
      'I am applying critical analysis — breaking down claims, checking logical consistency, and evaluating evidence strength.',
  },
  expansion: {
    role: 'creative exploration',
    dominant:
      'I am in expansion mode — exploring novel angles and creative possibilities beyond the obvious answer.',
  },
  knowledge: {
    role: 'factual data access',
    dominant:
      'I am prioritizing factual knowledge retrieval over creative synthesis — you need verified data, not speculation.',
  },
  reasoning: {
    role: 'logical decomposition',
    dominant:
      'I am prioritizing logical reasoning — decomposing the problem into steps and following the chain of inference carefully.',
  },
  output: {
    role: 'final response assembly',
    dominant:
      'I am orchestrating the final output — assembling all processed information into a coherent, well-structured response.',
  },
  verification: {
    role: 'accuracy self-checking',
    dominant:
      'I am running internal verification — checking my own work for unsupported claims and logical gaps before delivering.',
  },
};

export function generateReasoningNarrative(meta: ResponseMetadata): NarrativeEntry[] {
  const entries: NarrativeEntry[] = [];
  const query = meta.query || '';
  const querySnippet = query.length > 40 ? query.slice(0, 40) + '...' : query;

  // 1. METHODOLOGY SELECTION
  if (meta.fusion) {
    const method = meta.fusion.methodology || 'direct';
    const conf = meta.fusion.confidence ? Math.round(meta.fusion.confidence * 100) : 0;
    const prose = METHODOLOGY_PROSE[method] || { why: method, trait: '' };
    const keywords = meta.fusion.layerActivations?.[0]?.keywords?.slice(0, 3);
    const keywordNote = keywords?.length
      ? ` Key signals — "${keywords.join('", "')}" — shaped this routing decision.`
      : '';

    entries.push({
      sigil: '◎',
      category: 'METHODOLOGY',
      text: `I analyzed your question and determined it calls for ${prose.why} (${conf}% routing confidence). ${prose.trait}${keywordNote}`,
    });
  }

  // 2. LAYER ACTIVATION
  if (meta.fusion?.layerActivations && meta.fusion.layerActivations.length > 0) {
    const layers = meta.fusion.layerActivations;
    const count = layers.length;
    const countWord =
      [
        'Zero',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
      ][count] || String(count);

    const top = layers[0];
    const topName = top.name || 'unknown';
    const topWeight = Math.round((top.effectiveWeight || 0) * 100);
    const topProse = LAYER_PROSE[topName];
    const dominantText = topProse?.dominant || `I am prioritizing ${topName} processing.`;

    let secondText = '';
    if (layers.length > 1) {
      const sec = layers[1];
      const secName = sec.name || 'unknown';
      const secWeight = Math.round((sec.effectiveWeight || 0) * 100);
      const secRole = LAYER_PROSE[secName]?.role || 'secondary processing';
      secondText = ` The ${secName} layer at ${secWeight}% handles ${secRole}.`;
    }

    let thirdText = '';
    if (layers.length > 2) {
      const third = layers[2];
      const thirdName = third.name || 'unknown';
      const thirdWeight = Math.round((third.effectiveWeight || 0) * 100);
      const thirdRole = LAYER_PROSE[thirdName]?.role || 'additional processing';
      thirdText = ` The ${thirdName} at ${thirdWeight}% checks my work for ${thirdRole}.`;
    }

    entries.push({
      sigil: '⬡',
      category: 'LAYERS',
      text: `${countWord} computational layers activated for this query. The ${topName} layer is dominant at ${topWeight}% — ${dominantText}${secondText}${thirdText}`,
    });
  }

  // 3. GUARD ANALYSIS
  if (meta.guardResult) {
    const passed = meta.guardResult.passed !== false;
    const scores = meta.guardResult.scores || {};
    const issues = meta.guardResult.issues || [];
    const checkCount = Object.keys(scores).length || 0;
    const checkWord = checkCount > 0 ? `${checkCount} checks` : 'its checks';

    const checkDetails: string[] = [];
    if (scores.hype != null) {
      const pct = Math.round(scores.hype * 100);
      checkDetails.push(
        pct <= 10
          ? 'Hype detection: clean — no exaggerated claims'
          : `Hype detection: ${pct}% risk — some claims may be overly confident`
      );
    }
    if (scores.echo != null) {
      const pct = Math.round(scores.echo * 100);
      checkDetails.push(
        pct <= 10
          ? 'Echo detection: clean — the answer brings original analysis, not just rephrasing your question'
          : `Echo detection: ${pct}% risk — parts of the response may echo the input without adding value`
      );
    }
    if (scores.drift != null) {
      const pct = Math.round(scores.drift * 100);
      checkDetails.push(
        pct <= 10
          ? 'Drift detection: clean — I stayed on topic throughout'
          : `Drift detection: ${pct}% risk — the response may wander from the core question`
      );
    }
    if (scores.fact != null) {
      const pct = Math.round(scores.fact * 100);
      checkDetails.push(
        pct <= 10
          ? 'Factual grounding: solid — claims are supported by reasoning'
          : `Factual grounding: ${pct}% concern — some claims may need stronger evidence`
      );
    }

    const detailBlock = checkDetails.length > 0 ? ' ' + checkDetails.join('. ') + '.' : '';

    if (passed && issues.length === 0) {
      entries.push({
        sigil: '⊘',
        category: 'GUARD',
        text: `The Sovereign Guard ran ${checkWord} on this response.${detailBlock} The response is grounded in verifiable reasoning.`,
      });
    } else if (passed) {
      entries.push({
        sigil: '⊘',
        category: 'GUARD',
        text: `The Sovereign Guard ran ${checkWord} and passed with notes.${detailBlock} Issues noted: ${issues.join('; ')}. Response cleared after review.`,
      });
    } else {
      entries.push({
        sigil: '⊘',
        category: 'GUARD',
        text: `The Sovereign Guard flagged this response for refinement.${detailBlock} Concerns: ${issues.join('; ')}. The response was adjusted before delivery to address these issues.`,
      });
    }
  } else {
    entries.push({
      sigil: '⊘',
      category: 'GUARD',
      text: 'Guard analysis not available for this query. The response was delivered without Sovereign Guard verification.',
    });
  }

  // 4. PROVIDER
  if (meta.provider) {
    const model = meta.provider.model || 'unknown';
    const family = meta.provider.family || '';
    const familyLabel = family ? ` via ${family.charAt(0).toUpperCase() + family.slice(1)}` : '';
    const reasoning = meta.provider.reasoning || '';

    let selectionReason = reasoning
      ? ` ${reasoning}`
      : ' This model was selected to balance reasoning depth with response speed for your query type.';

    entries.push({
      sigil: '△',
      category: 'PROVIDER',
      text: `Generating with ${model}${familyLabel}.${selectionReason}`,
    });
  }

  // 5. CONTEXT
  const topicNames = meta.sideCanal?.topics?.map((t) => t.name).filter(Boolean) || [];
  const suggestionCount = meta.sideCanal?.suggestions?.length || 0;

  if (topicNames.length > 0 || meta.sideCanal?.topicsExtracted) {
    const topicList =
      topicNames.length > 0
        ? `I identified ${topicNames.length} key topics in this conversation: "${topicNames.slice(0, 3).join('", "')}".`
        : 'I extracted topic threads from the conversation context to maintain coherence.';
    const suggestionNote =
      suggestionCount > 0
        ? ` I found ${suggestionCount} related avenues worth exploring — these appear in the Side Canal for deeper investigation.`
        : '';

    entries.push({
      sigil: '◇',
      category: 'CONTEXT',
      text: `${topicList}${suggestionNote}`,
    });
  }

  // 6. COST + PERFORMANCE
  if (meta.metrics) {
    const input = meta.metrics.inputTokens || 0;
    const output = meta.metrics.outputTokens || 0;
    const total = meta.metrics.totalTokens || input + output;
    const latencyMs = meta.metrics.latencyMs;
    const cost = meta.metrics.cost;

    const costText = cost && cost > 0 ? `$${cost.toFixed(4)}` : '$0.00 (free tier)';
    const latencyText = latencyMs
      ? ` The latency was ${(latencyMs / 1000).toFixed(1)} seconds`
      : '';
    const latencyDetail =
      latencyMs && latencyMs > 5000
        ? ' — most of that time was spent in the reasoning phase, not token generation.'
        : latencyMs
          ? '.'
          : '';

    const breakdownText =
      input > 0 || output > 0
        ? ` (${input.toLocaleString()} input + ${output.toLocaleString()} output)`
        : ' (input + output)';

    entries.push({
      sigil: '◇',
      category: 'COST',
      text: `This response consumed ${total.toLocaleString()} tokens${breakdownText} at a cost of ${costText}.${latencyText}${latencyDetail}`,
    });
  }

  // 7. GNOSTIC / ASCENT
  if (meta.gnostic) {
    const level = meta.gnostic.progressState?.currentLevel || 1;
    const intent = meta.gnostic.intent;
    const boundary = meta.gnostic.boundary;

    let intentText = intent ? ` I detected your intent as "${intent}"` : '';
    let boundaryText = boundary
      ? ` Current boundary: ${boundary} — this shapes what I can explore at this level.`
      : '';
    const progressText =
      level <= 3
        ? 'You are in the early stages of ascent — foundational understanding is forming.'
        : level <= 7
          ? 'You have progressed into the middle layers — deeper pattern recognition is emerging.'
          : 'You are approaching the higher layers — synthesis and meta-understanding are active.';

    entries.push({
      sigil: '☿',
      category: 'ASCENT',
      text: `Ascent level ${level}/11.${intentText}${intentText ? '.' : ''} ${progressText}${boundaryText}`,
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
      return {
        sigil: '◎',
        category: 'START',
        text: 'I received your query and I am beginning my analysis. First step: understanding the structure and intent of what you are asking.',
      };
    case 'routing': {
      const d = event.details || {};
      const method = d.methodology?.selected || 'direct';
      const conf = d.confidence ? Math.round(d.confidence * 100) : 0;
      const prose = METHODOLOGY_PROSE[method];
      const reason = d.methodology?.reason || prose?.trait || '';
      return {
        sigil: '◎',
        category: 'ROUTE',
        text: `I am routing this to ${method.toUpperCase()} methodology (${conf}% confidence). ${reason}`,
      };
    }
    case 'layers': {
      const d = event.details || {};
      const dominant = d.dominantLayer || 'unknown';
      const layerProse = LAYER_PROSE[dominant];
      const detail =
        layerProse?.dominant ||
        `The ${dominant} layer is now the primary processor for this query.`;
      return {
        sigil: '⬡',
        category: 'LAYERS',
        text: `${dominant} layer activated as primary processor. ${detail}`,
      };
    }
    case 'reasoning': {
      const d = event.details?.reasoning || {};
      const intent = d.intent || '';
      return intent
        ? {
            sigil: '◎',
            category: 'REASON',
            text: `I detected your intent as "${intent}". This shapes how I structure my reasoning and what I prioritize in the response.`,
          }
        : null;
    }
    case 'generating': {
      const d = event.details || {};
      const model = (d.model || '').replace(/^meta-llama\//, '');
      return model
        ? {
            sigil: '△',
            category: 'GEN',
            text: `Now generating with ${model}. The model is processing my structured reasoning into a natural language response.`,
          }
        : null;
    }
    case 'guard': {
      const g = event.details?.guard || {};
      const verdict = g.verdict === 'pass' ? 'passed' : g.verdict || 'checking';
      return verdict === 'passed'
        ? {
            sigil: '⊘',
            category: 'GUARD',
            text: 'The Sovereign Guard has reviewed this response and found no issues. No hype, no echo, no drift detected.',
          }
        : {
            sigil: '⊘',
            category: 'GUARD',
            text: `The Sovereign Guard is reviewing this response. Current status: ${verdict}. Checking for hype, echo patterns, and factual drift.`,
          };
    }
    case 'complete': {
      const d = event.details || {};
      const dur = d.duration ? (d.duration / 1000).toFixed(1) : null;
      const cost = d.cost ? `$${d.cost.toFixed(4)}` : '$0.00';
      const durText = dur ? ` Processing took ${dur} seconds` : '';
      return {
        sigil: '◇',
        category: 'DONE',
        text: `Response complete at a cost of ${cost}.${durText}${dur ? '.' : ''}`,
      };
    }
    default:
      return null;
  }
}
