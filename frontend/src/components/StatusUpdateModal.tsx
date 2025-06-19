import React, { useState } from 'react';
import { Report, ReportStatus } from '../types/report';
import { api } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onStatusUpdated: () => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  report,
  onStatusUpdated,
}) => {
  const { t } = useLanguage();
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');

  const handleStatusChange = async () => {
    if (!report) return;

    try {
      switch (newStatus) {
        case ReportStatus.COMPLETED:
          await api.completeReport({ reportId: report.id, remark });
          break;
        case ReportStatus.ON_HOLD:
          await api.putReportOnHold({ reportId: report.id, remark });
          break;
        case ReportStatus.PENDING:
          await api.resumeReport({ reportId: report.id, remark });
          break;
        case ReportStatus.CANCELLED:
          await api.cancelReport({ reportId: report.id, remark });
          break;
      }
      onStatusUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (!isOpen || !report) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg w-96"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{t('modal.status_update.title')} #{report.id}</h2>
        <select
          className="w-full p-2 border rounded mb-4"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
        >
          <option value={ReportStatus.PENDING}>{t('report.status.pending')}</option>
          <option value={ReportStatus.ON_HOLD}>{t('report.status.on_hold')}</option>
          <option value={ReportStatus.COMPLETED}>{t('report.status.completed')}</option>
          <option value={ReportStatus.CANCELLED}>{t('report.status.cancelled')}</option>
        </select>
        <textarea
          className="w-full p-2 border rounded mb-4"
          placeholder={t('modal.status_update.remark_placeholder')}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => {
              onClose();
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleStatusChange}
          >
            {t('modal.status_update.update')}
          </button>
        </div>
      </div>
    </div>
  );
}; 