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

// Helper functions for Thai text
const getStatusText = (status: ReportStatus, report?: Report): string => {
  if (status === ReportStatus.CANCELLED && report) {
    const cancelledStatus = report.statusHistory.find(
      change => change.to === ReportStatus.CANCELLED
    );
    const reason = cancelledStatus?.remark || 'ไม่พบเหตุผลการยกเลิก';
    return `ยกเลิก: ${reason}`;
  }

  switch (status) {
    case ReportStatus.PENDING:
      return 'กำลังดำเนินการ';
    case ReportStatus.COMPLETED:
      return 'เสร็จสิ้น';
    case ReportStatus.CANCELLED:
      return 'ยกเลิก';
    case ReportStatus.ON_HOLD:
      return 'พักการดำเนินการ';
    default:
      return status;
  }
};

const getTypeText = (type: CatType): string => {
  switch (type) {
    case CatType.STRAY:
      return "แมวจร";
    case CatType.INJURED:
      return "แมวบาดเจ็บ";
    case CatType.SICK:
      return "แมวป่วย";
    case CatType.KITTEN:
      return "ลูกแมว";
    default:
      return type;
  }
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex gap-4 justify-around flex-1">
          <div className="flex flex-col flex-1">
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

          <div className="flex flex-col flex-1">
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
        </div>

        <div className="flex gap-4 justify-around flex-1">
          <div className="flex flex-col flex-1">
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

          <div className="flex flex-col flex-1">
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

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white p-4 rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{t('report.id')} #{report.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={getStatusStyle(report.status)}
                  >
                    {getStatusText(report.status, report)}
                  </span>
                </div>
                <p className="mt-2">{t('report.type')}: {getTypeText(report.type)}</p>
                <p>{t('report.number_of_cats')}: {report.numberOfCats} {t('report.cats')}</p>
                {report.description && <p>{t('report.description')}: {report.description}</p>}
                <p>{t('report.contact')}: {report.contactPhone}</p>
                <p>{t('report.location')}: {report.location.description}</p>
                <p>{t('report.created_at')}: {formatDate(report.createdAt)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => handleUpdateStatus(report)}
                >
                  {t('report.update_status')}
                </button>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  onClick={() => handleViewOnMap(report)}
                >
                  {t('report.view_map')}
                </button>
              </div>
            </div>
            {report.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {report.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${t('report.id')} ${report.id} - ${t('report.images')} ${index + 1}`}
                    className="h-32 w-32 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onStatusUpdated={fetchReports}
      />
    </div>
  );
}; 