/**
 * Content Classifier — Extracts structured Facts, Metrics, and Correlations
 * from AI response text for Mini Canvas visualization.
 */

// ── Types ──────────────────────────────────────────────────

export interface FactBoxes {
  tangibleData: string;
  verifiable: string;
  unrefutable: string;
  nonBiased: string;
  straightForward: string;
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
  facts: FactBoxes;
  metrics: MetricRow[];
  correlations: CorrelationRow[];
  charts: ChartConfig[];
}

// ── Helpers ────────────────────────────────────────────────

const NUMBER_PATTERN =
  /\b(\d[\d,.]*\s*(?:%|percent|dollars?|\$|€|£|K|M|B|billion|million|thousand|trillion|kg|lb|mph|km|mi|years?|months?|days?))\b/gi;
const DATE_PATTERN =
  /\b(\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{0,4})\b/gi;
const CAUSAL_PATTERN =
  /\b(because|therefore|consequently|as a result|correlat(?:es?|ion|ed)|inversely|inverse|due to|leads? to|causes?|driven by|while|coupled with|decoupled from|linked to|relationship between|compared to|versus|vs\.?|relative to|tracks?|follows?|mirrors?|diverge[sd]?|converge[sd]?)\b/i;
const UNIT_PATTERN = /(\d[\d,.]*)\s*(%|percent|\$|€|£|K|M|B|billion|million|thousand|trillion)/i;
const CURRENCY_FIRST = /(?:\$|€|£)\s*(\d[\d,.]*)\s*(K|M|B|T|billion|million|thousand|trillion)?/gi;
const PERCENT_PATTERN = /(\d[\d,.]*)\s*%/gi;

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

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[PATH \d+\]:\s*/gi, '')
    .replace(/[*_`|#]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
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

const SOURCE_PATTERN =
  /\b(according to|reported by|published|study|research|data from|survey|report|index|ranking|cited|source|journal|university|institute)\b/i;
const CONSENSUS_PATTERN =
  /\b(established|proven|confirmed|widely accepted|consensus|undeniable|fundamental|definitively|universally|historically)\b/i;
const OPINION_PATTERN =
  /\b(best|worst|should|must|amazing|terrible|obviously|clearly|arguably|controversial|debatable|believe|opinion|seems?|might|could)\b/i;

const BALANCED_PATTERN =
  /\b(however|on the other hand|both|while|although|conversely|nonetheless|yet|balanced|neutral)\b/i;

function pickSentences(
  cleaned: string[],
  used: Set<number>,
  test: (s: string) => boolean,
  max: number
): number[] {
  const picked = cleaned
    .map((s, i) => (test(s) && !used.has(i) ? i : -1))
    .filter((i) => i >= 0)
    .slice(0, max);
  picked.forEach((i) => used.add(i));
  return picked;
}

function extractFactBoxes(sentences: string[]): FactBoxes {
  const cleaned = sentences.map((s) => stripMarkdown(s));
  const used = new Set<number>();
  const join = (idxs: number[]) => idxs.map((i) => cleaned[i]).join(' ');

  const tangibleIdxs = pickSentences(
    cleaned,
    used,
    (s) => {
      NUMBER_PATTERN.lastIndex = 0;
      DATE_PATTERN.lastIndex = 0;
      return NUMBER_PATTERN.test(s) || DATE_PATTERN.test(s);
    },
    5
  );
  const tangibleData =
    tangibleIdxs.length > 0 ? join(tangibleIdxs) : 'No quantitative data identified in response.';

  const verifiableIdxs = pickSentences(cleaned, used, (s) => SOURCE_PATTERN.test(s), 4);
  const verifiable =
    verifiableIdxs.length > 0
      ? join(verifiableIdxs)
      : 'No externally verifiable sources cited in response.';

  const unrefutableIdxs = pickSentences(cleaned, used, (s) => CONSENSUS_PATTERN.test(s), 3);
  const unrefutable =
    unrefutableIdxs.length > 0
      ? join(unrefutableIdxs)
      : 'No unrefutable conclusions could be extracted.';

  const neutralIdxs = pickSentences(
    cleaned,
    used,
    (s) => BALANCED_PATTERN.test(s) && !OPINION_PATTERN.test(s) && s.length > 30,
    4
  );
  const nonBiased =
    neutralIdxs.length > 0 ? join(neutralIdxs) : 'Unable to extract sufficiently neutral content.';

  const remaining = cleaned
    .map((s, i) => (!used.has(i) && s.length > 30 ? i : -1))
    .filter((i) => i >= 0);
  const lastTwo = remaining.slice(-2);
  const straightForward = lastTwo.length > 0 ? join(lastTwo) : 'No direct conclusion available.';

  return { tangibleData, verifiable, unrefutable, nonBiased, straightForward };
}

function extractMetricLabel(sentence: string, matchStr: string): string {
  let label = stripMarkdown(sentence.replace(matchStr, '')).replace(/^\W+/, '').trim();
  const bp = label.search(/[,.\-;:]/);
  label = bp > 5 && bp < 40 ? label.slice(0, bp).trim() : label.slice(0, 40).trim();
  return label || 'Metric';
}

function inferContext(label: string, value: string): string {
  const lv = (label + ' ' + value).toLowerCase();
  const rules: [RegExp, string][] = [
    [/market|cap|valuation|worth/, 'market size'],
    [/growth|increase|rise|grew|expand/, 'growth rate'],
    [/year|month|week|day|quarter|timeline|by 20/, 'timeline'],
    [/revenue|sales|income|profit/, 'revenue'],
    [/cost|spend|budget|invest|fund/, 'investment'],
    [/user|customer|subscriber|adoption/, 'adoption'],
    [/rate|ratio|share|portion/, 'ratio'],
    [/reduc|declin|drop|loss|fell/, 'decline'],
  ];
  for (const [re, tag] of rules) {
    if (re.test(lv)) return tag;
  }
  if (/%|percent/i.test(value)) return 'percentage';
  if (/\$|€|£/i.test(value)) return 'monetary';
  return 'data point';
}

function labelSimilarity(a: string, b: string): number {
  const wa = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const wb = b
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (wa.size === 0 || wb.length === 0) return 0;
  return wb.filter((w) => wa.has(w)).length / Math.max(wa.size, wb.length);
}

const META_NOISE =
  /\b(need to|should|must|ground these|in the live|context:|note:|disclaimer|caveat|please)\b/i;

function cleanMetricName(raw: string): string {
  let name = raw.replace(/[\s]*[–—-]+[\s]*$/, '').trim();
  // Strip markdown bold markers
  name = name.replace(/^\*\*|\*\*$/g, '');
  // Strip [NEXT]: and [RELATED]: prefixes
  name = name.replace(/^\[(NEXT|RELATED)\]\s*:?\s*/i, '');
  // Strip 'Next:' / 'Next :' prefix
  name = name.replace(/^Next\s*:\s*/i, '');
  // Strip leading list markers
  name = name.replace(/^[-•*]\s+/, '');
  // Word-boundary truncation
  if (name.length > 45) {
    const cut = name.lastIndexOf(' ', 45);
    name = (cut > 10 ? name.slice(0, cut) : name.slice(0, 45)) + '...';
  }
  return name;
}

function cleanMetricValue(raw: string, sentence: string): string {
  let v = raw.trim();
  // Fix '4, M' → '4M', '2, B' → '2B' (comma-space between number and unit)
  v = v.replace(/(\d+),\s*([A-Za-z])/, '$1$2');
  // Append 'B' to bare currency like '$2.6' when context says billion
  if (/^\$[\d.]+$/.test(v) && /\bbillions?\b/i.test(sentence)) v += 'B';
  if (/^\$[\d.]+$/.test(v) && /\bmillions?\b/i.test(sentence)) v += 'M';
  if (/^\$[\d.]+$/.test(v) && /\btrillions?\b/i.test(sentence)) v += 'T';
  return v;
}

function addMetric(
  metrics: MetricRow[],
  value: string,
  label: string,
  sentence: string,
  seen: Set<string>
): void {
  const cleaned = cleanMetricName(label);
  const fixedValue = cleanMetricValue(value, sentence);
  const normalized = fixedValue.replace(/[\$€£,\s]/g, '').toLowerCase();
  if (cleaned.length < 3 || !normalized || normalized === '-') return;
  if (META_NOISE.test(cleaned)) return;
  if (seen.has(normalized)) {
    // Same value — keep shorter name
    const existing = metrics.find(
      (m) => m.value.replace(/[\$€£,\s]/g, '').toLowerCase() === normalized
    );
    if (existing && cleaned.length < existing.metric.length) {
      existing.metric = cleaned;
    }
    return;
  }
  // Dedup by label similarity — skip if >80% overlap with existing metric
  for (const existing of metrics) {
    if (labelSimilarity(existing.metric, cleaned) > 0.8) return;
  }
  seen.add(normalized);
  const dateMatch = sentence.match(DATE_PATTERN);
  metrics.push({
    id: generateId('metric', metrics.length),
    metric: cleaned,
    value: fixedValue,
    date: dateMatch ? dateMatch[0] : 'N/A',
    source: 'N/A',
    link: 'N/A',
    commentary: inferContext(cleaned, fixedValue),
    expertConsensus: 'N/A',
    scientificPOV: 'N/A',
    theologicPOV: 'N/A',
  });
}

const PLAIN_NUMBER_UNIT =
  /(\d[\d,.]*)\s*(trillion|billion|million|thousand|percent|years?|months?|weeks?|days?|hours?)\b/gi;

function extractMetrics(sentences: string[]): MetricRow[] {
  const metrics: MetricRow[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    // 1. Currency-first: $95,000, €2.5B
    CURRENCY_FIRST.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CURRENCY_FIRST.exec(sentence)) !== null) {
      const value = m[0].trim();
      const label = extractMetricLabel(sentence, value);
      addMetric(metrics, value, label, sentence, seen);
    }

    // 2. Unit-after: 95K, 45%
    UNIT_PATTERN.lastIndex = 0;
    const unitMatch = sentence.match(UNIT_PATTERN);
    if (unitMatch) {
      const value = unitMatch[0].trim();
      const label = extractMetricLabel(sentence, value);
      addMetric(metrics, value, label, sentence, seen);
    }

    // 3. Standalone percent: 45%
    PERCENT_PATTERN.lastIndex = 0;
    while ((m = PERCENT_PATTERN.exec(sentence)) !== null) {
      const value = m[0].trim();
      const label = extractMetricLabel(sentence, value);
      addMetric(metrics, value, label, sentence, seen);
    }

    // 4. Plain number+unit: "4.4 trillion", "6 months"
    PLAIN_NUMBER_UNIT.lastIndex = 0;
    while ((m = PLAIN_NUMBER_UNIT.exec(sentence)) !== null) {
      const value = m[0].trim();
      const label = extractMetricLabel(sentence, value);
      addMetric(metrics, value, label, sentence, seen);
    }
  }
  return metrics.slice(0, 15);
}

function extractCorrelations(
  sentences: string[],
  facts: FactBoxes,
  metrics: MetricRow[]
): CorrelationRow[] {
  const boxEntries = Object.entries(facts) as [string, string][];
  if (metrics.length === 0 && boxEntries.every(([, v]) => v.startsWith('No '))) return [];

  const correlations: CorrelationRow[] = [];
  for (const sentence of sentences) {
    if (!CAUSAL_PATTERN.test(sentence)) continue;

    let bestBoxKey = '';
    let bestBoxScore = 0;
    for (const [key, content] of boxEntries) {
      const overlap = countWordOverlap(sentence, content);
      if (overlap > bestBoxScore) {
        bestBoxScore = overlap;
        bestBoxKey = key;
      }
    }

    let bestMetric: MetricRow | null = metrics.length > 0 ? metrics[0] : null;
    let bestMetricScore = 0;
    for (const metric of metrics) {
      const overlap = countWordOverlap(sentence, metric.metric);
      if (overlap > bestMetricScore) {
        bestMetricScore = overlap;
        bestMetric = metric;
      }
    }

    if (bestBoxScore < 1) continue;

    const roleLabel = BOX_ROLE[bestBoxKey] || formatBoxKey(bestBoxKey);
    const metricLabel = bestMetric ? bestMetric.metric.slice(0, 25) : 'general trend';
    correlations.push({
      id: generateId('corr', correlations.length),
      factRef: bestBoxKey,
      metricRef: bestMetric?.id || 'N/A',
      relationship: stripMarkdown(sentence).slice(0, 120),
      strength: determineStrength(sentence),
      implication: `${roleLabel} ${determineStrength(sentence) === 'inverse' ? 'inversely impacts' : 'supports'} ${metricLabel}`,
    });
  }
  return correlations.slice(0, 8);
}

function countWordOverlap(a: string, b: string): number {
  const wa = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
  return b
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && wa.has(w)).length;
}

function determineStrength(sentence: string): CorrelationRow['strength'] {
  const lower = sentence.toLowerCase();
  if (/inversely|negative|opposite|contrary/i.test(lower)) return 'inverse';
  if (/strong|significant|major|substantial|clearly/i.test(lower)) return 'strong';
  if (/weak|minor|slight|marginal/i.test(lower)) return 'weak';
  return 'moderate';
}

// ── Chart Generation ───────────────────────────────────────

function generateCharts(metrics: MetricRow[]): ChartConfig[] {
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

// ── Implicit Correlations ──────────────────────────────────

function formatBoxKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

const BOX_ROLE: Record<string, string> = {
  tangibleData: 'concrete numbers',
  verifiable: 'sourced claims',
  unrefutable: 'consensus conclusions',
  nonBiased: 'neutral synthesis',
  straightForward: 'direct conclusions',
};

function extractSharedTopics(a: string, b: string): string[] {
  const wordsA = new Set(
    a
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
  );
  return [
    ...new Set(
      b
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4 && wordsA.has(w))
    ),
  ].slice(0, 3);
}

function buildMechanism(keyA: string, keyB: string, shared: string[]): string {
  const roleA = BOX_ROLE[keyA] || formatBoxKey(keyA);
  const roleB = BOX_ROLE[keyB] || formatBoxKey(keyB);
  const terms = shared.length > 0 ? ` via ${shared.join(', ')}` : '';
  // Generate a causal mechanism phrase
  if (keyA === 'tangibleData' && keyB === 'unrefutable')
    return `Concrete figures${terms} validate consensus conclusions`;
  if (keyA === 'tangibleData' && keyB === 'verifiable')
    return `Quantitative data${terms} enables independent verification`;
  if (keyA === 'verifiable' && keyB === 'unrefutable')
    return `Sourced evidence${terms} reinforces established consensus`;
  if (keyA === 'tangibleData' && keyB === 'nonBiased')
    return `Hard numbers${terms} anchor neutral factual synthesis`;
  if (keyA === 'nonBiased' && keyB === 'straightForward')
    return `Neutral analysis${terms} distills into direct conclusions`;
  if (shared.length >= 2) return `${roleA} validates ${roleB} through ${shared.join(', ')}`;
  if (shared.length === 1) return `Both reference "${shared[0]}" from different angles`;
  return `${roleA} and ${roleB} address the same subject independently`;
}

function generateImplicitCorrelations(facts: FactBoxes, metrics: MetricRow[]): CorrelationRow[] {
  const correlations: CorrelationRow[] = [];
  const boxEntries = Object.entries(facts) as [string, string][];

  for (let i = 0; i < boxEntries.length && correlations.length < 8; i++) {
    for (let j = i + 1; j < boxEntries.length && correlations.length < 8; j++) {
      const [keyA, contentA] = boxEntries[i];
      const [keyB, contentB] = boxEntries[j];
      if (!contentA || !contentB || contentA.startsWith('No ') || contentB.startsWith('No '))
        continue;
      const overlap = countWordOverlap(contentA, contentB);
      if (overlap < 3) continue;
      let metricRef = 'N/A';
      for (const m of metrics) {
        if (countWordOverlap(contentA + ' ' + contentB, m.metric) >= 1) {
          metricRef = m.id;
          break;
        }
      }
      const shared = extractSharedTopics(contentA, contentB);
      correlations.push({
        id: generateId('corr', correlations.length),
        factRef: keyA,
        metricRef,
        relationship: buildMechanism(keyA, keyB, shared),
        strength: overlap >= 6 ? 'strong' : overlap >= 4 ? 'moderate' : 'weak',
        implication: shared.length > 0 ? shared.join(', ') : 'thematic overlap',
      });
    }
  }
  return correlations;
}

// ── Main Classifier ────────────────────────────────────────

export function classifyContent(text: string, query: string): MiniCanvasData {
  const sentences = splitSentences(text);

  const facts = extractFactBoxes(sentences);
  const metrics = extractMetrics(sentences);
  let correlations = extractCorrelations(sentences, facts, metrics);
  if (correlations.length === 0) {
    correlations = generateImplicitCorrelations(facts, metrics);
  }
  const charts = generateCharts(metrics);

  return { facts, metrics, correlations, charts };
}
