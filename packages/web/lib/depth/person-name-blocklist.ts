/**
 * Post-extraction blocklist for person-name detection in depth annotations.
 *
 * Used by `lib/depth/patterns-general.ts` to reject matches where the regex
 * captures a title suffix or institutional common noun as if it were a
 * person's name.
 *
 * Rule (`isLikelyPersonName`): reject when EVERY word of the extracted name
 * is in the blocklist. Single blocklist words are therefore always rejected;
 * multi-word phrases made entirely of blocklist words are rejected as titles
 * or institutions; any phrase with at least one non-blocklist word passes.
 *
 * Rejected examples:
 *   - "secretary general" → captures "General"         → rejected
 *   - "minister Share"    → captures "Share"           → rejected
 *   - "Prime Minister"    → both blocked               → rejected
 *   - "Board Directors"   → both blocked               → rejected
 *   - "European Commission" → both blocked             → rejected
 *
 * Still accepted:
 *   - "Henry Kissinger", "Van Rompuy", "Angela Merkel"
 *   - "Henry Ford" (Ford not in blocklist)
 *   - "Jean-Claude Trichet" (neither token blocked)
 */

const PERSON_NAME_BLOCKLIST = new Set<string>([
  // Title suffixes that get captured as "names" after role words
  'general',
  'minister',
  'secretary',
  'director',
  'president',
  'chairman',
  'chair',
  'executive',
  'officer',
  'chief',
  'governor',
  'ambassador',
  'commissioner',
  'chancellor',
  'mayor',
  'judge',
  'prime',
  'vice',
  'deputy',
  'acting',
  'former',
  'current',
  'founding',

  // Organizational / institutional common nouns
  'share',
  'shares',
  'council',
  'board',
  'committee',
  'commission',
  'group',
  'union',
  'alliance',
  'partnership',
  'association',
  'institute',
  'foundation',
  'bureau',
  'agency',
  'department',
  'ministry',
  'parliament',
  'congress',
  'senate',
  'assembly',
  'organization',
  'organisation',
  'administration',
  'authority',
  'corporation',
  'company',
  'holdings',

  // Geopolitical adjectives common in institution names
  'european',
  'american',
  'african',
  'asian',
  'united',
  'federal',
  'national',
  'international',
  'global',
  'regional',
  'central',
  'world',
]);

/**
 * Returns `true` if `name` plausibly refers to a real person (not a title
 * phrase or institution). Reject only when every word in the name is a
 * known title/institutional suffix in `PERSON_NAME_BLOCKLIST`.
 *
 * @param name  Candidate name string extracted by a regex capture group.
 */
export function isLikelyPersonName(name: string): boolean {
  if (!name) return false;
  const words = name
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => w.replace(/[\u2018\u2019'".,]/g, ''))
    .filter(Boolean);
  if (words.length === 0) return false;
  return !words.every((w) => PERSON_NAME_BLOCKLIST.has(w));
}

/** Exported for tests and for future inspection/debug tooling. */
export { PERSON_NAME_BLOCKLIST };
