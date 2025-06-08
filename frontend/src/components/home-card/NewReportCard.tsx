import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface NewReportCardProps {
  isRescueMode: boolean;
  onClick: () => void;
}

export const NewReportCard: React.FC<NewReportCardProps> = ({ isRescueMode, onClick }) => {
  const { getDualLanguageText, t } = useLanguage();
  
  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
        <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{getDualLanguageText('card.new_report.title')}</h3>
        <p className="text-sm text-gray-600">{t('card.new_report.description')}</p>
      </div>
      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}; 