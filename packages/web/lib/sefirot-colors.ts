/**
 * Sefirot Color System for Depth Annotations
 * Maps Tree of Life layers to annotation types
 */

export interface SefirotLayer {
  name: string
  hebrew: string
  meaning: string
  color: string
  shape: string
  annotationType: string
}

export const SEFIROT_LAYERS: Record<string, SefirotLayer> = {
  kether: {
    name: 'Kether',
    hebrew: 'כֶּתֶר',
    meaning: 'Crown',
    color: '#9333EA', // Deep Purple
    shape: '★',
    annotationType: 'meta-insight'
  },
  chokmah: {
    name: 'Chokmah',
    hebrew: 'חָכְמָה',
    meaning: 'Wisdom',
    color: '#3B82F6', // Blue
    shape: '●',
    annotationType: 'strategic-fact'
  },
  binah: {
    name: 'Binah',
    hebrew: 'בִּינָה',
    meaning: 'Understanding',
    color: '#1E40AF', // Dark Blue
    shape: '◐',
    annotationType: 'pattern'
  },
  chesed: {
    name: 'Chesed',
    hebrew: 'חֶסֶד',
    meaning: 'Mercy',
    color: '#60A5FA', // Light Blue
    shape: '○',
    annotationType: 'context'
  },
  gevurah: {
    name: 'Gevurah',
    hebrew: 'גְּבוּרָה',
    meaning: 'Severity',
    color: '#DC2626', // Red
    shape: '◆',
    annotationType: 'critical-metric'
  },
  tiferet: {
    name: 'Tiferet',
    hebrew: 'תִּפְאֶרֶת',
    meaning: 'Beauty',
    color: '#F59E0B', // Amber
    shape: '◈',
    annotationType: 'synthesis'
  },
  netzach: {
    name: 'Netzach',
    hebrew: 'נֶצַח',
    meaning: 'Victory',
    color: '#10B981', // Emerald
    shape: '▲',
    annotationType: 'innovation'
  },
  hod: {
    name: 'Hod',
    hebrew: 'הוֹד',
    meaning: 'Glory',
    color: '#F97316', // Orange
    shape: '◇',
    annotationType: 'data-point'
  },
  yesod: {
    name: 'Yesod',
    hebrew: 'יְסוֹד',
    meaning: 'Foundation',
    color: '#8B5CF6', // Violet
    shape: '▣',
    annotationType: 'implementation'
  },
  malkuth: {
    name: 'Malkuth',
    hebrew: 'מַלְכוּת',
    meaning: 'Kingdom',
    color: '#78716C', // Stone
    shape: '■',
    annotationType: 'raw-data'
  }
}

/**
 * Get Sefirot layer by annotation type
 */
export function getSefirotForAnnotation(content: string): SefirotLayer {
  const contentLower = content.toLowerCase()

  // Meta-cognitive insights (Kether)
  if (/paradigm|revolutionary|fundamental\s+shift|meta-|redefin|transform/i.test(contentLower)) {
    return SEFIROT_LAYERS.kether
  }

  // Critical metrics (Gevurah)
  if (/\$[\d,]+[KMB]|\d+%|\d+x\s+(?:faster|slower|more)|valuation|revenue|growth/i.test(contentLower)) {
    return SEFIROT_LAYERS.gevurah
  }

  // Strategic facts (Chokmah)
  if (/first|leader|pioneer|dominant|advantage|strategy|position/i.test(contentLower)) {
    return SEFIROT_LAYERS.chokmah
  }

  // Innovation/Breakthrough (Netzach)
  if (/breakthrough|novel|innovative|unique|unprecedented|achievement/i.test(contentLower)) {
    return SEFIROT_LAYERS.netzach
  }

  // Pattern recognition (Binah)
  if (/similar\s+to|compared\s+to|like|cycle|pattern|historical|trend/i.test(contentLower)) {
    return SEFIROT_LAYERS.binah
  }

  // Synthesis (Tiferet)
  if (/combin|integrat|merg|unif|synthesis|balanc/i.test(contentLower)) {
    return SEFIROT_LAYERS.tiferet
  }

  // Data points (Hod)
  if (/\d+\s+(?:users|downloads|customers|subscribers)|data\s+shows|statistics/i.test(contentLower)) {
    return SEFIROT_LAYERS.hod
  }

  // Implementation details (Yesod)
  if (/built\s+on|uses|implements|based\s+on|architecture|framework|api/i.test(contentLower)) {
    return SEFIROT_LAYERS.yesod
  }

  // Context (Chesed)
  if (/context|background|originated|developed\s+by|founded/i.test(contentLower)) {
    return SEFIROT_LAYERS.chesed
  }

  // Default: Raw data (Malkuth)
  return SEFIROT_LAYERS.malkuth
}
