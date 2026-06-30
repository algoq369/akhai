import 'server-only';

/**
 * In-process lexical-support scorer (E1.1).
 *
 * The lighter 'heuristic' grounding tier: when ReAct produced sources but no external
 * NLI box (GUARD_NLI_URL) is configured, this gives the grounding meter a REAL,
 * deterministic score from word overlap between the answer and its retrieved context.
 *
 * This is HONEST lexical support — NOT deep entailment. It cannot tell that "Paris is
 * NOT the capital" contradicts "Paris is the capital"; it only measures whether an
 * answer's content words appear in the grounding context. The external NLI tier
 * ('grounded') supersedes it whenever the box exists.
 */

export interface HeuristicResult {
  score: number; // 0..1, content-word fraction of the answer supported by context
  spans: Array<{ start: number; end: number; text: string }>; // unsupported sentences
}

// Small inline stopword set — common function words carry no grounding signal.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'of', 'and', 'to', 'in', 'that', 'it', 'for',
  'on', 'with', 'as', 'by', 'at', 'this', 'be', 'or', 'from', 'but', 'not', 'have',
  'has', 'had', 'will', 'can', 'its', 'their', 'which', 'you', 'your',
]);

/** Extract content words: lowercase, split on non-alphanumeric, drop stopwords + len<=2. */
function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function scoreLexicalSupport(answer: string, context: string[]): HeuristicResult {
  // Build the content-word set from all context snippets.
  const contextSet = new Set<string>();
  for (const c of context) {
    for (const w of contentWords(c)) contextSet.add(w);
  }

  // Split the answer into sentences while tracking char offsets (for spans).
  const spans: HeuristicResult['spans'] = [];
  let totalPresent = 0;
  let totalWords = 0;

  const sentenceRe = /[^.!?]+[.!?]*/g;
  let m: RegExpExecArray | null;
  while ((m = sentenceRe.exec(answer)) !== null) {
    const raw = m[0];
    const text = raw.trim();
    if (!text) continue;

    const words = contentWords(text);
    if (words.length === 0) continue; // no content words → not counted

    const present = words.filter((w) => contextSet.has(w)).length;
    const supportRatio = present / words.length;

    totalPresent += present;
    totalWords += words.length;

    if (supportRatio < 0.3) {
      const leading = raw.length - raw.trimStart().length;
      const start = m.index + leading;
      spans.push({ start, end: start + text.length, text });
    }
  }

  // Length-weighted average across counted sentences == totalPresent / totalWords.
  const score = totalWords === 0 ? 0 : Math.round((totalPresent / totalWords) * 1000) / 1000;
  return { score, spans };
}
