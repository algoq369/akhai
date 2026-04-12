// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Origin, Horoscope } = require('circular-natal-horoscope-js') as {
  Origin: new (opts: Record<string, number>) => Record<string, unknown>;
  Horoscope: new (opts: Record<string, unknown>) => HoroscopeResult;
};

interface HoroscopeResult {
  CelestialBodies: { all: RawBody[] };
  CelestialPoints: { northnode: RawBody; southnode: RawBody };
  Houses: RawHouse[];
  Aspects: { all: RawAspect[] };
}
interface RawBody {
  key: string;
  ChartPosition: { Ecliptic: { DecimalDegrees: number } };
  Sign: { key: string };
}
interface RawHouse {
  ChartPosition: { StartPosition: { Ecliptic: { DecimalDegrees: number } } };
}
interface RawAspect {
  point1Key: string;
  point2Key: string;
  aspectKey: string;
  orb: number;
}

// === Types ===

export interface BirthData {
  name: string;
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface Planet {
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  signDegree: number;
  house: number;
}

export interface NodePosition {
  longitude: number;
  sign: string;
  signDegree: number;
  house: number;
  formattedDegree: string;
}

export interface Aspect {
  planet: string;
  symbol: string;
  type: string;
  angle: number;
  orb: number;
  exact: number;
}

export interface Transit {
  planet: string;
  symbol: string;
  type: string;
  orb: number;
  applying: boolean;
}

export interface NatalChart {
  planets: Planet[];
  houses: number[];
  northNode: NodePosition;
  southNode: NodePosition;
  aspects: Aspect[];
}

// === Constants ===

const SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;
const SIGN_ABBR: Record<string, string> = {
  aries: 'ARI',
  taurus: 'TAU',
  gemini: 'GEM',
  cancer: 'CAN',
  leo: 'LEO',
  virgo: 'VIR',
  libra: 'LIB',
  scorpio: 'SCO',
  sagittarius: 'SAG',
  capricorn: 'CAP',
  aquarius: 'AQU',
  pisces: 'PIS',
};
const PLANET_SYMBOLS: Record<string, string> = {
  sun: '\u2609',
  moon: '\u263D',
  mercury: '\u263F',
  venus: '\u2640',
  mars: '\u2642',
  jupiter: '\u2643',
  saturn: '\u2644',
  uranus: '\u2645',
  neptune: '\u2646',
  pluto: '\u2647',
  chiron: '\u26B7',
};
const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};
const STORAGE_KEY = 'constellation-birth-data';

// === Helpers ===

function longitudeToSign(lng: number): { sign: string; degree: number } {
  const norm = ((lng % 360) + 360) % 360;
  const idx = Math.floor(norm / 30);
  return { sign: SIGNS[idx], degree: norm - idx * 30 };
}

function formatDegree(deg: number, sign: string): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}\u00B0${m}' ${SIGN_ABBR[sign] ?? sign}`;
}

