/**
 * Qlipoth Report Formatter
 *
 * Formats QlipothReport into human-readable markdown annotations.
 */

import type { QlipothReport, ShadowActivation, WeightRecommendation } from './types'

/**
 * Health status icons
 */
const HEALTH_ICONS: Record<QlipothReport['overallHealth'], string> = {
  balanced: '◉',
  minor_imbalance: '◐',
  significant_imbalance: '◔',
  critical: '○',
}

/**
 * Health status labels
 */
const HEALTH_LABELS: Record<QlipothReport['overallHealth'], string> = {
  balanced: 'Balanced',
  minor_imbalance: 'Minor Imbalance',
  significant_imbalance: 'Significant Imbalance',
  critical: 'Critical',
}

/**
 * Format a complete gnostic annotation
 */
export function formatGnosticAnnotation(report: QlipothReport): string {
  const sections: string[] = []

  // Header
  sections.push(formatHeader(report))

  // Processing Path
  sections.push(formatProcessingPath(report.processingPath))

  // Guard Analysis
  sections.push(formatGuardAnalysis(report.guardAnalysis))

  // Shadow Activations
  if (report.shadowsActivated.length > 0) {
    sections.push(formatShadowActivations(report.shadowsActivated))
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    sections.push(formatRecommendations(report.recommendations))
  }

  return sections.join('\n\n')
}

/**
 * Format compact annotation (for inline display)
 */
export function formatCompactAnnotation(report: QlipothReport): string {
  const icon = HEALTH_ICONS[report.overallHealth]
  const label = HEALTH_LABELS[report.overallHealth]
  const dominant = report.processingPath.dominantSephirah
  const shadowCount = report.shadowsActivated.length

  let compact = `${icon} ${label} | ${dominant}`

  if (shadowCount > 0) {
    const shadows = report.shadowsActivated
      .slice(0, 2)
      .map((s) => s.qlipah)
      .join(', ')
    compact += ` | Shadows: ${shadows}${shadowCount > 2 ? '...' : ''}`
  }

  return compact
}

/**
 * Format header section
 */
function formatHeader(report: QlipothReport): string {
  const icon = HEALTH_ICONS[report.overallHealth]
  const label = HEALTH_LABELS[report.overallHealth]
  const time = new Date(report.timestamp).toLocaleTimeString()

  return `## ${icon} Gnostic Annotation

**Status:** ${label}
**Time:** ${time}`
}

/**
 * Format processing path section
 */
function formatProcessingPath(path: QlipothReport['processingPath']): string {
  const complexity = Math.round(path.inputComplexity * 100)
  const influence = Math.round(path.weightInfluenceRatio * 100)

  return `### Processing Path

| Aspect | Value |
|--------|-------|
| Dominant Sephirah | **${path.dominantSephirah}** |
| Methodology | ${path.methodologyUsed} |
| Complexity | ${complexity}% |
| Weight Influence | ${influence}% |
| Active Lenses | ${path.activeLenses.join(', ') || 'None'} |`
}

/**
 * Format guard analysis section
 */
function formatGuardAnalysis(analysis: QlipothReport['guardAnalysis']): string {
  const drift = Math.round(analysis.driftScore * 100)
  const hype = Math.round(analysis.hypeScore * 100)
  const risk = Math.round(analysis.hallucinationRisk * 100)

  const driftBar = createBar(analysis.driftScore)
  const hypeBar = createBar(analysis.hypeScore)
  const riskBar = createBar(analysis.hallucinationRisk)

  return `### Guard Analysis

| Metric | Score | Level |
|--------|-------|-------|
| Drift | ${driftBar} ${drift}% | ${getLevel(analysis.driftScore)} |
| Hype | ${hypeBar} ${hype}% | ${getLevel(analysis.hypeScore)} |
| Hallucination Risk | ${riskBar} ${risk}% | ${getLevel(analysis.hallucinationRisk)} |`
}

