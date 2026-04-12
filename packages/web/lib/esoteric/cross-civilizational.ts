import { readFileSync } from 'fs';
import { join } from 'path';
import type { CrossCivilizationalData } from './types';

const crossCiv = JSON.parse(
  readFileSync(join(process.cwd(), 'lib/esoteric/data/cross-civilizational.json'), 'utf-8')
) as CrossCivilizationalData;

export interface CrossCivInsight {
  traditionId: string;
  traditionName: string;
  sigil: string;
  color: string;
  topic: string;
  formatted: string;
}

function formatInsight(
  name: string,
  sigil: string,
  principle: string,
  insight: string,
  mode: 'secular' | 'esoteric'
): string {
  if (mode === 'secular') {
    return `Historical cyclical analysis suggests: ${insight}`;
  }
  return `${sigil} ${name} — ${principle}: ${insight}`;
}

export function getPatterns(
  topics: string[],
  mode: 'secular' | 'esoteric' = 'secular'
): CrossCivInsight[] {
  if (!topics.length) return [];
  const normalizedTopics = topics.map((t) => t.toLowerCase().trim());
  const results: CrossCivInsight[] = [];
  const seenTraditions = new Set<string>();

  for (const tradition of crossCiv.traditions) {
    if (seenTraditions.size >= 4) break;

    for (const pattern of tradition.patterns) {
      if (seenTraditions.has(tradition.id)) break;
      const matches = normalizedTopics.some(
        (t) => pattern.topic.includes(t) || t.includes(pattern.topic)
      );
      if (matches) {
        seenTraditions.add(tradition.id);
        results.push({
          traditionId: tradition.id,
          traditionName: mode === 'secular' ? 'Historical Pattern Analysis' : tradition.name,
          sigil: mode === 'secular' ? '\u25C6' : tradition.sigil,
          color: tradition.color,
          topic: pattern.topic,
          formatted: formatInsight(
            tradition.name,
            tradition.sigil,
            tradition.principle,
            pattern.insight,
            mode
          ),
        });
      }
    }
  }

  return results;
}
