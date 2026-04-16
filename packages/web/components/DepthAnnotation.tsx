'use client';

/**
 * DEPTH ANNOTATION COMPONENT - LAYERS SIGIL VERSION
 *
 * Renders text with inline colored sigils from Tree of Life.
 * Click sigil to expand grey insight text in popover.
 *
 * @module DepthAnnotation
 */

import React, { useMemo } from 'react';
import {
  DepthAnnotation as AnnotationType,
  AnnotatedSegment,
  DepthConfig,
} from '@/lib/depth-annotations';
import { DepthSigil } from './DepthSigil';

// ============ TEXT SEGMENT WITH INLINE SIGILS ============

interface AnnotatedTextSegmentProps {
  segment: AnnotatedSegment;
  onExpand?: (query: string) => void;
}

function AnnotatedTextSegment({ segment, onExpand }: AnnotatedTextSegmentProps) {
  // Render text with inline sigils
  const renderTextWithSigils = useMemo(() => {
    if (segment.annotations.length === 0) {
      return <span>{segment.text}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort annotations by position
    const sortedAnns = [...segment.annotations].sort((a, b) => a.position - b.position);

    // Build a map of term positions to avoid duplicates
    const processedPositions = new Set<number>();

    for (const ann of sortedAnns) {
      // Find term in text
      const termIndex = segment.text.toLowerCase().indexOf(ann.term.toLowerCase(), lastIndex);
      if (termIndex === -1 || processedPositions.has(termIndex)) continue;

      processedPositions.add(termIndex);

      // Add text before term
      if (termIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{segment.text.substring(lastIndex, termIndex)}</span>
        );
      }

      // Add term + inline sigil
      const termEnd = termIndex + ann.term.length;
      parts.push(
        <span key={`annotated-${termIndex}`} className="inline-flex items-baseline gap-0.5">
          <span className="text-slate-900">{segment.text.substring(termIndex, termEnd)}</span>
          <DepthSigil content={ann.content} term={ann.term} />
        </span>
      );

      lastIndex = termEnd;
    }

    // Add remaining text
    if (lastIndex < segment.text.length) {
      parts.push(<span key={`text-end`}>{segment.text.substring(lastIndex)}</span>);
    }

    return <>{parts}</>;
  }, [segment, onExpand]);

  return <span className="inline">{renderTextWithSigils}</span>;
}

// ============ MAIN DEPTH TEXT COMPONENT ============

interface DepthTextProps {
  /** The text content to annotate */
  text: string;
  /** Pre-computed annotations (for streaming) */
  annotations?: AnnotationType[];
  /** Configuration */
  config?: DepthConfig;
  /** Callback when user expands annotation */
  onExpand?: (query: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function DepthText({
  text,
  annotations = [],
  config,
  onExpand,
  className = '',
}: DepthTextProps) {
  const rendered = useMemo(() => {
    // Always-on: do NOT check config.enabled here
    if (annotations.length === 0) return null;

    // Build list of term matches using word-boundary regex (no position trust)
    type Match = { start: number; end: number; ann: AnnotationType };
    const matches: Match[] = [];

    for (const ann of annotations) {
      if (!ann.term) continue;
      const escaped = ann.term.replace(/[.*+?${}()|[\]\\]/g, '\\$&');
      // Lookahead/lookbehind treating hyphen, apostrophe, underscore as word-internal
      const before = "(?<![\\w\\-\\'])";
      const after = "(?![\\w\\-\\'])";
      const wordBoundaryRegex = new RegExp(`${before}${escaped}${after}`, 'gi');
      const m = wordBoundaryRegex.exec(text);
      if (m) {
        matches.push({ start: m.index, end: m.index + m[0].length, ann });
      }
    }

    // Sort by position, drop overlaps
    matches.sort((a, b) => a.start - b.start);
    const clean: Match[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        clean.push(m);
        lastEnd = m.end;
      }
    }

    if (clean.length === 0) return null;

    // Render text with sigil AFTER each matched term (not inside)
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const m of clean) {
      if (m.start > cursor) {
        parts.push(<span key={`t-${cursor}`}>{text.substring(cursor, m.start)}</span>);
      }
      parts.push(<span key={`w-${m.start}`}>{text.substring(m.start, m.end)}</span>);
      parts.push(<DepthSigil key={`s-${m.start}`} content={m.ann.content} term={m.ann.term} />);
      cursor = m.end;
    }
    if (cursor < text.length) {
      parts.push(<span key="end">{text.substring(cursor)}</span>);
    }
    return parts;
  }, [text, annotations]);

  if (!rendered) return <span className={className}>{text}</span>;
  return <span className={`depth-text ${className}`}>{rendered}</span>;
}

// ============ STREAMING DEPTH TEXT COMPONENT ============

interface StreamingDepthTextProps {
  /** Current streaming text */
  text: string;
  /** Annotations detected so far */
  annotations: AnnotationType[];
  /** Configuration */
  config: DepthConfig;
  /** Callback when user expands annotation */
  onExpand?: (query: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function StreamingDepthText({
  text,
  annotations,
  config,
  onExpand,
  className = '',
}: StreamingDepthTextProps) {
  return (
    <DepthText
      text={text}
      annotations={annotations}
      config={config}
      onExpand={onExpand}
      className={className}
    />
  );
}

// ============ DEPTH CONTROLS (MINIMAL) ============

interface DepthControlsProps {
  config: DepthConfig;
  onConfigChange: (config: DepthConfig) => void;
  annotationCount: number;
}

export function DepthControls({ config, onConfigChange, annotationCount }: DepthControlsProps) {
  // Controls removed - sigils are always shown, individually expandable
  // This component kept for backwards compatibility but renders nothing
  return null;
}

// Default export
export default DepthText;
