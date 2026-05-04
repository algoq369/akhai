export interface ConnectionData {
  from: string;
  to: string;
  strength: number;
}

export interface TreeLayoutProps {
  insights: CoreInsight[];
  connections: ConnectionData[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDeepDive?: (query: string) => void;
}

export interface CoreInsight {
  id: string;
  rank: number;
  title: string;
  fullContent: string;
  category: 'executive' | 'strategy' | 'action' | 'insight' | 'data';
  confidence: number;
  impact: number;
  connections: number;
  children: string[];
  dataDensity: number; // 0-1 score for how much factual data this contains
  metrics: string[]; // Extracted numbers/percentages
}

// Clean category colors
export const CATEGORY_CONFIG = {
  executive: {
    bg: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    border: 'border-indigo-300 dark:border-indigo-600/30',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    icon: '◆',
  },
  strategy: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    border: 'border-purple-300 dark:border-purple-600/30',
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    icon: '◇',
  },
  action: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-300 dark:border-emerald-600/30',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    icon: '▸',
  },
  insight: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-300 dark:border-amber-600/30',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    icon: '✦',
  },
  data: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-300 dark:border-blue-600/30',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    icon: '▣',
  },
};

// Enhanced metrics extraction
export function extractMetrics(text: string): string[] {
  const metrics: string[] = [];

  // Patterns for different metric types
  const patterns = [
    /\d+(?:\.\d+)?%/g, // Percentages: 85%, 12.5%
    /\$\d+(?:,\d{3})*(?:\.\d{2})?[KMB]?/g, // Money: $100K, $1.5M, $2B
    /\d+(?:,\d{3})*(?:\.\d+)?[KMB]?\s*(?:users|people|customers|clients)/gi, // Users: 10K users
    /\d+(?:\.\d+)?x/g, // Multipliers: 5x, 2.5x
    /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:hours?|days?|weeks?|months?|years?)/gi, // Time: 3 days
    /\d+:\d+/g, // Ratios: 3:1, 10:1
    /\d+(?:,\d{3})*(?:\.\d+)?/g, // Pure numbers: 1000, 45.7
  ];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) metrics.push(...matches);
  });

  // Remove duplicates and return unique metrics
  return [...new Set(metrics)].slice(0, 5);
}

// Calculate data density score (0-1)
export function calculateDataDensity(text: string): number {
  const metrics = extractMetrics(text);
  const words = text.split(/\s+/).length;

  // Scoring factors
  const metricCount = metrics.length;
  const hasPercentage = /\d+%/.test(text);
  const hasMoney = /\$\d+/.test(text);
  const hasTimeframe = /\d+\s*(?:hours?|days?|weeks?|months?|years?)/i.test(text);
  const hasQuantity = /\d+[KMB]?/.test(text);
  const hasComparison = /(?:vs|versus|compared to|more than|less than|increase|decrease)/i.test(
    text
  );

  // Calculate score
  let score = 0;
  score += Math.min(metricCount * 0.15, 0.4); // Up to 0.4 for metrics
  score += hasPercentage ? 0.15 : 0;
  score += hasMoney ? 0.15 : 0;
  score += hasTimeframe ? 0.1 : 0;
  score += hasQuantity ? 0.1 : 0;
  score += hasComparison ? 0.1 : 0;

  // Bonus for density (metrics per word)
  if (words > 0) {
    const density = metricCount / words;
    score += Math.min(density * 0.5, 0.2);
  }

  return Math.min(score, 1.0);
}

