import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface AllReportsCardProps {
  isRescueMode: boolean;
  onClick: () => void;
}

export const AllReportsCard: React.FC<AllReportsCardProps> = ({ isRescueMode, onClick }) => {
  const { getDualLanguageText, t } = useLanguage();
  
  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
        <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{getDualLanguageText('card.all_reports.title')}</h3>
        <p className="text-sm text-gray-600">{t('card.all_reports.description')}</p>
      </div>
      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}; 