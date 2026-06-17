/**
 * Render predicates — V6 Block 2 CUT 3. Pure content checks extracted from heavy
 * viz components so ChatMessages stops bundling d3/mindmap/motion at first paint.
 */
export { shouldShowMindmap } from '@/components/ResponseMindmap.utils';

export function shouldShowLayers(content: string, hasGnosticData: boolean = false): boolean {
  if (hasGnosticData) {
    return true;
  }

  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length;

  return headerCount >= 1 || boldCount >= 2 || bulletCount >= 2 || content.length > 200;
}

export function shouldShowInsightMap(content: string, hasGnosticData: boolean = false): boolean {
  if (hasGnosticData) return true;

  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length;
  // Free-tier models use [TAG]: format instead of markdown
  const tagCount = (
    content.match(/\[(?:TECHNICAL|STRATEGIC|CRITICAL|RELATED|NEXT|KEY|SUMMARY|INSIGHT)\]/gi) || []
  ).length;
  const numberedSteps = (content.match(/^\d+\.\s+.+$/gm) || []).length;

  return (
    boldCount >= 1 ||
    headerCount >= 1 ||
    bulletCount >= 2 ||
    tagCount >= 1 ||
    numberedSteps >= 3 ||
    content.length > 200
  );
}
