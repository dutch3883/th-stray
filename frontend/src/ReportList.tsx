import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { api } from './services/apiService';
import { Report, ReportDTO, ReportStatus } from './types/report';
import { Spinner } from './components/Spinner';
import { theme } from './theme';

interface ReportListProps {
  user: User;
}

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

const getStatusText = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.PENDING:
      return 'กำลังดำเนินการ';
    case ReportStatus.COMPLETED:
      return 'เสร็จสิ้น';
    case ReportStatus.CANCELLED:
      return 'ยกเลิก';
    default:
      return status;
  }
};

export default function ReportList({ user }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRemark, setCancelRemark] = useState('');

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
        <h2 className="text-lg font-bold mb-4">รายการแจ้งของฉัน</h2>
        <div className="text-gray-500">ยังไม่มีรายการแจ้ง</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">รายการแจ้งของฉัน</h2>
      {reports.map((report) => (
        <div key={report.id} className="border p-4 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">รายงาน #{report.id}</h3>
                  <span 
                    className="px-2 py-1 rounded-full text-sm font-medium"
                    style={getStatusStyle(report.status)}
                  >
                    {getStatusText(report.status)}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(report.createdAt).toLocaleString('th-TH')}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">ประเภท:</span> {report.type}</p>
                  <p><span className="font-medium">จำนวนแมว:</span> {report.numberOfCats} ตัว</p>
                  <p><span className="font-medium">เบอร์ติดต่อ:</span> {report.contactPhone}</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">สถานที่:</span> {report.location.description}</p>
                </div>
              </div>

              {report.description && (
                <div className="mt-4 p-2 bg-gray-50 rounded">
                  <div className="font-medium">รายละเอียดเพิ่มเติม:</div>
                  <div>{report.description}</div>
                </div>
              )}
            </div>
          </div>

          {report.status === ReportStatus.PENDING && (
            <div className="mt-3 flex gap-2">
              <button 
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                onClick={() => {/* TODO: Implement edit functionality */}}
              >
                แก้ไข
              </button>
              <button 
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                onClick={() => {
                  setSelectedReport(report);
                  setCancelModalOpen(true);
                }}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Cancel Modal */}
      {cancelModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">ยกเลิกรายงาน</h2>
            <textarea
              className="w-full p-2 border rounded mb-4"
              placeholder="ระบุเหตุผลในการยกเลิก..."
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setCancelModalOpen(false);
                  setSelectedReport(null);
                  setCancelRemark('');
                }}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={handleCancel}
              >
                ยืนยันการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 