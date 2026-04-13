import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    return saved === 'es' || saved === 'en' ? saved : 'es';
  });

  const setLang = (value: Lang) => {
    setLangState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', value);
    }
  };

  const t = (key: string): string => {
    const value = getNestedValue(translations[lang], key);
    if (typeof value === 'string') return value;
    // Fallback to English if key missing
    const fallback = getNestedValue(translations.en, key);
    return typeof fallback === 'string' ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return ctx;
}
