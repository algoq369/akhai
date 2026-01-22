/**
 * HEBREW TERMS DICTIONARY
 * 
 * Complete dictionary of all Hebrew/Kabbalistic terms used in AkhAI.
 * Every term includes translations in all supported languages.
 * 
 * RULE: Hebrew terms MUST always be displayed with their translation.
 * 
 * @module hebrew-terms
 */

import { SupportedLanguage as Locale } from '@/components/LanguageSelector';

export interface HebrewTermDefinition {
  hebrew: string;
  transliteration: string;
  translations: Record<Locale, string>;
  pronunciation?: string;
  category: 'sefirah' | 'concept' | 'term' | 'protocol' | 'level';
}

export const HEBREW_TERMS: Record<string, HebrewTermDefinition> = {
  // ============ SEFIROT (10 + Da'at) ============
  kether: {
    hebrew: 'כֶּתֶר',
    transliteration: 'Kether',
    translations: {
      en: 'Crown',
      fr: 'Couronne',
      es: 'Corona',
      ar: 'التاج',
      he: 'כתר',
      de: 'Krone',
      pt: 'Coroa',
      zh: '王冠',
      ja: '王冠',
    },
    pronunciation: 'KEH-tehr',
    category: 'sefirah',
  },
  
  chokmah: {
    hebrew: 'חָכְמָה',
    transliteration: 'Chokmah',
    translations: {
      en: 'Wisdom',
      fr: 'Sagesse',
      es: 'Sabiduría',
      ar: 'الحكمة',
      he: 'חכמה',
      de: 'Weisheit',
      pt: 'Sabedoria',
      zh: '智慧',
      ja: '知恵',
    },
    pronunciation: 'khokh-MAH',
    category: 'sefirah',
  },
  
  binah: {
    hebrew: 'בִּינָה',
    transliteration: 'Binah',
    translations: {
      en: 'Understanding',
      fr: 'Compréhension',
      es: 'Entendimiento',
      ar: 'الفهم',
      he: 'בינה',
      de: 'Verständnis',
      pt: 'Compreensão',
      zh: '理解',
      ja: '理解',
    },
    pronunciation: 'bee-NAH',
    category: 'sefirah',
  },
  
  chesed: {
    hebrew: 'חֶסֶד',
    transliteration: 'Chesed',
    translations: {
      en: 'Mercy',
      fr: 'Miséricorde',
      es: 'Misericordia',
      ar: 'الرحمة',
      he: 'חסד',
      de: 'Gnade',
      pt: 'Misericórdia',
      zh: '仁慈',
      ja: '慈悲',
    },
    pronunciation: 'KHEH-sed',
    category: 'sefirah',
  },
  
  gevurah: {
    hebrew: 'גְּבוּרָה',
    transliteration: 'Gevurah',
    translations: {
      en: 'Severity',
      fr: 'Rigueur',
      es: 'Severidad',
      ar: 'القوة',
      he: 'גבורה',
      de: 'Stärke',
      pt: 'Severidade',
      zh: '严厉',
      ja: '厳格',
    },
    pronunciation: 'geh-voo-RAH',
    category: 'sefirah',
  },
  
  tiferet: {
    hebrew: 'תִּפְאֶרֶת',
    transliteration: 'Tiferet',
    translations: {
      en: 'Beauty',
      fr: 'Beauté',
      es: 'Belleza',
      ar: 'الجمال',
      he: 'תפארת',
      de: 'Schönheit',
      pt: 'Beleza',
      zh: '美丽',
      ja: '美',
    },
    pronunciation: 'tee-FEH-ret',
    category: 'sefirah',
  },
  
  netzach: {
    hebrew: 'נֶצַח',
    transliteration: 'Netzach',
    translations: {
      en: 'Victory',
      fr: 'Victoire',
      es: 'Victoria',
      ar: 'النصر',
      he: 'נצח',
      de: 'Sieg',
      pt: 'Vitória',
      zh: '胜利',
      ja: '勝利',
    },
    pronunciation: 'NEH-tsakh',
    category: 'sefirah',
  },
  
  hod: {
    hebrew: 'הוֹד',
    transliteration: 'Hod',
    translations: {
      en: 'Glory',
      fr: 'Gloire',
      es: 'Gloria',
      ar: 'المجد',
      he: 'הוד',
      de: 'Herrlichkeit',
      pt: 'Glória',
      zh: '荣耀',
      ja: '栄光',
    },
    pronunciation: 'HOHD',
    category: 'sefirah',
  },
  
  yesod: {
    hebrew: 'יְסוֹד',
    transliteration: 'Yesod',
    translations: {
      en: 'Foundation',
      fr: 'Fondation',
      es: 'Fundamento',
      ar: 'الأساس',
      he: 'יסוד',
      de: 'Fundament',
      pt: 'Fundação',
      zh: '基础',
      ja: '基盤',
    },
    pronunciation: 'yeh-SOHD',
    category: 'sefirah',
  },
  
  malkuth: {
    hebrew: 'מַלְכוּת',
    transliteration: 'Malkuth',
    translations: {
      en: 'Kingdom',
      fr: 'Royaume',
      es: 'Reino',
      ar: 'الملكوت',
      he: 'מלכות',
      de: 'Königreich',
      pt: 'Reino',
      zh: '王国',
      ja: '王国',
    },
    pronunciation: 'mal-KHOOT',
    category: 'sefirah',
  },
  
  daat: {
    hebrew: 'דַּעַת',
    transliteration: "Da'at",
    translations: {
      en: 'Knowledge',
      fr: 'Connaissance',
      es: 'Conocimiento',
      ar: 'المعرفة',
      he: 'דעת',
      de: 'Wissen',
      pt: 'Conhecimento',
      zh: '知识',
      ja: '知識',
    },
    pronunciation: 'DAH-aht',
    category: 'sefirah',
  },
  
  // ============ KABBALISTIC CONCEPTS ============
  sefirot: {
    hebrew: 'סְפִירוֹת',
    transliteration: 'Sefirot',
    translations: {
      en: 'Emanations',
      fr: 'Émanations',
      es: 'Emanaciones',
      ar: 'التجليات',
      he: 'ספירות',
      de: 'Emanationen',
      pt: 'Emanações',
      zh: '流溢',
      ja: '流出',
    },
    category: 'concept',
  },
  
  etzChayim: {
    hebrew: 'עֵץ חַיִּים',
    transliteration: 'Etz Chayim',
    translations: {
      en: 'Tree of Life',
      fr: 'Arbre de Vie',
      es: 'Árbol de la Vida',
      ar: 'شجرة الحياة',
      he: 'עץ החיים',
      de: 'Baum des Lebens',
      pt: 'Árvore da Vida',
      zh: '生命之树',
      ja: '生命の木',
    },
    category: 'concept',
  },
  
  qliphoth: {
    hebrew: 'קְלִיפּוֹת',
    transliteration: 'Qliphoth',
    translations: {
      en: 'Shells (Shadow)',
      fr: 'Écorces (Ombre)',
      es: 'Cáscaras (Sombra)',
      ar: 'القشور (الظل)',
      he: 'קליפות',
      de: 'Schalen (Schatten)',
      pt: 'Cascas (Sombra)',
      zh: '外壳（阴影）',
      ja: '殻（影）',
    },
    category: 'concept',
  },
  
  tikkunOlam: {
    hebrew: 'תִּקּוּן עוֹלָם',
    transliteration: 'Tikkun Olam',
    translations: {
      en: 'World Repair',
      fr: 'Réparation du Monde',
      es: 'Reparación del Mundo',
      ar: 'إصلاح العالم',
      he: 'תיקון עולם',
      de: 'Weltreparatur',
      pt: 'Reparação do Mundo',
      zh: '修复世界',
      ja: '世界の修復',
    },
    category: 'concept',
  },
  
  yechidah: {
    hebrew: 'יְחִידָה',
    transliteration: 'Yechidah',
    translations: {
      en: 'Unity (Highest Soul)',
      fr: 'Unité (Âme Suprême)',
      es: 'Unidad (Alma Suprema)',
      ar: 'الوحدة',
      he: 'יחידה',
      de: 'Einheit (Höchste Seele)',
      pt: 'Unidade (Alma Suprema)',
      zh: '统一',
      ja: '単一',
    },
    category: 'concept',
  },
  
  partzufim: {
    hebrew: 'פַּרְצוּפִים',
    transliteration: 'Partzufim',
    translations: {
      en: 'Divine Faces',
      fr: 'Visages Divins',
      es: 'Rostros Divinos',
      ar: 'الوجوه الإلهية',
      he: 'פרצופים',
      de: 'Göttliche Gesichter',
      pt: 'Faces Divinas',
      zh: '神圣面孔',
      ja: '神聖な顔',
    },
    category: 'concept',
  },
  
  olamot: {
    hebrew: 'עוֹלָמוֹת',
    transliteration: 'Olamot',
    translations: {
      en: 'Worlds',
      fr: 'Mondes',
      es: 'Mundos',
      ar: 'العوالم',
      he: 'עולמות',
      de: 'Welten',
      pt: 'Mundos',
      zh: '世界',
      ja: '世界',
    },
    category: 'concept',
  },
  
  // ============ FIVE WORLDS ============
  adamKadmon: {
    hebrew: 'אָדָם קַדְמוֹן',
    transliteration: 'Adam Kadmon',
    translations: {
      en: 'Primordial Man',
      fr: 'Homme Primordial',
      es: 'Hombre Primordial',
      ar: 'الإنسان الأول',
      he: 'אדם קדמון',
      de: 'Urmensch',
      pt: 'Homem Primordial',
      zh: '原始人',
      ja: '原初の人間',
    },
    category: 'concept',
  },
  
  atziluth: {
    hebrew: 'אֲצִילוּת',
    transliteration: 'Atziluth',
    translations: {
      en: 'Emanation',
      fr: 'Émanation',
      es: 'Emanación',
      ar: 'التجلي',
      he: 'אצילות',
      de: 'Emanation',
      pt: 'Emanação',
      zh: '发射',
      ja: '発散',
    },
    category: 'concept',
  },
  
  beriah: {
    hebrew: 'בְּרִיאָה',
    transliteration: 'Beriah',
    translations: {
      en: 'Creation',
      fr: 'Création',
      es: 'Creación',
      ar: 'الخلق',
      he: 'בריאה',
      de: 'Schöpfung',
      pt: 'Criação',
      zh: '创造',
      ja: '創造',
    },
    category: 'concept',
  },
  
  yetzirah: {
    hebrew: 'יְצִירָה',
    transliteration: 'Yetzirah',
    translations: {
      en: 'Formation',
      fr: 'Formation',
      es: 'Formación',
      ar: 'التشكيل',
      he: 'יצירה',
      de: 'Formation',
      pt: 'Formação',
      zh: '形成',
      ja: '形成',
    },
    category: 'concept',
  },
  
  assiah: {
    hebrew: 'עֲשִׂיָּה',
    transliteration: 'Assiah',
    translations: {
      en: 'Action',
      fr: 'Action',
      es: 'Acción',
      ar: 'العمل',
      he: 'עשייה',
      de: 'Aktion',
      pt: 'Ação',
      zh: '行动',
      ja: '行動',
    },
    category: 'concept',
  },
  
  // ============ PROTOCOLS ============
  emet: {
    hebrew: 'אֱמֶת',
    transliteration: 'Emet',
    translations: {
      en: 'Truth (Life)',
      fr: 'Vérité (Vie)',
      es: 'Verdad (Vida)',
      ar: 'الحقيقة',
      he: 'אמת',
      de: 'Wahrheit (Leben)',
      pt: 'Verdade (Vida)',
      zh: '真理',
      ja: '真実',
    },
    category: 'protocol',
  },
  
  met: {
    hebrew: 'מֵת',
    transliteration: 'Met',
    translations: {
      en: 'Death (Deactivation)',
      fr: 'Mort (Désactivation)',
      es: 'Muerte (Desactivación)',
      ar: 'الموت',
      he: 'מת',
      de: 'Tod (Deaktivierung)',
      pt: 'Morte (Desativação)',
      zh: '死亡',
      ja: '死',
    },
    category: 'protocol',
  },
  
  golem: {
    hebrew: 'גּוֹלֶם',
    transliteration: 'Golem',
    translations: {
      en: 'Animated Being',
      fr: 'Être Animé',
      es: 'Ser Animado',
      ar: 'الكائن المتحرك',
      he: 'גולם',
      de: 'Belebtes Wesen',
      pt: 'Ser Animado',
      zh: '魔像',
      ja: 'ゴーレム',
    },
    category: 'protocol',
  },
  
  // ============ WISDOM LEVELS ============
  madregot: {
    hebrew: 'מַדְרֵגוֹת',
    transliteration: 'Madregot',
    translations: {
      en: 'Levels/Steps',
      fr: 'Niveaux/Étapes',
      es: 'Niveles/Pasos',
      ar: 'المستويات',
      he: 'מדרגות',
      de: 'Stufen/Ebenen',
      pt: 'Níveis/Passos',
      zh: '等级',
      ja: 'レベル',
    },
    category: 'level',
  },
  
  chokhmah: {
    hebrew: 'חָכְמָה',
    transliteration: 'Chokhmah',
    translations: {
      en: 'Wisdom',
      fr: 'Sagesse',
      es: 'Sabiduría',
      ar: 'الحكمة',
      he: 'חכמה',
      de: 'Weisheit',
      pt: 'Sabedoria',
      zh: '智慧',
      ja: '知恵',
    },
    category: 'concept',
  },
  
  // ============ SOUL LEVELS ============
  nefesh: {
    hebrew: 'נֶפֶשׁ',
    transliteration: 'Nefesh',
    translations: {
      en: 'Vital Soul',
      fr: 'Âme Vitale',
      es: 'Alma Vital',
      ar: 'النفس',
      he: 'נפש',
      de: 'Lebensseele',
      pt: 'Alma Vital',
      zh: '活力灵魂',
      ja: '生命の魂',
    },
    category: 'concept',
  },
  
  ruach: {
    hebrew: 'רוּחַ',
    transliteration: 'Ruach',
    translations: {
      en: 'Spirit',
      fr: 'Esprit',
      es: 'Espíritu',
      ar: 'الروح',
      he: 'רוח',
      de: 'Geist',
      pt: 'Espírito',
      zh: '精神',
      ja: '霊',
    },
    category: 'concept',
  },
  
  neshamah: {
    hebrew: 'נְשָׁמָה',
    transliteration: 'Neshamah',
    translations: {
      en: 'Higher Soul',
      fr: 'Âme Supérieure',
      es: 'Alma Superior',
      ar: 'النشمة',
      he: 'נשמה',
      de: 'Höhere Seele',
      pt: 'Alma Superior',
      zh: '高等灵魂',
      ja: '高次の魂',
    },
    category: 'concept',
  },
  
  chayah: {
    hebrew: 'חַיָּה',
    transliteration: 'Chayah',
    translations: {
      en: 'Living Essence',
      fr: 'Essence Vivante',
      es: 'Esencia Viviente',
      ar: 'الجوهر الحي',
      he: 'חיה',
      de: 'Lebende Essenz',
      pt: 'Essência Viva',
      zh: '活的本质',
      ja: '生きた本質',
    },
    category: 'concept',
  },
};

/**
 * Get a Hebrew term with its translation for the current locale
 */
export function getHebrewTerm(
  termKey: keyof typeof HEBREW_TERMS,
  locale: Locale = 'en'
): string {
  const term = HEBREW_TERMS[termKey];
  if (!term) return termKey;
  
  const translation = term.translations[locale] || term.translations.en;
  return `${term.transliteration} (${term.hebrew}) - ${translation}`;
}

/**
 * Get just the translation without Hebrew
 */
export function getTermTranslation(
  termKey: keyof typeof HEBREW_TERMS,
  locale: Locale = 'en'
): string {
  const term = HEBREW_TERMS[termKey];
  if (!term) return termKey;
  
  return term.translations[locale] || term.translations.en;
}

/**
 * Get all terms by category
 */
export function getTermsByCategory(
  category: HebrewTermDefinition['category']
): Record<string, HebrewTermDefinition> {
  return Object.fromEntries(
    Object.entries(HEBREW_TERMS).filter(([_, def]) => def.category === category)
  );
}

export default HEBREW_TERMS;
