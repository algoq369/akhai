/**
 * Reasoning Narrator — live SSE event narration.
 *
 * narrateThoughtEvent: generates a narrative line from each SSE thought event
 * during streaming. Called as events arrive to build the narrative incrementally.
 *
 * The post-hoc reflection (formerly generateReasoningNarrative) has been replaced
 * by the Cognitive Signature system (lib/cognitive/).
 */

export interface NarrativeEntry {
  sigil: string;
  category: string;
  text: string;
}

/** Methodology descriptions for live routing events */
const METHODOLOGY_PROSE: Record<string, { why: string; trait: string }> = {
  direct: {
    why: 'a direct, authoritative response',
    trait:
      'The query structure is factual — direct methodology gives the clearest signal-to-noise ratio here.',
  },
  cod: {
    why: 'chain-of-draft iterative reasoning',
    trait: 'This question benefits from progressive refinement — each draft builds on the last.',
  },
  sc: {
    why: 'self-consistency with multiple reasoning paths',
    trait:
      'By sampling several independent lines of reasoning, I reduce the risk of a single flawed chain.',
  },
  react: {
    why: 'a ReAct agent loop with observation and tool use',
    trait: 'This problem requires me to think, act, observe, and iterate.',
  },
  pas: {
    why: 'plan-and-solve decomposition',
    trait: 'I first devise a step-by-step plan, then execute each step.',
  },
  tot: {
    why: 'tree-of-thoughts multi-AI consensus',
    trait: 'Multiple AI models independently analyze your question and debate their findings.',
  },
  auto: {
    why: 'automatic methodology selection',
    trait: 'I classified your query against known patterns and selected the best methodology.',
  },
};

/** Layer descriptions for live layer activation events */
const LAYER_PROSE: Record<string, string> = {
  reception: 'I am prioritizing careful input parsing — understanding exactly what you asked.',
  comprehension: 'I am focusing on semantic comprehension — extracting deeper meaning.',
  context: 'I am prioritizing factual knowledge retrieval to ground the response.',
  articulation: 'I am focusing on articulation — organizing the answer for clarity.',
  synthesis: 'I am synthesizing multiple viewpoints into a coherent whole.',
  analysis: 'I am applying critical analysis — breaking down claims and checking logic.',
  expansion: 'I am in expansion mode — exploring novel angles beyond the obvious.',
  knowledge: 'I am prioritizing factual retrieval over creative synthesis.',
  reasoning: 'I am prioritizing logical reasoning — decomposing the problem into steps.',
  output: 'I am orchestrating the final output assembly.',
  verification: 'I am running internal verification — checking my own work.',
};

/**
 * Generate a narrative line from a single SSE thought event (live during processing).
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
      const detail = LAYER_PROSE[dominant] || `The ${dominant} layer is now the primary processor.`;
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
            text: `I detected your intent as "${intent}". This shapes how I structure my reasoning.`,
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
            text: 'The Sovereign Guard has reviewed this response and found no issues.',
          }
        : {
            sigil: '⊘',
            category: 'GUARD',
            text: `The Sovereign Guard is reviewing this response. Current status: ${verdict}.`,
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
