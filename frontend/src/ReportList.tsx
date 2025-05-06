import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';
import { app } from './firebase';

interface Report {
  type: string;
  numberOfCats: number;
  status: 'submitted' | 'completed' | 'cancelled';
  location?: {
    description: string;
  };
}

interface ReportListProps {
  user: User;
}

export default function ReportList({ user }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async (): Promise<void> => {
      const functions = getFunctions(app);
      const getUserReports = httpsCallable<void, Report[]>(functions, 'getUserReports');
      const result = await getUserReports();
      setReports(result.data);
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">My Reports</h2>
      {reports.map((report, idx) => (
        <div key={idx} className="border p-3 rounded shadow">
          <div><strong>Type:</strong> {report.type}</div>
          <div><strong>Number of Cats:</strong> {report.numberOfCats}</div>
          <div><strong>Status:</strong> {report.status}</div>
          <div><strong>Location:</strong> {report.location?.description}</div>
          {report.status === 'submitted' && (
            <button className="bg-blue-400 text-white px-3 py-1 mt-2 rounded">
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
} 