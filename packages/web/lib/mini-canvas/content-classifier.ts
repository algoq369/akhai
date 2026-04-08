/**
 * Content Classifier — Extracts structured Facts, Metrics, and Correlations
 * from AI response text for Mini Canvas visualization.
 */

// ── Types ──────────────────────────────────────────────────

export interface FactItem {
  id: string;
  statement: string;
  dataPoint?: string;
  verifiable: boolean;
  source?: string;
}

export interface MetricRow {
  id: string;
  metric: string;
  value: string;
  date: string;
  source: string;
  link: string;
  commentary: string;
  expertConsensus: string;
  scientificPOV: string;
  theologicPOV: string;
}

export interface CorrelationRow {
  id: string;
  factRef: string;
  metricRef: string;
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak' | 'inverse';
  implication: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: { name: string; value: number; unit?: string }[];
  panel: 'facts' | 'metrics' | 'correlation';
}

export interface MiniCanvasData {
  facts: FactItem[];
  metrics: MetricRow[];
  correlations: CorrelationRow[];
  charts: ChartConfig[];
}

// ── Helpers ────────────────────────────────────────────────

const BIAS_WORDS = /\b(best|worst|should|must|obviously|clearly|everyone knows)\b/gi;
const NUMBER_PATTERN =
  /\b(\d[\d,.]*\s*(?:%|percent|dollars?|\$|€|£|K|M|B|billion|million|thousand|trillion|kg|lb|mph|km|mi|years?|months?|days?))\b/gi;
const DATE_PATTERN =
  /\b(\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{0,4})\b/gi;
const PROPER_NOUN_PATTERN = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
const CAUSAL_PATTERN =
  /\b(because|therefore|consequently|as a result|correlates?|inversely|due to|leads to|causes?|driven by)\b/i;
const UNIT_PATTERN = /(\d[\d,.]*)\s*(%|percent|\$|€|£|K|M|B|billion|million|thousand|trillion)/i;

function generateId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

