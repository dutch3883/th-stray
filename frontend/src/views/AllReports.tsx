import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from '../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import { StatusUpdateModal } from '../components/StatusUpdateModal';
import { useLanguage } from '../contexts/LanguageContext';

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
    case ReportStatus.ON_HOLD:
      return {
        backgroundColor: theme.colors.status.onHold.bg,
        color: theme.colors.status.onHold.text,
      };
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

export const AllReports = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CatType | 'all'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.PENDING);
  const [remark, setRemark] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper functions for Thai text - now using translation system
  const getStatusText = (status: ReportStatus, report?: Report): string => {
    if (status === ReportStatus.CANCELLED && report) {
      const cancelledStatus = report.statusHistory.find(
        change => change.to === ReportStatus.CANCELLED
      );
      const reason = cancelledStatus?.remark || t('report.status.cancelled.no_reason');
      return `${t('report.status.cancelled')}: ${reason}`;
    }

    switch (status) {
      case ReportStatus.PENDING:
        return t('report.status.pending');
      case ReportStatus.COMPLETED:
        return t('report.status.completed');
      case ReportStatus.CANCELLED:
        return t('report.status.cancelled');
      case ReportStatus.ON_HOLD:
        return t('report.status.on_hold');
      default:
        return status;
    }
  };

  const getTypeText = (type: CatType): string => {
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
        return type;
    }
  };

  // Initial load
  useEffect(() => {
    fetchReports();
  }, []);

  // Filter changes
  useEffect(() => {
    fetchReportsWithoutLoading();
  }, [statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        sortBy,
        sortOrder
      });
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsWithoutLoading = async () => {
    try {
      const data = await api.listReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        sortBy,
        sortOrder
      });
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedReport) return;

    try {
      switch (newStatus) {
        case ReportStatus.COMPLETED:
          await api.completeReport({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.ON_HOLD:
          await api.putReportOnHold({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.PENDING:
          await api.resumeReport({ reportId: selectedReport.id, remark });
          break;
        case ReportStatus.CANCELLED:
          await api.cancelReport({ reportId: selectedReport.id, remark });
          break;
      }
      await fetchReports();
      setStatusModalOpen(false);
      setSelectedReport(null);
      setRemark('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewOnMap = (report: Report) => {
    navigate(`/map?reportId=${report.id}`);
  };

  const handleUpdateStatus = (report: Report) => {
    setSelectedReport(report);
    setStatusModalOpen(true);
  };

  const updateReportStatusOptimistically = (reportId: number, newStatus: ReportStatus) => {
    setReports(prevReports => 
      prevReports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      )
    );
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">{t('report.all_reports.title')}</h2>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('report.filter.status')}</label>
            <select
              className="p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            >
              <option value="all">{t('report.filter.all_status')}</option>
              {Object.values(ReportStatus).map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('report.filter.type')}</label>
            <select
              className="p-2 border rounded"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CatType | 'all')}
            >
              <option value="all">{t('report.filter.all_type')}</option>
              {Object.values(CatType).map((type) => (
                <option key={type} value={type}>
                  {getTypeText(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('report.sort.by')}</label>
            <select
              className="p-2 border rounded"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">{t('report.sort.created_at')}</option>
              <option value="status">{t('report.sort.status')}</option>
              <option value="type">{t('report.sort.type')}</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{t('report.sort.order')}</label>
            <select
              className="p-2 border rounded"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">{t('report.sort.desc')}</option>
              <option value="asc">{t('report.sort.asc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4 mt-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border p-4 rounded-lg shadow-sm bg-white"
          >
            <div className="flex gap-4">
              <div className="flex-1 overflow-scroll">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
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
                
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                  <div className="space-y-2" style={{ flex: 2 }}>
                    <p><span className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded">{t('report.type')}:</span> <span className="text-gray-800">{getTypeText(report.type)}</span></p>
                    <p><span className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded">{t('report.number_of_cats')}:</span> <span className="text-gray-800">{report.numberOfCats} {t('report.cats')}</span></p>
                    <p><span className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded">{t('report.contact')}:</span> <span className="text-gray-800">{report.contactPhone}</span></p>
                    <p><span className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded">{t('report.location')}:</span> <span className="text-gray-800">{report.location.description}</span></p>
                    <p><span className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded">{t('report.english_communication')}:</span> <span className="text-gray-800">{report.canSpeakEnglish ? t('form.contact.english.yes') : t('form.contact.english.no')}</span></p>
                  </div>
                  <div style={{ flex: 1 }}>
                    {report.images.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {report.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${t('report.id')} ${report.id} - ${t('report.images')} ${index + 1}`}
                            className="w-full h-auto object-cover rounded max-h-48 md:max-h-48 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(image)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {report.description && (
                  <div className="mt-4 p-2 bg-gray-50 rounded">
                    <div className="font-bold text-slate-700 bg-blue-50 px-2 py-1 rounded inline-block">{t('report.description')}:</div>
                    <div className="text-gray-800 mt-2">{report.description}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Right Side */}
              <div className="w-1/4 flex flex-col gap-2 items-center justify-center">
                <button
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors w-full min-h-16"
                  onClick={() => handleUpdateStatus(report)}
                >
                  {t('report.update_status')}
                </button>
                <button
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors w-full min-h-16"
                  onClick={() => handleViewOnMap(report)}
                >
                  {t('report.view_map')}
                </button>
                <button
                  className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors w-full min-h-16"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${report.location.lat},${report.location.long}`;
                    window.open(url, '_blank');
                  }}
                >
                  {t('report.open_google_maps')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 pb-20"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 cursor-pointer"
              onClick={() => setSelectedImage(null)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="rgba(0, 0, 0, 0.5)"/>
                <line x1="10" y1="10" x2="22" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="22" y1="10" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <img
              src={selectedImage}
              alt="Enlarged image"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onStatusUpdated={(newStatus) => {
          if (newStatus && selectedReport) {
            updateReportStatusOptimistically(selectedReport.id, newStatus);
          }
        }}
      />
    </div>
  );
}; 