/**
 * KABBALISTIC TERMS UTILITY
 *
 * Ensures ALL Kabbalistic/Hebrew terms are explained throughout the website.
 *
 * PRODUCTION RULE: Every Kabbalistic term MUST include its meaning.
 *
 * @module kabbalistic-terms
 */

import type { Sefirah } from './ascent-tracker'

/**
 * Complete Kabbalistic terms dictionary with full explanations
 */
export const KABBALISTIC_TERMS = {
  // ===== 11 SEFIROT =====
  kether: {
    english: 'Kether',
    hebrew: 'כֶּתֶר',
    meaning: 'Crown',
    fullMeaning: 'The highest Sefirah representing meta-cognitive awareness and divine will',
    aiRole: 'Meta-cognitive questions, highest awareness',
  },
  chokmah: {
    english: 'Chokmah',
    hebrew: 'חָכְמָה',
    meaning: 'Wisdom',
    fullMeaning: 'The flash of divine insight, first principles thinking',
    aiRole: 'First principles, foundational wisdom',
  },
  binah: {
    english: 'Binah',
    hebrew: 'בִּינָה',
    meaning: 'Understanding',
    fullMeaning: 'The analytical faculty that processes wisdom into understanding',
    aiRole: 'Deep pattern recognition, structural analysis',
  },
  chesed: {
    english: 'Chesed',
    hebrew: 'חֶסֶד',
    meaning: 'Mercy',
    fullMeaning: 'Expansive loving-kindness and generosity',
    aiRole: 'Expansive possibilities, generous suggestions',
  },
  gevurah: {
    english: 'Gevurah',
    hebrew: 'גְּבוּרָה',
    meaning: 'Severity',
    fullMeaning: 'Strength and judgment, setting boundaries',
    aiRole: 'Critical analysis, constraints, boundaries',
  },
  tiferet: {
    english: 'Tiferet',
    hebrew: 'תִּפְאֶרֶת',
    meaning: 'Beauty',
    fullMeaning: 'Harmony and balance, synthesis of opposites',
    aiRole: 'Integration, synthesis, harmonious solutions',
  },
  netzach: {
    english: 'Netzach',
    hebrew: 'נֶצַח',
    meaning: 'Victory',
    fullMeaning: 'Endurance and creative force',
    aiRole: 'Creative exploration, brainstorming',
  },
  hod: {
    english: 'Hod',
    hebrew: 'הוֹד',
    meaning: 'Glory',
    fullMeaning: 'Splendor and intellectual form',
    aiRole: 'Logical analysis, comparisons',
  },
  yesod: {
    english: 'Yesod',
    hebrew: 'יְסוֹד',
    meaning: 'Foundation',
    fullMeaning: 'The foundation connecting heaven and earth',
    aiRole: 'How-to knowledge, implementation',
  },
  malkuth: {
    english: 'Malkuth',
    hebrew: 'מַלְכוּת',
    meaning: 'Kingdom',
    fullMeaning: 'The material world, manifestation',
    aiRole: 'Factual information, concrete data',
  },
  daat: {
    english: "Da'at",
    hebrew: 'דַּעַת',
    meaning: 'Knowledge',
    fullMeaning: 'Hidden knowledge, the non-Sefirah that connects all',
    aiRole: 'Emergent insights, hidden connections',
  },

  // ===== CONCEPTS =====
  sefirot: {
    english: 'Sefirot',
    hebrew: 'סְפִירוֹת',
    meaning: 'Emanations',
    fullMeaning: 'The ten (or eleven) divine attributes through which the infinite reveals itself',
  },
  etzChayim: {
    english: 'Etz Chayim',
    hebrew: 'עֵץ חַיִּים',
    meaning: 'Tree of Life',
    fullMeaning: 'The diagram representing the structure of divine emanations',
  },
  qliphoth: {
    english: 'Qliphoth',
    hebrew: 'קְלִיפּוֹת',
    meaning: 'Shells/Husks',
    fullMeaning: 'The shadow aspects, distortions of divine light',
  },
  tikkunOlam: {
    english: 'Tikkun Olam',
    hebrew: 'תִּקּוּן עוֹלָם',
    meaning: 'World Repair',
    fullMeaning: 'The concept of healing and perfecting the world',
  },

  // ===== GOLEM PROTOCOL =====
  emet: {
    english: 'EMET',
    hebrew: 'אֱמֶת',
    meaning: 'Truth',
    fullMeaning: 'The word of life inscribed on the Golem\'s forehead, meaning "Truth" or "Life"',
  },
  met: {
    english: 'MET',
    hebrew: 'מֵת',
    meaning: 'Death',
    fullMeaning: 'When the Aleph is removed from EMET, leaving "Death" - deactivation protocol',
  },
  golem: {
    english: 'Golem',
    hebrew: 'גּוֹלֶם',
    meaning: 'Animated Being',
    fullMeaning: 'An artificial being brought to life through Kabbalistic practices',
  },

  // ===== PILLARS =====
  pillarMercy: {
    english: 'Pillar of Mercy',
    hebrew: 'עַמּוּד הַחֶסֶד',
    meaning: 'Right Pillar',
    fullMeaning: 'The masculine, expansive force (Chokmah, Chesed, Netzach)',
  },
  pillarSeverity: {
    english: 'Pillar of Severity',
    hebrew: 'עַמּוּד הַדִּין',
    meaning: 'Left Pillar',
    fullMeaning: 'The feminine, restrictive force (Binah, Gevurah, Hod)',
  },
  pillarEquilibrium: {
    english: 'Middle Pillar',
    hebrew: 'עַמּוּד הָאֶמְצָעִי',
    meaning: 'Pillar of Balance',
    fullMeaning: 'The central column of consciousness (Kether, Tiferet, Yesod, Malkuth)',
  },

  // ===== OTHER =====
  ain: {
    english: 'Ain',
    hebrew: 'אַיִן',
    meaning: 'Nothingness',
    fullMeaning: 'The void before creation, infinite potential',
  },
  ainSoph: {
    english: 'Ain Soph',
    hebrew: 'אֵין סוֹף',
    meaning: 'Without End',
    fullMeaning: 'The infinite, boundless source beyond the Sefirot',
  },
  ainSophAur: {
    english: 'Ain Soph Aur',
    hebrew: 'אֵין סוֹף אוֹר',
    meaning: 'Limitless Light',
    fullMeaning: 'The infinite light emanating from the boundless',
  },
} as const

