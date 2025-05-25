import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from './Spinner';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';

// Helper function to format dates
const formatDate = (dateOrTimestamp: Date | { _seconds: number; _nanoseconds: number }): string => {
  let date: Date;
  if ('_seconds' in dateOrTimestamp) {
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
const getStatusText = (status: ReportStatus): string => {
  switch (status) {
    case ReportStatus.PENDING:
      return "กำลังดำเนินการ";
    case ReportStatus.COMPLETED:
      return "เสร็จสิ้น";
    case ReportStatus.CANCELLED:
      return "ยกเลิก";
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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CatType | ''>('');
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
        status: statusFilter || undefined,
        type: typeFilter || undefined,
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
        status: statusFilter || undefined,
        type: typeFilter || undefined,
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex gap-4 justify-around flex-1">
          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1">กรองตามสถานะ</label>
            <select
              className="p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
            >
              <option value="">ทุกสถานะ</option>
              {Object.values(ReportStatus)
                .filter(status => status !== ReportStatus.ON_HOLD)
                .map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1">กรองตามประเภท</label>
            <select
              className="p-2 border rounded"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CatType | '')}
            >
              <option value="">ทุกประเภท</option>
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
            <label className="text-sm font-medium text-gray-700 mb-1">เรียงตาม</label>
            <select
              className="p-2 border rounded"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">วันที่สร้าง</option>
              <option value="status">สถานะ</option>
              <option value="type">ประเภท</option>
            </select>
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1">ลำดับ</label>
            <select
              className="p-2 border rounded"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">มากไปน้อย</option>
              <option value="asc">น้อยไปมาก</option>
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
                <h3 className="font-bold">รายงาน #{report.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={getStatusStyle(report.status)}
                  >
                    {getStatusText(report.status)}
                  </span>
                </div>
                <p className="mt-2">ประเภท: {getTypeText(report.type)}</p>
                <p>จำนวนแมว: {report.numberOfCats} ตัว</p>
                {report.description && <p>รายละเอียด: {report.description}</p>}
                <p>เบอร์ติดต่อ: {report.contactPhone}</p>
                <p>สถานที่: {report.location.description}</p>
                <p>วันที่สร้าง: {formatDate(report.createdAt)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => {
                    setSelectedReport(report);
                    setStatusModalOpen(true);
                  }}
                >
                  อัปเดตสถานะ
                </button>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  onClick={() => handleViewOnMap(report)}
                >
                  ดูบนแผนที่
                </button>
              </div>
            </div>
            {report.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {report.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`รายงาน ${report.id} - รูปที่ ${index + 1}`}
                    className="h-32 w-32 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Update Modal */}
      {statusModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">อัปเดตสถานะรายงาน</h2>
            <select
              className="w-full p-2 border rounded mb-4"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
            >
              <option value={ReportStatus.PENDING}>กำลังดำเนินการ</option>
              <option value={ReportStatus.ON_HOLD}>รอดำเนินการ</option>
              <option value={ReportStatus.COMPLETED}>เสร็จสิ้น</option>
              <option value={ReportStatus.CANCELLED}>ยกเลิก</option>
            </select>
            <textarea
              className="w-full p-2 border rounded mb-4"
              placeholder="เพิ่มหมายเหตุ..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setStatusModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleStatusChange}
              >
                อัปเดต
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 