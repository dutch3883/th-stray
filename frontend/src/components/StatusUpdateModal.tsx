import React, { useState } from 'react';
import { Report, ReportStatus } from '../types/report';
import { api } from '../services/apiService';

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
        <h2 className="text-xl font-bold mb-4">อัปเดตสถานะรายงาน #{report.id}</h2>
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
            onClick={() => {
              onClose();
            }}
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
  );
}; 