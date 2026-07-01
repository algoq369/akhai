import 'server-only';

export interface Source {
  title: string;
  snippet: string;
  url: string;
}

// Markdown "Sources" section from the real retrieved sources. Empty string if no sources.
export function buildSourcesSection(sources: Source[]): string {
  if (!sources || sources.length === 0) return '';
  const items = sources
    .filter((s) => s.url)
    .map((s, i) => `${i + 1}. [${(s.title || s.url).trim()}](${s.url})`)
    .join('\n');
  return items ? `\n\n---\n\n**Sources**\n\n${items}` : '';
}

// Lexical breadth signal: of N sources, how many share distinctive content words with the answer
// BODY (proxy for "the answer actually reflects this source"). Not a correctness claim — a coverage
// breadth signal, honestly labeled.
export function citationCoverage(
  answerBody: string,
  sources: Source[]
): { referenced: number; total: number } {
  const STOP = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'of',
    'to',
    'in',
    'on',
    'for',
    'with',
    'is',
    'are',
    'was',
    'were',
    'be',
    'as',
    'at',
    'by',
    'it',
    'this',
    'that',
    'from',
    'which',
    'their',
    'has',
    'have',
  ]);
  const toks = (t: string) =>
    new Set((t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 3 && !STOP.has(w)));
  const ans = toks(answerBody);
  let referenced = 0;
  for (const s of sources || []) {
    const src = toks(`${s.title} ${s.snippet}`);
    if (src.size === 0) continue;
    let overlap = 0;
    for (const w of src) if (ans.has(w)) overlap++;
    // "referenced" if the answer shares a meaningful fraction of the source's distinctive words
    if (overlap / src.size >= 0.15) referenced++;
  }
  return { referenced, total: (sources || []).filter((s) => s.url).length };
}
