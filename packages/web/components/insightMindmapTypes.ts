import { Layer, LAYER_METADATA } from '@/lib/layer-registry';

export interface ConceptNode {
  id: string;
  label: string;
  fullText: string;
  category: string;
  confidence: number;
  relevance: number;
  connections: string[];
  context: string;
  insight: string;
  layerMapping: Layer[]; // Which Layers this concept relates to
}

export interface QueryInsight {
  intent: string;
  keywords: string[];
  layersFocus: { layerNode: Layer; reason: string }[];
}

// Research link from dynamic discovery
export interface ResearchLink {
  id: string;
  url: string;
  title: string;
  snippet?: string;
  relevance: number;
  source: string;
}

export interface InsightMindmapProps {
  content: string;
  query: string;
  methodology?: string;
  onSwitchToLayers?: () => void;
  onOpenMindMap?: () => void;
  onDeepDive?: (query: string) => void;
}

// Layer colors
export const LAYER_COLORS: Record<number, string> = {
  1: '#f59e0b', // Embedding - amber
  2: '#8b5cf6', // Executor - violet
  3: '#f97316', // Classifier - orange
  4: '#22c55e', // Generative - green
  5: '#eab308', // Attention - yellow
  6: '#ef4444', // Discriminator - red
  7: '#3b82f6', // Expansion - blue
  8: '#6366f1', // Encoder - indigo
  9: '#64748b', // Reasoning - slate
  10: '#ffffff', // Meta-Core - white
  11: '#06b6d4', // Synthesis - cyan
};

// Map concepts to Layers based on content
export function mapToLayers(text: string, category: string): Layer[] {
  const textLower = text.toLowerCase();
  const layers: Layer[] = [];

  // Meta-Core (10) - Crown - Meta, integration, highest level
  if (
    textLower.includes('meta') ||
    textLower.includes('integration') ||
    textLower.includes('holistic') ||
    textLower.includes('overview')
  ) {
    layers.push(Layer.META_CORE);
  }
  // Reasoning (9) - Wisdom - Abstract reasoning, principles
  if (
    textLower.includes('principle') ||
    textLower.includes('theory') ||
    textLower.includes('abstract') ||
    textLower.includes('reasoning')
  ) {
    layers.push(Layer.REASONING);
  }
  // Encoder (8) - Understanding - Patterns, analysis
  if (
    textLower.includes('pattern') ||
    textLower.includes('structure') ||
    textLower.includes('analysis') ||
    textLower.includes('understand')
  ) {
    layers.push(Layer.ENCODER);
  }
  // Expansion (7) - Expansion - Growth, possibilities
  if (
    textLower.includes('expand') ||
    textLower.includes('grow') ||
    textLower.includes('possibilit') ||
    textLower.includes('opportunity')
  ) {
    layers.push(Layer.EXPANSION);
  }
  // Discriminator (6) - Constraint - Limits, rules, validation
  if (
    textLower.includes('limit') ||
    textLower.includes('constrain') ||
    textLower.includes('valid') ||
    textLower.includes('rule')
  ) {
    layers.push(Layer.DISCRIMINATOR);
  }
  // Attention (5) - Balance - Harmony, integration
  if (
    textLower.includes('balance') ||
    textLower.includes('harmony') ||
    textLower.includes('core') ||
    category === 'core'
  ) {
    layers.push(Layer.ATTENTION);
  }
  // Generative (4) - Creativity - Generation, creation
  if (
    textLower.includes('creat') ||
    textLower.includes('generat') ||
    textLower.includes('design') ||
    textLower.includes('innovate')
  ) {
    layers.push(Layer.GENERATIVE);
  }
  // Classifier (3) - Logic - Classification, logic
  if (
    textLower.includes('logic') ||
    textLower.includes('classif') ||
    textLower.includes('categor') ||
    category === 'definition'
  ) {
    layers.push(Layer.CLASSIFIER);
  }
  // Executor (2) - Foundation - Implementation, execution
  if (
    textLower.includes('implement') ||
    textLower.includes('execut') ||
    textLower.includes('method') ||
    category === 'method'
  ) {
    layers.push(Layer.EXECUTOR);
  }
  // Embedding (1) - Kingdom - Data, concrete
  if (
    textLower.includes('data') ||
    textLower.includes('result') ||
    textLower.includes('example') ||
    category === 'data' ||
    category === 'example'
  ) {
    layers.push(Layer.EMBEDDING);
  }
  // Synthesis (11) - Knowledge - Emergent insights
  if (
    textLower.includes('insight') ||
    textLower.includes('emergent') ||
    textLower.includes('discover') ||
    category === 'insight'
  ) {
    layers.push(Layer.SYNTHESIS);
  }

  // Default to Attention (balance/core) if no match
  return layers.length > 0 ? layers.slice(0, 2) : [Layer.ATTENTION];
}

