import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translationService } from '../services/translationService';
import { useAuth } from '../hooks/useAuth';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getDualLanguageText: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DEFAULT_LANGUAGE: Language = 'th';
const LANGUAGE_STORAGE_KEY = 'straycat_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [savedLanguage, setSavedLanguage] = useState<Language | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved language from localStorage on mount or when user changes
  useEffect(() => {
    const storageKey = user ? `${LANGUAGE_STORAGE_KEY}_${user.uid}` : LANGUAGE_STORAGE_KEY;
    const savedLang = localStorage.getItem(storageKey) as Language | null;
    setSavedLanguage(savedLang);
  }, [user]);

  // Update current language when saved language is loaded
  useEffect(() => {
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, [savedLanguage]);

  useEffect(() => {
    const initTranslation = async () => {
      try {
        await translationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize translation service:', error);
      }
    };
    initTranslation();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setSavedLanguage(lang);
    const storageKey = user ? `${LANGUAGE_STORAGE_KEY}_${user.uid}` : LANGUAGE_STORAGE_KEY;
    localStorage.setItem(storageKey, lang);
  };

  const t = (key: string): string => {
    if (!isInitialized) return key;
    return translationService.getTranslation(key, language);
  };

  const getDualLanguageText = (key: string): string => {
    if (!isInitialized) return key;
    const currentText = t(key);
    const otherLang = language === 'en' ? 'th' : 'en';
    const otherText = translationService.getTranslation(key, otherLang);
    return `${currentText} / ${otherText}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getDualLanguageText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 