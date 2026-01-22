/**
 * LANGUAGE SELECTOR COMPONENT
 * 
 * Simple dropdown to switch website language.
 * Stores preference in localStorage and cookie.
 * 
 * Supported languages:
 * - English (en) - Primary
 * - French (fr)
 * - Spanish (es)
 * - Arabic (ar) - RTL
 * - Hebrew (he) - RTL
 * - German (de)
 * - Portuguese (pt)
 * - Chinese (zh)
 * - Japanese (ja)
 * 
 * @module LanguageSelector
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GlobeAltIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export type SupportedLanguage = 
  | 'en' | 'fr' | 'es' | 'ar' | 'he' 
  | 'de' | 'pt' | 'zh' | 'ja';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: 'FR', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: 'ES', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: 'AR', rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: 'HE', rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: 'PT', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: 'ZH', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'JA', rtl: false },
];

const STORAGE_KEY = 'akhai-language';

interface LanguageSelectorProps {
  /** Callback when language changes */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** Show native name instead of English name */
  showNativeName?: boolean;
  /** Show flag emoji */
  showFlag?: boolean;
  /** Compact mode (just flag + dropdown) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get current language from storage or browser
 */
export function getCurrentLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  
  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGES.some(l => l.code === stored)) {
    return stored as SupportedLanguage;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (LANGUAGES.some(l => l.code === browserLang)) {
    return browserLang as SupportedLanguage;
  }
  
  return 'en';
}

/**
 * Set language and apply to document
 */
export function setLanguage(lang: SupportedLanguage): void {
  if (typeof window === 'undefined') return;

  const langOption = LANGUAGES.find(l => l.code === lang);
  if (!langOption) return;

  // Store preference
  localStorage.setItem(STORAGE_KEY, lang);

  // Set cookie for SSR
  document.cookie = `akhai-lang=${lang};path=/;max-age=31536000`;

  // Apply to document
  document.documentElement.lang = lang;
  document.documentElement.dir = langOption.rtl ? 'rtl' : 'ltr';

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));

  // Force page reload to apply translations
  window.location.reload();
}

/**
 * Check if current language is RTL
 */
export function isRTL(): boolean {
  const lang = getCurrentLanguage();
  return LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
}

/**
 * Language Selector Component
 */
export function LanguageSelector({
  onLanguageChange,
  showNativeName = false,
  showFlag = true,
  compact = false,
  className = '',
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize language on mount
  useEffect(() => {
    const lang = getCurrentLanguage();
    setCurrentLang(lang);

    // Apply language settings to document WITHOUT reloading
    const langOption = LANGUAGES.find(l => l.code === lang);
    if (langOption && typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = langOption.rtl ? 'rtl' : 'ltr';
    }
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    setLanguage(lang);
    setIsOpen(false);
    onLanguageChange?.(lang);
  };
  
  const currentOption = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  
  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1
          text-relic-silver hover:text-relic-slate transition-colors
          ${compact ? 'px-0' : 'px-0'}
        `}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        {showFlag && <span className="text-[8px] font-mono">{currentOption.flag}</span>}

        {!compact && (
          <span className="text-[8px]">
            {showNativeName ? currentOption.nativeName : currentOption.name}
          </span>
        )}

        <ChevronDownIcon
          className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute top-full mt-1 right-0 z-50
          min-w-[120px] py-1
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`
                w-full flex items-center gap-2 px-0 py-1
                text-left transition-colors
                ${currentLang === lang.code ? 'text-relic-void' : 'text-relic-silver hover:text-relic-slate'}
              `}
            >
              <span className="text-[8px] font-mono w-5">{lang.flag}</span>
              <div className="flex-1">
                <div className="text-[8px]">{lang.name}</div>
              </div>
              {currentLang === lang.code && (
                <CheckIcon className="w-2.5 h-2.5 text-relic-slate" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact language selector (just globe icon)
 */
export function LanguageSelectorCompact(props: Omit<LanguageSelectorProps, 'compact'>) {
  return <LanguageSelector {...props} compact />;
}

/**
 * Flag-only language switcher (horizontal row)
 */
export function LanguageSelectorFlags({
  onLanguageChange,
  className = '',
}: Pick<LanguageSelectorProps, 'onLanguageChange' | 'className'>) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  
  useEffect(() => {
    setCurrentLang(getCurrentLanguage());
  }, []);
  
  const handleSelect = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    setLanguage(lang);
    onLanguageChange?.(lang);
  };
  
  return (
    <div className={`flex gap-1 ${className}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          className={`
            text-[9px] font-mono p-1.5 rounded transition-all
            hover:bg-gray-700
            ${currentLang === lang.code
              ? 'bg-gray-800 text-white ring-1 ring-gray-600'
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
          title={`${lang.name} (${lang.nativeName})`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook to get current language
 */
export function useLanguage() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  
  useEffect(() => {
    setLang(getCurrentLanguage());
    
    const handleChange = (e: CustomEvent<SupportedLanguage>) => {
      setLang(e.detail);
    };
    
    window.addEventListener('languagechange', handleChange as EventListener);
    return () => window.removeEventListener('languagechange', handleChange as EventListener);
  }, []);
  
  return {
    language: lang,
    isRTL: LANGUAGES.find(l => l.code === lang)?.rtl ?? false,
    setLanguage: (newLang: SupportedLanguage) => {
      setLanguage(newLang);
      setLang(newLang);
    },
  };
}

export default LanguageSelector;
