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

  // SOURCES: Citations, references
  {
    type: 'source',
    patterns: [
      /(?:according\s+to|per|via|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:\d{4}|study|report|paper))/gi,
      /\((?:source|ref|cite):\s*([^)]+)\)/gi,
      /(?:research\s+(?:by|from)|study\s+(?:by|from))\s+([A-Z][a-zA-Z\s]+)/gi,
    ],
    extractor: (match, context) => ({
      content: match[0],
      confidence: 0.75,
    }),
  },

  // PLAIN TEXT FALLBACKS — catch annotations in unformatted prose
  {
    type: 'metric',
    patterns: [
      // Any sentence fragment containing a number (plain prose)
      /[^.!?\n]*\b(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*[a-zA-Z]+[^.!?\n]*/g,
    ],
    extractor: (match) => {
      const num = match[1];
      if (!num || parseInt(num) < 10) return null;
      return { content: `ᵐ Metric: ${match[0].trim().substring(0, 60)}`, confidence: 0.6 };
    },
  },
  {
    type: 'connection',
    patterns: [
      // Causal reasoning phrases in plain prose
      /[^.!?\n]*\b(?:because|since|therefore|thus|consequently|as a result|due to|leads? to|causes?|enables?)\b[^.!?\n]*/gi,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 15) return null;
      return { content: `ᶜ Reasoning: ${text.substring(0, 60)}`, confidence: 0.55 };
    },
  },
  {
    type: 'fact',
    patterns: [
      // Definitional statements in plain prose
      /[^.!?\n]*\b(?:is defined as|refers to|is known as|is called|means that|is a type of|is a form of)\b[^.!?\n]*/gi,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 15) return null;
      return { content: `ᶠ Definition: ${text.substring(0, 60)}`, confidence: 0.6 };
    },
  },

  // BROAD FALLBACKS — ensure minimum 3+ annotations per response
  {
    type: 'detail',
    patterns: [
      // Long sentences (> 80 chars) are substantive claims worth annotating
      /[A-Z][^.!?]{80,}[.!?]/g,
    ],
    extractor: (match) => {
      return { content: `◊ ${match[0].trim().substring(0, 50)}...`, confidence: 0.45 };
    },
  },
  {
    type: 'detail',
    patterns: [
      // Parenthetical explanations indicate detail worth noting
      /[^.!?\n]*\([^)]{8,}\)[^.!?\n]*/g,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 20) return null;
      return { content: `◊ Detail: ${text.substring(0, 55)}`, confidence: 0.5 };
    },
  },
  {
    type: 'connection',
    patterns: [
      // Comma-separated lists of 3+ items indicate relationships
      /[^.!?\n]*(?:[^,]+,){2,}[^.!?\n]*/g,
    ],
    extractor: (match) => {
      const text = match[0].trim();
      if (text.length < 30) return null;
      const commaCount = (text.match(/,/g) || []).length;
      if (commaCount < 2) return null;
      return { content: `☿ Enumeration: ${text.substring(0, 50)}`, confidence: 0.4 };
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
