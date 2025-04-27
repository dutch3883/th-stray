import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export default function AdminDashboard() {
  const [view, setView] = useState('list');
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchReports = async () => {
    const functions = getFunctions(app);
    const getAllReports = httpsCallable(functions, 'getAllReports');
    const result = await getAllReports({ status: filterStatus });
    setReports(result.data);
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const handleAction = async (id, action) => {
    const functions = getFunctions(app);
    if (action === 'complete') {
      const image = prompt('Enter completion image URL:');
      if (!image) return;
      const completeFn = httpsCallable(functions, 'markReportComplete');
      await completeFn({ id, completionImage: image });
    } else {
      const reason = prompt('Enter cancel reason:');
      if (!reason) return;
      const cancelFn = httpsCallable(functions, 'cancelReport');
      await cancelFn({ id, reason });
    }
    fetchReports();
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      <div className="space-x-2">
        <button onClick={() => setView('list')} className="bg-blue-500 text-white px-3 py-1 rounded">List</button>
        <button onClick={() => setView('map')} className="bg-green-500 text-white px-3 py-1 rounded">Map</button>
        <select onChange={(e) => setFilterStatus(e.target.value)} className="ml-2 border p-1">
          <option value="all">All</option>
          <option value="submitted">Submitted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {view === 'list' && (
        <div className="overflow-auto">
          <table className="min-w-full border border-gray-300 mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">User</th>
                <th className="border px-3 py-2 text-left">Type</th>
                <th className="border px-3 py-2 text-left">Status</th>
                <th className="border px-3 py-2 text-left">Location</th>
                <th className="border px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{r.userId}</td>
                  <td className="border px-3 py-2">{r.type}</td>
                  <td className="border px-3 py-2">{r.status}</td>
                  <td className="border px-3 py-2">{r.location?.description}</td>
                  <td className="border px-3 py-2 space-x-2">
                    {r.status === 'submitted' && (
                      <>
                        <button onClick={() => handleAction(r.id, 'complete')} className="bg-blue-500 text-white px-2 py-1 rounded">Complete</button>
                        <button onClick={() => handleAction(r.id, 'cancel')} className="bg-red-500 text-white px-2 py-1 rounded">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'map' && (
        <div className="h-[400px] bg-gray-200 flex items-center justify-center">
          <p>Map view coming soon...</p>
        </div>
      )}
    </div>
  );
}
