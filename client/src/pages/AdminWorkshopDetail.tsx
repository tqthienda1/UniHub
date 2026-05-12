import { useState, useEffect } from 'react';

import { useParams, Link } from 'react-router-dom';

interface Registration {
  id: string;
  user: {
    fullName: string;
    email: string;
    mssv?: string;
  };
  status: string;
  createdAt: string;
}

const AdminWorkshopDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3000/staff-portal/workshops/${id}/registrations?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch registrations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [id, statusFilter]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/staff-portal/workshops/${id}/registrations/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workshop_${id}_registrations.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const checkInCount = registrations.filter(r => r.status === 'CHECKED_IN').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Link to="/" className="text-sm font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Workshops
          </Link>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Workshop Registrations</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
            <div className="text-right border-r border-gray-100 pr-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance</p>
              <p className="text-xl font-black text-indigo-600">{checkInCount} / {registrations.length}</p>
            </div>
            <button
              onClick={handleExport}
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Registered Students</h2>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-100 rounded-lg px-4 py-2 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">MSSV</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Registered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                  No registrations found for this filter.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{reg.user.fullName}</div>
                    <div className="text-xs text-gray-400 font-medium">{reg.user.email}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{reg.user.mssv || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest
                      ${reg.status === 'CHECKED_IN' ? 'bg-indigo-100 text-indigo-700' : 
                        reg.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-rose-100 text-rose-700'}`}>
                      {reg.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                    {new Date(reg.createdAt).toLocaleDateString()}
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

export default AdminWorkshopDetail;
