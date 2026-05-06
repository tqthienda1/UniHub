import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import QrModal from '../components/QrModal';

interface Registration {
  id: string;
  workshopId: string;
  status: string;
  qrToken: string | null;
  createdAt: string;
  workshop: {
    title: string;
    room: string;
    startTime: string;
  };
}

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const { showNotification } = useNotification();

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/registrations/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Failed to fetch registrations', error);
      showNotification('Could not load registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const initiateCancel = (reg: Registration) => {
    setSelectedReg(reg);
    setIsCancelModalOpen(true);
  };

  const showQr = (reg: Registration) => {
    setSelectedReg(reg);
    setIsQrModalOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedReg) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/registrations/${selectedReg.id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        showNotification('Registration cancelled successfully', 'success');
        fetchRegistrations();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Cancellation failed', 'error');
      }
    } catch (error) {
      console.error('Cancellation failed', error);
      showNotification('Connection error during cancellation', 'error');
    } finally {
      setIsCancelModalOpen(false);
      setSelectedReg(null);
    }
  };

  // Filter out cancelled registrations for the main active list
  const activeRegistrations = registrations.filter(reg => reg.status !== 'CANCELLED');

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">
          My <span className="text-indigo-600">Registrations</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg font-medium">
          Manage your active workshops and access your check-in passes.
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing your records...</p>
          </div>
        ) : activeRegistrations.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-400 font-black text-xl mb-8 uppercase tracking-tight">No active registrations found</p>
            <Link to="/" className="inline-flex items-center px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200">
              Find Workshops
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Workshop</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Schedule</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeRegistrations.map((reg) => (
                  <tr key={reg.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="px-10 py-8">
                      <div className="font-black text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{reg.workshop.title}</div>
                      <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {reg.workshop.room}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-sm text-gray-700 font-black tracking-tight">
                        {new Date(reg.workshop.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400 font-bold">
                        {new Date(reg.workshop.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm
                        ${reg.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                          reg.status === 'CHECKED_IN' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 
                          'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${reg.status === 'CONFIRMED' ? 'bg-emerald-500' : reg.status === 'CHECKED_IN' ? 'bg-indigo-500' : 'bg-gray-400'}`}></span>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        {reg.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => showQr(reg)}
                              className="px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                            >
                              View QR
                            </button>
                            <button
                              onClick={() => initiateCancel(reg)}
                              className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {reg.status === 'CHECKED_IN' && (
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            Attended
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancel Registration"
        message={`Are you sure you want to cancel your seat for "${selectedReg?.workshop.title}"? This cannot be undone.`}
        onConfirm={handleCancel}
        onCancel={() => setIsCancelModalOpen(false)}
        confirmText="Yes, Release Seat"
        isDestructive={true}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        token={selectedReg?.qrToken || null}
        workshopTitle={selectedReg?.workshop.title || ''}
      />
    </div>
  );
};


export default MyRegistrationsPage;

