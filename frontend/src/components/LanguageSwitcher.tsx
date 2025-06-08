import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === 'th' ? 'en' : 'th';
    setLanguage(newLang);
  };

  return (
    <div className="flex items-center">
      <div className="bg-gray-200 rounded-lg p-1 flex">
        <button
          onClick={() => setLanguage('th')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            language === 'th'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ภาษาไทย
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher; 