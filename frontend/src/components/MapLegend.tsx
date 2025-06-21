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
          <div 
            className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.STRAY ? 'bg-gray-100' : ''}`}
            onClick={() => onLegendClick(CatType.STRAY)}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.STRAY) }}></div>
            <span className="text-sm text-gray-600">{t('common.cat.type.stray')}</span>
          </div>
          <div 
            className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.INJURED ? 'bg-gray-100' : ''}`}
            onClick={() => onLegendClick(CatType.INJURED)}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.INJURED) }}></div>
            <span className="text-sm text-gray-600">{t('common.cat.type.injured')}</span>
          </div>
          <div 
            className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.SICK ? 'bg-gray-100' : ''}`}
            onClick={() => onLegendClick(CatType.SICK)}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.SICK) }}></div>
            <span className="text-sm text-gray-600">{t('common.cat.type.sick')}</span>
          </div>
          <div 
            className={`flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 ${typeFilter === CatType.KITTEN ? 'bg-gray-100' : ''}`}
            onClick={() => onLegendClick(CatType.KITTEN)}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: getMarkerColor(CatType.KITTEN) }}></div>
            <span className="text-sm text-gray-600">{t('common.cat.type.kitten')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 