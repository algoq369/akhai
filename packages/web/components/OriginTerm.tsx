'use client'

/**
 * HEBREW TERM COMPONENT
 * 
 * Simple component that displays Hebrew terms with English translation.
 * RULE: Every Hebrew term on the website MUST use this component.
 * 
 * Usage:
 *   <HebrewTerm term="kether" />
 *   // Renders: "Kether (כֶּתֶר) - Crown"
 * 
 * @module HebrewTerm
 */

import React from 'react'
import { HEBREW_TERMS as LIB_TERMS, HebrewTermDisplay } from '@/lib/origin-formatter'

// Complete Hebrew terms dictionary (merged with lib version)
export const HEBREW_TERMS: Record<string, {
  hebrew: string
  english: string
  pronunciation?: string
}> = {
  // ===== SEFIROT =====
  kether: { hebrew: 'כֶּתֶר', english: 'Crown', pronunciation: 'KEH-tehr' },
  chokmah: { hebrew: 'חָכְמָה', english: 'Wisdom', pronunciation: 'khokh-MAH' },
  binah: { hebrew: 'בִּינָה', english: 'Understanding', pronunciation: 'bee-NAH' },
  chesed: { hebrew: 'חֶסֶד', english: 'Mercy', pronunciation: 'KHEH-sed' },
  gevurah: { hebrew: 'גְּבוּרָה', english: 'Severity', pronunciation: 'geh-voo-RAH' },
  tiferet: { hebrew: 'תִּפְאֶרֶת', english: 'Beauty', pronunciation: 'tee-FEH-ret' },
  netzach: { hebrew: 'נֶצַח', english: 'Victory', pronunciation: 'NEH-tsakh' },
  hod: { hebrew: 'הוֹד', english: 'Glory', pronunciation: 'HOHD' },
  yesod: { hebrew: 'יְסוֹד', english: 'Foundation', pronunciation: 'yeh-SOHD' },
  malkuth: { hebrew: 'מַלְכוּת', english: 'Kingdom', pronunciation: 'mal-KHOOT' },
  daat: { hebrew: 'דַּעַת', english: 'Knowledge', pronunciation: 'DAH-aht' },
  
  // ===== CONCEPTS =====
  sefirot: { hebrew: 'סְפִירוֹת', english: 'Emanations' },
  etzChayim: { hebrew: 'עֵץ חַיִּים', english: 'Tree of Life' },
  qliphoth: { hebrew: 'קְלִיפּוֹת', english: 'Shells (Shadows)' },
  tikkunOlam: { hebrew: 'תִּקּוּן עוֹלָם', english: 'World Repair' },
  yechidah: { hebrew: 'יְחִידָה', english: 'Unity (Highest Soul)' },
  
  // ===== FIVE WORLDS =====
  adamKadmon: { hebrew: 'אָדָם קַדְמוֹן', english: 'Primordial Man' },
  atziluth: { hebrew: 'אֲצִילוּת', english: 'Emanation' },
  beriah: { hebrew: 'בְּרִיאָה', english: 'Creation' },
  yetzirah: { hebrew: 'יְצִירָה', english: 'Formation' },
  assiah: { hebrew: 'עֲשִׂיָּה', english: 'Action' },
  
  // ===== PROTOCOLS =====
  emet: { hebrew: 'אֱמֶת', english: 'Truth (Life)' },
  met: { hebrew: 'מֵת', english: 'Death (Deactivation)' },
  golem: { hebrew: 'גּוֹלֶם', english: 'Animated Being' },
  
  // ===== SOUL LEVELS =====
  nefesh: { hebrew: 'נֶפֶשׁ', english: 'Vital Soul' },
  ruach: { hebrew: 'רוּחַ', english: 'Spirit' },
  neshamah: { hebrew: 'נְשָׁמָה', english: 'Higher Soul' },
  chayah: { hebrew: 'חַיָּה', english: 'Living Essence' },
  
  // ===== THREE PILLARS =====
  pillarMercy: { hebrew: 'עַמּוּד הַחֶסֶד', english: 'Pillar of Mercy' },
  pillarSeverity: { hebrew: 'עַמּוּד הַדִּין', english: 'Pillar of Severity' },
  pillarEquilibrium: { hebrew: 'עַמּוּד הָאֶמְצָעִי', english: 'Middle Pillar' },
  
  // ===== OTHER =====
  ain: { hebrew: 'אַיִן', english: 'Nothingness' },
  ainSoph: { hebrew: 'אֵין סוֹף', english: 'Infinity' },
  ainSophAur: { hebrew: 'אֵין סוֹף אוֹר', english: 'Limitless Light' },
  olamot: { hebrew: 'עוֹלָמוֹת', english: 'Worlds' },
  madregot: { hebrew: 'מַדְרֵגוֹת', english: 'Levels' },
}

export type HebrewTermKey = keyof typeof HEBREW_TERMS

interface HebrewTermProps {
  /** The term key */
  term: HebrewTermKey
  /** Format: 'full' = "Kether (כֶּתֶר) - Crown", 'compact' = "Kether - Crown", 'hebrew' = "כֶּתֶר" */
  format?: 'full' | 'compact' | 'hebrew' | 'english'
  /** Show pronunciation on hover */
  showPronunciation?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * HebrewTerm Component
 * Displays Hebrew terms with English translations
 */
export function HebrewTerm({
  term,
  format = 'full',
  showPronunciation = true,
  className = '',
}: HebrewTermProps) {
  const termData = HEBREW_TERMS[term]
  
  if (!termData) {
    console.warn(`[HebrewTerm] Unknown term: ${term}`)
    return <span className={className}>{term}</span>
  }
  
  const { hebrew, english, pronunciation } = termData
  const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1)
  
  let display: string
  switch (format) {
    case 'hebrew':
      display = hebrew
      break
    case 'english':
      display = english
      break
    case 'compact':
      display = `${capitalizedTerm} - ${english}`
      break
    case 'full':
    default:
      display = `${capitalizedTerm} (${hebrew}) - ${english}`
  }
  
  return (
    <span 
      className={`hebrew-term ${className}`}
      title={showPronunciation && pronunciation ? `Pronunciation: ${pronunciation}` : undefined}
    >
      {display}
    </span>
  )
}

/**
 * Shorthand component: <HT t="kether" />
 */
export function HT({ t, f = 'full' }: { t: HebrewTermKey; f?: HebrewTermProps['format'] }) {
  return <HebrewTerm term={t} format={f} />
}

/**
 * Get formatted Hebrew term as string (non-React)
 */
export function formatHebrewTerm(
  term: HebrewTermKey,
  format: 'full' | 'compact' | 'hebrew' | 'english' = 'full'
): string {
  const termData = HEBREW_TERMS[term]
  if (!termData) return term
  
  const { hebrew, english } = termData
  const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1)
  
  switch (format) {
    case 'hebrew': return hebrew
    case 'english': return english
    case 'compact': return `${capitalizedTerm} - ${english}`
    case 'full':
    default: return `${capitalizedTerm} (${hebrew}) - ${english}`
  }
}

/**
 * Get all Sefirot term keys
 */
export function getSefirotTerms(): HebrewTermKey[] {
  return ['kether', 'chokmah', 'binah', 'chesed', 'gevurah', 'tiferet', 'netzach', 'hod', 'yesod', 'malkuth', 'daat']
}

/**
 * Re-export HebrewTermDisplay from lib for AI correlations
 */
export { HebrewTermDisplay }

export default HebrewTerm
