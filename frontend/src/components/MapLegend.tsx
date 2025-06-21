import React from 'react';
import { CatType } from '../types/report';
import { useLanguage } from '../contexts/LanguageContext';

interface MapLegendProps {
  isCollapsed: boolean;
  typeFilter: CatType | 'all';
  onToggleCollapse: () => void;
  onLegendClick: (type: CatType) => void;
  getMarkerColor: (type: CatType) => string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  isCollapsed,
  typeFilter,
  onToggleCollapse,
  onLegendClick,
  getMarkerColor,
}) => {
  const { t } = useLanguage();

  // Helper function to get translation key for cat type
  const getCatTypeTranslation = (type: CatType): string => {
    switch (type) {
      case CatType.STRAY:
        return t('common.cat.type.stray');
      case CatType.INJURED:
        return t('common.cat.type.injured');
      case CatType.SICK:
        return t('common.cat.type.sick');
      case CatType.KITTEN:
        return t('common.cat.type.kitten');
      default:
        return '';
    }
  };

  // Get all cat types as an array
  const catTypes = Object.values(CatType);

  return (
    <div className="absolute bottom-[104px] right-4 bg-white rounded-lg shadow-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50"
        onClick={onToggleCollapse}
      >
        <div className="text-sm font-medium text-gray-700">{t('map.legend')}</div>
        <button 
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        >
          <svg 
            className={`w-3.5 h-3.5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'h-0' : 'h-auto'}`}>
        <div className="p-2.5 pt-0 space-y-1.5">
          {catTypes.map((type) => (
            <div 
              key={type}
              className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-green-100 ${typeFilter === type ? 'bg-green-300 border border-green-200' : ''}`}
              onClick={() => onLegendClick(type)}
            >
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getMarkerColor(type) }}></div>
              <span className={`text-sm ${typeFilter === type ? 'text-green-900 font-medium' : 'text-gray-600'}`}>
                {getCatTypeTranslation(type)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 