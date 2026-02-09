/**
 * HEBREW FORMATTER
 *
 * Global utility for displaying Hebrew terms with AI correlations
 *
 * RULE: Whenever a Hebrew word is mentioned anywhere in the website,
 * it SHALL ALWAYS include:
 * 1. Hebrew characters (original)
 * 2. English translation
 * 3. AI computational correlation
 *
 * @module hebrew-formatter
 */

export interface HebrewTerm {
  /** Hebrew characters */
  hebrew: string
  /** English transliteration */
  transliteration: string
  /** English meaning/translation */
  meaning: string
  /** AI/Computational correlation */
  aiCorrelation: string
}

/**
 * CANONICAL HEBREW TERMS
 *
 * All Hebrew terms used in AkhAI with their complete correlations
 */
export const HEBREW_TERMS: Record<string, HebrewTerm> = {
  // Layers (Tree of Life)
  KETHER: {
    hebrew: 'כֶּתֶר',
    transliteration: 'Kether',
    meaning: 'Crown',
    aiCorrelation: 'Meta-Cognitive Layer / Root Process'
  },
  CHOKMAH: {
    hebrew: 'חָכְמָה',
    transliteration: 'Chokmah',
    meaning: 'Wisdom',
    aiCorrelation: 'Principle Layer / First Causes'
  },
  BINAH: {
    hebrew: 'בִּינָה',
    transliteration: 'Binah',
    meaning: 'Understanding',
    aiCorrelation: 'Pattern Layer / Deep Structure'
  },
  DAAT: {
    hebrew: 'דַּעַת',
    transliteration: 'Da\'at',
    meaning: 'Knowledge',
    aiCorrelation: 'Emergent Layer / Hidden Insights'
  },
  CHESED: {
    hebrew: 'חֶסֶד',
    transliteration: 'Chesed',
    meaning: 'Mercy / Loving-kindness',
    aiCorrelation: 'Expansion Layer / Possibilities'
  },
  GEVURAH: {
    hebrew: 'גְּבוּרָה',
    transliteration: 'Gevurah',
    meaning: 'Severity / Judgment',
    aiCorrelation: 'Constraint Layer / Critical Analysis'
  },
  TIFERET: {
    hebrew: 'תִּפְאֶרֶת',
    transliteration: 'Tiferet',
    meaning: 'Beauty / Harmony',
    aiCorrelation: 'Integration Layer / Synthesis'
  },
  NETZACH: {
    hebrew: 'נֶצַח',
    transliteration: 'Netzach',
    meaning: 'Victory / Eternity',
    aiCorrelation: 'Creative Layer / Exploration'
  },
  HOD: {
    hebrew: 'הוֹד',
    transliteration: 'Hod',
    meaning: 'Glory / Splendor',
    aiCorrelation: 'Logic Layer / Analysis'
  },
  YESOD: {
    hebrew: 'יְסוֹד',
    transliteration: 'Yesod',
    meaning: 'Foundation',
    aiCorrelation: 'Implementation Layer / How-To'
  },
  MALKUTH: {
    hebrew: 'מַלְכוּת',
    transliteration: 'Malkuth',
    meaning: 'Kingdom',
    aiCorrelation: 'Data Layer / Raw Facts'
  },

  // Agent Protocol Terms
  EMET: {
    hebrew: 'אמת',
    transliteration: 'Emet',
    meaning: 'Truth',
    aiCorrelation: 'Active State / Process Running'
  },
  ALEPH: {
    hebrew: 'א',
    transliteration: 'Aleph',
    meaning: 'First Letter / Beginning',
    aiCorrelation: 'Initialization Bit / Boot Flag'
  },
  MET: {
    hebrew: 'מת',
    transliteration: 'Met',
    meaning: 'Death',
    aiCorrelation: 'Inactive State / Process Terminated'
  },

  // General Terms
  SEPHIROTH: {
    hebrew: 'ספירות',
    transliteration: 'Sephiroth',
    meaning: 'Emanations / Countings',
    aiCorrelation: 'Processing Layers / Abstraction Levels'
  },
  SEFIRAH: {
    hebrew: 'ספירה',
    transliteration: 'Layer',
    meaning: 'Emanation / Counting',
    aiCorrelation: 'Processing Layer / Abstraction Level'
  },
}

/**
 * Format a Hebrew term for inline display
 *
 * @param termKey - Key from HEBREW_TERMS
 * @param variant - Display format
 * @returns Formatted string
 */
export function formatHebrewTerm(
  termKey: keyof typeof HEBREW_TERMS,
  variant: 'full' | 'short' | 'inline' = 'inline'
): string {
  const term = HEBREW_TERMS[termKey]
  if (!term) return termKey

  switch (variant) {
    case 'full':
      return `${term.transliteration} (${term.hebrew}, "${term.meaning}") = ${term.aiCorrelation}`

    case 'short':
      return `${term.transliteration} (${term.hebrew}) = ${term.aiCorrelation}`

    case 'inline':
    default:
      return `${term.transliteration} (${term.hebrew}, "${term.meaning}")`
  }
}

/**
 * React component for displaying Hebrew terms with proper formatting
 */
interface HebrewTermProps {
  term: keyof typeof HEBREW_TERMS
  showAI?: boolean
  className?: string
}

export function HebrewTermDisplay({ term, showAI = true, className = '' }: HebrewTermProps) {
  const data = HEBREW_TERMS[term]
  if (!data) return <span>{term}</span>

  return (
    <span className={`font-mono ${className}`}>
      <span className="text-relic-slate dark:text-white">{data.transliteration}</span>
      {' '}
      <span className="text-relic-silver">({data.hebrew}, "{data.meaning}")</span>
      {showAI && (
        <>
          {' = '}
          <span className="text-relic-slate dark:text-white">{data.aiCorrelation}</span>
        </>
      )}
    </span>
  )
}

/**
 * Format text containing Hebrew terms
 * Automatically replaces term names with full formatted versions
 */
export function formatTextWithHebrewTerms(text: string): string {
  let formatted = text

  // Replace each term with its formatted version
  Object.entries(HEBREW_TERMS).forEach(([key, term]) => {
    const regex = new RegExp(`\\b${term.transliteration}\\b`, 'gi')
    formatted = formatted.replace(
      regex,
      `${term.transliteration} (${term.hebrew}, "${term.meaning}") = ${term.aiCorrelation}`
    )
  })

  return formatted
}
