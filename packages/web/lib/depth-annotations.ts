/**
 * DEPTH ANNOTATIONS SYSTEM
 *
 * Real-time depth generation for AI responses.
 * Adds grey subtitle annotations beneath key terms during streaming.
 *
 * Annotation Types:
 * - ᶠ Fact: Verifiable data
 * - ᵐ Metric: Numbers, stats, percentages
 * - ᶜ Connection: Links to user context/memory
 * - ᵈ Detail: Expanded information
 * - ˢ Source: Citation hints
 *
 * @module depth-annotations
 */

// ============ TYPES ============

export type AnnotationType = 'fact' | 'metric' | 'connection' | 'detail' | 'source';

export interface DepthAnnotation {
  id: string;
  type: AnnotationType;
  term: string; // The term being annotated
  content: string; // The annotation text
  position: number; // Character position in text
  confidence: number; // 0-1 confidence score
  expandable?: boolean; // Can click to explore further
  expandQuery?: string; // Query to run if clicked
  metadata?: Record<string, any>;
}

export interface AnnotatedSegment {
  text: string;
  annotations: DepthAnnotation[];
}

export interface DepthConfig {
  enabled: boolean;
  density: 'minimal' | 'standard' | 'maximum';
  showByDefault: boolean;
  annotationTypes: AnnotationType[];
}

// ============ SYMBOLS ============

export const DEPTH_SYMBOLS: Record<AnnotationType, string> = {
  fact: 'ᶠ',
  metric: 'ᵐ',
  connection: 'ᶜ',
  detail: 'ᵈ',
  source: 'ˢ',
};

export const DEPTH_COLORS: Record<AnnotationType, string> = {
  fact: 'text-blue-400/60',
  metric: 'text-emerald-400/60',
  connection: 'text-purple-400/60',
  detail: 'text-gray-400/60',
  source: 'text-amber-400/60',
};

// Detection patterns extracted to depth/patterns.ts
import { DETECTION_PATTERNS, type DetectionPattern } from '@/lib/depth/patterns';

// ============ CORE DETECTION ENGINE ============

