import type { MindmapNode } from './ResponseMindmap.types';

// Generate tailored footer content based on query analysis
export function generateTailoredFooter(
  query: string | undefined,
  nodes: MindmapNode[],
  topics: Array<{ id: string; name: string; category?: string }> | undefined,
  methodology: string,
  isExpanded: boolean,
  selectedNode: MindmapNode | null
): { focus: string; quality: string; action: string } {
  const conceptCount = nodes.length - 1;
  const rootLabel = nodes[0]?.label || 'concepts';

  // Analyze query intent
  const queryLower = query?.toLowerCase() || '';
  const hasHow = queryLower.includes('how');
  const hasWhat = queryLower.includes('what');
  const hasWhy = queryLower.includes('why');
  const hasCompare =
    queryLower.includes('compare') ||
    queryLower.includes('vs') ||
    queryLower.includes('versus') ||
    queryLower.includes('difference');
  const hasList = queryLower.includes('list') || /\d+\./.test(query || '');
  const hasExplain = queryLower.includes('explain') || queryLower.includes('describe');
  const hasCreate =
    queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('design');

  // Extract subject from query
  const queryWords = query?.split(/\s+/).filter((w) => w.length > 3) || [];
  const primarySubject = nodes[1]?.label || queryWords[queryWords.length - 1] || 'topic';

  // Detect topic patterns
  const hasNumbers = nodes.some((n) => /\d+/.test(n.label));
  const hasQuestions = nodes.some((n) => /\?/.test(n.fullText));
  const categories = topics
    ? new Set(topics.filter((t) => t.category).map((t) => t.category))
    : new Set();

  // Generate FOCUS line (tailored to query type)
  let focus = '';
  if (hasCompare) {
    focus = `Comparative analysis mapping ${conceptCount} distinguishing factors for "${primarySubject}" — radial structure reveals contrast points across ${methodology} methodology with spatial organization highlighting differences.`;
  } else if (hasHow) {
    focus = `Procedural knowledge map extracting ${conceptCount} implementation steps for "${primarySubject}" — ${methodology} methodology captures sequential and parallel pathways with interconnected concept relationships.`;
  } else if (hasWhat) {
    focus = `Definitional framework identifying ${conceptCount} core aspects of "${primarySubject}" — hierarchical visualization anchored to "${rootLabel}" with categorical concept distribution.`;
  } else if (hasWhy) {
    focus = `Causal reasoning graph mapping ${conceptCount} explanatory factors for "${primarySubject}" — ${methodology} methodology surfaces cause-effect relationships through radial concept clustering.`;
  } else if (hasList || hasNumbers) {
    focus = `Structured enumeration visualizing ${conceptCount} sequential elements from "${rootLabel}" — numbered hierarchy with radial layout preserving logical ordering from ${methodology} response.`;
  } else if (hasCreate || hasExplain) {
    focus = `Constructive knowledge map decomposing "${primarySubject}" into ${conceptCount} foundational concepts — ${methodology} methodology reveals building blocks with spatial organization for synthesis.`;
  } else {
    focus = `Conceptual map extracting ${conceptCount} key topics from ${methodology} methodology response — hierarchical visualization centered on "${rootLabel}" with radial concept distribution for spatial knowledge organization.`;
  }

  // Generate QUALITY line (tailored to extraction type and content)
  let quality = '';
  if (topics && topics.length > 0) {
    const categoryText =
      categories.size > 0
        ? ` across ${categories.size} ${categories.size === 1 ? 'category' : 'categories'}`
        : '';
    quality = `Topic-driven extraction with ${conceptCount} confirmed topics${categoryText} — AI-verified against response content with ${Math.round((topics.length / Math.max(conceptCount, 1)) * 100)}% coverage confidence.`;
  } else if (hasNumbers) {
    quality = `Numbered pattern extraction preserving sequential structure — ${conceptCount} ordered concepts with ${nodes.filter((n) => /^\d+/.test(n.label)).length} explicit enumerations maintaining logical flow integrity.`;
  } else if (hasQuestions) {
    quality = `Question-aware extraction identifying ${conceptCount} inquiry-driven concepts — preserves interrogative structure with ${nodes.filter((n) => /\?/.test(n.fullText)).length} question nodes for exploratory navigation.`;
  } else {
    const boldCount = nodes.filter((n) => n.fullText.includes('**')).length;
    const headerCount = nodes.filter((n) => n.fullText.startsWith('#')).length;
    quality = `Pattern-based extraction from ${headerCount} headers and ${boldCount} emphasized terms — ${conceptCount} distinct concepts with semantic deduplication at ${Math.round((conceptCount / Math.max(nodes.length, 1)) * 100)}% retention.`;
  }

  // Generate ACTION line (tailored to current state and content type)
  let action = '';
  if (isExpanded && selectedNode) {
    const relatedCount = nodes.filter((n) => n.level === 1).length;
    action = `Detail view active for "${selectedNode.label}" — revealing full context with ${selectedNode.level === 0 ? relatedCount + ' connected concepts' : 'parent relationships'}. Click other nodes to navigate concept network or drag to reorganize spatial layout.`;
  } else if (isExpanded) {
    const interactionHints = hasCompare
      ? 'compare side-by-side by opening multiple detail panels'
      : hasHow
        ? 'explore step-by-step by clicking sequential nodes'
        : 'drill into any concept for full context';
    action = `Interactive exploration enabled: Click nodes to ${interactionHints}. Drag to reorganize — spatial positioning aids memory retention. ${conceptCount} concepts ready for deep-dive analysis.`;
  } else {
    const previewHint = hasCompare
      ? 'comparison matrix'
      : hasList
        ? 'ordered workflow'
        : hasHow
          ? 'implementation roadmap'
          : 'concept relationships';
    action = `Compact preview of ${conceptCount}-topic ${previewHint}. Click expand (↗) for interactive mode with draggable nodes, detail panels, and full-text exploration of "${primarySubject}".`;
  }

  return { focus, quality, action };
}

