import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MapLocationButtonProps {
  isLocationLoading: boolean;
  onGetCurrentLocation: () => void;
}

export const MapLocationButton: React.FC<MapLocationButtonProps> = ({
  isLocationLoading,
  onGetCurrentLocation,
}) => {
  const { t } = useLanguage();

  return (
    <div className="absolute bottom-[104px] left-4">
      <button
        onClick={onGetCurrentLocation}
        disabled={isLocationLoading}
        className="bg-white px-3 py-2.5 rounded-lg shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        title={t('map.myLocation')}
      >
        {isLocationLoading ? (
          <svg className="w-3.5 h-3.5 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {isLocationLoading ? t('map.locating') : t('map.myLocation')}
        </span>
      </button>
    </div>
  );
}; 