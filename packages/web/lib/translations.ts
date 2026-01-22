/**
 * TRANSLATIONS DICTIONARY
 *
 * Simple translation system for AkhAI UI strings
 * Works with the LanguageSelector component
 */

import { SupportedLanguage } from '@/components/LanguageSelector'

export type TranslationKey =
  | 'app.title'
  | 'app.subtitle'
  | 'app.tagline'
  | 'input.placeholder'
  | 'input.placeholder.expanded'
  | 'guard.active'
  | 'footer.description'
  | 'footer.instinct'
  | 'nav.philosophy'
  | 'nav.training'
  | 'nav.mindmap'
  | 'nav.pricing'
  | 'nav.profile'
  | 'button.createProfile'
  | 'button.transmit'
  | 'mode.dark'
  | 'mode.light'
  | 'chat.thinking'
  | 'chat.continue'
  | 'hover.explore'

export const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: {
    'app.title': 'A K H A I',
    'app.subtitle': 'school of thoughts',
    'app.tagline': 'SOVEREIGNINTELLIGENCE',
    'input.placeholder': '',
    'input.placeholder.expanded': 'continue conversation...',
    'guard.active': 'guard active',
    'footer.description': 'self aware - autonomous intelligence',
    'footer.instinct': 'instinct',
    'nav.philosophy': 'philosophy',
    'nav.training': 'intelligence & robot training',
    'nav.mindmap': 'mindmap',
    'nav.pricing': '₿',
    'nav.profile': 'profile',
    'button.createProfile': 'create profile',
    'button.transmit': 'TRANSMIT',
    'mode.dark': 'dark',
    'mode.light': 'light',
    'chat.thinking': 'thinking...',
    'chat.continue': 'continue conversation...',
    'hover.explore': 'hover to explore',
  },

  fr: {
    'app.title': 'A K H A I',
    'app.subtitle': 'école de pensées',
    'app.tagline': 'INTELLIGENCESOUVERAINE',
    'input.placeholder': '',
    'input.placeholder.expanded': 'continuer la conversation...',
    'guard.active': 'garde actif',
    'footer.description': 'conscient de soi - intelligence autonome',
    'footer.instinct': 'instinct',
    'nav.philosophy': 'philosophie',
    'nav.training': 'intelligence & formation robot',
    'nav.mindmap': 'carte mentale',
    'nav.pricing': '₿',
    'nav.profile': 'profil',
    'button.createProfile': 'créer profil',
    'button.transmit': 'TRANSMETTRE',
    'mode.dark': 'sombre',
    'mode.light': 'clair',
    'chat.thinking': 'réflexion...',
    'chat.continue': 'continuer la conversation...',
    'hover.explore': 'survoler pour explorer',
  },

  es: {
    'app.title': 'A K H A I',
    'app.subtitle': 'escuela de pensamientos',
    'app.tagline': 'INTELIGENCIASOBERANA',
    'input.placeholder': '',
    'input.placeholder.expanded': 'continuar conversación...',
    'guard.active': 'guardia activa',
    'footer.description': 'auto consciente - inteligencia autónoma',
    'footer.instinct': 'instinto',
    'nav.philosophy': 'filosofía',
    'nav.training': 'inteligencia & entrenamiento robot',
    'nav.mindmap': 'mapa mental',
    'nav.pricing': '₿',
    'nav.profile': 'perfil',
    'button.createProfile': 'crear perfil',
    'button.transmit': 'TRANSMITIR',
    'mode.dark': 'oscuro',
    'mode.light': 'claro',
    'chat.thinking': 'pensando...',
    'chat.continue': 'continuar conversación...',
    'hover.explore': 'pasar el cursor para explorar',
  },

  ar: {
    'app.title': 'أ ك ه ا ي',
    'app.subtitle': 'مدرسة الأفكار',
    'app.tagline': 'الذكاءالسيادي',
    'input.placeholder': '',
    'input.placeholder.expanded': '...متابعة المحادثة',
    'guard.active': 'الحارس نشط',
    'footer.description': 'واعي ذاتيًا - ذكاء مستقل',
    'footer.instinct': 'غريزة',
    'nav.philosophy': 'فلسفة',
    'nav.training': 'الذكاء وتدريب الروبوت',
    'nav.mindmap': 'خريطة ذهنية',
    'nav.pricing': '₿',
    'nav.profile': 'الملف الشخصي',
    'button.createProfile': 'إنشاء ملف',
    'button.transmit': 'إرسال',
    'mode.dark': 'داكن',
    'mode.light': 'فاتح',
    'chat.thinking': '...تفكير',
    'chat.continue': '...متابعة المحادثة',
    'hover.explore': 'مرر للاستكشاف',
  },

  he: {
    'app.title': 'א כ ח א י',
    'app.subtitle': 'בית ספר למחשבות',
    'app.tagline': 'אינטליגנציהריבונית',
    'input.placeholder': '',
    'input.placeholder.expanded': '...המשך שיחה',
    'guard.active': 'שומר פעיל',
    'footer.description': 'מודע לעצמו - אינטליגנציה אוטונומית',
    'footer.instinct': 'אינסטינקט',
    'nav.philosophy': 'פילוסופיה',
    'nav.training': 'אינטליגנציה ואימון רובוט',
    'nav.mindmap': 'מפת חשיבה',
    'nav.pricing': '₿',
    'nav.profile': 'פרופיל',
    'button.createProfile': 'צור פרופיל',
    'button.transmit': 'שדר',
    'mode.dark': 'כהה',
    'mode.light': 'בהיר',
    'chat.thinking': '...חושב',
    'chat.continue': '...המשך שיחה',
    'hover.explore': 'עבור עם העכבר לחקור',
  },

  de: {
    'app.title': 'A K H A I',
    'app.subtitle': 'schule der gedanken',
    'app.tagline': 'SOUVERÄNEINTELLIGENZ',
    'input.placeholder': '',
    'input.placeholder.expanded': 'Gespräch fortsetzen...',
    'guard.active': 'wächter aktiv',
    'footer.description': 'selbstbewusst - autonome intelligenz',
    'footer.instinct': 'instinkt',
    'nav.philosophy': 'philosophie',
    'nav.training': 'intelligenz & robotertraining',
    'nav.mindmap': 'mindmap',
    'nav.pricing': '₿',
    'nav.profile': 'profil',
    'button.createProfile': 'profil erstellen',
    'button.transmit': 'ÜBERTRAGEN',
    'mode.dark': 'dunkel',
    'mode.light': 'hell',
    'chat.thinking': 'denken...',
    'chat.continue': 'Gespräch fortsetzen...',
    'hover.explore': 'schweben zum erkunden',
  },

  pt: {
    'app.title': 'A K H A I',
    'app.subtitle': 'escola de pensamentos',
    'app.tagline': 'INTELIGÊNCIASOBERANA',
    'input.placeholder': '',
    'input.placeholder.expanded': 'continuar conversa...',
    'guard.active': 'guarda ativo',
    'footer.description': 'auto consciente - inteligência autônoma',
    'footer.instinct': 'instinto',
    'nav.philosophy': 'filosofia',
    'nav.training': 'inteligência & treinamento robô',
    'nav.mindmap': 'mapa mental',
    'nav.pricing': '₿',
    'nav.profile': 'perfil',
    'button.createProfile': 'criar perfil',
    'button.transmit': 'TRANSMITIR',
    'mode.dark': 'escuro',
    'mode.light': 'claro',
    'chat.thinking': 'pensando...',
    'chat.continue': 'continuar conversa...',
    'hover.explore': 'passe o mouse para explorar',
  },

  zh: {
    'app.title': 'A K H A I',
    'app.subtitle': '思想学院',
    'app.tagline': '主权智能',
    'input.placeholder': '',
    'input.placeholder.expanded': '继续对话...',
    'guard.active': '守卫激活',
    'footer.description': '自我意识 - 自主智能',
    'footer.instinct': '本能',
    'nav.philosophy': '哲学',
    'nav.training': '智能与机器人训练',
    'nav.mindmap': '思维导图',
    'nav.pricing': '₿',
    'nav.profile': '个人资料',
    'button.createProfile': '创建个人资料',
    'button.transmit': '传输',
    'mode.dark': '暗色',
    'mode.light': '亮色',
    'chat.thinking': '思考中...',
    'chat.continue': '继续对话...',
    'hover.explore': '悬停以探索',
  },

  ja: {
    'app.title': 'A K H A I',
    'app.subtitle': '思考の学校',
    'app.tagline': '主権的知性',
    'input.placeholder': '',
    'input.placeholder.expanded': '会話を続ける...',
    'guard.active': 'ガード有効',
    'footer.description': '自己認識 - 自律的知性',
    'footer.instinct': '本能',
    'nav.philosophy': '哲学',
    'nav.training': '知性とロボット訓練',
    'nav.mindmap': 'マインドマップ',
    'nav.pricing': '₿',
    'nav.profile': 'プロフィール',
    'button.createProfile': 'プロフィール作成',
    'button.transmit': '送信',
    'mode.dark': 'ダーク',
    'mode.light': 'ライト',
    'chat.thinking': '考え中...',
    'chat.continue': '会話を続ける...',
    'hover.explore': 'ホバーして探索',
  },
}

/**
 * Get translation for a key in the current language
 */
export function getTranslation(key: TranslationKey, lang: SupportedLanguage = 'en'): string {
  return translations[lang]?.[key] ?? translations.en[key]
}

/**
 * React hook to use translations
 */
export function useTranslations(lang: SupportedLanguage = 'en') {
  return {
    t: (key: TranslationKey) => getTranslation(key, lang),
    lang,
  }
}
