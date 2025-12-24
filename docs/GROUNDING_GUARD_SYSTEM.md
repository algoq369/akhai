# Grounding Guard - Cognitive Immune System

## Overview

Grounding Guard is AkhAI's real-time verification layer that monitors every AI response for potential issues.

## The 4 Detectors

### 1. Hype Detection
**Catches**: Exaggerated language
**Examples**: "revolutionary", "unprecedented", "guaranteed", "always", "never"
**Threshold**: 2+ hype words

### 2. Echo Detection
**Catches**: Repetitive content
**Metric**: Unique sentences / Total sentences
**Threshold**: >30% repetition

### 3. Drift Detection
**Catches**: Off-topic responses
**Metric**: Query word overlap with response
**Threshold**: >85% drift on 6+ word queries
**Optimizations**: Skips short queries, math queries

### 4. Factuality Check
**Catches**: Unverifiable claims
**Status**: Basic implementation, advanced version planned

## Interactive Response

When issues detected:
- **Warning banner** with specific violations
- **Three options**:
  - **Refine**: AI suggests better questions
  - **Continue**: Show response with warning badge
  - **Pivot**: AI suggests alternative approaches

## Implementation

- Runs automatically on every response
- Cannot be disabled (core safety feature)
- Thresholds tuned to minimize false positives
- Logs all detections for analysis

## Future Enhancements

- External fact-checking API integration
- User-configurable thresholds
- Historical accuracy scoring