export function detectAnnotations(
  text: string,
  config: DepthConfig,
  userContext?: { topics?: string[]; previousQueries?: string[] }
): DepthAnnotation[] {
  console.log('[detectAnnotations] Called with:', {
    textLength: text.length,
    enabled: config.enabled,
    density: config.density,
    types: config.annotationTypes,
  });

  // Depth annotations are always generated — the toggle only controls visibility
  // (no early return — detection runs for every call)

  const annotations: DepthAnnotation[] = [];
  const maxAnnotations = config.density === 'minimal' ? 5 : config.density === 'standard' ? 15 : 40;

  console.log(
    '[detectAnnotations] Max annotations:',
    maxAnnotations,
    '(density:',
    config.density,
    ')'
  );

  // Run pattern detection
  for (const detector of DETECTION_PATTERNS) {
    if (!config.annotationTypes.includes(detector.type)) continue;

    for (const pattern of detector.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        const extracted = detector.extractor(match, text);
        if (!extracted) continue;

        annotations.push({
          id: `${detector.type}-${match.index}`,
          type: detector.type,
          term: match[0],
          content: extracted.content || match[0],
          position: match.index,
          confidence: extracted.confidence || 0.7,
          expandable: detector.type !== 'metric',
          ...extracted,
        });
      }
    }
  }

  // Detect connections to user context
  if (config.annotationTypes.includes('connection') && userContext?.topics) {
    for (const topic of userContext.topics) {
      const regex = new RegExp(`\\b${topic}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        annotations.push({
          id: `connection-topic-${match.index}`,
          type: 'connection',
          term: match[0],
          content: `From your memory · Topic: ${topic}`,
          position: match.index,
          confidence: 0.95,
          expandable: true,
          expandQuery: `Show me more about ${topic} from my history`,
        });
      }
    }
  }

  // Relevance gate — reject annotations that add no value
  function isValuableAnnotation(ann: DepthAnnotation): boolean {
    // 1. Reject if content is just the term repeated (no added info)
    if (ann.content.toLowerCase().trim() === ann.term.toLowerCase().trim()) return false;

    // 2. Reject if content is too short to be informative
    if (ann.content.length < 30) return false;

    // 3. Reject if term is inside a markdown header (##, #) — already emphasized
    const lineStart = text.lastIndexOf('\n', ann.position) + 1;
    const lineEnd = text.indexOf('\n', ann.position);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    if (/^#{1,3}\s/.test(line)) return false;

    // 4. Reject if term is inside a bold-wrapped label on its own line
    if (/^\*\*[A-Z][^*]+\*\*\s*$/.test(line.trim())) return false;

    return true;
  }

  // Sort by position, dedupe overlapping, filter by relevance, limit by density
  const sorted = annotations
    .sort((a, b) => a.position - b.position)
    .filter((ann) => isValuableAnnotation(ann))
    .filter((ann, i, arr) => {
      if (i === 0) return true;
      const prev = arr[i - 1];
      // Remove overlapping annotations (within 20 chars)
      return ann.position - prev.position > 20;
    })
    .slice(0, maxAnnotations);

  console.log('[detectAnnotations] FINAL:', {
    totalDetected: annotations.length,
    afterDedup: sorted.length,
    maxAllowed: maxAnnotations,
    density: config.density,
    sample: sorted.slice(0, 5).map((a) => ({ type: a.type, term: a.term })),
  });

  return sorted;
}

// ============ STREAMING INTEGRATION ============

export interface StreamingDepthState {
  buffer: string;
  processedLength: number;
  annotations: DepthAnnotation[];
  pendingAnnotations: DepthAnnotation[];
}

export function createStreamingDepthState(): StreamingDepthState {
  return {
    buffer: '',
    processedLength: 0,
    annotations: [],
    pendingAnnotations: [],
  };
}

/**
 * Process streaming text chunk and extract annotations in real-time
 */
export function processStreamingChunk(
  state: StreamingDepthState,
  chunk: string,
  config: DepthConfig,
  userContext?: { topics?: string[]; previousQueries?: string[] }
): { state: StreamingDepthState; newAnnotations: DepthAnnotation[] } {
  // Add chunk to buffer
  state.buffer += chunk;

  // Only process complete sentences/phrases
  const lastSentenceEnd = Math.max(
    state.buffer.lastIndexOf('.'),
    state.buffer.lastIndexOf('!'),
    state.buffer.lastIndexOf('?'),
    state.buffer.lastIndexOf('\n')
  );

  if (lastSentenceEnd <= state.processedLength) {
    return { state, newAnnotations: [] };
  }

  // Process new complete text
  const textToProcess = state.buffer.substring(state.processedLength, lastSentenceEnd + 1);
  const newAnnotations = detectAnnotations(textToProcess, config, userContext);

  // Adjust positions relative to full buffer
  const adjustedAnnotations = newAnnotations.map((ann) => ({
    ...ann,
    position: ann.position + state.processedLength,
  }));

  // Update state
  state.processedLength = lastSentenceEnd + 1;
  state.annotations.push(...adjustedAnnotations);

  return { state, newAnnotations: adjustedAnnotations };
}

// ============ SEGMENT BUILDER ============

/**
 * Build annotated segments from text and annotations
 */
export function buildAnnotatedSegments(
  text: string,
  annotations: DepthAnnotation[]
): AnnotatedSegment[] {
  if (annotations.length === 0) {
    return [{ text, annotations: [] }];
  }

  const segments: AnnotatedSegment[] = [];
  let lastEnd = 0;

  // Group annotations by their line/sentence
  const sortedAnnotations = [...annotations].sort((a, b) => a.position - b.position);

  for (const ann of sortedAnnotations) {
    // Find the end of the term
    const termEnd = ann.position + ann.term.length;

    // Find the end of the sentence containing this annotation
    let sentenceEnd = text.indexOf('.', termEnd);
    if (sentenceEnd === -1) sentenceEnd = text.indexOf('\n', termEnd);
    if (sentenceEnd === -1) sentenceEnd = text.length;

    // Add text before this sentence if there's a gap
    if (lastEnd < ann.position) {
      const textBefore = text.substring(lastEnd, sentenceEnd + 1);
      const annsInSegment = sortedAnnotations.filter(
        (a) => a.position >= lastEnd && a.position <= sentenceEnd
      );

      segments.push({
        text: textBefore,
        annotations: annsInSegment,
      });

      lastEnd = sentenceEnd + 1;
    }
  }

  // Add remaining text
  if (lastEnd < text.length) {
    segments.push({
      text: text.substring(lastEnd),
      annotations: [],
    });
  }

  return segments;
}

// ============ DEFAULT CONFIG ============

export const DEFAULT_DEPTH_CONFIG: DepthConfig = {
  enabled: true,
  density: 'maximum', // Maximum capabilities - show more insights per user request
  showByDefault: true,
  annotationTypes: ['fact', 'metric', 'connection', 'detail', 'source'],
};

export function getDepthConfig(): DepthConfig {
  if (typeof window === 'undefined') return DEFAULT_DEPTH_CONFIG;

  const stored = localStorage.getItem('akhai-depth-config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Allow maximum density - user wants maximum capabilities
      return { ...DEFAULT_DEPTH_CONFIG, ...parsed };
    } catch {
      return DEFAULT_DEPTH_CONFIG;
    }
  }
  return DEFAULT_DEPTH_CONFIG;
}

export function saveDepthConfig(config: DepthConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('akhai-depth-config', JSON.stringify(config));
}
