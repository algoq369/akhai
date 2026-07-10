/**
 * Pure scoring helpers for the GTP consensus route (extracted verbatim from
 * app/api/tot-consensus/route.ts to keep that file under the 500-LOC rule).
 */

// Extract key points from content
export function extractKeyPoints(content: string): string[] {
  const points: string[] = [];

  const bulletMatches = content.match(/^[•\-\*]\s+(.+)$/gm);
  if (bulletMatches) {
    points.push(...bulletMatches.map((m) => m.replace(/^[•\-\*]\s+/, '').trim()));
  }

  const numberedMatches = content.match(/^\d+\.\s+(.+)$/gm);
  if (numberedMatches) {
    points.push(...numberedMatches.map((m) => m.replace(/^\d+\.\s+/, '').trim()));
  }

  const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
  if (boldMatches) {
    points.push(...boldMatches.map((m) => m.replace(/\*\*/g, '').trim()));
  }

  return Array.from(new Set(points))
    .filter((p) => p.length > 10)
    .slice(0, 5);
}

// Calculate confidence from content
export function calculateConfidence(content: string): number {
  const lowerContent = content.toLowerCase();
  const highMarkers = ['definitely', 'certainly', 'clearly', 'undoubtedly', 'confident'];
  const lowMarkers = ['might', 'possibly', 'perhaps', 'uncertain', 'unclear', 'may'];

  let score = 0.7;
  highMarkers.forEach((m) => {
    if (lowerContent.includes(m)) score += 0.05;
  });
  lowMarkers.forEach((m) => {
    if (lowerContent.includes(m)) score -= 0.05;
  });

  return Math.min(0.95, Math.max(0.3, score));
}

// Calculate consensus level between responses
export function calculateConsensus(responses: { status: string; keyPoints: string[] }[]): number {
  const successful = responses.filter((r) => r.status === 'complete');
  if (successful.length < 2) return 0;

  const allKeyPoints = successful.flatMap((r) => r.keyPoints.map((p) => p.toLowerCase()));
  const uniquePoints = new Set(allKeyPoints);
  const overlap = 1 - uniquePoints.size / Math.max(allKeyPoints.length, 1);

  return Math.min(0.95, Math.max(0.3, 0.5 + overlap * 0.5));
}