// Generate query-specific insight with Layers focus
export function generateQueryInsight(
  query: string,
  content: string,
  nodes: ConceptNode[]
): QueryInsight {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);

  // Extract key phrases (capitalized or quoted)
  const keyPhrases = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const keywords = [...new Set([...keyPhrases, ...queryWords.slice(0, 5)])].slice(0, 6);

  // Determine intent
  let intent = '';
  if (queryLower.includes('how')) intent = 'Understand methodology and process';
  else if (queryLower.includes('what')) intent = 'Define and clarify concepts';
  else if (queryLower.includes('why')) intent = 'Explore reasoning and causation';
  else if (queryLower.includes('compare')) intent = 'Analyze differences and trade-offs';
  else intent = 'Explore and synthesize information';

  // Determine Layers focus based on query type
  const layersFocus: { layerNode: Layer; reason: string }[] = [];

  if (
    queryLower.includes('how') ||
    queryLower.includes('implement') ||
    queryLower.includes('build')
  ) {
    layersFocus.push({ layerNode: Layer.EXECUTOR, reason: 'Implementation focus' });
  }
  if (
    queryLower.includes('what') ||
    queryLower.includes('define') ||
    queryLower.includes('explain')
  ) {
    layersFocus.push({ layerNode: Layer.CLASSIFIER, reason: 'Classification & definition' });
  }
  if (queryLower.includes('why') || queryLower.includes('reason') || queryLower.includes('cause')) {
    layersFocus.push({ layerNode: Layer.ENCODER, reason: 'Pattern understanding' });
  }
  if (
    queryLower.includes('create') ||
    queryLower.includes('design') ||
    queryLower.includes('generate')
  ) {
    layersFocus.push({ layerNode: Layer.GENERATIVE, reason: 'Creative generation' });
  }
  if (
    queryLower.includes('compare') ||
    queryLower.includes('limit') ||
    queryLower.includes('constraint')
  ) {
    layersFocus.push({ layerNode: Layer.DISCRIMINATOR, reason: 'Boundaries & evaluation' });
  }

  // Default to Attention if no specific focus
  if (layersFocus.length === 0) {
    layersFocus.push({ layerNode: Layer.ATTENTION, reason: 'Balanced integration' });
  }

  return { intent, keywords, layersFocus: layersFocus.slice(0, 2) };
}

// Generate node-specific context and insight — direct pass-through of the source text.
export function generateNodeInsight(
  text: string,
  _category: string,
  _query: string
): { context: string; insight: string } {
  return {
    context: text,
    insight: text.length > 80 ? text.substring(0, 77) + '...' : text,
  };
}

