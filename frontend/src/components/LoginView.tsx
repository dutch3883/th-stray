import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getButtonGradient, getBgGradient } from '../utils/themeUtils';
import LanguageSwitcher from './LanguageSwitcher';

export const LoginView: React.FC = () => {
  const { signIn } = useAuth();
  const { isRescueMode } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 -mt-16 relative">
      {/* Soft background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getBgGradient(isRescueMode)} opacity-60 z-[-1]`}></div>
      
      {/* Content wrapper */}
      <div className="flex flex-col items-center gap-4">
        {/* Language Switcher */}
        <LanguageSwitcher />
        
        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100 transform transition-all duration-300 hover:shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {t('auth.login.title')}
          </h1>
          
          {/* Animated illustration */}
          <div className="w-48 h-48 mx-auto mb-8 transform transition-all duration-500 hover:scale-105">
            <img 
              src="/images/login_image.png" 
              alt={t('auth.login.title')}
              className="w-full h-full object-contain"
            />
          </div>

          <p className="text-base text-gray-600 mb-6 text-center">
            {t('auth.login.description')}
          </p>

          {/* Enhanced button */}
          <button 
            onClick={signIn} 
            className={`w-full bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1 flex items-center justify-center`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#fff" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            {t('auth.login.google')}
          </button>
        </div>
        
        {/* Subtle footer note */}
        <p className="text-xs text-gray-500 text-center">
          {t('welcome.rescue')}
        </p>
      </div>
    </div>
  );
}; 