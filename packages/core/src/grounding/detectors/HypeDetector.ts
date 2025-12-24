/**
 * Hype Detector
 *
 * Detects excessive hype language and superlatives in conversation.
 * Uses regex patterns + optional sentiment analysis (DistilBERT).
 *
 * Triggers: "revolutionary", "game-changer", "10x", excessive exclamation marks
 */

import type { Message, GroundingAlert, AlertSeverity } from '../types.js';

/**
 * Hype keywords and patterns
 */
const HYPE_PATTERNS = {
  superlatives: [
    /\b(revolutionary|groundbreaking|game-chang(er|ing)|paradigm shift)\b/gi,
    /\b(best ever|greatest|ultimate|perfect|flawless)\b/gi,
    /\b(absolutely|completely|totally|100%) (guaranteed|certain|sure)\b/gi,
  ],
  exaggeration: [
    /\b(\d+x|10x|100x|1000x) (better|faster|cheaper|more)\b/gi,
    /\b(unlimited|infinite|endless|boundless)\b/gi,
    /\b(never (seen|done|possible) before)\b/gi,
    /\b(change the world|transform everything|redefine)\b/gi,
  ],
  urgency: [
    /\b(urgent|immediately|right now|don't wait|limited time)\b/gi,
    /\b(act (now|fast)|hurry|rush)\b/gi,
    /!{2,}/g, // Multiple exclamation marks
  ],
  certainty: [
    /\b(guaranteed|definitely|certainly|absolutely will)\b/gi,
    /\b(no doubt|without question|clearly|obviously)\b/gi,
    /\b(proven fact|scientifically proven|everyone knows)\b/gi,
  ],
};

/**
 * Hype detection result
 */
interface HypeDetection {
  score: number; // 0-1, higher = more hype
  matches: Array<{
    category: string;
    pattern: string;
    count: number;
  }>;
  sentimentScore?: number; // Optional ML-based score
}

/**
 * Detect hype in messages
 */
export async function detectHype(
  messages: Message[],
  sensitivity: number = 0.7
): Promise<GroundingAlert | null> {
  const startTime = Date.now();

  // Combine all assistant messages for analysis
  const assistantText = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join('\n\n');

  if (!assistantText) {
    return null; // No assistant messages to analyze
  }

  // Pattern-based detection
  const detection = analyzeHypePatterns(assistantText);

  // Calculate severity based on score and sensitivity
  const severity: AlertSeverity =
    detection.score >= sensitivity + 0.2
      ? 'critical'
      : detection.score >= sensitivity
      ? 'warning'
      : 'info';

  // Only create alert if score exceeds sensitivity threshold
  if (detection.score < sensitivity) {
    return null;
  }

  // Build evidence
  const evidence: string[] = [];
  for (const match of detection.matches) {
    if (match.count > 0) {
      evidence.push(`${match.category}: ${match.count} instances`);
    }
  }

  // Build suggestions
  const suggestions = [
    'Verify claims with specific data and sources',
    'Replace superlatives with measurable metrics',
    'Acknowledge uncertainties and limitations',
  ];

  if (detection.score >= 0.8) {
    suggestions.unshift('Consider reframing response with more balanced language');
  }

  return {
    id: `hype_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'hype',
    severity,
    confidence: detection.score,
    message:
      detection.score >= 0.8
        ? 'Excessive hype language detected - claims may be overstated'
        : 'Hype language detected - verify claims with data',
    timestamp: Date.now(),
    evidence,
    suggestions,
  };
}

/**
 * Analyze hype patterns in text
 */
function analyzeHypePatterns(text: string): HypeDetection {
  const matches: HypeDetection['matches'] = [];
  let totalMatches = 0;

  // Check each category
  for (const [category, patterns] of Object.entries(HYPE_PATTERNS)) {
    let categoryCount = 0;

    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) {
        categoryCount += found.length;
        totalMatches += found.length;
      }
    }

    if (categoryCount > 0) {
      matches.push({
        category,
        pattern: `${category} language`,
        count: categoryCount,
      });
    }
  }

  // Calculate score based on:
  // 1. Number of matches
  // 2. Text length (normalize)
  // 3. Category diversity (hitting multiple categories is worse)
  const wordCount = text.split(/\s+/).length;
  const density = totalMatches / Math.max(wordCount, 1);
  const categoryDiversity = matches.length / Object.keys(HYPE_PATTERNS).length;

  // Weighted score: density (50%), diversity (30%), raw count (20%)
  const score = Math.min(
    1.0,
    density * 50 + // Up to 0.5 from density
      categoryDiversity * 0.3 + // Up to 0.3 from diversity
      Math.min(totalMatches / 20, 0.2) // Up to 0.2 from raw count
  );

  return {
    score,
    matches,
  };
}

/**
 * Load ML model for sentiment analysis (optional enhancement)
 *
 * NOTE: Requires @xenova/transformers to be installed.
 * Currently returns null (pattern-based only).
 * To enable: uncomment imports and implementation.
 */
async function loadSentimentModel(): Promise<any | null> {
  try {
    // Lazy load transformers.js to avoid startup cost
    // const { pipeline } = await import('@xenova/transformers');
    // const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    // return classifier;
    return null; // Disabled for now
  } catch (error) {
    console.warn('[HypeDetector] ML model not available:', error);
    return null;
  }
}

/**
 * Analyze sentiment with ML model (optional)
 */
async function analyzeSentiment(text: string): Promise<number | undefined> {
  const model = await loadSentimentModel();
  if (!model) {
    return undefined;
  }

  try {
    const result = await model(text.substring(0, 512)); // Limit to 512 chars
    // DistilBERT returns: [{ label: 'POSITIVE'|'NEGATIVE', score: 0-1 }]
    const positive = result.find((r: any) => r.label === 'POSITIVE');
    return positive ? positive.score : 0;
  } catch (error) {
    console.warn('[HypeDetector] Sentiment analysis failed:', error);
    return undefined;
  }
}
