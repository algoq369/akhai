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
  // Position-based sigil insertion — no segment splitting, no indexOf
  const rendered = useMemo(() => {
    if (!config?.enabled || annotations.length === 0) {
      return null;
    }

    const sortedAnns = [...annotations]
      .filter((a) => a.position >= 0 && a.position < text.length)
      .sort((a, b) => a.position - b.position);

    const parts: React.ReactNode[] = [];
    let lastPos = 0;

    for (const ann of sortedAnns) {
      // Skip overlapping annotations
      if (ann.position < lastPos) continue;

      if (ann.position > lastPos) {
        parts.push(<span key={`t-${lastPos}`}>{text.substring(lastPos, ann.position)}</span>);
      }

      const termEnd = Math.min(ann.position + ann.term.length, text.length);
      parts.push(
        <span key={`a-${ann.position}`} className="inline-flex items-baseline gap-0.5">
          <span className="text-slate-900">{text.substring(ann.position, termEnd)}</span>
          <DepthSigil content={ann.content} term={ann.term} />
        </span>
      );
      lastPos = termEnd;
    }

    if (lastPos < text.length) {
      parts.push(<span key="end">{text.substring(lastPos)}</span>);
    }

    return parts;
  }, [text, annotations, config]);

  if (!rendered) {
    return <span className={className}>{text}</span>;
  }

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