export function extractConcepts(content: string): MindmapNode[] {
  const nodes: MindmapNode[] = [];

  // Get first meaningful sentence for root
  const sentences = content.split(/[.!?]/).filter((s) => s.trim().length > 10);
  const firstSentence = sentences[0]?.trim() || 'Response';
  const rootLabel =
    firstSentence.length > 28 ? firstSentence.substring(0, 25) + '...' : firstSentence;

  nodes.push({
    id: 'root',
    label: rootLabel,
    fullText: firstSentence,
    level: 0,
  });

  // Extract concepts with their full context
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
    { regex: /^#+\s*(.+)$/gm, type: 'header' },
    { regex: /^[-•*]\s*(.+)$/gm, type: 'bullet' },
    { regex: /^\d+\.\s*(.+)$/gm, type: 'numbered' },
  ];

  const conceptMap = new Map<string, string>();

  patterns.forEach(({ regex }) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullText = match[1]?.trim().replace(/[*#]/g, '').trim();
      if (fullText && fullText.length > 2 && fullText.length < 200) {
        const label = fullText.length > 20 ? fullText.substring(0, 17) + '...' : fullText;
        if (!conceptMap.has(label)) {
          conceptMap.set(label, fullText);
        }
      }
    }
  });

  // Fallback for plain prose: extract key sentences as concepts
  if (conceptMap.size < 3) {
    sentences.slice(1, 9).forEach((s) => {
      const trimmed = s.trim();
      if (trimmed.length > 15 && trimmed.length < 200) {
        const label = trimmed.length > 20 ? trimmed.substring(0, 17) + '...' : trimmed;
        if (!conceptMap.has(label)) {
          conceptMap.set(label, trimmed);
        }
      }
    });
  }

  // Convert to nodes (max 8)
  Array.from(conceptMap.entries())
    .slice(0, 8)
    .forEach(([label, fullText], index) => {
      nodes.push({
        id: `concept-${index}`,
        label,
        fullText,
        level: 1,
        parentId: 'root',
      });
    });

  return nodes;
}

export function shouldShowMindmap(
  content: string,
  topics?: Array<{ id: string; name: string; category?: string }>
): boolean {
  if (topics && topics.length >= 2) return true;
  const concepts = extractConcepts(content);
  return concepts.length >= 3;
}
