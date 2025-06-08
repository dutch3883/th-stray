import React from 'react';
import { getThemeGradient, getThemeColor } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface WelcomeCardProps {
  isRescueMode: boolean;
  mode: string;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ isRescueMode, mode }) => {
  const { getDualLanguageText, t } = useLanguage();
  
  return (
    <div className={`bg-gradient-to-r ${getThemeGradient(isRescueMode)} text-white p-6 rounded-xl shadow-md`}>
      <h1 className="text-2xl font-bold mb-2">{getDualLanguageText('welcome.title')}</h1>
      <p className={`${getThemeColor(true, isRescueMode, 100)}`}>
        {mode === 'rescue' ? t('welcome.rescue') : t('welcome.report')}
      </p>
    </div>
  );
}; 