export function extractHighLevelInsights(content: string, query: string): CoreInsight[] {
  const insights: CoreInsight[] = [];
  const seen = new Set<string>();
  let rank = 0;

  // PRIORITY 1: Extract numbered lists (often contain concrete steps/data)
  const numberedPattern = /^\d+[\.)]\s*(.{10,150})$/gm;
  let match;
  while ((match = numberedPattern.exec(content)) !== null) {
    const text = match[1].trim();
    const key = text.toLowerCase().substring(0, 30);

    if (seen.has(key)) continue;
    seen.add(key);

    // Look ahead for the paragraph following this numbered item (until blank line or 300 chars)
    const lineEnd = content.indexOf('\n', match.index + match[0].length);
    const nextLineStart = lineEnd >= 0 ? lineEnd + 1 : content.length;
    const nextBlank = content.indexOf('\n\n', nextLineStart);
    const followingText = content
      .slice(nextLineStart, nextBlank > 0 ? nextBlank : nextLineStart + 300)
      .trim();
    const fullContent = followingText || text;

    const metrics = extractMetrics(fullContent);
    const dataDensity = calculateDataDensity(fullContent);

    // Skip if no meaningful data
    if (metrics.length === 0 && dataDensity < 0.15) continue;

    rank++;
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 60 ? text.substring(0, 57) + '...' : text,
      fullContent: fullContent.length > 300 ? fullContent.substring(0, 297) + '...' : fullContent,
      category: dataDensity > 0.5 ? 'data' : 'action',
      confidence: 0.88 + dataDensity * 0.1,
      impact: 0.82 + dataDensity * 0.15,
      connections: Math.floor(metrics.length / 2),
      children: [],
      dataDensity,
      metrics,
    });
  }

  // PRIORITY 2: Extract headers with emphasis on data-rich ones
  const headerPattern = /^#+\s*(.+)$/gm;
  // First pass: collect all header positions so we know each section's boundary.
  const headerMatches: { text: string; lineStart: number; bodyStart: number }[] = [];
  while ((match = headerPattern.exec(content)) !== null) {
    headerMatches.push({
      text: match[1].trim().replace(/[#*]/g, '').trim(),
      lineStart: match.index,
      bodyStart: match.index + match[0].length,
    });
  }
  for (let hi = 0; hi < headerMatches.length; hi++) {
    const hp = headerMatches[hi];
    const text = hp.text;
    const key = text.toLowerCase().substring(0, 30);

    if (text.length < 5 || text.length > 100 || seen.has(key)) continue;
    seen.add(key);

    // Body = content between this header line and the next header (or end of text).
    const bodyEnd =
      hi + 1 < headerMatches.length ? headerMatches[hi + 1].lineStart : content.length;
    const bodyContent = content.slice(hp.bodyStart, bodyEnd).trim();
    const firstSentences = bodyContent
      .split(/(?<=[.!?])\s+/)
      .slice(0, 3)
      .join(' ')
      .trim();
    const fullContent = firstSentences || text;

    const metrics = extractMetrics(bodyContent || text);
    const dataDensity = calculateDataDensity(bodyContent || text);
    const textLower = text.toLowerCase();

    // Determine category with data focus
    let category: CoreInsight['category'] = 'strategy';
    if (
      dataDensity > 0.4 ||
      textLower.includes('metric') ||
      textLower.includes('data') ||
      textLower.includes('stat')
    ) {
      category = 'data';
    } else if (
      textLower.includes('summary') ||
      textLower.includes('overview') ||
      textLower.includes('executive')
    ) {
      category = 'executive';
    } else if (
      textLower.includes('action') ||
      textLower.includes('implement') ||
      textLower.includes('step')
    ) {
      category = 'action';
    } else if (
      textLower.includes('insight') ||
      textLower.includes('key') ||
      textLower.includes('finding')
    ) {
      category = 'insight';
    }

    rank++;
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 60 ? text.substring(0, 57) + '...' : text,
      fullContent: fullContent.length > 300 ? fullContent.substring(0, 297) + '...' : fullContent,
      category,
      confidence: 0.85 + dataDensity * 0.12,
      impact: 0.78 + dataDensity * 0.18,
      connections: Math.max(1, Math.floor(metrics.length / 2)),
      children: [],
      dataDensity,
      metrics,
    });
  }

  // PRIORITY 3: Extract bold concepts with metrics
  const boldPattern = /\*\*([^*]{8,80})\*\*/g;
  const maxBold = 12 - insights.length;
  let boldCount = 0;

  while ((match = boldPattern.exec(content)) !== null && boldCount < maxBold) {
    const text = match[1].trim();
    const key = text.toLowerCase().substring(0, 30);

    if (seen.has(key)) continue;
    seen.add(key);

    const metrics = extractMetrics(text);
    const dataDensity = calculateDataDensity(text);
    const textLower = text.toLowerCase();

    // Only include if has data or is important
    if (
      metrics.length === 0 &&
      dataDensity < 0.2 &&
      !textLower.includes('key') &&
      !textLower.includes('critical') &&
      !textLower.includes('important')
    ) {
      continue;
    }

    let category: CoreInsight['category'] = 'strategy';
    if (dataDensity > 0.35 || metrics.length >= 2) {
      category = 'data';
    } else if (textLower.includes('action') || textLower.includes('implement')) {
      category = 'action';
    } else if (textLower.includes('insight')) {
      category = 'insight';
    }

    rank++;
    boldCount++;
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 55 ? text.substring(0, 52) + '...' : text,
      fullContent: text,
      category,
      confidence: 0.72 + dataDensity * 0.2,
      impact: 0.68 + dataDensity * 0.25,
      connections: metrics.length > 0 ? 1 : 0,
      children: [],
      dataDensity,
      metrics,
    });
  }

  // PRIORITY 4: Extract bullet points with data
  const bulletPattern = /^[•\-*]\s*(.{10,120})$/gm;
  const maxBullets = 14 - insights.length;
  let bulletCount = 0;

  while ((match = bulletPattern.exec(content)) !== null && bulletCount < maxBullets) {
    const text = match[1].trim();
    const key = text.toLowerCase().substring(0, 30);

    if (seen.has(key)) continue;

    const metrics = extractMetrics(text);
    const dataDensity = calculateDataDensity(text);

    // Only include bullets with substantial data
    if (metrics.length < 1 && dataDensity < 0.25) continue;

    seen.add(key);
    rank++;
    bulletCount++;

    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 50 ? text.substring(0, 47) + '...' : text,
      fullContent: text,
      category: dataDensity > 0.4 ? 'data' : 'insight',
      confidence: 0.68 + dataDensity * 0.25,
      impact: 0.62 + dataDensity * 0.3,
      connections: metrics.length > 1 ? 1 : 0,
      children: [],
      dataDensity,
      metrics,
    });
  }

  // PRIORITY 5: Extract key sentences from plain paragraphs (fallback for short/unformatted responses)
  if (insights.length < 2) {
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.replace(/[#*`\-\[\]]/g, '').trim())
      .filter((s) => s.length >= 20 && s.length <= 200);

    const queryWords = new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    for (const sentence of sentences) {
      if (insights.length >= 6) break;
      const key = sentence.toLowerCase().substring(0, 30);
      if (seen.has(key)) continue;

      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const relevance = sentenceWords.filter((w) => queryWords.has(w)).length;
      const metrics = extractMetrics(sentence);
      const dataDensity = calculateDataDensity(sentence);

      // Accept sentences that are relevant to the query OR contain data
      if (relevance === 0 && metrics.length === 0 && dataDensity < 0.1) continue;

      seen.add(key);
      rank++;

      const category: CoreInsight['category'] =
        dataDensity > 0.3 ? 'data' : relevance >= 2 ? 'executive' : 'insight';

      insights.push({
        id: `insight-${rank}`,
        rank,
        title: sentence.length > 55 ? sentence.substring(0, 52) + '...' : sentence,
        fullContent: sentence,
        category,
        confidence: 0.65 + relevance * 0.08 + dataDensity * 0.15,
        impact: 0.6 + relevance * 0.1 + dataDensity * 0.2,
        connections: 0,
        children: [],
        dataDensity,
        metrics,
      });
    }
  }

  // Sort by: data density (40%) + impact (35%) + confidence (25%)
  return insights
    .sort((a, b) => {
      const scoreA = a.dataDensity * 0.4 + a.impact * 0.35 + a.confidence * 0.25;
      const scoreB = b.dataDensity * 0.4 + b.impact * 0.35 + b.confidence * 0.25;
      return scoreB - scoreA;
    })
    .slice(0, 10)
    .map((ins, i) => ({ ...ins, rank: i + 1 }));
}
