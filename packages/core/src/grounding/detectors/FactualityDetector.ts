/**
 * Factuality Detector
 *
 * Detects potential factual inaccuracies in responses.
 * Uses TinyLettuce sidecar service (HTTP API) for fact-checking.
 *
 * TinyLettuce API:
 * - POST /check { text: string }
 * - Returns: { score: 0-1, claims: [...], issues: [...] }
 *
 * NOTE: Requires TinyLettuce sidecar to be running.
 * Gracefully degrades if service unavailable.
 */

import type { Message, GroundingAlert, AlertSeverity } from '../types.js';

/**
 * TinyLettuce API configuration
 */
const TINY_LETTUCE_CONFIG = {
  endpoint: process.env.TINY_LETTUCE_URL || 'http://localhost:8080',
  timeout: 5000, // 5s timeout
  enabled: false, // Disabled by default (set via config)
};

/**
 * TinyLettuce fact-check response
 */
interface FactCheckResponse {
  score: number; // 0-1, higher = more factual
  confidence: number; // 0-1, how confident in the score
  claims: Array<{
    text: string;
    category: 'factual' | 'opinion' | 'ambiguous';
    confidence: number;
  }>;
  issues: Array<{
    claim: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Detect factuality issues
 */
export async function detectFactuality(
  messages: Message[],
  enabled: boolean = false
): Promise<GroundingAlert | null> {
  if (!enabled) {
    return null; // Factuality checking disabled
  }

  const startTime = Date.now();

  // Get recent assistant messages
  const recentAssistant = messages
    .filter(m => m.role === 'assistant')
    .slice(-3); // Check last 3 responses

  if (recentAssistant.length === 0) {
    return null;
  }

  // Combine messages for fact-checking
  const textToCheck = recentAssistant.map(m => m.content).join('\n\n');

  // Call TinyLettuce API
  const factCheck = await checkFactuality(textToCheck);

  if (!factCheck) {
    return null; // Service unavailable or no issues found
  }

  // Calculate factuality score (inverse of factCheck.score)
  const inaccuracyScore = 1 - factCheck.score;

  // Determine severity
  const severity: AlertSeverity =
    inaccuracyScore >= 0.7 || factCheck.issues.some(i => i.severity === 'high')
      ? 'critical'
      : inaccuracyScore >= 0.4 || factCheck.issues.some(i => i.severity === 'medium')
      ? 'warning'
      : 'info';

  // Only create alert if there are actual issues
  if (factCheck.issues.length === 0) {
    return null;
  }

  // Build evidence from issues
  const evidence = factCheck.issues.map(issue => `${issue.claim}: ${issue.issue}`);

  // Build suggestions
  const suggestions = [
    'Verify claims with authoritative sources',
    'Request citations or evidence for factual claims',
    'Consider asking for alternative viewpoints',
  ];

  if (factCheck.issues.some(i => i.severity === 'high')) {
    suggestions.unshift('High-severity factual issues detected - verify before acting');
  }

  return {
    id: `factuality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'factuality',
    severity,
    confidence: factCheck.confidence,
    message:
      severity === 'critical'
        ? 'Potential factual inaccuracies detected'
        : 'Factual claims require verification',
    timestamp: Date.now(),
    evidence,
    suggestions,
  };
}

/**
 * Call TinyLettuce API for fact-checking
 */
async function checkFactuality(text: string): Promise<FactCheckResponse | null> {
  try {
    // Make HTTP POST request to TinyLettuce
    const response = await fetch(`${TINY_LETTUCE_CONFIG.endpoint}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(TINY_LETTUCE_CONFIG.timeout),
    });

    if (!response.ok) {
      console.warn('[FactualityDetector] TinyLettuce returned error:', response.status);
      return null;
    }

    const result = (await response.json()) as FactCheckResponse;
    return result;
  } catch (error) {
    // Service unavailable - graceful degradation
    if (error instanceof Error) {
      console.debug('[FactualityDetector] TinyLettuce unavailable:', error.message);
    }
    return null;
  }
}

/**
 * Health check for TinyLettuce service
 */
export async function checkFactualityServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${TINY_LETTUCE_CONFIG.endpoint}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Configure TinyLettuce endpoint
 */
export function configureFactualityService(endpoint: string): void {
  TINY_LETTUCE_CONFIG.endpoint = endpoint;
  TINY_LETTUCE_CONFIG.enabled = true;
}
