import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { api } from '../services/apiService';
import { Report, ReportDTO, ReportStatus, CatType } from '../types/report';
import { Spinner } from '../components/Spinner';
import { theme } from '../theme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeColor, getThemeBg, getButtonGradient } from '../utils/themeUtils';
import { StatusUpdateModal } from '../components/StatusUpdateModal';
import { EditReportModal } from '../components/EditReportModal';

interface ReportListProps {
  user: User;
}

// Helper function to format dates
const formatDate = (dateOrTimestamp: Date | { _seconds: number; _nanoseconds: number } | string): string => {
  let date: Date;
  
  if (typeof dateOrTimestamp === 'string') {
    date = new Date(dateOrTimestamp);
  } else if ('_seconds' in dateOrTimestamp) {
    date = new Date(dateOrTimestamp._seconds * 1000);
  } else {
    date = dateOrTimestamp;
  }

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusStyle = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.PENDING:
      return {
        backgroundColor: theme.colors.status.pending.bg,
        color: theme.colors.status.pending.text,
      };
    case ReportStatus.COMPLETED:
      return {
        backgroundColor: theme.colors.status.completed.bg,
        color: theme.colors.status.completed.text,
      };
    case ReportStatus.CANCELLED:
      return {
        backgroundColor: theme.colors.status.cancelled.bg,
        color: theme.colors.status.cancelled.text,
      };
    default:
      return {
        backgroundColor: theme.colors.status.pending.bg,
        color: theme.colors.status.pending.text,
      };
  }
};

export default function ReportList({ user }: ReportListProps) {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRemark, setCancelRemark] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const getStatusText = (status: ReportStatus, report?: Report): string => {
    if (status === ReportStatus.CANCELLED && report) {
      const cancelledStatus = report.statusHistory.find(
        change => change.to === ReportStatus.CANCELLED
      );
      const reason = cancelledStatus?.remark || t('report.status.cancelled.no_reason');
      return `${t('report.status.cancelled')}: ${reason}`;
    }

    switch (status) {
      case ReportStatus.ON_HOLD:
        return t('report.status.on_hold');
      case ReportStatus.PENDING:
        return t('report.status.pending');
      case ReportStatus.COMPLETED:
        return t('report.status.completed');
      case ReportStatus.CANCELLED:
        return t('report.status.cancelled');
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.listMyReports();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReport) return;

    try {
      await api.cancelReport({ 
        reportId: selectedReport.id, 
        remark: cancelRemark 
      });
      await fetchReports();
      setCancelModalOpen(false);
      setSelectedReport(null);
      setCancelRemark('');
    } catch (error) {
      console.error('Error cancelling report:', error);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!reports.length) {
    return (
      <div className="p-4 pb-bottom-bar">
        <h2 className="text-lg font-bold mb-4">{t('report.my_reports.title')}</h2>
        <div className="text-gray-500">{t('report.my_reports.empty')}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">{t('report.my_reports.title')}</h2>
      {reports.map((report) => (
        <div key={report.id} className="border p-4 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1 overflow-scroll">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{`${t('report.id')} #${report.id}`}</h3>
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={getStatusStyle(report.status)}
                  >
                    {getStatusText(report.status, report)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(report.createdAt)}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">{t('report.type')}:</span> {
                    report.type === CatType.STRAY ? t('common.cat.type.stray') :
                    report.type === CatType.INJURED ? t('common.cat.type.injured') :
                    report.type === CatType.SICK ? t('common.cat.type.sick') :
                    t('common.cat.type.kitten')
                  }</p>
                  <p><span className="font-medium">{t('report.number_of_cats')}:</span> {report.numberOfCats} {t('report.cats')}</p>
                  <p><span className="font-medium">{t('report.contact_phone')}:</span> {report.contactPhone}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">{t('report.location')}:</span> {report.location.description}</p>
                </div>
              </div>

              {report.description && (
                <div className="mt-4 p-2 bg-gray-50 rounded">
                  <div className="font-medium">{t('report.description')}:</div>
                  <div>{report.description}</div>
                </div>
              )}
            </div>
          </div>

          {report.status === ReportStatus.PENDING && (
            <div className="mt-3 flex gap-2">
              <button 
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                onClick={() => {
                  setSelectedReport(report);
                  setShowEditModal(true);
                }}
              >
                {t('report.actions.edit')}
              </button>
              <button 
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                onClick={() => {
                  setSelectedReport(report);
                  setCancelModalOpen(true);
                }}
              >
                {t('report.actions.cancel')}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Cancel Modal */}
      {cancelModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">{t('report.cancel.title')}</h3>
            <textarea
              className="w-full p-2 border rounded mb-4"
              rows={3}
              placeholder={t('report.cancel.reason_placeholder')}
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelRemark('');
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleCancel}
              >
                {t('report.cancel.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedReport && (
        <EditReportModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
          onReportUpdated={() => {
            setShowEditModal(false);
            setSelectedReport(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
} 