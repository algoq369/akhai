/**
 * Detection patterns for depth annotations — barrel file.
 * Category-specific patterns are in patterns-general.ts, patterns-tech.ts, patterns-science.ts
 */

import type { DepthAnnotation } from '@/lib/depth-annotations';
import { HEBREW_TERMS, HebrewTermKey } from '@/components/OriginTerm';
import { GENERAL_PATTERNS, type DetectionPattern } from './patterns-general';
import { TECH_PATTERNS } from './patterns-tech';
import { SCIENCE_PATTERNS } from './patterns-science';

const REMAINING_PATTERNS: DetectionPattern[] = [
  // CONNECTIONS: References to user context
  {
    type: 'connection',
    patterns: [
      /(?:as\s+(?:you|we)\s+(?:mentioned|discussed|noted))/gi,
      /(?:related\s+to|connects?\s+to|similar\s+to)/gi,
      /(?:in\s+your\s+(?:previous|earlier|last))/gi,
      /(?:building\s+on|extending|following\s+up)/gi,
    ],
    extractor: (match, context) => ({
      content: match[0],
      confidence: 0.8,
    }),
  },

  // SOURCES: Citations, references — broadened to catch plain-text citations
  {
    type: 'source',
    patterns: [
      /\b(?:according\s+to|per|via)\s+([A-Z][a-zA-Z\s]{2,30})/gi,
      /\b(?:study|research|report|survey|analysis)\s+(?:by|from)\s+([A-Z][a-zA-Z\s]+)/gi,
      /\b(?:published|found\s+that|reported\s+that|showed\s+that|concluded\s+that)/gi,
      /\b(?:university|institute|foundation|organization|journal)\b/gi,
      /\((?:source|ref|cite):\s*([^)]+)\)/gi,
    ],
    extractor: (match) => ({
      content: `ˢ Source: ${match[0].trim().substring(0, 60)}`,
      confidence: 0.75,
    }),
  },

  // FACTS: Sentences with specific numbers, units, dates, or named data
  {
    type: 'fact',
    patterns: [
      /[^.!?\n]*\b\d+[\d,.]*\s*(?:%|percent|billion|million|trillion|BTC|USD|ETH|TWh|GWh?|MW|km|mph|kg|lb)\b[^.!?\n]*/gi,
      /[^.!?\n]*\b(?:is defined as|refers to|is known as|is called|means that|is a type of)\b[^.!?\n]*/gi,
      /[^.!?\n]*\b(?:since|in|as of)\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b[^.!?\n]*/gi,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 15) return null;
      return { content: `ᶠ ${text.substring(0, 70)}`, confidence: 0.7 };
    },
  },

  // METRICS: Comparative or change-indicating phrases
  {
    type: 'metric',
    patterns: [
      /[^.!?\n]*\b(?:increased|decreased|grew|dropped|rose|fell|surged|declined|doubled|tripled)\s+(?:by\s+)?\d[^.!?\n]*/gi,
      /[^.!?\n]*\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*[a-zA-Z]+[^.!?\n]*/g,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 15) return null;
      const numMatch = text.match(/\d+/);
      if (numMatch && parseInt(numMatch[0]) < 2) return null;
      return { content: `ᵐ ${text.substring(0, 70)}`, confidence: 0.65 };
    },
  },

  // CONNECTIONS: Cross-domain comparisons and causal reasoning
  {
    type: 'connection',
    patterns: [
      /[^.!?\n]*\b(?:similar to|unlike|compared to|relates to|intersection of|analogous to|in contrast)\b[^.!?\n]*/gi,
      /[^.!?\n]*\b(?:because|therefore|consequently|as a result|due to|leads? to|causes?|enables?)\b[^.!?\n]*/gi,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 20) return null;
      return { content: `ᶜ ${text.substring(0, 70)}`, confidence: 0.6 };
    },
  },

  // DEPTH: Deeper implications and fundamentals
  {
    type: 'detail',
    patterns: [
      /[^.!?\n]*\b(?:implication|consequence|underlying|fundamental|root cause|in essence|critically|notably|importantly)\b[^.!?\n]*/gi,
      /[^.!?\n]*\([^)]{8,}\)[^.!?\n]*/g,
      /[A-Z][^.!?]{80,}[.!?]/g,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 20) return null;
      return { content: `ᵈ ${text.substring(0, 70)}`, confidence: 0.5 };
    },
  },
];

const DETECTION_PATTERNS: DetectionPattern[] = [
  ...GENERAL_PATTERNS,
  ...TECH_PATTERNS,
  ...SCIENCE_PATTERNS,
  ...REMAINING_PATTERNS,
];

// ============ HEBREW/KABBALISTIC TERM DETECTION ============

const KABBALISTIC_TERMS = Object.keys(HEBREW_TERMS);

function detectHebrewTerms(text: string): DepthAnnotation[] {
  const annotations: DepthAnnotation[] = [];

  for (const termKey of KABBALISTIC_TERMS) {
    const term = HEBREW_TERMS[termKey as HebrewTermKey];
    if (!term) continue;

    // Match transliteration (case insensitive)
    const regex = new RegExp(`\\b${termKey}\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      annotations.push({
        id: `hebrew-${termKey}-${match.index}`,
        type: 'detail',
        term: match[0],
        content: `${term.hebrew} · ${term.english}`,
        position: match.index,
        confidence: 1.0,
        expandable: true,
        expandQuery: `Explain the Kabbalistic concept of ${termKey} and its role in AI`,
        metadata: { hebrewTerm: termKey },
      });
    }
  }

  return annotations;
}

export { DETECTION_PATTERNS, type DetectionPattern, detectHebrewTerms };