function inferLayerMapping(text: string): Layer[] {
  const layers: Layer[] = [];
  const lower = text.toLowerCase();

  if (/how|process|method|step|procedure|tutorial/.test(lower)) layers.push(Layer.EXECUTOR);
  if (/analy|compare|versus|differ|pros|cons|evaluat/.test(lower)) layers.push(Layer.DISCRIMINATOR);
  if (/data|statistic|number|percent|measure|fact/.test(lower)) layers.push(Layer.ENCODER);
  if (/think|reason|logic|argument|because|therefore|why/.test(lower)) layers.push(Layer.REASONING);
  if (/create|write|design|build|imagine|story/.test(lower)) layers.push(Layer.GENERATIVE);
  if (/overview|summary|main|key|important|significant/.test(lower)) layers.push(Layer.ATTENTION);
  if (/risk|danger|careful|warning|error|problem|issue/.test(lower))
    layers.push(Layer.DISCRIMINATOR);
  if (/connect|relate|pattern|system|whole|integrat/.test(lower)) layers.push(Layer.SYNTHESIS);
  if (/what|define|concept|mean|term/.test(lower)) layers.push(Layer.EMBEDDING);
  if (/all|everything|complete|comprehensive|full/.test(lower)) layers.push(Layer.META_CORE);

  return [...new Set(layers)].slice(0, 2);
}

