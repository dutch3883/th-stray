import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translationService } from '../services/translationService';
import { useAuth } from '../hooks/useAuth';
import { logDebug } from '../services/LoggingService';

interface LanguageContextType {
  language: Language;
  savedLanguage: Language | null;
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
  logDebug("language value in context start", language);
  logDebug("savedLanguage value in context start", savedLanguage);

  // Load saved language from localStorage on mount or when user changes
  useEffect(() => {
    if(user !== null && user !== undefined) {
    const storageKey = user ? `${LANGUAGE_STORAGE_KEY}_${user.uid}` : LANGUAGE_STORAGE_KEY;
    const savedLang = localStorage.getItem(storageKey) as Language | null;
    logDebug("savedLang value in local storage", savedLang);
    
    // Always set savedLanguage to the result (null or actual value)
    // If no saved language exists, use default
    const finalLanguage = savedLang || DEFAULT_LANGUAGE;
    logDebug(`finalLanguage value in context ${finalLanguage} user ${user?.uid}`);
    setSavedLanguage(finalLanguage);
    setLanguageState(finalLanguage);
  }
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
    logDebug("manual set language", lang);
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

  logDebug("language value in context end", language);
  return (
    <LanguageContext.Provider value={{ language, savedLanguage, setLanguage, t, getDualLanguageText }}>
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