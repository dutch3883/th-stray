import React, { useState } from 'react';
import { Report, ReportStatus } from '../types/report';
import { api } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { Toast } from './Toast';
import { logDebug, logError } from '../services/LoggingService';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onStatusUpdated: (newStatus?: ReportStatus) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Reset newStatus when report changes
  React.useEffect(() => {
    if (report) {
      const validTransitions = getValidStatusTransitions(report.status);
      if (validTransitions.length > 0) {
        setNewStatus(validTransitions[0]); // Set to first valid transition option
      } else {
        setNewStatus(report.status); // Fallback to current status if no transitions
      }
    }
  }, [report]);

  // Clear toast when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setToast(prev => ({ ...prev, isVisible: false }));
      setIsLoading(false);
    }
  }, [isOpen]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Get valid status transitions based on current status
  const getValidStatusTransitions = (currentStatus: ReportStatus): ReportStatus[] => {
    switch (currentStatus) {
      case ReportStatus.PENDING:
        return [ReportStatus.ON_HOLD, ReportStatus.COMPLETED, ReportStatus.CANCELLED];
      case ReportStatus.ON_HOLD:
        return [ReportStatus.PENDING];
      case ReportStatus.COMPLETED:
      case ReportStatus.CANCELLED:
        return []; // No transitions allowed for completed/cancelled reports
      default:
        return [];
    }
  };

  const handleStatusChange = async () => {
    if (!report) return;

    logDebug('StatusUpdateModal: handleStatusChange called', { reportId: report.id, currentStatus: report.status, newStatus, remark });

    setIsLoading(true);

    try {
      // Determine which API to call based on the transition
      if (report.status === ReportStatus.PENDING && newStatus === ReportStatus.ON_HOLD) {
        logDebug('Calling api.putReportOnHold');
        await api.putReportOnHold({ reportId: report.id, remark });
      } else if (report.status === ReportStatus.PENDING && newStatus === ReportStatus.COMPLETED) {
        logDebug('Calling api.completeReport');
        await api.completeReport({ reportId: report.id, remark });
      } else if (report.status === ReportStatus.PENDING && newStatus === ReportStatus.CANCELLED) {
        logDebug('Calling api.cancelReport');
        await api.cancelReport({ reportId: report.id, remark });
      } else if (report.status === ReportStatus.ON_HOLD && newStatus === ReportStatus.PENDING) {
        logDebug('Calling api.resumeReport');
        await api.resumeReport({ reportId: report.id, remark });
      } else {
        throw new Error(`Invalid status transition from ${report.status} to ${newStatus}`);
      }
      
      logDebug('API call successful, calling onStatusUpdated');
      showToast(t('modal.status_update.success'), 'success');
      onStatusUpdated(newStatus);
      
      // Add a small delay before closing to ensure toast is visible
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      logError('Error updating status:', error);
      
      // Extract error message from different error types
      let errorMessage = t('modal.status_update.error');
      
      if (error instanceof Error) {
        errorMessage = `${t('modal.status_update.error')} ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `${t('modal.status_update.error')} ${error}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `${t('modal.status_update.error')} ${String(error.message)}`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !report) return null;

  const validTransitions = getValidStatusTransitions(report.status);
  const isUpdateDisabled = validTransitions.length === 0;

  return (
    <>
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
          
          {isUpdateDisabled ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">{t('modal.status_update.no_transitions')}</p>
              <p className="text-sm text-gray-500">
                {t('modal.status_update.current_status')}: {t(`report.status.${report.status.toLowerCase()}`)}
              </p>
            </div>
          ) : (
            <>
              <select
                className="w-full p-2 border rounded mb-4"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
              >
                {validTransitions.map((status) => (
                  <option key={status} value={status}>
                    {t(`report.status.${status.toLowerCase()}`)}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full p-2 border rounded mb-4"
                placeholder={t('modal.status_update.remark_placeholder')}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </>
          )}
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 active:scale-95 rounded transition-all duration-150 ease-in-out font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                onClose();
              }}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            {!isUpdateDisabled && (
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95 text-white rounded transition-all duration-150 ease-in-out font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => {
                  logDebug('Update button clicked');
                  handleStatusChange();
                }}
                disabled={isLoading}
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? t('modal.status_update.updating') : t('modal.status_update.update')}
              </button>
            )}
          </div>
        </div>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}; 