function findHouse(lng: number, cusps: number[]): number {
  const norm = ((lng % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (start < end) {
      if (norm >= start && norm < end) return i + 1;
    } else {
      if (norm >= start || norm < end) return i + 1;
    }
  }
  return 1;
}

// === Core computation ===

export function computeNatalChart(data: BirthData): NatalChart {
  const origin = new Origin({
    year: data.year,
    month: data.month - 1,
    date: data.day,
    hour: data.hour,
    minute: data.minute,
    second: 0,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: ['bodies', 'points', 'angles'],
    aspectWithPoints: ['bodies', 'points', 'angles'],
    aspectTypes: ['major'],
  });

  // House cusps
  const cusps: number[] = horoscope.Houses.map(
    (h) => h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees
  );

  // Planets
  const planets: Planet[] = horoscope.CelestialBodies.all
    .filter((b) => PLANET_SYMBOLS[b.key])
    .map((b) => {
      const lng = b.ChartPosition.Ecliptic.DecimalDegrees;
      const { sign, degree } = longitudeToSign(lng);
      return {
        name: b.key,
        symbol: PLANET_SYMBOLS[b.key],
        longitude: lng,
        sign,
        signDegree: degree,
        house: findHouse(lng, cusps),
      };
    });

  // Nodes
  const nnRaw = horoscope.CelestialPoints.northnode;
  const nnLng: number = nnRaw.ChartPosition.Ecliptic.DecimalDegrees;
  const nn = longitudeToSign(nnLng);
  const snLng = (nnLng + 180) % 360;
  const sn = longitudeToSign(snLng);

  const northNode: NodePosition = {
    longitude: nnLng,
    sign: nn.sign,
    signDegree: nn.degree,
    house: findHouse(nnLng, cusps),
    formattedDegree: formatDegree(nn.degree, nn.sign),
  };
  const southNode: NodePosition = {
    longitude: snLng,
    sign: sn.sign,
    signDegree: sn.degree,
    house: findHouse(snLng, cusps),
    formattedDegree: formatDegree(sn.degree, sn.sign),
  };

  // Aspects to North Node
  const aspects: Aspect[] = horoscope.Aspects.all
    .filter((a) => a.point1Key === 'northnode' || a.point2Key === 'northnode')
    .map((a) => {
      const other = a.point1Key === 'northnode' ? a.point2Key : a.point1Key;
      return {
        planet: other,
        symbol: PLANET_SYMBOLS[other] ?? other,
        type: a.aspectKey,
        angle: ASPECT_ANGLES[a.aspectKey] ?? 0,
        orb: Math.round(a.orb * 100) / 100,
        exact: ASPECT_ANGLES[a.aspectKey] ?? 0,
      };
    });

  return { planets, houses: cusps, northNode, southNode, aspects };
}

// === Interpretations ===

const NODE_SIGNS: Record<string, { theme: string; growth: string; challenge: string }> = {
  aries: {
    theme: 'Independent action and self-assertion',
    growth:
      'Learning to lead, take initiative, and trust your instincts without waiting for permission.',
    challenge: 'Moving beyond codependency and excessive compromise (South Node Libra).',
  },
  taurus: {
    theme: 'Material stability and embodied presence',
    growth: 'Building lasting value, cultivating patience, and trusting the physical senses.',
    challenge:
      'Releasing attachment to crisis, intensity, and shared resources (South Node Scorpio).',
  },
  gemini: {
    theme: 'Curiosity, communication, and local connection',
    growth: 'Learning to ask questions, gather diverse perspectives, and stay flexible.',
    challenge: 'Moving beyond dogmatic beliefs and the need to be right (South Node Sagittarius).',
  },
  cancer: {
    theme: 'Emotional security and nurturing foundations',
    growth: 'Building inner safety, honoring feelings, and creating a sense of home.',
    challenge: 'Releasing excessive ambition and emotional armoring (South Node Capricorn).',
  },
  leo: {
    theme: 'Creative self-expression and personal authority',
    growth: 'Developing authentic creative voice and the courage to stand apart from the group.',
    challenge: 'Moving beyond detachment and hiding in collective identity (South Node Aquarius).',
  },
  virgo: {
    theme: 'Service, discernment, and practical craft',
    growth: 'Learning precision, developing useful skills, and serving through competence.',
    challenge: 'Releasing escapism, victimhood, and boundary dissolution (South Node Pisces).',
  },
  libra: {
    theme: 'Partnership, diplomacy, and balanced relating',
    growth:
      'Learning cooperation, fairness, and how to hold space for others without losing yourself.',
    challenge: 'Moving beyond self-centeredness and impulsive independence (South Node Aries).',
  },
  scorpio: {
    theme: 'Transformation, depth, and emotional truth',
    growth: 'Embracing vulnerability, shared power, and the cycles of death and rebirth.',
    challenge: 'Releasing material attachment and resistance to change (South Node Taurus).',
  },
  sagittarius: {
    theme: 'Meaning, philosophy, and expansive truth-seeking',
    growth: 'Building a personal philosophy, seeking broader horizons, and trusting in meaning.',
    challenge:
      'Moving beyond information overload and surface-level engagement (South Node Gemini).',
  },
  capricorn: {
    theme: 'Mastery, responsibility, and public contribution',
    growth: 'Building enduring structures, accepting authority, and achieving visible results.',
    challenge: 'Releasing emotional dependency and comfort-zone clinging (South Node Cancer).',
  },
  aquarius: {
    theme: 'Innovation, community, and humanitarian vision',
    growth:
      'Contributing to collective progress, embracing originality, and thinking systemically.',
    challenge:
      'Moving beyond ego-driven creativity and need for personal recognition (South Node Leo).',
  },
  pisces: {
    theme: 'Spiritual surrender and compassionate transcendence',
    growth: 'Learning to trust the unseen, develop intuition, and dissolve rigid boundaries.',
    challenge:
      'Releasing perfectionism, over-analysis, and the need for control (South Node Virgo).',
  },
};

const NODE_HOUSES: Record<number, { lifeArea: string; focus: string }> = {
  1: {
    lifeArea: 'Identity and self-image',
    focus: 'Developing an authentic personal presence and learning to put yourself first.',
  },
  2: {
    lifeArea: 'Finances and self-worth',
    focus: 'Building personal resources and a stable sense of your own value.',
  },
  3: {
    lifeArea: 'Communication and learning',
    focus: 'Cultivating curiosity, writing, teaching, and neighborhood connections.',
  },
  4: {
    lifeArea: 'Home and family roots',
    focus: 'Creating emotional foundations and healing family-of-origin patterns.',
  },
  5: {
    lifeArea: 'Creativity and self-expression',
    focus: 'Pursuing joy, romance, children, and authentic creative output.',
  },
  6: {
    lifeArea: 'Health and daily practice',
    focus: 'Building sustainable routines, serving others through skill and craft.',
  },
  7: {
    lifeArea: 'Partnership and commitment',
    focus: 'Learning through one-on-one relationships and conscious partnership.',
  },
  8: {
    lifeArea: 'Shared resources and transformation',
    focus: 'Navigating intimacy, joint finances, and psychological depth.',
  },
  9: {
    lifeArea: 'Higher learning and worldview',
    focus: 'Expanding through travel, philosophy, publishing, and cross-cultural exchange.',
  },
  10: {
    lifeArea: 'Career and public role',
    focus: 'Building visible achievement and accepting responsibility in the world.',
  },
  11: {
    lifeArea: 'Community and future vision',
    focus: 'Contributing to groups, networks, and humanitarian goals.',
  },
  12: {
    lifeArea: 'Spirituality and the unconscious',
    focus: 'Developing inner life, meditation, and compassionate service behind the scenes.',
  },
};

export function getNodeSignMeaning(sign: string): {
  theme: string;
  growth: string;
  challenge: string;
} {
  return NODE_SIGNS[sign] ?? { theme: 'Unknown sign', growth: '', challenge: '' };
}

export function getNodeHouseMeaning(house: number): { lifeArea: string; focus: string } {
  return NODE_HOUSES[house] ?? { lifeArea: 'Unknown house', focus: '' };
}

// === Current transits to nodes ===

export function getCurrentTransitsToNodes(northNodeLng: number): Transit[] {
  const now = new Date();
  const origin = new Origin({
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: 0,
    latitude: 0,
    longitude: 0,
  });
  const horoscope = new Horoscope({
    origin,
    houseSystem: 'whole-sign',
    zodiac: 'tropical',
    aspectPoints: ['bodies'],
    aspectWithPoints: ['bodies'],
    aspectTypes: ['major'],
  });

  const transits: Transit[] = [];
  for (const body of horoscope.CelestialBodies.all) {
    if (!PLANET_SYMBOLS[body.key]) continue;
    const tLng = body.ChartPosition.Ecliptic.DecimalDegrees;
    const diff = ((tLng - northNodeLng + 540) % 360) - 180; // -180..180
    const absDiff = Math.abs(diff);

    for (const [type, angle] of Object.entries(ASPECT_ANGLES)) {
      const orb = type === 'conjunction' || type === 'opposition' ? 5 : 4;
      if (Math.abs(absDiff - angle) <= orb) {
        transits.push({
          planet: body.key,
          symbol: PLANET_SYMBOLS[body.key],
          type,
          orb: Math.round(Math.abs(absDiff - angle) * 100) / 100,
          applying: diff > 0 ? absDiff > angle : absDiff < angle,
        });
      }
    }
  }
  return transits;
}

// === LocalStorage ===

export function saveBirthData(data: BirthData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadBirthData(): BirthData | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as BirthData) : null;
  } catch {
    return null;
  }
}

// === Re-exports for convenience ===

export { SIGN_ABBR, PLANET_SYMBOLS };
