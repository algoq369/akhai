/**
 * E1.3 citation enforcement.
 *
 * buildSourcesSection surfaces the real retrieved URLs; citationCoverage is a
 * lexical BREADTH signal (referenced/total) — how many sources the answer's
 * distinctive words reflect. It is honestly a coverage signal, NOT a correctness
 * or confidence claim.
 */
import { describe, it, expect } from 'vitest';
import { buildSourcesSection, citationCoverage, type Source } from '../citation-check';

describe('citation-check / buildSourcesSection', () => {
  it('returns empty string for no sources', () => {
    expect(buildSourcesSection([])).toBe('');
  });

  it('builds a markdown Sources section listing each URL under a **Sources** header', () => {
    const sources: Source[] = [
      { title: 'Quantum Networking', snippet: 'entanglement', url: 'https://a.com/q' },
      { title: 'TLS 1.3', snippet: 'handshake', url: 'https://b.com/tls' },
    ];
    const out = buildSourcesSection(sources);
    expect(out).toContain('**Sources**');
    expect(out).toContain('https://a.com/q');
    expect(out).toContain('https://b.com/tls');
    expect(out).toContain('[Quantum Networking](https://a.com/q)');
  });

  it('filters out sources with an empty url', () => {
    const sources: Source[] = [
      { title: 'Has URL', snippet: '', url: 'https://a.com' },
      { title: 'No URL', snippet: '', url: '' },
    ];
    const out = buildSourcesSection(sources);
    expect(out).toContain('https://a.com');
    expect(out).not.toContain('No URL');
  });

  it('returns empty string when every source lacks a url', () => {
    expect(buildSourcesSection([{ title: 'x', snippet: 'y', url: '' }])).toBe('');
  });
});

describe('citation-check / citationCoverage', () => {
  const sources: Source[] = [
    { title: 'Quantum Networking', snippet: 'entanglement distribution protocols', url: 'https://a.com' },
  ];

  it('counts a source as referenced when the answer reflects its distinctive words', () => {
    const answer = 'Quantum networking uses entanglement distribution protocols across nodes.';
    expect(citationCoverage(answer, sources)).toEqual({ referenced: 1, total: 1 });
  });

  it('counts zero referenced for an unrelated answer', () => {
    const answer = 'Bananas are yellow and grow in tropical bunches.';
    expect(citationCoverage(answer, sources)).toEqual({ referenced: 0, total: 1 });
  });

  it('total counts only sources that have a url', () => {
    const mixed: Source[] = [
      { title: 'Quantum Networking', snippet: 'entanglement distribution protocols', url: 'https://a.com' },
      { title: 'Cooking Pasta', snippet: 'boil water salt', url: '' },
    ];
    const answer = 'Quantum networking uses entanglement distribution protocols.';
    const { referenced, total } = citationCoverage(answer, mixed);
    expect(total).toBe(1);
    expect(referenced).toBe(1);
  });

  it('is deterministic — same inputs produce the same output', () => {
    const answer = 'Quantum networking uses entanglement distribution protocols.';
    expect(citationCoverage(answer, sources)).toEqual(citationCoverage(answer, sources));
  });
});
