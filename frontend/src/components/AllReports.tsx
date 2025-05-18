import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Report, ReportStatus, CatType } from '../types/report';
import { Spinner } from './Spinner';

export const AllReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CatType | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>(ReportStatus.IN_PROGRESS);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchReports = async () => {
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
    } finally {
      setLoading(false);
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
        case ReportStatus.IN_PROGRESS:
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          className="p-2 border rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
        >
          <option value="">All Statuses</option>
          {Object.values(ReportStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CatType | '')}
        >
          <option value="">All Types</option>
          {Object.values(CatType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Created At</option>
          <option value="status">Status</option>
          <option value="type">Type</option>
        </select>

        <select
          className="p-2 border rounded"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white p-4 rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">Report #{report.id}</h3>
                <p>Status: {report.status}</p>
                <p>Type: {report.type}</p>
                <p>Cats: {report.numberOfCats}</p>
                {report.description && <p>Description: {report.description}</p>}
                <p>Contact: {report.contactPhone}</p>
                <p>Location: {report.location.address || `${report.location.lat}, ${report.location.lng}`}</p>
                <p>Created: {new Date(report.createdAt).toLocaleString()}</p>
              </div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setSelectedReport(report);
                  setStatusModalOpen(true);
                }}
              >
                Update Status
              </button>
            </div>
            {report.images.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {report.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Report ${report.id} - Image ${index + 1}`}
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
            <h2 className="text-xl font-bold mb-4">Update Report Status</h2>
            <select
              className="w-full p-2 border rounded mb-4"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
            >
              <option value={ReportStatus.IN_PROGRESS}>In Progress</option>
              <option value={ReportStatus.ON_HOLD}>On Hold</option>
              <option value={ReportStatus.COMPLETED}>Completed</option>
              <option value={ReportStatus.CANCELLED}>Cancelled</option>
            </select>
            <textarea
              className="w-full p-2 border rounded mb-4"
              placeholder="Add a remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleStatusChange}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 