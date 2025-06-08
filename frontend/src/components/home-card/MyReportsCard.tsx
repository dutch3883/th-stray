import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface MyReportsCardProps {
  isRescueMode: boolean;
  onClick: () => void;
}

export const MyReportsCard: React.FC<MyReportsCardProps> = ({ isRescueMode, onClick }) => {
  const { getDualLanguageText, t } = useLanguage();
  
  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
        <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{getDualLanguageText('card.my_reports.title')}</h3>
        <p className="text-sm text-gray-600">{t('card.my_reports.description')}</p>
      </div>
      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}; 