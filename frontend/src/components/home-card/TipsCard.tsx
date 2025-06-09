import React from 'react';
import { getThemeBgLight, getThemeColor, getTheme } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface TipsCardProps {
  isRescueMode: boolean;
}

export const TipsCard: React.FC<TipsCardProps> = ({ isRescueMode }) => {
  const { t, getDualLanguageText } = useLanguage();

  return (
    <div className={`${getThemeBgLight(isRescueMode)} border-${getTheme(isRescueMode).primary} p-5 rounded-xl border`}>
      <h3 className={`font-medium ${getThemeColor(true, isRescueMode)} flex items-center`}>
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        {getDualLanguageText('card.tips.title')}
      </h3>
      <p className={`text-sm ${getThemeColor(true, isRescueMode)} mt-2`}>
        {t('card.tips.content')}
      </p>
    </div>
  );
}; 