function stripBias(text: string): string {
  return text
    .replace(BIAS_WORDS, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractDataPoint(sentence: string): string | undefined {
  const numbers = sentence.match(NUMBER_PATTERN);
  if (numbers && numbers.length > 0) return numbers[0].trim();
  const dates = sentence.match(DATE_PATTERN);
  if (dates && dates.length > 0) return dates[0].trim();
  return undefined;
}

function hasSpecificData(sentence: string): boolean {
  return (
    NUMBER_PATTERN.test(sentence) ||
    DATE_PATTERN.test(sentence) ||
    PROPER_NOUN_PATTERN.test(sentence)
  );
}

function extractUnit(value: string): string | undefined {
  const match = value.match(UNIT_PATTERN);
  return match ? match[2] : undefined;
}

function parseNumericValue(raw: string): number {
  const cleaned = raw.replace(/[,$€£%]/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  if (/B|billion/i.test(raw)) return num * 1e9;
  if (/M|million/i.test(raw)) return num * 1e6;
  if (/K|thousand/i.test(raw)) return num * 1e3;
  return num;
}

// ── Extractors ─────────────────────────────────────────────

function extractFacts(sentences: string[]): FactItem[] {
  const facts: FactItem[] = [];
  for (const sentence of sentences) {
    if (!hasSpecificData(sentence)) continue;
    if (BIAS_WORDS.test(sentence)) continue;

    // Reset regex lastIndex
    NUMBER_PATTERN.lastIndex = 0;
    DATE_PATTERN.lastIndex = 0;
    PROPER_NOUN_PATTERN.lastIndex = 0;

    const cleaned = stripBias(sentence);
    if (cleaned.length < 15) continue;

    facts.push({
      id: generateId('fact', facts.length),
      statement: cleaned,
      dataPoint: extractDataPoint(sentence),
      verifiable: true,
      source: undefined,
    });
  }
  return facts.slice(0, 12);
}

function extractMetrics(sentences: string[]): MetricRow[] {
  const metrics: MetricRow[] = [];
  for (const sentence of sentences) {
    UNIT_PATTERN.lastIndex = 0;
    const match = sentence.match(UNIT_PATTERN);
    if (!match) continue;

    const value = match[0].trim();
    const metricName = sentence
      .replace(match[0], '')
      .replace(/[*#\-•]/g, '')
      .trim()
      .slice(0, 80);

    if (metricName.length < 5) continue;

    const dateMatch = sentence.match(DATE_PATTERN);

    metrics.push({
      id: generateId('metric', metrics.length),
      metric: metricName,
      value,
      date: dateMatch ? dateMatch[0] : 'N/A',
      source: 'N/A',
      link: 'N/A',
      commentary: 'N/A',
      expertConsensus: 'N/A',
      scientificPOV: 'N/A',
      theologicPOV: 'N/A',
    });
  }
  return metrics.slice(0, 15);
}

function extractCorrelations(
  sentences: string[],
  facts: FactItem[],
  metrics: MetricRow[]
): CorrelationRow[] {
  if (facts.length === 0 || metrics.length === 0) return [];

  const correlations: CorrelationRow[] = [];
  for (const sentence of sentences) {
    if (!CAUSAL_PATTERN.test(sentence)) continue;

    // Find the closest matching fact and metric
    let bestFact = facts[0];
    let bestMetric = metrics[0];
    let bestFactScore = 0;
    let bestMetricScore = 0;

    for (const fact of facts) {
      const overlap = countWordOverlap(sentence, fact.statement);
      if (overlap > bestFactScore) {
        bestFactScore = overlap;
        bestFact = fact;
      }
    }
    for (const metric of metrics) {
      const overlap = countWordOverlap(sentence, metric.metric);
      if (overlap > bestMetricScore) {
        bestMetricScore = overlap;
        bestMetric = metric;
      }
    }

    if (bestFactScore < 1 && bestMetricScore < 1) continue;

    const strength = determineStrength(sentence);

    correlations.push({
      id: generateId('corr', correlations.length),
      factRef: bestFact.id,
      metricRef: bestMetric.id,
      relationship: sentence.slice(0, 120),
      strength,
      implication: sentence.length > 120 ? sentence.slice(120).trim() : 'See relationship.',
    });
  }
  return correlations.slice(0, 8);
}

function countWordOverlap(a: string, b: string): number {
  const wordsA = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  const wordsB = b
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return wordsB.filter((w) => wordsA.has(w)).length;
}

function determineStrength(sentence: string): CorrelationRow['strength'] {
  const lower = sentence.toLowerCase();
  if (/inversely|negative|opposite|contrary/i.test(lower)) return 'inverse';
  if (/strong|significant|major|substantial|clearly/i.test(lower)) return 'strong';
  if (/weak|minor|slight|marginal/i.test(lower)) return 'weak';
  return 'moderate';
}

// ── Chart Generation ───────────────────────────────────────

function generateCharts(facts: FactItem[], metrics: MetricRow[]): ChartConfig[] {
  const charts: ChartConfig[] = [];

  // Bar chart: 3+ metrics with same unit
  const unitGroups: Record<string, MetricRow[]> = {};
  for (const m of metrics) {
    const unit = extractUnit(m.value);
    if (unit) {
      if (!unitGroups[unit]) unitGroups[unit] = [];
      unitGroups[unit].push(m);
    }
  }

  for (const [unit, group] of Object.entries(unitGroups)) {
    if (group.length >= 3) {
      charts.push({
        type: 'bar',
        title: `Comparison (${unit})`,
        data: group.slice(0, 8).map((m) => ({
          name: m.metric.slice(0, 30),
          value: parseNumericValue(m.value),
          unit,
        })),
        panel: 'metrics',
      });
      break; // One chart per panel
    }
  }

  // Pie chart: percentages that could sum to ~100
  const percentMetrics = metrics.filter((m) => /%|percent/i.test(m.value));
  if (percentMetrics.length >= 3) {
    const total = percentMetrics.reduce((sum, m) => sum + parseNumericValue(m.value), 0);
    if (total > 50 && total < 200) {
      charts.push({
        type: 'pie',
        title: 'Distribution',
        data: percentMetrics.slice(0, 6).map((m) => ({
          name: m.metric.slice(0, 30),
          value: parseNumericValue(m.value),
          unit: '%',
        })),
        panel: 'metrics',
      });
    }
  }

  return charts;
}

// ── Main Classifier ────────────────────────────────────────

export function classifyContent(text: string, query: string): MiniCanvasData {
  const sentences = splitSentences(text);

  const facts = extractFacts(sentences);
  const metrics = extractMetrics(sentences);
  const correlations = extractCorrelations(sentences, facts, metrics);
  const charts = generateCharts(facts, metrics);

  return { facts, metrics, correlations, charts };
}
