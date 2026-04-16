/** Client-safe keyword detection for esoteric relevance (no fs dependency) */

const RELEVANCE_KEYWORDS = [
  // Core cycle/macro concepts
  'war', 'peace', 'geopolit', 'civilization', 'empire', 'decline', 'future',
  '2030', '2040', '2050', 'cycle', 'economy', 'market', 'crisis', 'collapse',
  'global', 'world order', 'currency', 'inflation', 'debt', 'power', 'sovereignty',
  'ai future', 'humanity', 'macro', 'superpower', 'hegemony', 'revolution',
  'demographic', 'generation', 'millennial', 'boomer', 'capitalism', 'socialism',
  'paradigm', 'institutional', 'reserve currency', 'dollar', 'yuan', 'bretton',
  'cold war', 'world war', 'nuclear', 'climate',
  'kondratieff', 'turchin', 'dalio', 'strauss', 'barbault',

  // Geopolitical actors (missing before)
  'trump', 'biden', 'putin', 'xi jinping', 'modi', 'erdogan', 'netanyahu',
  'china', 'russia', 'ukraine', 'taiwan', 'iran', 'israel', 'palestine', 'gaza',
  'nato', 'brics', 'eu', 'european union', 'united states', 'america',
  'africa', 'asia', 'europe', 'middle east', 'saudi', 'turkey', 'india', 'pakistan',
  'japan', 'korea', 'venezuela', 'cuba', 'syria', 'lebanon', 'yemen', 'libya',

  // Economic/political triggers
  'recession', 'stagflation', 'deflation', 'monetary', 'fiscal', 'central bank',
  'federal reserve', 'fed', 'ecb', 'bank of japan', 'interest rate', 'rate hike',
  'sanctions', 'tariff', 'trade war', 'supply chain', 'energy crisis',
  'oil', 'gas', 'wheat', 'grain', 'commodity', 'gold', 'silver',
  'bitcoin', 'btc', 'crypto', 'stablecoin', 'cbdc', 'fiat', 'petrodollar',

  // Social/political dynamics
  'election', 'coup', 'protest', 'riot', 'uprising', 'regime', 'dictatorship',
  'democracy', 'authoritarian', 'populism', 'nationalism', 'globalism',
  'migration', 'refugee', 'border', 'immigration', 'identity',
  'inequality', 'polarization', 'culture war', 'tribalism',
  'elite', 'oligarch', 'billionaire', 'wealth gap',

  // Tech/civilizational shifts
  'agi', 'singularity', 'automation', 'unemployment', 'ubi', 'post-scarcity',
  'biotech', 'crispr', 'longevity', 'transhumanism',
  'pandemic', 'epidemic', 'virus', 'plague',

  // Conflict/risk terms
  'conflict', 'tension', 'threat', 'risk', 'uncertainty', 'instability',
  'proxy war', 'insurgency', 'terrorism', 'extremism',
  'cyber', 'espionage', 'intelligence', 'covert',

  // Historical/philosophical anchors
  'rome', 'byzantium', 'ottoman', 'hapsburg', 'weimar', 'roman', 'chinese dynasty',
  'mandate of heaven', 'golden age', 'dark age', 'renaissance', 'enlightenment',
  'fourth turning', 'strauss-howe', 'secular cycle', 'k-wave', 'k wave',
  'long wave', 'business cycle', 'credit cycle',

  // Philosophical / spiritual relevance
  'meaning', 'purpose', 'consciousness', 'spirituality', 'religion',
  'prophecy', 'prediction', 'forecast', 'trend', 'pattern',
];

export function detectEsotericRelevance(query: string): boolean {
  const q = query.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => q.includes(kw));
}