/**
 * Format shadow activations section
 */
function formatShadowActivations(shadows: ShadowActivation[]): string {
  const lines = ['### Shadow Activations', '']

  shadows.forEach((shadow) => {
    const intensity = Math.round(shadow.intensity * 100)
    const bar = createBar(shadow.intensity)
    const severityLabel = getSeverityLabel(shadow.intensity)

    lines.push(`#### ${shadow.qlipah} (${shadow.sephirah} Shadow)`)
    lines.push(`- **Intensity:** ${bar} ${intensity}% (${severityLabel})`)
    lines.push(`- **Reason:** ${shadow.reason}`)
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Format recommendations section
 */
function formatRecommendations(recommendations: WeightRecommendation[]): string {
  const lines = ['### Recommendations', '']

  recommendations.forEach((rec, i) => {
    const delta = rec.adjustWeight.delta > 0 ? `+${Math.round(rec.adjustWeight.delta * 100)}%` : `${Math.round(rec.adjustWeight.delta * 100)}%`
    lines.push(`${i + 1}. ${rec.suggestion}`)
    lines.push(`   - Adjust Sephirah ${rec.adjustWeight.sephirah}: ${delta}`)
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Create a simple text bar visualization
 */
function createBar(value: number): string {
  const filled = Math.round(value * 5)
  const empty = 5 - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Get level label for a score
 */
function getLevel(score: number): string {
  if (score < 0.2) return 'Low'
  if (score < 0.4) return 'Moderate'
  if (score < 0.6) return 'Elevated'
  if (score < 0.8) return 'High'
  return 'Critical'
}

/**
 * Get severity label for intensity
 */
function getSeverityLabel(intensity: number): string {
  if (intensity < 0.3) return 'Mild'
  if (intensity < 0.5) return 'Moderate'
  if (intensity < 0.7) return 'Severe'
  return 'Critical'
}

/**
 * Format for console display (with colors via ANSI codes)
 */
export function formatConsoleAnnotation(report: QlipothReport): string {
  const icon = HEALTH_ICONS[report.overallHealth]
  const label = HEALTH_LABELS[report.overallHealth]

  let output = `\n${icon} GNOSTIC ANNOTATION: ${label}\n`
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  output += `Dominant: ${report.processingPath.dominantSephirah}\n`
  output += `Methodology: ${report.processingPath.methodologyUsed}\n`
  output += `Complexity: ${Math.round(report.processingPath.inputComplexity * 100)}%\n`

  if (report.shadowsActivated.length > 0) {
    output += `\nShadows:\n`
    report.shadowsActivated.forEach((s) => {
      output += `  ⚠ ${s.qlipah}: ${Math.round(s.intensity * 100)}%\n`
    })
  }

  if (report.recommendations.length > 0) {
    output += `\nRecommendations:\n`
    report.recommendations.forEach((r, i) => {
      output += `  ${i + 1}. ${r.suggestion}\n`
    })
  }

  return output
}

/**
 * Format as JSON for API response
 */
export function formatJSONAnnotation(report: QlipothReport): object {
  return {
    health: report.overallHealth,
    processing: {
      dominant: report.processingPath.dominantSephirah,
      methodology: report.processingPath.methodologyUsed,
      complexity: report.processingPath.inputComplexity,
      weightInfluence: report.processingPath.weightInfluenceRatio,
    },
    guard: {
      drift: report.guardAnalysis.driftScore,
      hype: report.guardAnalysis.hypeScore,
      hallucinationRisk: report.guardAnalysis.hallucinationRisk,
    },
    shadows: report.shadowsActivated.map((s) => ({
      name: s.qlipah,
      sephirah: s.sephirah,
      intensity: s.intensity,
      reason: s.reason,
    })),
    recommendations: report.recommendations.map((r) => ({
      text: r.suggestion,
      sephirah: r.adjustWeight.sephirah,
      delta: r.adjustWeight.delta,
    })),
  }
}
