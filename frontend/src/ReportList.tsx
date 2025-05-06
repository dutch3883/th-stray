import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { listMyReports } from './services/apiService';
import type { Report } from './models';

interface ReportListProps {
  user: User;
}

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
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">รายการแจ้งของฉัน</h2>
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">รายการแจ้งของฉัน</h2>
        <div className="text-gray-500">ยังไม่มีรายการแจ้ง</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">รายการแจ้งของฉัน</h2>
      {reports.map((report) => (
        <div key={report.id} className="border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="font-medium">
              {report.type === 'stray' && 'แมวจร'}
              {report.type === 'injured' && 'แมวบาดเจ็บ'}
              {report.type === 'sick' && 'แมวป่วย'}
              {report.type === 'kitten' && 'ลูกแมว'}
            </div>
            <div className="text-sm">
              {new Date(report.createdAt).toLocaleDateString('th-TH')}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div>จำนวน: {report.numberOfCats} ตัว</div>
            <div>สถานะ: {
              report.status === 'pending' ? 'รอดำเนินการ' :
              report.status === 'complete' ? 'ดำเนินการแล้ว' :
              report.status === 'cancelled' ? 'ยกเลิก' : report.status
            }</div>
            <div>สถานที่: {report.location.description}</div>
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