export function extractInsights(content: string, query: string): ConceptNode[] {
  const nodes: ConceptNode[] = [];
  const categories = [
    'core',
    'definition',
    'example',
    'method',
    'application',
    'comparison',
    'insight',
    'data',
  ];

  const boldPattern = /\*\*([^*]+)\*\*/g;
  const headerPattern = /^#+\s*(.+)$/gm;
  const bulletPattern = /^[-•*]\s*(.+)$/gm;

  const allMatches: { text: string; type: string }[] = [];

  let match;
  while ((match = boldPattern.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 3 && text.length < 100) allMatches.push({ text, type: 'bold' });
  }

  while ((match = headerPattern.exec(content)) !== null) {
    const text = match[1].trim().replace(/[#*]/g, '');
    if (text.length > 3 && text.length < 80) allMatches.push({ text, type: 'header' });
  }

  while ((match = bulletPattern.exec(content)) !== null) {
    const text = match[1].trim().replace(/\*\*/g, '');
    if (text.length > 10 && text.length < 120) allMatches.push({ text, type: 'bullet' });
  }

  const seen = new Set<string>();
  allMatches.forEach((item, index) => {
    const key = item.text.toLowerCase().substring(0, 30);
    if (seen.has(key)) return;
    seen.add(key);

    let category = categories[index % categories.length];
    const textLower = item.text.toLowerCase();

    if (textLower.includes('example') || textLower.includes('such as')) category = 'example';
    else if (textLower.includes('define') || textLower.includes('is a')) category = 'definition';
    else if (textLower.includes('method') || textLower.includes('step')) category = 'method';
    else if (textLower.includes('use') || textLower.includes('apply')) category = 'application';
    else if (textLower.includes('data') || textLower.includes('metric')) category = 'data';
    else if (textLower.includes('compare') || textLower.includes('versus')) category = 'comparison';
    else if (textLower.includes('insight') || textLower.includes('key')) category = 'insight';

    const baseConfidence = item.type === 'bold' ? 0.9 : item.type === 'header' ? 0.85 : 0.75;
    const confidence = Math.min(0.98, baseConfidence + Math.random() * 0.08);

    const queryWords = query.toLowerCase().split(/\s+/);
    const matchWords = queryWords.filter((w) => w.length > 3 && textLower.includes(w)).length;
    const relevance = Math.min(0.98, 0.6 + (matchWords / Math.max(1, queryWords.length)) * 0.4);

    // Extract paragraph content following this match (until next header/bold/bullet/blank line)
    const matchPos = content.indexOf(item.text);
    let paragraphContent = '';
    if (matchPos >= 0) {
      const afterMatch = content.slice(matchPos + item.text.length);
      const nextBreak = afterMatch.search(/\n#{1,3}\s|\n\*\*|\n[-•*]\s|\n\n/);
      const rawParagraph =
        nextBreak > 0 ? afterMatch.slice(0, nextBreak) : afterMatch.slice(0, 500);
      const cleaned = rawParagraph.replace(/[#*]/g, '').replace(/\n/g, ' ').trim();
      const sentences = cleaned.match(/[^.!?]*[.!?]/g);
      paragraphContent = sentences ? sentences.slice(0, 3).join(' ').trim() : cleaned.slice(0, 250);
    }

    const { context, insight } = generateNodeInsight(item.text, category, query);
    const layerMapping = mapToLayers(item.text, category);

    nodes.push({
      id: `insight-${nodes.length}`,
      label: item.text.length > 32 ? item.text.substring(0, 29) + '...' : item.text,
      fullText: paragraphContent || item.text,
      category,
      confidence,
      relevance,
      connections: [],
      context: paragraphContent ? paragraphContent.slice(0, 120) : context,
      insight: paragraphContent ? paragraphContent.slice(0, 80) + '...' : insight,
      layerMapping,
    });
  });

  // PRIORITY LAST: Extract from plain text sentences when formatting-based extraction found < 3 nodes
  if (nodes.length < 3) {
    const plainSentences = content
      .split(/[.!?]+/)
      .map((s) => s.replace(/[#*`\-\[\]]/g, '').trim())
      .filter((s) => s.length > 30 && s.length < 300);

    const queryWordSet = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const scored = plainSentences.map((sentence) => {
      const words = sentence.toLowerCase().split(/\s+/);
      const matchCount = words.filter((w) => queryWordSet.has(w)).length;
      const relevance = queryWordSet.size > 0 ? matchCount / queryWordSet.size : 0.3;
      return { sentence, relevance };
    });

    scored.sort((a, b) => b.relevance - a.relevance);

    for (const { sentence, relevance } of scored.slice(0, 6)) {
      const key = sentence.toLowerCase().substring(0, 30);
      if (seen.has(key)) continue;
      seen.add(key);

      const category = categories[nodes.length % categories.length];
      const label = sentence.split(/\s+/).slice(0, 6).join(' ') + '...';
      const layerMapping = inferLayerMapping(sentence);
      const { context, insight } = generateNodeInsight(sentence, category, query);

      nodes.push({
        id: `plain-${nodes.length}`,
        label,
        fullText: sentence,
        category,
        confidence: 0.5 + relevance * 0.3,
        relevance: Math.min(0.98, 0.5 + relevance * 0.4),
        connections: [],
        context,
        insight,
        layerMapping: layerMapping.length > 0 ? layerMapping : [Layer.ATTENTION],
      });
    }
  }

  // Build connections (runs after ALL extraction including plain-text)
  nodes.forEach((node, i) => {
    nodes.forEach((other, j) => {
      if (i !== j) {
        const words1 = node.fullText.toLowerCase().split(/\s+/);
        const words2 = other.fullText.toLowerCase().split(/\s+/);
        const common = words1.filter((w) => w.length > 4 && words2.includes(w));
        if (common.length >= 2) node.connections.push(other.id);
      }
    });
  });

  return nodes.slice(0, 10);
}

/**
 * Dynamically discover research links
 */
export async function discoverResearchLinks(
  query: string,
  content: string
): Promise<{
  links: ResearchLink[];
  metacognition: { confidence: number; reasoning: string } | null;
  searchUnavailable: boolean;
}> {
  try {
    const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    const topics = [...new Set(capitalizedWords.map((w) => w.toLowerCase()))].slice(0, 5);

    const response = await fetch('/api/enhanced-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        conversationContext: content.substring(0, 1500),
        topics,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.insightLinks) {
        return {
          links: data.insightLinks.slice(0, 2).map((link: any) => ({
            id: link.id,
            url: link.url,
            title: link.title,
            snippet: link.snippet,
            relevance: link.relevance,
            source: link.source,
          })),
          metacognition: data.metacognition || null,
          searchUnavailable: data.searchUnavailable || false,
        };
      }
    }

    return { links: [], metacognition: null, searchUnavailable: false };
  } catch {
    return { links: [], metacognition: null, searchUnavailable: false };
  }
}
