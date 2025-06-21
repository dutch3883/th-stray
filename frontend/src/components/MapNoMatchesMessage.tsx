import React from 'react';
import { ReportStatus, CatType } from '../types/report';
import { useLanguage } from '../contexts/LanguageContext';

interface MapNoMatchesMessageProps {
  typeFilter: CatType | 'all';
  statusFilter: ReportStatus | 'all';
}

export const MapNoMatchesMessage: React.FC<MapNoMatchesMessageProps> = ({
  typeFilter,
  statusFilter,
}) => {
  const { t } = useLanguage();

  const getMessage = () => {
    if (typeFilter !== 'all' && statusFilter !== 'all') {
      return t('map.no_matches.both_filters');
    } else if (typeFilter !== 'all') {
      return t('map.no_matches.type_filter');
    } else if (statusFilter !== 'all') {
      return t('map.no_matches.status_filter');
    } else {
      return t('map.no_matches.no_reports');
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg text-center">
      <div className="text-gray-500 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-lg font-medium text-gray-700 mb-1">{t('map.no_matches')}</div>
      <div className="text-sm text-gray-500">{getMessage()}</div>
    </div>
  );
}; 