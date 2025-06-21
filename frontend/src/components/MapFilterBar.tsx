import React from 'react';
import { ReportStatus, CatType } from '../types/report';
import { useLanguage } from '../contexts/LanguageContext';

interface MapFilterBarProps {
  typeFilter: CatType | 'all';
  statusFilter: ReportStatus | 'all';
  onTypeFilterChange: (type: CatType | 'all') => void;
  onStatusFilterChange: (status: ReportStatus | 'all') => void;
}

export const MapFilterBar: React.FC<MapFilterBarProps> = ({
  typeFilter,
  statusFilter,
  onTypeFilterChange,
  onStatusFilterChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('report.filter.type')}
          </label>
          <select
            className="w-full p-2 border rounded"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as CatType | 'all')}
          >
            <option value="all">{t('report.filter.all_type')}</option>
            <option value={CatType.STRAY}>{t('common.cat.type.stray')}</option>
            <option value={CatType.INJURED}>{t('common.cat.type.injured')}</option>
            <option value={CatType.SICK}>{t('common.cat.type.sick')}</option>
            <option value={CatType.KITTEN}>{t('common.cat.type.kitten')}</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('report.filter.status')}
          </label>
          <select
            className="w-full p-2 border rounded"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ReportStatus | 'all')}
          >
            <option value="all">{t('report.filter.all_status')}</option>
            <option value={ReportStatus.PENDING}>{t('report.status.pending')}</option>
            <option value={ReportStatus.COMPLETED}>{t('report.status.completed')}</option>
            <option value={ReportStatus.ON_HOLD}>{t('report.status.on_hold')}</option>
            <option value={ReportStatus.CANCELLED}>{t('report.status.cancelled')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}; 