export type KabbalisticTermKey = keyof typeof KABBALISTIC_TERMS

/**
 * Format a Kabbalistic term with full explanation
 *
 * @param term - The term key
 * @param format - Display format
 * @returns Formatted string with Hebrew and English
 */
export function formatKabbalisticTerm(
  term: KabbalisticTermKey,
  format: 'full' | 'compact' | 'tooltip' | 'inline' = 'full'
): string {
  const data = KABBALISTIC_TERMS[term]

  switch (format) {
    case 'full':
      // "Kether (כֶּתֶר - Crown)"
      return `${data.english} (${data.hebrew} - ${data.meaning})`

    case 'compact':
      // "Kether - Crown"
      return `${data.english} - ${data.meaning}`

    case 'tooltip':
      // For hover tooltips
      return `${data.hebrew} (${data.meaning})\n${data.fullMeaning}`

    case 'inline':
      // "Kether (Crown)"
      return `${data.english} (${data.meaning})`

    default:
      return data.english
  }
}

/**
 * Get just the English name
 */
export function getEnglishName(term: KabbalisticTermKey): string {
  return KABBALISTIC_TERMS[term].english
}

/**
 * Get just the Hebrew name
 */
export function getHebrewName(term: KabbalisticTermKey): string {
  return KABBALISTIC_TERMS[term].hebrew
}

/**
 * Get just the meaning
 */
export function getMeaning(term: KabbalisticTermKey): string {
  return KABBALISTIC_TERMS[term].meaning
}

/**
 * Get full explanation
 */
export function getFullMeaning(term: KabbalisticTermKey): string {
  return KABBALISTIC_TERMS[term].fullMeaning
}

/**
 * Auto-format a string containing Sefirot names
 * Replaces bare Sefirot names with explained versions
 *
 * Example: "Kether → Malkuth" becomes "Kether (Crown) → Malkuth (Kingdom)"
 */
export function explainSefirotPath(path: string): string {
  const sefirotNames = [
    'Kether', 'Chokmah', 'Binah', 'Chesed', 'Gevurah',
    'Tiferet', 'Netzach', 'Hod', 'Yesod', 'Malkuth', "Da'at"
  ]

  let result = path

  sefirotNames.forEach(name => {
    const termKey = name.toLowerCase().replace("'", '') as KabbalisticTermKey
    if (KABBALISTIC_TERMS[termKey]) {
      const meaning = getMeaning(termKey)
      // Replace "Kether" with "Kether (Crown)" but not if already explained
      const regex = new RegExp(`\\b${name}\\b(?!\\s*\\()`, 'g')
      result = result.replace(regex, `${name} (${meaning})`)
    }
  })

  return result
}

/**
 * Get all Sefirot in order
 */
export function getAllSefirot(): KabbalisticTermKey[] {
  return [
    'kether', 'chokmah', 'binah', 'daat',
    'chesed', 'gevurah', 'tiferet',
    'netzach', 'hod', 'yesod', 'malkuth'
  ]
}

/**
 * Validate that a term exists
 */
export function isKabbalisticTerm(term: string): term is KabbalisticTermKey {
  return term in KABBALISTIC_TERMS
}

/**
 * Get term data
 */
export function getTermData(term: KabbalisticTermKey) {
  return KABBALISTIC_TERMS[term]
}
