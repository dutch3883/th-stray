import React from 'react';
import { getThemeBgLight, getThemeColor } from '../../utils/themeUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface MapCardProps {
  isRescueMode: boolean;
  onClick: () => void;
}

export const MapCard: React.FC<MapCardProps> = ({ isRescueMode, onClick }) => {
  const { getDualLanguageText, t } = useLanguage();
  
  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className={`w-12 h-12 ${getThemeBgLight(isRescueMode)} rounded-full flex items-center justify-center mr-4`}>
        <svg className={`w-6 h-6 ${getThemeColor(true, isRescueMode)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
      <div>
        <h3 className="font-medium text-gray-800">{getDualLanguageText('card.map.title')}</h3>
        <p className="text-sm text-gray-600">{t('card.map.description')}</p>
      </div>
      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}; 