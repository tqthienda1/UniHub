import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Student {
  mssv: string;
  email: string;
  fullName: string;
  createdAt: string;
}

const AdminStudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/sync/students', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/sync/students', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        alert('Sync triggered! Please refresh in a few moments.');
        setTimeout(fetchStudents, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger sync', error);
      alert('Failed to trigger sync.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Data Sync</h1>
          <p className="text-gray-500 mt-1">Manage and monitor synchronized student records from Legacy SIS.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Syncing...
            </>
          ) : (
            'Trigger Sync Now'
          )}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">MSSV</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Synced Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400 font-medium">Loading students...</p>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                  No synchronized students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.mssv} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 font-black text-indigo-600">{student.mssv}</td>
                  <td className="px-6 py-5 font-bold text-gray-900">{student.fullName}</td>
                  <td className="px-6 py-5 text-gray-600 font-medium">{student.email}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs font-bold">
                    {new Date(student.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStudentsPage;
