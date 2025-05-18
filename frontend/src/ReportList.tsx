import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { listMyReports } from './services/apiService';
import type { FirebaseTimestamp, Report } from './models';

interface ReportListProps {
  user: User;
}

// Helper function to format Firebase timestamps with time
const formatFirebaseTimestamp = (timestamp: FirebaseTimestamp): string => {
  try {
    // Handle Firebase Timestamp format with _seconds and _nanoseconds
    if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
      const date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds / 1000000));
      // Format: date and time in Thai locale
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Fallback for other formats
    return new Date(timestamp).toLocaleString('th-TH');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export default function ReportList({ user }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const data = await listMyReports();
        setReports(data);
      } catch (err) {
        console.error('Error fetching reports:', err);
        alert('ไม่สามารถโหลดรายการได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 pb-bottom-bar">
        <h2 className="text-lg font-bold mb-4">รายการแจ้งของฉัน</h2>
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
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
    <div className="p-4 pb-bottom-bar space-y-4">
      <h2 className="text-lg font-bold">รายการแจ้งของฉัน</h2>
      {reports.map((report) => (
        <div key={report.id} className="border p-4 rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-2 ">
            <div className="font-medium">
              {report.type === 'stray' && 'แมวจร'}
              {report.type === 'injured' && 'แมวบาดเจ็บ'}
              {report.type === 'sick' && 'แมวป่วย'}
              {report.type === 'kitten' && 'ลูกแมว'}
            </div>
            <div className="text-sm">
              {report.createdAt && formatFirebaseTimestamp(report.createdAt)}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>จำนวน: {report.numberOfCats} ตัว</div>
            <div>สถานะ: {
              report.status === 'pending' ? 'รอดำเนินการ' :
              report.status === 'onHold' ? 'พักการดำเนินการ' :
              report.status === 'completed' ? 'ดำเนินการแล้ว' :
              report.status === 'cancelled' ? 'ยกเลิก' : report.status
            }</div>
            <div>สถานที่: {report.location.description}</div>
            {report.description && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="font-medium">รายละเอียดเพิ่มเติม:</div>
                <div>{report.description}</div>
              </div>
            )}
            {report.adminNote && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div className="font-medium">บันทึกเพิ่มเติม:</div>
                <div>{report.adminNote}</div>
              </div>
            )}
          </div>

          {report.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200">
                แก้ไข
              </button>
              <button className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 