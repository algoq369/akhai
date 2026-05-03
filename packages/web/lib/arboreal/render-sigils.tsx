import type { ReactNode } from 'react';

export const SIGIL_COLORS: Record<string, string> = {
  '◇': '#7C3AED',
  '△': '#6366F1',
  '⊕': '#EF4444',
  '○': '#3B82F6',
  '⬢': '#22C55E',
  '▽': '#9333EA',
  '□': '#F97316',
  '⊘': '#F59E0B',
  '⊙': '#EAB308',
  '✦': '#06B6D4',
  '⬡': '#6B7280',
};

export function renderWithSigils(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /([◇△⊕○⬢▽□⊘⊙✦⬡])/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={`t${last}`}>{text.slice(last, match.index)}</span>);
    }
    const sigil = match[1];
    parts.push(
      <span
        key={`s${match.index}`}
        style={{ color: SIGIL_COLORS[sigil] ?? '#71717a', fontWeight: 500 }}
      >
        {sigil}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={`t${last}`}>{text.slice(last)}</span>);
  return parts;
}
